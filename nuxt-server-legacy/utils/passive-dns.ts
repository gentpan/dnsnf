import { $fetch } from 'ofetch'
/**
 * Passive DNS — query multiple free public sources concurrently.
 *
 * Sources (no API key required):
 *   - CIRCL Passive DNS  (circl.lu)
 *   - Robtex Free API    (freeapi.robtex.com)
 */

export type PassiveDnsRecord = {
  domain: string;
  record_type: string;
  record_value: string;
  first_seen_at: string; // ISO-8601
  last_seen_at: string;  // ISO-8601
  source: string;
};

const ALLOWED_TYPES = new Set(["A", "AAAA", "MX", "NS", "CNAME", "TXT", "SOA", "PTR"]);

/** Parse NDJSON (newline-delimited JSON) text safely */
const parseNdjson = (text: string): unknown[] => {
  const out: unknown[] = [];
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    try { out.push(JSON.parse(t)); } catch { /* skip malformed line */ }
  }
  return out;
};

const toIso = (unixSec: unknown): string => {
  const n = Number(unixSec);
  return n > 0 ? new Date(n * 1000).toISOString() : new Date().toISOString();
};

const normalizeDomain = (v: string) => String(v || "").replace(/\.$/, "").toLowerCase();
const normalizeValue  = (v: string) => String(v || "").replace(/\.$/, "");

// ── CIRCL Passive DNS ─────────────────────────────────────────────────────────
// https://www.circl.lu/services/passive-dns/
// Response: NDJSON  { rrname, rrtype, rdata, time_first, time_last, count }
const queryCIRCL = async (domain: string): Promise<PassiveDnsRecord[]> => {
  const text = await $fetch(
    `https://www.circl.lu/pdns/query/${encodeURIComponent(domain)}`,
    { responseType: "text", timeout: 10_000, headers: { Accept: "application/json" } },
  );
  return parseNdjson(text).flatMap((obj: any) => {
    if (!obj?.rrtype || !obj?.rdata) return [];
    return [{
      domain:        normalizeDomain(String(obj.rrname || domain)),
      record_type:   String(obj.rrtype).toUpperCase(),
      record_value:  normalizeValue(String(obj.rdata)),
      first_seen_at: toIso(obj.time_first),
      last_seen_at:  toIso(obj.time_last),
      source: "circl",
    }];
  });
};

// ── Robtex Free Passive DNS ───────────────────────────────────────────────────
// https://www.robtex.com/api/
// Response: NDJSON  { rrname, rrtype, rdata, time_first, time_last }
const queryRobtex = async (domain: string): Promise<PassiveDnsRecord[]> => {
  const text = await $fetch(
    `https://freeapi.robtex.com/pdns/forward/${encodeURIComponent(domain)}`,
    { responseType: "text", timeout: 10_000 },
  );
  return parseNdjson(text).flatMap((obj: any) => {
    if (!obj?.rrtype || !obj?.rdata) return [];
    return [{
      domain:        normalizeDomain(String(obj.rrname || domain)),
      record_type:   String(obj.rrtype).toUpperCase(),
      record_value:  normalizeValue(String(obj.rdata)),
      first_seen_at: toIso(obj.time_first),
      last_seen_at:  toIso(obj.time_last),
      source: "robtex",
    }];
  });
};

/**
 * Query all passive DNS sources concurrently for a domain.
 * Returns deduplicated records filtered to supported record types.
 * Individual source failures are silently ignored.
 */
export const queryPassiveDns = async (domain: string): Promise<PassiveDnsRecord[]> => {
  const settled = await Promise.allSettled([
    queryCIRCL(domain),
    queryRobtex(domain),
  ]);

  const all: PassiveDnsRecord[] = [];
  for (const r of settled) {
    if (r.status === "fulfilled") all.push(...r.value);
  }

  // Deduplicate by (record_type, record_value, source) and filter allowed types
  const seen = new Set<string>();
  const out: PassiveDnsRecord[] = [];
  for (const r of all) {
    if (!ALLOWED_TYPES.has(r.record_type)) continue;
    const key = `${r.record_type}|${r.record_value}|${r.source}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
};
