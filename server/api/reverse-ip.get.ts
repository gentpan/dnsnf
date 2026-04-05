import { $fetch } from 'ofetch'
import { isIP } from "node:net";

type SourceName = "hackertarget" | "yougetsignal" | "rapiddns";

type DomainRow = {
  domain: string;
  sources: SourceName[];
};

const LOOKUP_TIMEOUT_MS = 6_000;
const LOOKUP_CACHE_TTL_MS = 120_000;
const DOMAIN_RE = /^(?=.{1,253}$)(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/i;
const lookupCache = new Map<string, { expiresAt: number; payload: unknown }>();
const CACHE_NAMESPACE = "reverse-ip";

const normalizeDomain = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\.$/, "");

const pickDomainsFromText = (text: string) => {
  const out: string[] = [];
  for (const line of text.split(/\r?\n/g)) {
    const trimmed = String(line || "").trim();
    if (!trimmed) continue;
    let candidate = trimmed;
    // Some providers return `domain,ip` CSV lines.
    if (candidate.includes(",")) {
      candidate = candidate.split(",")[0] || candidate;
    }
    // Some providers include extra columns in whitespace format.
    if (candidate.includes(" ")) {
      candidate = candidate.split(/\s+/)[0] || candidate;
    }
    const raw = normalizeDomain(candidate);
    if (!raw) continue;
    if (
      /^(api count exceeded|error|no records|invalid|too many requests|captcha|daily reverse ip check limit reached)/i.test(
        raw,
      )
    ) {
      continue;
    }
    if (!DOMAIN_RE.test(raw)) continue;
    out.push(raw);
  }
  return Array.from(new Set(out));
};

const pickDomainsFromRapidDnsHtml = (html: string) => {
  const out: string[] = [];
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

const queryHackerTarget = async (ip: string) => {
  const text = await $fetch("https://api.hackertarget.com/reverseiplookup/", {
    query: { q: ip },
    responseType: "text",
    timeout: LOOKUP_TIMEOUT_MS,
  });
  return pickDomainsFromText(String(text || ""));
};

const queryRapidDns = async (ip: string) => {
  const text = await $fetch(`https://rapiddns.io/sameip/${encodeURIComponent(ip)}?full=1`, {
    responseType: "text",
    timeout: LOOKUP_TIMEOUT_MS,
    headers: {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    },
  });
  return pickDomainsFromRapidDnsHtml(String(text || ""));
};

const queryYouGetSignal = async (ip: string) => {
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
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      "x-requested-with": "XMLHttpRequest",
    },
    timeout: LOOKUP_TIMEOUT_MS,
  });

  if (resp?.status && String(resp.status).toLowerCase() !== "success") {
    throw new Error(resp?.message || `provider status: ${resp.status}`);
  }

  const rows = Array.isArray((resp as { domainArray?: unknown })?.domainArray) ? (resp as { domainArray: Array<[string, string]> }).domainArray : [];
  const domains = rows
    .map((x: [string, string]) => normalizeDomain(String(x?.[0] || "")))
    .filter((x: string) => DOMAIN_RE.test(x));
  return Array.from(new Set(domains)) as string[];
};

const mergeRows = (sourceRows: Array<{ source: SourceName; domains: string[] }>) => {
  const bucket = new Map<string, Set<SourceName>>();
  for (const row of sourceRows) {
    for (const domain of row.domains) {
      const exists = bucket.get(domain) || new Set<SourceName>();
      exists.add(row.source);
      bucket.set(domain, exists);
    }
  }
  return Array.from(bucket.entries())
    .map(([domain, sources]) => ({
      domain,
      sources: Array.from(sources).sort() as SourceName[],
    }))
    .sort((a, b) => a.domain.localeCompare(b.domain));
};

export default defineEventHandler(async (event) => {
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
      const payload = structuredClone(cacheHit.payload as object) as { cached?: boolean };
      payload.cached = true;
      return payload;
    }
    lookupCache.delete(cacheKey);
  }

  try {
    const persisted = await cacheStore.getItem<{ expiresAt: number; payload: unknown }>(storageKey);
    if (persisted?.payload && typeof persisted.expiresAt === "number") {
      if (persisted.expiresAt > now) {
        lookupCache.set(cacheKey, persisted);
        const payload = structuredClone(persisted.payload as object) as { cached?: boolean };
        payload.cached = true;
        return payload;
      }
      await cacheStore.removeItem(storageKey);
    }
  } catch {
    // Ignore storage read errors and continue with live query.
  }

  const sourceRows: Array<{ source: SourceName; domains: string[] }> = [];
  const errors: string[] = [];

  try {
    const domains = await queryHackerTarget(ip);
    sourceRows.push({ source: "hackertarget", domains });
  } catch (err) {
    errors.push(`hackertarget: ${(err as Error)?.message || "lookup failed"}`);
  }

  try {
    const domains = await queryYouGetSignal(ip);
    sourceRows.push({ source: "yougetsignal", domains: domains as string[] });
  } catch (err) {
    errors.push(`yougetsignal: ${(err as Error)?.message || "lookup failed"}`);
  }

  try {
    const domains = await queryRapidDns(ip);
    sourceRows.push({ source: "rapiddns", domains });
  } catch (err) {
    errors.push(`rapiddns: ${(err as Error)?.message || "lookup failed"}`);
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
      errors:
        domains.length === 0 && errors.length === 0
          ? ["No records returned from public reverse-ip sources for this IP."]
          : errors,
    },
    cached: false,
    timestamp: Math.floor(Date.now() / 1000),
  };

  lookupCache.set(cacheKey, {
    expiresAt: now + LOOKUP_CACHE_TTL_MS,
    payload,
  });
  try {
    await cacheStore.setItem(storageKey, {
      expiresAt: now + LOOKUP_CACHE_TTL_MS,
      payload,
    });
  } catch {
    // Ignore storage write errors and still return fresh data.
  }

  return payload;
});
