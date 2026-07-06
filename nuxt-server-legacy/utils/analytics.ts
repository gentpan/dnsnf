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

const memDay = () => toDayKey();

let memRequests = 0;
let memQueries = 0;
let memDayKey = memDay();

const knownVisitors = new Set<string>();
const pendingVisitors = new Set<string>();
let visitorsLoadedDay = "";
let visitorsLoadPromise: Promise<void> | null = null;

const visitorSetKey = (day: string) => `${DAILY_VISITOR_SET_PREFIX}${day}`;
const dailyKey = (day: string) => `${DAILY_PREFIX}${day}`;

const readVisitorSet = async (day: string) => {
  const store = useStorage(ANALYTICS_NS);
  return (await store.getItem<Record<string, 1>>(visitorSetKey(day))) || {};
};

const visitorCountFromSet = (seen: Record<string, 1>) => Object.keys(seen).length;

const loadVisitorsForDay = async (day: string) => {
  const seen = await readVisitorSet(day);
  knownVisitors.clear();
  for (const ip of Object.keys(seen)) {
    knownVisitors.add(ip);
  }
  pendingVisitors.clear();
  visitorsLoadedDay = day;
};

const ensureVisitorsLoaded = async (day: string) => {
  if (visitorsLoadedDay === day) return;
  if (!visitorsLoadPromise) {
    visitorsLoadPromise = loadVisitorsForDay(day).finally(() => {
      visitorsLoadPromise = null;
    });
  }
  await visitorsLoadPromise;
  if (visitorsLoadedDay !== day) {
    await loadVisitorsForDay(day);
  }
};

const resetMemCounters = (day: string) => {
  memDayKey = day;
  memRequests = 0;
  memQueries = 0;
  knownVisitors.clear();
  pendingVisitors.clear();
  visitorsLoadedDay = "";
};

const readDailyCounters = async (day: string): Promise<DailyCounters> => {
  const store = useStorage(ANALYTICS_NS);
  const [saved, seen] = await Promise.all([
    store.getItem<Partial<DailyCounters>>(dailyKey(day)),
    readVisitorSet(day),
  ]);
  const seenVisitors = visitorCountFromSet(seen);
  return {
    day,
    requests: Math.max(0, Number(saved?.requests) || 0),
    queries: Math.max(0, Number(saved?.queries) || 0),
    visitors: seenVisitors > 0 ? seenVisitors : Math.max(0, Number(saved?.visitors) || 0),
    updated_at: Math.max(0, Number(saved?.updated_at) || 0),
  };
};

const flushAnalytics = async () => {
  const day = memDay();
  const nowSec = Math.floor(Date.now() / 1000);

  if (day !== memDayKey) {
    if (memRequests > 0 || memQueries > 0 || pendingVisitors.size > 0) {
      await flushToStorage(memDayKey, nowSec);
    }
    resetMemCounters(day);
    return;
  }

  if (memRequests === 0 && memQueries === 0 && pendingVisitors.size === 0) return;
  await flushToStorage(day, nowSec);
};

const flushToStorage = async (day: string, nowSec: number) => {
  const store = useStorage(ANALYTICS_NS);
  const daily = await readDailyCounters(day);

  let addedVisitors = 0;
  let todayVisitors = daily.visitors;

  if (pendingVisitors.size > 0) {
    const visitorKey = visitorSetKey(day);
    const seen = (await store.getItem<Record<string, 1>>(visitorKey)) || {};
    for (const ip of pendingVisitors) {
      if (!seen[ip]) {
        seen[ip] = 1;
        addedVisitors += 1;
      }
    }
    await store.setItem(visitorKey, seen);
    todayVisitors = visitorCountFromSet(seen);
  }

  daily.requests += memRequests;
  daily.queries += memQueries;
  daily.visitors = todayVisitors;
  daily.updated_at = nowSec;
  await store.setItem(dailyKey(day), daily);

  const saved = await store.getItem<AnalyticsOverview>(OVERVIEW_KEY);
  const current = normalize(saved || DEFAULT_OVERVIEW);
  const next: AnalyticsOverview = {
    visits_total: current.visits_total + addedVisitors,
    requests_total: current.requests_total + memRequests,
    queries_total: current.queries_total + memQueries,
    today_requests: daily.requests,
    today_queries: daily.queries,
    today_visitors: daily.visitors,
    updated_at: nowSec,
  };
  await store.setItem(OVERVIEW_KEY, next);

  memRequests = 0;
  memQueries = 0;
  pendingVisitors.clear();
};

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

startFlushTimer();

export const readAnalyticsOverview = async (): Promise<AnalyticsOverview> => {
  const day = memDay();
  const daily = await readDailyCounters(day);
  const store = useStorage(ANALYTICS_NS);
  const saved = await store.getItem<AnalyticsOverview>(OVERVIEW_KEY);
  const merged = normalize(saved || DEFAULT_OVERVIEW);

  const pendingVisitorCount = day === memDayKey ? pendingVisitors.size : 0;
  const hasMemPending = day === memDayKey && (memRequests > 0 || memQueries > 0 || pendingVisitorCount > 0);
  return {
    ...merged,
    visits_total: merged.visits_total + pendingVisitorCount,
    requests_total: merged.requests_total + (day === memDayKey ? memRequests : 0),
    queries_total: merged.queries_total + (day === memDayKey ? memQueries : 0),
    today_requests: daily.requests + (day === memDayKey ? memRequests : 0),
    today_queries: daily.queries + (day === memDayKey ? memQueries : 0),
    today_visitors: daily.visitors + pendingVisitorCount,
    updated_at: hasMemPending ? Math.floor(Date.now() / 1000) : Math.max(merged.updated_at, daily.updated_at),
  };
};

export const incrementAnalytics = async (input: {
  requests?: number;
  queries?: number;
  visitClientIp?: string;
}) => {
  const addRequests = Math.max(0, Math.min(10_000, Number(input.requests) || 0));
  const addQueries = Math.max(0, Math.min(10_000, Number(input.queries) || 0));
  const clientIp = String(input.visitClientIp || "").trim();
  const shouldTrackVisitor = clientIp.length > 0;

  if (!addRequests && !addQueries && !shouldTrackVisitor) return;

  const day = memDay();
  if (day !== memDayKey) {
    await flushAnalytics();
    resetMemCounters(day);
  }

  memRequests += addRequests;
  memQueries += addQueries;

  if (shouldTrackVisitor) {
    await ensureVisitorsLoaded(day);
    if (!knownVisitors.has(clientIp)) {
      knownVisitors.add(clientIp);
      pendingVisitors.add(clientIp);
    }
  }
};

export const forceFlushAnalytics = async () => {
  await flushAnalytics();
};
