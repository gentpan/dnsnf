const HISTORY_NS = "dns-history";
const HISTORY_MAX_ITEMS = 300;

export type DnsHistoryItem = {
  timestamp: number;
  type: string;
  target: string;
  records: Record<string, unknown>;
  cached: boolean;
};

const storageKey = (target: string) => `${HISTORY_NS}:${target.toLowerCase()}`;

/** Append a DNS lookup result to local file storage (legacy fallback). */
export const appendDnsHistory = async (target: string, item: DnsHistoryItem) => {
  const store = useStorage("dnsHistory");
  const key = storageKey(target);
  const existing = (await store.getItem<DnsHistoryItem[]>(key)) || [];
  existing.push(item);
  const trimmed = existing.slice(-HISTORY_MAX_ITEMS);
  await store.setItem(key, trimmed);

  // Also persist individual DNS records to Go backend DB
  persistQueryRecordsToDb(target, item).catch(() => { /* non-critical */ });
};

export const readDnsHistory = async (target: string) => {
  const store = useStorage("dnsHistory");
  const key = storageKey(target);
  return (await store.getItem<DnsHistoryItem[]>(key)) || [];
};

/**
 * Extract flat DNS records from a DNS lookup result and upsert them to
 * the Go backend's dns_history table so they are permanently stored.
 */
const persistQueryRecordsToDb = async (domain: string, item: DnsHistoryItem) => {
  const config = useRuntimeConfig();
  const apiBase = String(
    (config as any).apiInternalBase || (config.public as any)?.apiBase || "http://localhost:8080",
  ).replace(/\/$/, "");
  const internalToken = String((config as any).internalToken || "").trim();

  const now = new Date(item.timestamp * 1000).toISOString();
  const payload: Array<{
    domain: string; record_type: string; record_value: string;
    first_seen_at: string; last_seen_at: string; source: string;
  }> = [];

  const records = item.records as Record<string, unknown>;
  for (const [rtype, rdata] of Object.entries(records)) {
    if (!Array.isArray(rdata) || rdata.length === 0) continue;
    for (const entry of rdata) {
      const value = typeof entry === "string" ? entry : JSON.stringify(entry);
      if (!value) continue;
      payload.push({
        domain,
        record_type: rtype.toUpperCase(),
        record_value: value,
        first_seen_at: now,
        last_seen_at: now,
        source: "query",
      });
    }
  }

  if (payload.length === 0) return;

  if (!internalToken) return;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Internal-Token": internalToken,
  };

  await $fetch(`${apiBase}/v2/dns/history`, {
    method: "POST",
    body: payload,
    headers,
  });
};
