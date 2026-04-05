export type AnalyticsOverview = {
  visits_total: number;
  requests_total: number;
  queries_total: number;
  today_requests: number;
  today_queries: number;
  today_visitors: number;
  updated_at: number;
};

const OVERVIEW_KEY = "overview";
const ANALYTICS_NS = "analytics";
const DAILY_PREFIX = "daily:";
const DAILY_VISITOR_SET_PREFIX = "daily_visitors:";

const DEFAULT_OVERVIEW: AnalyticsOverview = {
  visits_total: 0,
  requests_total: 0,
  queries_total: 0,
  today_requests: 0,
  today_queries: 0,
  today_visitors: 0,
  updated_at: 0,
};

const normalize = (raw: Partial<AnalyticsOverview> | null | undefined): AnalyticsOverview => ({
  visits_total: Math.max(0, Number(raw?.visits_total) || 0),
  requests_total: Math.max(0, Number(raw?.requests_total) || 0),
  queries_total: Math.max(0, Number(raw?.queries_total) || 0),
  today_requests: Math.max(0, Number(raw?.today_requests) || 0),
  today_queries: Math.max(0, Number(raw?.today_queries) || 0),
  today_visitors: Math.max(0, Number(raw?.today_visitors) || 0),
  updated_at: Math.max(0, Number(raw?.updated_at) || 0),
});

const toDayKey = (now = new Date()) => {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

type DailyCounters = {
  day: string;
  requests: number;
  queries: number;
  visitors: number;
  updated_at: number;
};

// ── In-memory counters to avoid race-condition write-losses ─────────────────
const memDay = () => toDayKey();

let memRequests = 0;
let memQueries = 0;
const memVisitorSet = new Set<string>();
let memPendingVisitors = 0; // visitors that haven't been flushed yet
let memDayKey = memDay();

const resetMemCounters = (day: string) => {
  memDayKey = day;
  memRequests = 0;
  memQueries = 0;
  memVisitorSet.clear();
  memPendingVisitors = 0;
};

const readDailyCounters = async (day: string): Promise<DailyCounters> => {
  const store = useStorage(ANALYTICS_NS);
  const saved = await store.getItem<Partial<DailyCounters>>(`${DAILY_PREFIX}${day}`);
  return {
    day,
    requests: Math.max(0, Number(saved?.requests) || 0),
    queries: Math.max(0, Number(saved?.queries) || 0),
    visitors: Math.max(0, Number(saved?.visitors) || 0),
    updated_at: Math.max(0, Number(saved?.updated_at) || 0),
  };
};

const flushAnalytics = async () => {
  const day = memDay();
  const nowSec = Math.floor(Date.now() / 1000);

  // If day changed, flush previous day first, then reset.
  if (day !== memDayKey) {
    if (memRequests > 0 || memQueries > 0 || memPendingVisitors > 0) {
      await flushToStorage(memDayKey, nowSec);
    }
    resetMemCounters(day);
    return;
  }

  if (memRequests === 0 && memQueries === 0 && memPendingVisitors === 0) return;

  await flushToStorage(day, nowSec);
};

const flushToStorage = async (day: string, nowSec: number) => {
  const store = useStorage(ANALYTICS_NS);

  // Daily counters
  const daily = await readDailyCounters(day);
  daily.requests += memRequests;
  daily.queries += memQueries;
  daily.visitors += memPendingVisitors;
  daily.updated_at = nowSec;
  await store.setItem(`${DAILY_PREFIX}${day}`, daily);

  // Visitor set persistence
  if (memPendingVisitors > 0) {
    const visitorKey = `${DAILY_VISITOR_SET_PREFIX}${day}`;
    const seen = (await store.getItem<Record<string, 1>>(visitorKey)) || {};
    for (const ip of memVisitorSet) {
      seen[ip] = 1;
    }
    await store.setItem(visitorKey, seen);
  }

  // Overview totals
  const saved = await store.getItem<AnalyticsOverview>(OVERVIEW_KEY);
  const current = normalize(saved || DEFAULT_OVERVIEW);
  const next: AnalyticsOverview = {
    visits_total: current.visits_total + memPendingVisitors,
    requests_total: current.requests_total + memRequests,
    queries_total: current.queries_total + memQueries,
    today_requests: daily.requests,
    today_queries: daily.queries,
    today_visitors: daily.visitors,
    updated_at: nowSec,
  };
  await store.setItem(OVERVIEW_KEY, next);

  // Reset memory after successful flush
  memRequests = 0;
  memQueries = 0;
  memPendingVisitors = 0;
  memVisitorSet.clear();
};

// Flush every 30 seconds
const FLUSH_INTERVAL_MS = 30_000;
let flushTimer: NodeJS.Timeout | null = null;

const startFlushTimer = () => {
  if (flushTimer) return;
  flushTimer = setInterval(() => {
    flushAnalytics().catch(() => {
      /* ignore flush errors */
    });
  }, FLUSH_INTERVAL_MS);
};

// Start timer immediately in this module
startFlushTimer();

export const readAnalyticsOverview = async (): Promise<AnalyticsOverview> => {
  const day = memDay();
  const daily = await readDailyCounters(day);
  const store = useStorage(ANALYTICS_NS);
  const saved = await store.getItem<AnalyticsOverview>(OVERVIEW_KEY);
  const merged = normalize(saved || DEFAULT_OVERVIEW);

  const hasMemPending = day === memDayKey && (memRequests > 0 || memQueries > 0 || memPendingVisitors > 0);
  return {
    ...merged,
    visits_total: merged.visits_total + (day === memDayKey ? memPendingVisitors : 0),
    requests_total: merged.requests_total + (day === memDayKey ? memRequests : 0),
    queries_total: merged.queries_total + (day === memDayKey ? memQueries : 0),
    today_requests: daily.requests + (day === memDayKey ? memRequests : 0),
    today_queries: daily.queries + (day === memDayKey ? memQueries : 0),
    today_visitors: daily.visitors + (day === memDayKey ? memPendingVisitors : 0),
    updated_at: hasMemPending ? Math.floor(Date.now() / 1000) : Math.max(merged.updated_at, daily.updated_at),
  };
};

export const incrementAnalytics = async (input: {
  requests?: number;
  queries?: number;
  visitClientIp?: string;
}) => {
  const addRequests = Math.max(0, Number(input.requests) || 0);
  const addQueries = Math.max(0, Number(input.queries) || 0);
  const clientIp = String(input.visitClientIp || "").trim();
  const shouldTrackVisitor = clientIp.length > 0;

  if (!addRequests && !addQueries && !shouldTrackVisitor) return;

  const day = memDay();
  if (day !== memDayKey) {
    // Day boundary crossed: flush previous day, then reset.
    await flushAnalytics();
    resetMemCounters(day);
  }

  memRequests += addRequests;
  memQueries += addQueries;

  if (shouldTrackVisitor && !memVisitorSet.has(clientIp)) {
    memVisitorSet.add(clientIp);
    memPendingVisitors += 1;
  }
};

// Graceful flush helper (can be called on process exit if needed)
export const forceFlushAnalytics = async () => {
  await flushAnalytics();
};
