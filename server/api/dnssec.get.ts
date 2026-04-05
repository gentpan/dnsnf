import { aggregateWithConfidence } from "../utils/doh";

const DOMAIN_RE = /^(?=.{1,253}$)(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/i;

const DNSSEC_TYPES = ["DS", "DNSKEY", "RRSIG", "NSEC"] as const;
type DnssecType = (typeof DNSSEC_TYPES)[number];

const hasRows = (rows: unknown) => Array.isArray(rows) && rows.length > 0;

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const domain = String(query.domain || "").trim().toLowerCase();
  if (!domain || !DOMAIN_RE.test(domain)) {
    throw createError({ statusCode: 400, statusMessage: "invalid domain" });
  }

  const results = await Promise.all(
    DNSSEC_TYPES.map(async (type) => {
      const agg = await aggregateWithConfidence(domain, type as DnssecType);
      return {
        type,
        values: agg.values,
        confidence: agg.confidence,
        sources: agg.sources,
      };
    }),
  );

  const byType = results.reduce<Record<string, { values: unknown[]; confidence: number; sources: string[] }>>((acc, row) => {
    acc[row.type] = {
      values: row.values,
      confidence: row.confidence,
      sources: row.sources,
    };
    return acc;
  }, {});

  const dsOk = hasRows(byType.DS?.values);
  const dnskeyOk = hasRows(byType.DNSKEY?.values);
  const rrsigOk = hasRows(byType.RRSIG?.values);
  const nsecOk = hasRows(byType.NSEC?.values);

  const scoreRaw =
    (dsOk ? 30 : 0) +
    (dnskeyOk ? 30 : 0) +
    (rrsigOk ? 30 : 0) +
    (nsecOk ? 10 : 0);
  const score = Math.max(0, Math.min(100, scoreRaw));

  return {
    code: 0,
    data: {
      domain,
      score,
      status: score >= 70 ? "strong" : score >= 40 ? "partial" : "weak",
      records: byType,
    },
    cached: false,
    timestamp: Math.floor(Date.now() / 1000),
  };
});
