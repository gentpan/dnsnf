import { $fetch } from 'ofetch'
import {
  Resolver,
  resolve4,
  resolve6,
  resolveCaa,
  resolveCname,
  resolveMx,
  resolveNs,
  resolveSoa,
  resolveSrv,
  resolveTxt,
  reverse,
} from "node:dns/promises";
import { aggregateWithConfidence } from "../../utils/doh";
import { appendDnsHistory } from "../../utils/dns-history";

type RecordType =
  | "ALL"
  | "A"
  | "AAAA"
  | "CNAME"
  | "MX"
  | "NS"
  | "PTR"
  | "TXT"
  | "CAA"
  | "SOA"
  | "SRV";

const LOOKUP_TIMEOUT_MS = 2000;
const LOOKUP_CACHE_TTL_MS = 60_000;
const IPV4_CIDR_RE = /^(\d{1,3}\.){3}\d{1,3}\/([0-9]|[12][0-9]|3[0-2])$/;
const IPV4_RE = /^(\d{1,3}\.){3}\d{1,3}$/;
const IPV6_RE = /:/;
const DOMAIN_RE = /^(?=.{1,253}$)(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/i;
const DNS_FALLBACK_SERVERS = ["1.1.1.1", "8.8.8.8"];

const ALL_DOMAIN_TYPES: Array<Exclude<RecordType, "ALL">> = [
  "A",
  "AAAA",
  "CNAME",
  "MX",
  "NS",
  "PTR",
  "TXT",
  "CAA",
  "SOA",
  "SRV",
];
const CONSENSUS_TYPES: Array<Exclude<RecordType, "ALL" | "PTR">> = ["A", "AAAA", "CNAME", "MX", "NS", "TXT", "CAA", "SOA", "SRV"];
const DKIM_SELECTORS = ["default", "google", "selector1", "selector2", "k1", "s1"];
const lookupCache = new Map<string, { expiresAt: number; payload: unknown }>();

// Types that Go backend supports for domain queries
const GO_PROXY_TYPES: RecordType[] = ["ALL", "A", "AAAA", "CNAME", "MX", "NS", "TXT", "CAA", "SOA", "SRV"];

const emptyRecords = () => ({
  A: [] as string[],
  AAAA: [] as string[],
  CNAME: [] as string[],
  MX: [] as Array<{ host: string; pref: number }>,
  NS: [] as string[],
  PTR: [] as string[],
  TXT: [] as string[],
  CAA: [] as Array<{ flag: number; tag: string; value: string }>,
  SOA: {} as {
    ns?: string;
    mbox?: string;
    serial?: number;
    refresh?: number;
    retry?: number;
    expire?: number;
    minttl?: number;
  },
  SRV: [] as Array<{ target: string; port: number; priority: number; weight: number }>,
});

type Records = ReturnType<typeof emptyRecords>;

const withTimeout = async <T>(promise: Promise<T>, timeoutMs = LOOKUP_TIMEOUT_MS): Promise<T> => {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("lookup timeout")), timeoutMs);
    }),
  ]);
};

const isNotFound = (err: unknown) => {
  const code = (err as { code?: string })?.code;
  return code === "ENOTFOUND" || code === "ENODATA" || code === "SERVFAIL";
};

const safe = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
  try {
    return await withTimeout(fn());
  } catch (err) {
    if (isNotFound(err)) return fallback;
    return fallback;
  }
};

const normalizeType = (raw: unknown): RecordType => {
  const t = String(raw || "ALL").trim().toUpperCase();
  if (t === "SAO") return "SOA";
  if (t === "RDNS") return "PTR";
  if (t === "SPF" || t === "DMARC" || t === "DKIM") return "TXT";
  const supported: RecordType[] = ["ALL", "A", "AAAA", "CNAME", "MX", "NS", "PTR", "TXT", "CAA", "SOA", "SRV"];
  if (!supported.includes(t as RecordType)) return "ALL";
  return t as RecordType;
};

const resolveSoaWithFallback = async (domain: string) => {
  const direct = await safe(() => resolveSoa(domain), null as Awaited<ReturnType<typeof resolveSoa>> | null);
  if (direct) return direct;

  for (const server of DNS_FALLBACK_SERVERS) {
    const resolver = new Resolver();
    resolver.setServers([server]);
    const viaPublic = await safe(() => resolver.resolveSoa(domain), null as Awaited<ReturnType<typeof resolveSoa>> | null);
    if (viaPublic) return viaPublic;
  }

  return null;
};

