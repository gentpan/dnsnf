import { d as defineEventHandler, g as getQuery, c as createError, e as aggregateWithConfidence } from '../../nitro/nitro.mjs';
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
const DNSSEC_TYPES = ["DS", "DNSKEY", "RRSIG", "NSEC"];
const hasRows = (rows) => Array.isArray(rows) && rows.length > 0;
const dnssec_get = defineEventHandler(async (event) => {
  var _a, _b, _c, _d;
  const query = getQuery(event);
  const domain = String(query.domain || "").trim().toLowerCase();
  if (!domain || !DOMAIN_RE.test(domain)) {
    throw createError({ statusCode: 400, statusMessage: "invalid domain" });
  }
  const results = await Promise.all(
    DNSSEC_TYPES.map(async (type) => {
      const agg = await aggregateWithConfidence(domain, type);
      return {
        type,
        values: agg.values,
        confidence: agg.confidence,
        sources: agg.sources
      };
    })
  );
  const byType = results.reduce((acc, row) => {
    acc[row.type] = {
      values: row.values,
      confidence: row.confidence,
      sources: row.sources
    };
    return acc;
  }, {});
  const dsOk = hasRows((_a = byType.DS) == null ? void 0 : _a.values);
  const dnskeyOk = hasRows((_b = byType.DNSKEY) == null ? void 0 : _b.values);
  const rrsigOk = hasRows((_c = byType.RRSIG) == null ? void 0 : _c.values);
  const nsecOk = hasRows((_d = byType.NSEC) == null ? void 0 : _d.values);
  const scoreRaw = (dsOk ? 30 : 0) + (dnskeyOk ? 30 : 0) + (rrsigOk ? 30 : 0) + (nsecOk ? 10 : 0);
  const score = Math.max(0, Math.min(100, scoreRaw));
  return {
    code: 0,
    data: {
      domain,
      score,
      status: score >= 70 ? "strong" : score >= 40 ? "partial" : "weak",
      records: byType
    },
    cached: false,
    timestamp: Math.floor(Date.now() / 1e3)
  };
});

export { dnssec_get as default };
//# sourceMappingURL=dnssec.get.mjs.map
