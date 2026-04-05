import { d as defineEventHandler, g as getQuery, c as createError, h as useStorage, $ as $fetch } from '../../nitro/nitro.mjs';
import { resolveNs, resolve4 } from 'node:dns/promises';
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
const CANDIDATE_SCAN_LIMIT = 120;
const SCAN_CONCURRENCY = 10;
const CACHE_NAMESPACE = "shared-ns";
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
const safeResolveNs = async (domain) => {
  try {
    const rows = await withTimeout(resolveNs(domain));
    return Array.from(
      new Set(
        rows.map((x) => normalizeDomain(x)).filter(Boolean)
      )
    );
  } catch {
    return [];
  }
};
const safeResolveA = async (domain) => {
  try {
    const rows = await withTimeout(resolve4(domain));
    return Array.from(new Set(rows.map((x) => String(x).trim()).filter(Boolean)));
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
const reverseNs_get = defineEventHandler(async (event) => {
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
  const cacheKey = `shared-ns:${rawDomain}:limit=${limit}`;
  const storageKey = `${CACHE_NAMESPACE}:${rawDomain}:limit=${limit}`;
  const now = Date.now();
  const cacheStore = useStorage("sharedNsCache");
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
  const targetNs = await safeResolveNs(rawDomain);
  if (targetNs.length === 0) {
    throw createError({ statusCode: 404, statusMessage: "no ns records found for target domain" });
  }
  const sourceIps = Array.from(
    new Set((await Promise.all(targetNs.map((ns) => safeResolveA(ns)))).flat())
  );
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
  const targetNsSet = new Set(targetNs);
  await withConcurrency(candidates, SCAN_CONCURRENCY, async (domain) => {
    const ns = await safeResolveNs(domain);
    if (!ns.length) return;
    const sharedNs = ns.filter((x) => targetNsSet.has(x));
    if (!sharedNs.length) return;
    items.push({
      domain,
      shared_ns: Array.from(new Set(sharedNs)).sort(),
      source_ips: Array.from(candidateSource.get(domain) || []).sort()
    });
  });
  items.sort((a, b) => {
    if (b.shared_ns.length !== a.shared_ns.length) return b.shared_ns.length - a.shared_ns.length;
    return a.domain.localeCompare(b.domain);
  });
  const payload = {
    code: 0,
    data: {
      target: rawDomain,
      ns: targetNs,
      source_ips: sourceIps,
      total_candidates: candidateSource.size,
      total_shared: items.length,
      items: items.slice(0, limit),
      note: "Best-effort results using public reverse IP datasets and DNS NS verification.",
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

export { reverseNs_get as default };
//# sourceMappingURL=reverse-ns.get.mjs.map
