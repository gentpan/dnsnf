import { $fetch } from 'ofetch'
type DohProvider = "google" | "cloudflare";

export type DnsRecordValue =
  | string
  | { host: string; pref: number }
  | { target: string; port: number; priority: number; weight: number }
  | { flag: number; tag: string; value: string }
  | {
      ns?: string;
      mbox?: string;
      serial?: number;
      refresh?: number;
      retry?: number;
      expire?: number;
      minttl?: number;
    };

export type AggregatedTypeResult = {
  values: DnsRecordValue[];
  confidence: number;
  sources: string[];
};

type DohAnswer = {
  name?: string;
  type?: number;
  TTL?: number;
  data?: string;
};

type DohResponse = {
  Status?: number;
  AD?: boolean;
  Answer?: DohAnswer[];
};

const PROVIDER_URLS: Record<DohProvider, string> = {
  google: "https://dns.google/resolve",
  cloudflare: "https://cloudflare-dns.com/dns-query",
};

const TYPE_NUM: Record<string, number> = {
  A: 1,
  NS: 2,
  CNAME: 5,
  SOA: 6,
  PTR: 12,
  MX: 15,
  TXT: 16,
  AAAA: 28,
  SRV: 33,
  RRSIG: 46,
  NSEC: 47,
  DNSKEY: 48,
  CAA: 257,
  DS: 43,
};

const normalizeHost = (value: string) => value.replace(/\.$/, "").toLowerCase();
const normalizeTxt = (value: string) => value.replace(/^"(.*)"$/, "$1");

const parseAnswer = (type: string, data: string): DnsRecordValue | null => {
  if (type === "A" || type === "AAAA" || type === "CNAME" || type === "NS" || type === "PTR" || type === "TXT") {
    return type === "TXT" ? normalizeTxt(data) : normalizeHost(data);
  }

  if (type === "MX") {
    const parts = data.trim().split(/\s+/);
    if (parts.length < 2) return null;
    return {
      pref: Number(parts[0]) || 0,
      host: normalizeHost(parts.slice(1).join(" ")),
    };
  }

  if (type === "SRV") {
    const parts = data.trim().split(/\s+/);
    if (parts.length < 4) return null;
    return {
      priority: Number(parts[0]) || 0,
      weight: Number(parts[1]) || 0,
      port: Number(parts[2]) || 0,
      target: normalizeHost(parts.slice(3).join(" ")),
    };
  }

  if (type === "CAA") {
    const parts = data.trim().split(/\s+/);
    if (parts.length < 3) return null;
    const [flagRaw, tagRaw, ...rest] = parts;
    return {
      flag: Number(flagRaw) || 0,
      tag: String(tagRaw || "").replace(/^"|"$/g, ""),
      value: rest.join(" ").replace(/^"|"$/g, ""),
    };
  }

  if (type === "SOA") {
    const parts = data.trim().split(/\s+/);
    if (parts.length < 7) return null;
    return {
      ns: normalizeHost(parts[0]),
      mbox: normalizeHost(parts[1]),
      serial: Number(parts[2]) || 0,
      refresh: Number(parts[3]) || 0,
      retry: Number(parts[4]) || 0,
      expire: Number(parts[5]) || 0,
      minttl: Number(parts[6]) || 0,
    };
  }

  // DS/DNSKEY/RRSIG/NSEC/NSEC3 are returned as raw strings for stability.
  return data;
};

const toStableKey = (value: DnsRecordValue): string => {
  if (typeof value === "string") return value.toLowerCase();
  if (value && typeof value === "object") {
    const ordered = Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .reduce<Record<string, unknown>>((acc, [k, v]) => {
        acc[k] = v;
        return acc;
      }, {});
    return JSON.stringify(ordered);
  }
  return String(value);
};

const uniqueValues = (rows: DnsRecordValue[]) => {
  const map = new Map<string, DnsRecordValue>();
  for (const row of rows) {
    map.set(toStableKey(row), row);
  }
  return Array.from(map.values());
};

export const resolveViaDoh = async (name: string, type: string, provider: DohProvider): Promise<DnsRecordValue[]> => {
  const typeNum = TYPE_NUM[type.toUpperCase()] || 1;
  const base = PROVIDER_URLS[provider];
  try {
    const res = await $fetch(base, {
      query: { name, type: typeNum, cd: 0, do: 1 },
      headers: { accept: "application/dns-json" },
      timeout: 3000,
      retry: 0,
    });
    const answers = Array.isArray((res as { Answer?: unknown })?.Answer) ? (res as { Answer: Array<{ type?: number; data?: string }> }).Answer : [];
    const values = answers
      .filter((a: { type?: number; data?: string }) => (a?.type || 0) === typeNum && typeof a?.data === "string")
      .map((a: { type?: number; data?: string }) => parseAnswer(type.toUpperCase(), String(a.data)))
      .filter((x: DnsRecordValue | null): x is DnsRecordValue => x !== null);
    return uniqueValues(values);
  } catch {
    return [];
  }
};

export const aggregateWithConfidence = async (name: string, type: string): Promise<AggregatedTypeResult> => {
  const providers: DohProvider[] = ["google", "cloudflare"];
  const providerRows = await Promise.all(providers.map((p) => resolveViaDoh(name, type, p)));

  const support = new Map<string, { value: DnsRecordValue; count: number; sources: string[] }>();
  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    for (const row of providerRows[i]) {
      const key = toStableKey(row);
      const hit = support.get(key);
      if (hit) {
        hit.count += 1;
        hit.sources.push(provider);
      } else {
        support.set(key, { value: row, count: 1, sources: [provider] });
      }
    }
  }

  const values = Array.from(support.values());
  const confidence = values.length === 0
    ? 0
    : Math.round(
        (values.reduce((sum, v) => sum + v.count / providers.length, 0) / values.length) * 100,
      );
  const sources = Array.from(
    new Set(values.flatMap((v) => v.sources)),
  );

  return {
    values: values.map((v) => v.value),
    confidence,
    sources,
  };
};
