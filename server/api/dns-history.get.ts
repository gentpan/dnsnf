import { $fetch } from 'ofetch'
import { queryPassiveDns, type PassiveDnsRecord } from "../utils/passive-dns";

const DOMAIN_RE = /^(?=.{1,253}$)(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/i;

type DbRecord = {
  id: number;
  domain: string;
  record_type: string;
  record_value: string;
  first_seen_at: string;
  last_seen_at: string;
  source: string;
};

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const domain = String(query.domain || "").trim().toLowerCase();
  const limit = Math.max(1, Math.min(2000, Number(query.limit) || 500));

  if (!domain || !DOMAIN_RE.test(domain)) {
    throw createError({ statusCode: 400, statusMessage: "invalid domain" });
  }

  const config = useRuntimeConfig(event);
  const apiBase = String(
    config.apiInternalBase || config.public?.apiBase || "http://localhost:8080",
  ).replace(/\/$/, "");
  const internalToken = String((config as any).internalToken || "").trim();

  // ── 1. Fetch from external passive-DNS sources concurrently ─────────────────
  let externalRecords: PassiveDnsRecord[] = [];
  try {
    externalRecords = await queryPassiveDns(domain);
  } catch {
    // External sources failed — continue with DB data only
  }

  // ── 2. Store external records in Go backend (fire-and-forget) ───────────────
  if (externalRecords.length > 0) {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (internalToken) headers["X-Internal-Token"] = internalToken;
    $fetch(`${apiBase}/v1/dns/history`, {
      method: "POST",
      body: externalRecords,
      headers,
    }).catch(() => { /* non-critical */ });
  }

  // ── 3. Read persisted records from Go backend ────────────────────────────────
  let dbRecords: DbRecord[] = [];
  try {
    const resp = await $fetch(`${apiBase}/v1/dns/history`, { query: { domain, limit } });
    if (resp?.code === 0) dbRecords = resp.data.records ?? [];
  } catch {
    // Go backend unavailable
  }

  // ── 4. Merge fresh external records not yet in DB (first-call usability) ────
  const dbKeys = new Set(dbRecords.map((r) => `${r.record_type}|${r.record_value}|${r.source}`));
  const freshExternal: DbRecord[] = externalRecords
    .filter((r) => !dbKeys.has(`${r.record_type}|${r.record_value}|${r.source}`))
    .map((r) => ({
      id: 0,
      domain: r.domain,
      record_type: r.record_type,
      record_value: r.record_value,
      first_seen_at: r.first_seen_at,
      last_seen_at: r.last_seen_at,
      source: r.source,
    }));

  const combined = [...dbRecords, ...freshExternal];

  return {
    code: 0,
    data: {
      domain,
      total: combined.length,
      records: combined,
      sources_queried: ["circl", "robtex"],
    },
    cached: false,
    timestamp: Math.floor(Date.now() / 1000),
  };
});
