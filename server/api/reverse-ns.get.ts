import { $fetch } from 'ofetch'
import { resolve4, resolveNs } from "node:dns/promises";

type SharedRow = {
  domain: string;
  shared_ns: string[];
  source_ips: string[];
};

const DOMAIN_RE = /^(?=.{1,253}$)(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/i;
const LOOKUP_TIMEOUT_MS = 4000;
const LOOKUP_CACHE_TTL_MS = 180_000;
const MAX_RESULTS = 50;
const CANDIDATE_SCAN_LIMIT = 120;
const SCAN_CONCURRENCY = 10;
const CACHE_NAMESPACE = "shared-ns";

const memoryCache = new Map<string, { expiresAt: number; payload: unknown }>();

const normalizeDomain = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\.$/, "");

const withTimeout = async <T>(promise: Promise<T>, timeoutMs = LOOKUP_TIMEOUT_MS): Promise<T> => {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("lookup timeout")), timeoutMs);
    }),
  ]);
};

const safeResolveNs = async (domain: string) => {
  try {
    const rows = await withTimeout(resolveNs(domain));
    return Array.from(
      new Set(
        rows
          .map((x) => normalizeDomain(x))
          .filter(Boolean),
      ),
    );
  } catch {
    return [] as string[];
  }
};

const safeResolveA = async (domain: string) => {
  try {
    const rows = await withTimeout(resolve4(domain));
    return Array.from(new Set(rows.map((x) => String(x).trim()).filter(Boolean)));
  } catch {
    return [] as string[];
  }
};

/** Run fn on each item with at most `concurrency` simultaneous calls. */
const withConcurrency = async <T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>): Promise<void> => {
  let i = 0;
  const run = async (): Promise<void> => {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
};

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const rawDomain = normalizeDomain(String(query.domain || ""));
  const limit = Math.max(1, Math.min(MAX_RESULTS, Number(query.limit) || MAX_RESULTS));
  if (!rawDomain) {
    throw createError({ statusCode: 400, statusMessage: "domain is required" });
  }
  if (!DOMAIN_RE.test(rawDomain)) {
    throw createError({ statusCode: 400, statusMessage: "invalid domain" });
  }

  const cacheKey = `shared-ns:${rawDomain}:limit=${limit}`;
  const storageKey = `${CACHE_NAMESPACE}:${rawDomain}:limit=${limit}`;
  const now = Date.now();
  const cacheStore = useStorage("sharedNsCache");

  const memoryHit = memoryCache.get(cacheKey);
  if (memoryHit) {
    if (memoryHit.expiresAt > now) {
      const payload = structuredClone(memoryHit.payload as object) as { cached?: boolean };
      payload.cached = true;
      return payload;
    }
    memoryCache.delete(cacheKey);
  }

  try {
    const persisted = await cacheStore.getItem<{ expiresAt: number; payload: unknown }>(storageKey);
    if (persisted?.payload && typeof persisted.expiresAt === "number") {
      if (persisted.expiresAt > now) {
        memoryCache.set(cacheKey, persisted);
        const payload = structuredClone(persisted.payload as object) as { cached?: boolean };
        payload.cached = true;
        return payload;
      }
      await cacheStore.removeItem(storageKey);
    }
  } catch {
    // ignore cache storage read errors
  }

  const targetNs = await safeResolveNs(rawDomain);
  if (targetNs.length === 0) {
    throw createError({ statusCode: 404, statusMessage: "no ns records found for target domain" });
  }

  const sourceIps = Array.from(
    new Set((await Promise.all(targetNs.map((ns) => safeResolveA(ns)))).flat()),
  );

  const candidateSource = new Map<string, Set<string>>();
  const fetchErrors: string[] = [];

  for (const ip of sourceIps) {
    try {
      const reverse = await $fetch("/api/reverse-ip", { query: { ip } });
      const rows = Array.isArray(reverse?.data?.domains) ? reverse.data.domains : [];
      for (const row of rows) {
        const domain = normalizeDomain(String(row?.domain || ""));
        if (!domain || domain === rawDomain || !DOMAIN_RE.test(domain)) continue;
        const bag = candidateSource.get(domain) || new Set<string>();
        bag.add(ip);
        candidateSource.set(domain, bag);
      }
    } catch (err) {
      fetchErrors.push(`${ip}: ${(err as Error)?.message || "reverse ip lookup failed"}`);
    }
  }

  const candidates = Array.from(candidateSource.keys()).slice(0, CANDIDATE_SCAN_LIMIT);
  const items: SharedRow[] = [];
  const targetNsSet = new Set(targetNs);

  // Validate candidates concurrently (10 parallel NS lookups) instead of serially
  await withConcurrency(candidates, SCAN_CONCURRENCY, async (domain) => {
    const ns = await safeResolveNs(domain);
    if (!ns.length) return;
    const sharedNs = ns.filter((x) => targetNsSet.has(x));
    if (!sharedNs.length) return;
    items.push({
      domain,
      shared_ns: Array.from(new Set(sharedNs)).sort(),
      source_ips: Array.from(candidateSource.get(domain) || []).sort(),
    });
  });

  items.sort((a, b) => {
    if (b.shared_ns.length !== a.shared_ns.length) return b.shared_ns.length - a.shared_ns.length;
    return a.domain.localeCompare(b.domain);
  });

  const payload = {
    code: 0,
    data: {
      target: rawDomain,
      ns: targetNs,
      source_ips: sourceIps,
      total_candidates: candidateSource.size,
      total_shared: items.length,
      items: items.slice(0, limit),
      note: "Best-effort results using public reverse IP datasets and DNS NS verification.",
      errors: fetchErrors,
    },
    cached: false,
    timestamp: Math.floor(Date.now() / 1000),
  };

  memoryCache.set(cacheKey, {
    expiresAt: now + LOOKUP_CACHE_TTL_MS,
    payload,
  });
  try {
    await cacheStore.setItem(storageKey, {
      expiresAt: now + LOOKUP_CACHE_TTL_MS,
      payload,
    });
  } catch {
    // ignore cache storage write errors
  }

  return payload;
});
