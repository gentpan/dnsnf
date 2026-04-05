import { d as defineEventHandler, g as getQuery, c as createError, h as useStorage, $ as $fetch } from '../../nitro/nitro.mjs';
import { isIP } from 'node:net';
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

const LOOKUP_TIMEOUT_MS = 6e3;
const LOOKUP_CACHE_TTL_MS = 12e4;
const DOMAIN_RE = /^(?=.{1,253}$)(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/i;
const lookupCache = /* @__PURE__ */ new Map();
const CACHE_NAMESPACE = "reverse-ip";
const normalizeDomain = (value) => value.trim().toLowerCase().replace(/\.$/, "");
const pickDomainsFromText = (text) => {
  const out = [];
  for (const line of text.split(/\r?\n/g)) {
    const trimmed = String(line || "").trim();
    if (!trimmed) continue;
    let candidate = trimmed;
    if (candidate.includes(",")) {
      candidate = candidate.split(",")[0] || candidate;
    }
    if (candidate.includes(" ")) {
      candidate = candidate.split(/\s+/)[0] || candidate;
    }
    const raw = normalizeDomain(candidate);
    if (!raw) continue;
    if (/^(api count exceeded|error|no records|invalid|too many requests|captcha|daily reverse ip check limit reached)/i.test(
      raw
    )) {
      continue;
    }
    if (!DOMAIN_RE.test(raw)) continue;
    out.push(raw);
  }
  return Array.from(new Set(out));
};
const pickDomainsFromRapidDnsHtml = (html) => {
  const out = [];
  const tdRegex = /<td[^>]*>\s*([^<]+?)\s*<\/td>/gi;
  for (const match of html.matchAll(tdRegex)) {
    const rawCell = String(match[1] || "").trim().toLowerCase();
    if (!rawCell) continue;
    const candidate = normalizeDomain(rawCell.replace(/^\*\./, ""));
    if (!candidate) continue;
    if (candidate === "rapiddns.io") continue;
    if (!DOMAIN_RE.test(candidate)) continue;
    out.push(candidate);
  }
  return Array.from(new Set(out));
};
const queryHackerTarget = async (ip) => {
  const text = await $fetch("https://api.hackertarget.com/reverseiplookup/", {
    query: { q: ip },
    responseType: "text",
    timeout: LOOKUP_TIMEOUT_MS
  });
  return pickDomainsFromText(String(text || ""));
};
const queryRapidDns = async (ip) => {
  const text = await $fetch(`https://rapiddns.io/sameip/${encodeURIComponent(ip)}?full=1`, {
    responseType: "text",
    timeout: LOOKUP_TIMEOUT_MS,
    headers: {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
    }
  });
  return pickDomainsFromRapidDnsHtml(String(text || ""));
};
const queryYouGetSignal = async (ip) => {
  const body = new URLSearchParams();
  body.set("remoteAddress", ip);
  body.set("key", "");
  const resp = await $fetch("https://domains.yougetsignal.com/domains.php", {
    method: "POST",
    body: body.toString(),
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      accept: "application/json, text/javascript, */*; q=0.01",
      origin: "https://www.yougetsignal.com",
      referer: "https://www.yougetsignal.com/tools/web-sites-on-web-server/",
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      "x-requested-with": "XMLHttpRequest"
    },
    timeout: LOOKUP_TIMEOUT_MS
  });
  if ((resp == null ? void 0 : resp.status) && String(resp.status).toLowerCase() !== "success") {
    throw new Error((resp == null ? void 0 : resp.message) || `provider status: ${resp.status}`);
  }
  const rows = Array.isArray(resp == null ? void 0 : resp.domainArray) ? resp.domainArray : [];
  const domains = rows.map((x) => normalizeDomain(String((x == null ? void 0 : x[0]) || ""))).filter((x) => DOMAIN_RE.test(x));
  return Array.from(new Set(domains));
};
const mergeRows = (sourceRows) => {
  const bucket = /* @__PURE__ */ new Map();
  for (const row of sourceRows) {
    for (const domain of row.domains) {
      const exists = bucket.get(domain) || /* @__PURE__ */ new Set();
      exists.add(row.source);
      bucket.set(domain, exists);
    }
  }
  return Array.from(bucket.entries()).map(([domain, sources]) => ({
    domain,
    sources: Array.from(sources).sort()
  })).sort((a, b) => a.domain.localeCompare(b.domain));
};
const reverseIp_get = defineEventHandler(async (event) => {
  const query = getQuery(event);
  const ip = String(query.ip || "").trim();
  if (!ip) {
    throw createError({ statusCode: 400, statusMessage: "ip is required" });
  }
  if (isIP(ip) !== 4) {
    throw createError({ statusCode: 400, statusMessage: "reverse ip lookup currently supports ipv4 only" });
  }
  const cacheKey = `reverse-ip:${ip}`;
  const storageKey = `${CACHE_NAMESPACE}:${ip}`;
  const now = Date.now();
  const cacheStore = useStorage("reverseIpCache");
  const cacheHit = lookupCache.get(cacheKey);
  if (cacheHit) {
    if (cacheHit.expiresAt > now) {
      const payload2 = structuredClone(cacheHit.payload);
      payload2.cached = true;
      return payload2;
    }
    lookupCache.delete(cacheKey);
  }
  try {
    const persisted = await cacheStore.getItem(storageKey);
    if ((persisted == null ? void 0 : persisted.payload) && typeof persisted.expiresAt === "number") {
      if (persisted.expiresAt > now) {
        lookupCache.set(cacheKey, persisted);
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
    const domains2 = await queryHackerTarget(ip);
    sourceRows.push({ source: "hackertarget", domains: domains2 });
  } catch (err) {
    errors.push(`hackertarget: ${(err == null ? void 0 : err.message) || "lookup failed"}`);
  }
  try {
    const domains2 = await queryYouGetSignal(ip);
    sourceRows.push({ source: "yougetsignal", domains: domains2 });
  } catch (err) {
    errors.push(`yougetsignal: ${(err == null ? void 0 : err.message) || "lookup failed"}`);
  }
  try {
    const domains2 = await queryRapidDns(ip);
    sourceRows.push({ source: "rapiddns", domains: domains2 });
  } catch (err) {
    errors.push(`rapiddns: ${(err == null ? void 0 : err.message) || "lookup failed"}`);
  }
  const domains = mergeRows(sourceRows);
  const payload = {
    code: 0,
    data: {
      ip,
      total: domains.length,
      domains,
      sources: sourceRows.map((x) => x.source),
      completeness: "best_effort_public_sources",
      note: "Results are from public datasets and may be incomplete.",
      errors: domains.length === 0 && errors.length === 0 ? ["No records returned from public reverse-ip sources for this IP."] : errors
    },
    cached: false,
    timestamp: Math.floor(Date.now() / 1e3)
  };
  lookupCache.set(cacheKey, {
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

export { reverseIp_get as default };
//# sourceMappingURL=reverse-ip.get.mjs.map
