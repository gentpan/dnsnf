import { d as defineEventHandler, g as getQuery, c as createError, h as useStorage, $ as $fetch } from '../../nitro/nitro.mjs';
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
const LOOKUP_TIMEOUT_MS = 6e3;
const LOOKUP_CACHE_TTL_MS = 18e4;
const MAX_RESULTS = 500;
const CACHE_NAMESPACE = "subdomain";
const memoryCache = /* @__PURE__ */ new Map();
const normalizeDomain = (value) => value.trim().toLowerCase().replace(/\.$/, "");
const inRootDomain = (host, root) => host === root || host.endsWith(`.${root}`);
const queryCrtSh = async (domain) => {
  const rows = await $fetch("https://crt.sh/", {
    query: { q: `%.${domain}`, output: "json" },
    timeout: LOOKUP_TIMEOUT_MS
  });
  const hosts = /* @__PURE__ */ new Set();
  for (const row of rows || []) {
    const nameValue = String((row == null ? void 0 : row.name_value) || "");
    for (const item of nameValue.split(/\r?\n/g)) {
      const cleaned = normalizeDomain(item.replace(/^\*\./, ""));
      if (!cleaned || !DOMAIN_RE.test(cleaned)) continue;
      if (!inRootDomain(cleaned, domain)) continue;
      hosts.add(cleaned);
    }
  }
  return Array.from(hosts);
};
const queryHackerTarget = async (domain) => {
  const text = await $fetch("https://api.hackertarget.com/hostsearch/", {
    query: { q: domain },
    responseType: "text",
    timeout: LOOKUP_TIMEOUT_MS
  });
  const hosts = /* @__PURE__ */ new Set();
  for (const line of String(text || "").split(/\r?\n/g)) {
    const first = line.split(",")[0] || "";
    const cleaned = normalizeDomain(first.replace(/^\*\./, ""));
    if (!cleaned || !DOMAIN_RE.test(cleaned)) continue;
    if (!inRootDomain(cleaned, domain)) continue;
    hosts.add(cleaned);
  }
  return Array.from(hosts);
};
const queryRapidDns = async (domain) => {
  const text = await $fetch(`https://rapiddns.io/subdomain/${encodeURIComponent(domain)}?full=1`, {
    responseType: "text",
    timeout: LOOKUP_TIMEOUT_MS,
    headers: {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
    }
  });
  const hosts = /* @__PURE__ */ new Set();
  const cellRegex = /<td[^>]*>\s*([^<]+?)\s*<\/td>/gi;
  for (const match of String(text || "").matchAll(cellRegex)) {
    const raw = normalizeDomain(String(match[1] || "").replace(/^\*\./, ""));
    if (!raw || !DOMAIN_RE.test(raw)) continue;
    if (!inRootDomain(raw, domain)) continue;
    hosts.add(raw);
  }
  return Array.from(hosts);
};
const mergeRows = (sourceRows) => {
  const bag = /* @__PURE__ */ new Map();
  for (const row of sourceRows) {
    for (const host of row.hosts) {
      const cur = bag.get(host) || /* @__PURE__ */ new Set();
      cur.add(row.source);
      bag.set(host, cur);
    }
  }
  return Array.from(bag.entries()).map(([host, sources]) => ({
    host,
    sources: Array.from(sources).sort()
  })).sort((a, b) => a.host.localeCompare(b.host));
};
const subdomains_get = defineEventHandler(async (event) => {
  const query = getQuery(event);
  const domain = normalizeDomain(String(query.domain || ""));
  const limit = Math.max(1, Math.min(MAX_RESULTS, Number(query.limit) || 200));
  if (!domain) {
    throw createError({ statusCode: 400, statusMessage: "domain is required" });
  }
  if (!DOMAIN_RE.test(domain)) {
    throw createError({ statusCode: 400, statusMessage: "invalid domain" });
  }
  const cacheKey = `subdomain:${domain}:limit=${limit}`;
  const storageKey = `${CACHE_NAMESPACE}:${domain}:limit=${limit}`;
  const now = Date.now();
  const cacheStore = useStorage("subdomainCache");
  const mem = memoryCache.get(cacheKey);
  if (mem) {
    if (mem.expiresAt > now) {
      const payload2 = structuredClone(mem.payload);
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
  const sourceRows = [];
  const errors = [];
  try {
    const hosts = await queryCrtSh(domain);
    sourceRows.push({ source: "crtsh", hosts });
  } catch (err) {
    errors.push(`crtsh: ${(err == null ? void 0 : err.message) || "lookup failed"}`);
  }
  try {
    const hosts = await queryHackerTarget(domain);
    sourceRows.push({ source: "hackertarget", hosts });
  } catch (err) {
    errors.push(`hackertarget: ${(err == null ? void 0 : err.message) || "lookup failed"}`);
  }
  try {
    const hosts = await queryRapidDns(domain);
    sourceRows.push({ source: "rapiddns", hosts });
  } catch (err) {
    errors.push(`rapiddns: ${(err == null ? void 0 : err.message) || "lookup failed"}`);
  }
  const rows = mergeRows(sourceRows);
  const payload = {
    code: 0,
    data: {
      target: domain,
      total: rows.length,
      items: rows.slice(0, limit),
      sources: sourceRows.map((x) => x.source),
      note: "Best-effort subdomain discovery from public datasets.",
      errors
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

export { subdomains_get as default };
//# sourceMappingURL=subdomains.get.mjs.map
