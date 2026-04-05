import { d as defineEventHandler, g as getQuery, c as createError, h as useStorage, $ as $fetch } from '../../nitro/nitro.mjs';
import { resolveMx, resolve4, resolveCname } from 'node:dns/promises';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'anymatch';
import 'node:crypto';
import 'node:url';
import 'ipx';

const DOMAIN_RE = /^(?=.{1,253}$)(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/i;
const LOOKUP_TIMEOUT_MS = 4e3;
const LOOKUP_CACHE_TTL_MS = 18e4;
const MAX_RESULTS = 50;
const CANDIDATE_SCAN_LIMIT = 500;
const SCAN_CONCURRENCY = 10;
const CACHE_NAMESPACE = "reverse-mx";
const memoryCache = /* @__PURE__ */ new Map();
const normalizeDomain = (value) => value.trim().toLowerCase().replace(/\.$/, "");
const withTimeout = async (promise, timeoutMs = LOOKUP_TIMEOUT_MS) => {
  return await Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("lookup timeout")), timeoutMs);
    })
  ]);
};
const safeResolveMx = async (domain) => {
  try {
    const rows = await withTimeout(resolveMx(domain));
    return Array.from(
      new Set(
        rows.map((x) => normalizeDomain(String(x.exchange || ""))).filter(Boolean)
      )
    );
  } catch {
    return [];
  }
};
const withConcurrency = async (items, concurrency, fn) => {
  let i = 0;
  const run = async () => {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
};
const safeResolveA = async (domain) => {
  const queue = [normalizeDomain(domain)];
  const visited = /* @__PURE__ */ new Set();
  const out = /* @__PURE__ */ new Set();
  let depth = 0;
  while (queue.length > 0 && depth < 3) {
    const host = queue.shift();
    if (!host || visited.has(host)) continue;
    visited.add(host);
    depth += 1;
    try {
      const rows = await withTimeout(resolve4(host));
      for (const row of rows) {
        const value = String(row).trim();
        if (value) out.add(value);
      }
    } catch {
    }
    if (out.size > 0) continue;
    try {
      const cnames = await withTimeout(resolveCname(host));
      for (const cname of cnames) {
        const normalized = normalizeDomain(String(cname || ""));
        if (normalized && !visited.has(normalized)) {
          queue.push(normalized);
        }
      }
    } catch {
    }
  }
  return Array.from(out);
};
const reverseMx_get = defineEventHandler(async (event) => {
  var _a;
  const query = getQuery(event);
  const rawDomain = normalizeDomain(String(query.domain || ""));
  const limit = Math.max(1, Math.min(MAX_RESULTS, Number(query.limit) || MAX_RESULTS));
  if (!rawDomain) {
    throw createError({ statusCode: 400, statusMessage: "domain is required" });
  }
  if (!DOMAIN_RE.test(rawDomain)) {
    throw createError({ statusCode: 400, statusMessage: "invalid domain" });
  }
  const cacheKey = `reverse-mx:${rawDomain}:limit=${limit}`;
  const storageKey = `${CACHE_NAMESPACE}:${rawDomain}:limit=${limit}`;
  const now = Date.now();
  const cacheStore = useStorage("reverseMxCache");
  const memoryHit = memoryCache.get(cacheKey);
  if (memoryHit) {
    if (memoryHit.expiresAt > now) {
      const payload2 = structuredClone(memoryHit.payload);
      payload2.cached = true;
      return payload2;
    }
    memoryCache.delete(cacheKey);
  }
  try {
    const persisted = await cacheStore.getItem(storageKey);
    if ((persisted == null ? void 0 : persisted.payload) && typeof persisted.expiresAt === "number") {
      if (persisted.expiresAt > now) {
        memoryCache.set(cacheKey, persisted);
        const payload2 = structuredClone(persisted.payload);
        payload2.cached = true;
        return payload2;
      }
      await cacheStore.removeItem(storageKey);
    }
  } catch {
  }
  const resolvedMx = await safeResolveMx(rawDomain);
  const targetMx = resolvedMx.length > 0 ? resolvedMx : [rawDomain];
  const inputMode = resolvedMx.length > 0 ? "domain" : "mx_host";
  if (inputMode === "mx_host") {
    const mxHostIps = await safeResolveA(rawDomain);
    if (mxHostIps.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "no mx records found for target domain, and target is not a resolvable mx host"
      });
    }
  }
  const sourceIps = Array.from(
    new Set((await Promise.all(targetMx.map((mx) => safeResolveA(mx)))).flat())
  );
  if (sourceIps.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "no ipv4 address found for target mx hosts"
    });
  }
  const candidateSource = /* @__PURE__ */ new Map();
  const fetchErrors = [];
  for (const ip of sourceIps) {
    try {
      const reverse = await $fetch("/api/reverse-ip", { query: { ip } });
      const rows = Array.isArray((_a = reverse == null ? void 0 : reverse.data) == null ? void 0 : _a.domains) ? reverse.data.domains : [];
      for (const row of rows) {
        const domain = normalizeDomain(String((row == null ? void 0 : row.domain) || ""));
        if (!domain || domain === rawDomain || !DOMAIN_RE.test(domain)) continue;
        const bag = candidateSource.get(domain) || /* @__PURE__ */ new Set();
        bag.add(ip);
        candidateSource.set(domain, bag);
      }
    } catch (err) {
      fetchErrors.push(`${ip}: ${(err == null ? void 0 : err.message) || "reverse ip lookup failed"}`);
    }
  }
  const candidates = Array.from(candidateSource.keys()).slice(0, CANDIDATE_SCAN_LIMIT);
  const items = [];
  const targetMxSet = new Set(targetMx);
  await withConcurrency(candidates, SCAN_CONCURRENCY, async (domain) => {
    const mx = await safeResolveMx(domain);
    if (!mx.length) return;
    const sharedMx = mx.filter((x) => targetMxSet.has(x));
    if (!sharedMx.length) return;
    items.push({
      domain,
      shared_mx: Array.from(new Set(sharedMx)).sort(),
      source_ips: Array.from(candidateSource.get(domain) || []).sort()
    });
  });
  items.sort((a, b) => {
    if (b.shared_mx.length !== a.shared_mx.length) return b.shared_mx.length - a.shared_mx.length;
    return a.domain.localeCompare(b.domain);
  });
  const payload = {
    code: 0,
    data: {
      target: rawDomain,
      input_mode: inputMode,
      mx: targetMx,
      source_ips: sourceIps,
      total_candidates: candidateSource.size,
      total_shared: items.length,
      items: items.slice(0, limit),
      note: inputMode === "mx_host" ? "MX host mode: best-effort reverse search using public reverse IP datasets and DNS MX verification." : "Domain mode: best-effort reverse search using public reverse IP datasets and DNS MX verification.",
      errors: fetchErrors
    },
    cached: false,
    timestamp: Math.floor(Date.now() / 1e3)
  };
  memoryCache.set(cacheKey, {
    expiresAt: now + LOOKUP_CACHE_TTL_MS,
    payload
  });
  try {
    await cacheStore.setItem(storageKey, {
      expiresAt: now + LOOKUP_CACHE_TTL_MS,
      payload
    });
  } catch {
  }
  return payload;
});

export { reverseMx_get as default };
//# sourceMappingURL=reverse-mx.get.mjs.map
