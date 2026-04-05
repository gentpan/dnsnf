import { d as defineEventHandler, g as getQuery, c as createError, u as useRuntimeConfig, q as queryPassiveDns, $ as $fetch } from '../../nitro/nitro.mjs';
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
const dnsHistory_get = defineEventHandler(async (event) => {
  var _a, _b;
  const query = getQuery(event);
  const domain = String(query.domain || "").trim().toLowerCase();
  const limit = Math.max(1, Math.min(2e3, Number(query.limit) || 500));
  if (!domain || !DOMAIN_RE.test(domain)) {
    throw createError({ statusCode: 400, statusMessage: "invalid domain" });
  }
  const config = useRuntimeConfig(event);
  const apiBase = String(
    config.apiInternalBase || ((_a = config.public) == null ? void 0 : _a.apiBase) || "http://localhost:8080"
  ).replace(/\/$/, "");
  const internalToken = String(config.internalToken || "").trim();
  let externalRecords = [];
  try {
    externalRecords = await queryPassiveDns(domain);
  } catch {
  }
  if (externalRecords.length > 0) {
    const headers = { "Content-Type": "application/json" };
    if (internalToken) headers["X-Internal-Token"] = internalToken;
    $fetch(`${apiBase}/v1/dns/history`, {
      method: "POST",
      body: externalRecords,
      headers
    }).catch(() => {
    });
  }
  let dbRecords = [];
  try {
    const resp = await $fetch(`${apiBase}/v1/dns/history`, { query: { domain, limit } });
    if ((resp == null ? void 0 : resp.code) === 0) dbRecords = (_b = resp.data.records) != null ? _b : [];
  } catch {
  }
  const dbKeys = new Set(dbRecords.map((r) => `${r.record_type}|${r.record_value}|${r.source}`));
  const freshExternal = externalRecords.filter((r) => !dbKeys.has(`${r.record_type}|${r.record_value}|${r.source}`)).map((r) => ({
    id: 0,
    domain: r.domain,
    record_type: r.record_type,
    record_value: r.record_value,
    first_seen_at: r.first_seen_at,
    last_seen_at: r.last_seen_at,
    source: r.source
  }));
  const combined = [...dbRecords, ...freshExternal];
  return {
    code: 0,
    data: {
      domain,
      total: combined.length,
      records: combined,
      sources_queried: ["circl", "robtex"]
    },
    cached: false,
    timestamp: Math.floor(Date.now() / 1e3)
  };
});

export { dnsHistory_get as default };
//# sourceMappingURL=dns-history.get.mjs.map