const isIPTarget = (value: string) => IPV4_RE.test(value) || IPV6_RE.test(value) || IPV4_CIDR_RE.test(value);

// ─── Direct DNS resolution helpers (all parallel) ────────────────────────────

/** Resolve a single non-TXT, non-PTR type directly via Node.js DNS. */
const resolveSingleType = async (domain: string, t: RecordType): Promise<Partial<Records>> => {
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
    return { CAA: caa.map((x) => ({ flag: x.critical ? 128 : 0, tag: x.issue || x.issuewild || "issue", value: (x as any).value || x.iodef || "" })) };
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

/** Resolve base TXT + DMARC + all DKIM selectors in parallel. */
const resolveTxtWithDkim = async (domain: string): Promise<string[]> => {
  const [txt, dmarcTxt, ...dkimResults] = await Promise.all([
    safe(() => resolveTxt(domain), []),
    safe(() => resolveTxt(`_dmarc.${domain}`), []),
    ...DKIM_SELECTORS.map((selector) => safe(() => resolveTxt(`${selector}._domainkey.${domain}`), [])),
  ]);
  const mappedBase = txt.map((chunk) => chunk.join("")).map((x) => (/^v=spf1\s/i.test(x) ? `SPF: ${x}` : x));
  const dmarcRows = dmarcTxt.map((chunk) => `DMARC: ${chunk.join("")}`);
  const dkimRows = DKIM_SELECTORS.flatMap((selector, i) =>
    (dkimResults[i] || []).map((chunk) => `DKIM ${selector}: ${chunk.join("")}`),
  );
  return Array.from(new Set([...mappedBase, ...dmarcRows, ...dkimRows]));
};

/** Resolve only DMARC + DKIM selectors in parallel (used to enrich Go backend TXT). */
const resolveDkimDmarc = async (domain: string): Promise<string[]> => {
  const [dmarcTxt, ...dkimResults] = await Promise.all([
    safe(() => resolveTxt(`_dmarc.${domain}`), []),
    ...DKIM_SELECTORS.map((selector) => safe(() => resolveTxt(`${selector}._domainkey.${domain}`), [])),
  ]);
  const dmarcRows = dmarcTxt.map((chunk) => `DMARC: ${chunk.join("")}`);
  const dkimRows = DKIM_SELECTORS.flatMap((selector, i) =>
    (dkimResults[i] || []).map((chunk) => `DKIM ${selector}: ${chunk.join("")}`),
  );
  return Array.from(new Set([...dmarcRows, ...dkimRows]));
};

/** Resolve PTR for a domain by first looking up its A/AAAA IPs in parallel. */
const resolvePtrForDomain = async (domain: string): Promise<{ ptrValues: string[]; reverseDns: string[] }> => {
  const [a, aaaa] = await Promise.all([safe(() => resolve4(domain), []), safe(() => resolve6(domain), [])]);
  const allIps = [...a, ...aaaa];
  const ptrResults = await Promise.all(allIps.map((ip) => safe(() => reverse(ip), [])));
  const reverseDns: string[] = [];
  const ptrValues: string[] = [];
  allIps.forEach((ip, idx) => {
    for (const host of ptrResults[idx]) {
      const normalized = host.replace(/\.$/, "").toLowerCase();
      reverseDns.push(`${ip} ${normalized}`);
      ptrValues.push(normalized);
    }
  });
  return { ptrValues: Array.from(new Set(ptrValues)), reverseDns };
};

// ─── Domain result builder ────────────────────────────────────────────────────

const buildDomainResult = async (domain: string, type: RecordType, includeConsensus: boolean, apiBase: string) => {
  const records = emptyRecords();
  let reverseDns: string[] = [];
  const toQuery = type === "ALL" ? ALL_DOMAIN_TYPES : [type];
  const consensus: Record<string, { confidence: number; sources: string[] }> = {};

  // ── Step 1: Fetch basic DNS records ─────────────────────────────────────────
  // Try Go backend proxy first (benefits: Redis cache + PostgreSQL logging).
  // Falls back to direct Node.js DNS resolution if Go is unavailable.
  let goProxySuccess = false;

  if (GO_PROXY_TYPES.includes(type)) {
    try {
      const goType = type === "PTR" ? "ALL" : type;
      const goResult = await $fetch(`${apiBase}/v1/dns/lookup`, {
        query: { domain, type: goType },
        signal: AbortSignal.timeout(3000),
      });

      if (goResult?.code === 0 && goResult.data?.records) {
        const gr = goResult.data.records;
        if (gr.A) records.A = gr.A;
        if (gr.AAAA) records.AAAA = gr.AAAA;
        if (gr.CNAME) records.CNAME = gr.CNAME;
        if (gr.MX) records.MX = gr.MX;
        if (gr.NS) records.NS = gr.NS;
        if (gr.TXT) {
          // Apply SPF prefix that Go backend doesn't add
          records.TXT = gr.TXT.map((x: string) => (/^v=spf1\s/i.test(x) ? `SPF: ${x}` : x));
        }
        if (gr.CAA) records.CAA = gr.CAA;
        if (gr.SOA) records.SOA = gr.SOA;
        if (gr.SRV) records.SRV = gr.SRV;
        goProxySuccess = true;
      }
    } catch {
      // Go backend unavailable — fall through to direct resolution
    }
  }

  if (!goProxySuccess) {
    // Direct parallel resolution for all non-TXT, non-PTR types
    const directTypes = toQuery.filter((t) => t !== "PTR" && t !== "TXT");
    const partials = await Promise.all(directTypes.map((t) => resolveSingleType(domain, t)));
    for (const partial of partials) Object.assign(records, partial);
  }

  // ── Step 2: TXT enrichment (DKIM + DMARC) ───────────────────────────────────
  // Always resolved directly — Go backend does not include DKIM/DMARC.
  if (type === "ALL" || type === "TXT") {
    if (goProxySuccess) {
      // Enrich Go's base TXT with DKIM/DMARC
      const extra = await resolveDkimDmarc(domain);
      records.TXT = Array.from(new Set([...records.TXT, ...extra]));
    } else {
      records.TXT = await resolveTxtWithDkim(domain);
    }
  }

  // ── Step 3: PTR lookup (Go backend doesn't support PTR for domain targets) ──
  if (type === "ALL" || type === "PTR") {
    const { ptrValues, reverseDns: ptrReverseDns } = await resolvePtrForDomain(domain);
    records.PTR = ptrValues;
    reverseDns = ptrReverseDns;
  }

  // ── Step 4: Upstream consensus (DoH cross-check) ────────────────────────────
  if (includeConsensus) {
    const targetTypes = toQuery.filter((t) => CONSENSUS_TYPES.includes(t as Exclude<RecordType, "ALL" | "PTR">));
    const rows = await Promise.all(
      targetTypes.map(async (t) => {
        const merged = await aggregateWithConfidence(domain, t);
        return { type: t, confidence: merged.confidence, sources: merged.sources };
      }),
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
      upstream_consensus: consensus,
    },
    cached: false,
    timestamp: Math.floor(Date.now() / 1000),
  };
};

// ─── IP / CIDR result builder (unchanged) ────────────────────────────────────

const buildIPResult = async (ip: string) => {
  if (IPV4_CIDR_RE.test(ip)) {
    const rdns = await $fetch("/api/rdns", {
      query: { ip, type: "RDNS" },
    });
    const reverseDns = Array.isArray((rdns as { data?: { reverse_dns?: string[] } })?.data?.reverse_dns)
      ? ((rdns as { data: { reverse_dns: string[] } }).data.reverse_dns)
      : [];
    const ptr = reverseDns
      .map((row) => String(row).trim().match(/^((?:\d{1,3}\.){3}\d{1,3})\s+(.+)$/)?.[2] || "")
      .filter(Boolean);
    const rdnsRecords = (rdns as { data?: { records?: ReturnType<typeof emptyRecords> } })?.data?.records || emptyRecords();
    return {
      ...(rdns as object),
      data: {
        ...(rdns as { data?: object }).data,
        records: {
          ...emptyRecords(),
          ...rdnsRecords,
          PTR: ptr,
        },
      },
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
        PTR: ptr.map((x) => x.replace(/\.$/, "").toLowerCase()),
      },
    },
    cached: false,
    timestamp: Math.floor(Date.now() / 1000),
  };
};

// ─── Handler ──────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
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
      const payload = structuredClone(cacheHit.payload as object) as { cached?: boolean };
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
    const apiBase = String(config.apiInternalBase || config.public?.apiBase || "http://localhost:8080").replace(/\/$/, "");
    const result = await buildDomainResult(rawDomain, type, includeConsensus, apiBase);
    await appendDnsHistory(rawDomain, {
      timestamp: result.timestamp,
      type,
      target: rawDomain,
      records: result.data.records as Record<string, unknown>,
      cached: false,
    });
    lookupCache.set(cacheKey, {
      expiresAt: now + LOOKUP_CACHE_TTL_MS,
      payload: result,
    });
    return result;
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
    payload: result,
  });
  return result;
});
