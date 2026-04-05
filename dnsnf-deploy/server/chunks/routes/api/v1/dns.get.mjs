import { d as defineEventHandler, g as getQuery, c as createError, u as useRuntimeConfig, j as appendDnsHistory, $ as $fetch, e as aggregateWithConfidence } from '../../../nitro/nitro.mjs';
import { reverse, resolveMx, resolveCaa, resolveSoa, Resolver, resolveSrv, resolveTxt, resolve4, resolve6, resolveCname, resolveNs } from 'node:dns/promises';
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

const LOOKUP_TIMEOUT_MS = 2e3;
const LOOKUP_CACHE_TTL_MS = 6e4;
const IPV4_CIDR_RE = /^(\d{1,3}\.){3}\d{1,3}\/([0-9]|[12][0-9]|3[0-2])$/;
const IPV4_RE = /^(\d{1,3}\.){3}\d{1,3}$/;
const IPV6_RE = /:/;
const DOMAIN_RE = /^(?=.{1,253}$)(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/i;
const DNS_FALLBACK_SERVERS = ["1.1.1.1", "8.8.8.8"];
const ALL_DOMAIN_TYPES = [
  "A",
  "AAAA",
  "CNAME",
  "MX",
  "NS",
  "PTR",
  "TXT",
  "CAA",
  "SOA",
  "SRV"
];
const CONSENSUS_TYPES = ["A", "AAAA", "CNAME", "MX", "NS", "TXT", "CAA", "SOA", "SRV"];
const DKIM_SELECTORS = ["default", "google", "selector1", "selector2", "k1", "s1"];
const lookupCache = /* @__PURE__ */ new Map();
const GO_PROXY_TYPES = ["ALL", "A", "AAAA", "CNAME", "MX", "NS", "TXT", "CAA", "SOA", "SRV"];
const emptyRecords = () => ({
  A: [],
  AAAA: [],
  CNAME: [],
  MX: [],
  NS: [],
  PTR: [],
  TXT: [],
  CAA: [],
  SOA: {},
  SRV: []
});
const withTimeout = async (promise, timeoutMs = LOOKUP_TIMEOUT_MS) => {
  return await Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("lookup timeout")), timeoutMs);
    })
  ]);
};
const isNotFound = (err) => {
  const code = err == null ? void 0 : err.code;
  return code === "ENOTFOUND" || code === "ENODATA" || code === "SERVFAIL";
};
const safe = async (fn, fallback) => {
  try {
    return await withTimeout(fn());
  } catch (err) {
    if (isNotFound(err)) return fallback;
    return fallback;
  }
};
const normalizeType = (raw) => {
  const t = String(raw || "ALL").trim().toUpperCase();
  if (t === "SAO") return "SOA";
  if (t === "RDNS") return "PTR";
  if (t === "SPF" || t === "DMARC" || t === "DKIM") return "TXT";
  const supported = ["ALL", "A", "AAAA", "CNAME", "MX", "NS", "PTR", "TXT", "CAA", "SOA", "SRV"];
  if (!supported.includes(t)) return "ALL";
  return t;
};
const resolveSoaWithFallback = async (domain) => {
  const direct = await safe(() => resolveSoa(domain), null);
  if (direct) return direct;
  for (const server of DNS_FALLBACK_SERVERS) {
    const resolver = new Resolver();
    resolver.setServers([server]);
    const viaPublic = await safe(() => resolver.resolveSoa(domain), null);
    if (viaPublic) return viaPublic;
  }
  return null;
};
const isIPTarget = (value) => IPV4_RE.test(value) || IPV6_RE.test(value) || IPV4_CIDR_RE.test(value);
const resolveSingleType = async (domain, t) => {
  if (t === "A") return { A: await safe(() => resolve4(domain), []) };
  if (t === "AAAA") return { AAAA: await safe(() => resolve6(domain), []) };
  if (t === "CNAME") return { CNAME: await safe(() => resolveCname(domain), []) };
  if (t === "MX") {
    const mx = await safe(() => resolveMx(domain), []);
    return { MX: mx.map((x) => ({ host: x.exchange, pref: x.priority })) };
  }
  if (t === "NS") return { NS: await safe(() => resolveNs(domain), []) };
  if (t === "CAA") {
    const caa = await safe(() => resolveCaa(domain), []);
    return { CAA: caa.map((x) => ({ flag: x.critical ? 128 : 0, tag: x.issue || x.issuewild || "issue", value: x.value || x.iodef || "" })) };
  }
  if (t === "SOA") {
    const soa = await resolveSoaWithFallback(domain);
    if (!soa) return {};
    return { SOA: { ns: soa.nsname, mbox: soa.hostmaster, serial: soa.serial, refresh: soa.refresh, retry: soa.retry, expire: soa.expire, minttl: soa.minttl } };
  }
  if (t === "SRV") {
    const srv = await safe(() => resolveSrv(domain), []);
    return { SRV: srv.map((x) => ({ target: x.name, port: x.port, priority: x.priority, weight: x.weight })) };
  }
  return {};
};
const resolveTxtWithDkim = async (domain) => {
  const [txt, dmarcTxt, ...dkimResults] = await Promise.all([
    safe(() => resolveTxt(domain), []),
    safe(() => resolveTxt(`_dmarc.${domain}`), []),
    ...DKIM_SELECTORS.map((selector) => safe(() => resolveTxt(`${selector}._domainkey.${domain}`), []))
  ]);
  const mappedBase = txt.map((chunk) => chunk.join("")).map((x) => /^v=spf1\s/i.test(x) ? `SPF: ${x}` : x);
  const dmarcRows = dmarcTxt.map((chunk) => `DMARC: ${chunk.join("")}`);
  const dkimRows = DKIM_SELECTORS.flatMap(
    (selector, i) => (dkimResults[i] || []).map((chunk) => `DKIM ${selector}: ${chunk.join("")}`)
  );
  return Array.from(/* @__PURE__ */ new Set([...mappedBase, ...dmarcRows, ...dkimRows]));
};
const resolveDkimDmarc = async (domain) => {
  const [dmarcTxt, ...dkimResults] = await Promise.all([
    safe(() => resolveTxt(`_dmarc.${domain}`), []),
    ...DKIM_SELECTORS.map((selector) => safe(() => resolveTxt(`${selector}._domainkey.${domain}`), []))
  ]);
  const dmarcRows = dmarcTxt.map((chunk) => `DMARC: ${chunk.join("")}`);
  const dkimRows = DKIM_SELECTORS.flatMap(
    (selector, i) => (dkimResults[i] || []).map((chunk) => `DKIM ${selector}: ${chunk.join("")}`)
  );
  return Array.from(/* @__PURE__ */ new Set([...dmarcRows, ...dkimRows]));
};
const resolvePtrForDomain = async (domain) => {
  const [a, aaaa] = await Promise.all([safe(() => resolve4(domain), []), safe(() => resolve6(domain), [])]);
  const allIps = [...a, ...aaaa];
  const ptrResults = await Promise.all(allIps.map((ip) => safe(() => reverse(ip), [])));
  const reverseDns = [];
  const ptrValues = [];
  allIps.forEach((ip, idx) => {
    for (const host of ptrResults[idx]) {
      const normalized = host.replace(/\.$/, "").toLowerCase();
      reverseDns.push(`${ip} ${normalized}`);
      ptrValues.push(normalized);
    }
  });
  return { ptrValues: Array.from(new Set(ptrValues)), reverseDns };
};
const buildDomainResult = async (domain, type, includeConsensus, apiBase) => {
  var _a;
  const records = emptyRecords();
  let reverseDns = [];
  const toQuery = type === "ALL" ? ALL_DOMAIN_TYPES : [type];
  const consensus = {};
  let goProxySuccess = false;
  if (GO_PROXY_TYPES.includes(type)) {
    try {
      const goType = type === "PTR" ? "ALL" : type;
      const goResult = await $fetch(`${apiBase}/v1/dns/lookup`, {
        query: { domain, type: goType },
        signal: AbortSignal.timeout(3e3)
      });
      if ((goResult == null ? void 0 : goResult.code) === 0 && ((_a = goResult.data) == null ? void 0 : _a.records)) {
        const gr = goResult.data.records;
        if (gr.A) records.A = gr.A;
        if (gr.AAAA) records.AAAA = gr.AAAA;
        if (gr.CNAME) records.CNAME = gr.CNAME;
        if (gr.MX) records.MX = gr.MX;
        if (gr.NS) records.NS = gr.NS;
        if (gr.TXT) {
          records.TXT = gr.TXT.map((x) => /^v=spf1\s/i.test(x) ? `SPF: ${x}` : x);
        }
        if (gr.CAA) records.CAA = gr.CAA;
        if (gr.SOA) records.SOA = gr.SOA;
        if (gr.SRV) records.SRV = gr.SRV;
        goProxySuccess = true;
      }
    } catch {
    }
  }
  if (!goProxySuccess) {
    const directTypes = toQuery.filter((t) => t !== "PTR" && t !== "TXT");
    const partials = await Promise.all(directTypes.map((t) => resolveSingleType(domain, t)));
    for (const partial of partials) Object.assign(records, partial);
  }
  if (type === "ALL" || type === "TXT") {
    if (goProxySuccess) {
      const extra = await resolveDkimDmarc(domain);
      records.TXT = Array.from(/* @__PURE__ */ new Set([...records.TXT, ...extra]));
    } else {
      records.TXT = await resolveTxtWithDkim(domain);
    }
  }
  if (type === "ALL" || type === "PTR") {
    const { ptrValues, reverseDns: ptrReverseDns } = await resolvePtrForDomain(domain);
    records.PTR = ptrValues;
    reverseDns = ptrReverseDns;
  }
  if (includeConsensus) {
    const targetTypes = toQuery.filter((t) => CONSENSUS_TYPES.includes(t));
    const rows = await Promise.all(
      targetTypes.map(async (t) => {
        const merged = await aggregateWithConfidence(domain, t);
        return { type: t, confidence: merged.confidence, sources: merged.sources };
      })
    );
    for (const row of rows) {
      consensus[row.type] = { confidence: row.confidence, sources: row.sources };
    }
  }
  return {
    code: 0,
    data: {
      domain,
      reverse_dns: reverseDns,
      records,
      upstream_consensus: consensus
    },
    cached: false,
    timestamp: Math.floor(Date.now() / 1e3)
  };
};
const buildIPResult = async (ip) => {
  var _a, _b;
  if (IPV4_CIDR_RE.test(ip)) {
    const rdns = await $fetch("/api/rdns", {
      query: { ip, type: "RDNS" }
    });
    const reverseDns = Array.isArray((_a = rdns == null ? void 0 : rdns.data) == null ? void 0 : _a.reverse_dns) ? rdns.data.reverse_dns : [];
    const ptr2 = reverseDns.map((row) => {
      var _a2;
      return ((_a2 = String(row).trim().match(/^((?:\d{1,3}\.){3}\d{1,3})\s+(.+)$/)) == null ? void 0 : _a2[2]) || "";
    }).filter(Boolean);
    const rdnsRecords = ((_b = rdns == null ? void 0 : rdns.data) == null ? void 0 : _b.records) || emptyRecords();
    return {
      ...rdns,
      data: {
        ...rdns.data,
        records: {
          ...emptyRecords(),
          ...rdnsRecords,
          PTR: ptr2
        }
      }
    };
  }
  const ptr = await safe(() => reverse(ip), []);
  return {
    code: 0,
    data: {
      ip,
      reverse_dns: ptr.map((x) => `${ip} ${x.replace(/\.$/, "").toLowerCase()}`),
      records: {
        ...emptyRecords(),
        PTR: ptr.map((x) => x.replace(/\.$/, "").toLowerCase())
      }
    },
    cached: false,
    timestamp: Math.floor(Date.now() / 1e3)
  };
};
const dns_get = defineEventHandler(async (event) => {
  var _a;
  const query = getQuery(event);
  const rawDomain = String(query.domain || "").trim().toLowerCase();
  const rawIP = String(query.ip || "").trim();
  const type = normalizeType(query.type);
  const includeConsensus = String(query.consensus || "1").trim() !== "0";
  const target = rawDomain || rawIP;
  if (!target) {
    throw createError({ statusCode: 400, statusMessage: "domain or ip is required" });
  }
  const cacheKey = `${rawDomain ? "domain" : "ip"}:${target}:type=${type}`;
  const now = Date.now();
  const cacheHit = lookupCache.get(cacheKey);
  if (cacheHit) {
    if (cacheHit.expiresAt > now) {
      const payload = structuredClone(cacheHit.payload);
      payload.cached = true;
      return payload;
    }
    lookupCache.delete(cacheKey);
  }
  if (rawDomain) {
    if (!DOMAIN_RE.test(rawDomain)) {
      throw createError({ statusCode: 400, statusMessage: "invalid domain" });
    }
    const config = useRuntimeConfig(event);
    const apiBase = String(config.apiInternalBase || ((_a = config.public) == null ? void 0 : _a.apiBase) || "http://localhost:8080").replace(/\/$/, "");
    const result2 = await buildDomainResult(rawDomain, type, includeConsensus, apiBase);
    await appendDnsHistory(rawDomain, {
      timestamp: result2.timestamp,
      type,
      target: rawDomain,
      records: result2.data.records,
      cached: false
    });
    lookupCache.set(cacheKey, {
      expiresAt: now + LOOKUP_CACHE_TTL_MS,
      payload: result2
    });
    return result2;
  }
  if (!isIPTarget(rawIP)) {
    throw createError({ statusCode: 400, statusMessage: "invalid ip" });
  }
  if (type !== "PTR" && type !== "ALL") {
    throw createError({ statusCode: 400, statusMessage: "ip target supports only PTR or ALL" });
  }
  const result = await buildIPResult(rawIP);
  lookupCache.set(cacheKey, {
    expiresAt: now + LOOKUP_CACHE_TTL_MS,
    payload: result
  });
  return result;
});

export { dns_get as default };
//# sourceMappingURL=dns.get.mjs.map
