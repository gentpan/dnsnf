type CounterBucket = { windowStartMs: number; used: number };

const counterMem = new Map<string, CounterBucket>();
const nowMs = () => Date.now();
const minuteWindowMs = 60_000;

// GC: remove expired counter buckets every 5 minutes to prevent unbounded growth
setInterval(() => {
  const now = nowMs();
  for (const [key, bucket] of counterMem) {
    if (now - bucket.windowStartMs > minuteWindowMs * 2) {
      counterMem.delete(key);
    }
  }
}, minuteWindowMs * 5);

export const consumeRateLimit = (key: string, limitPerMinute: number) => {
  const limit = Math.max(1, Number(limitPerMinute) || 1);
  const now = nowMs();
  const existing = counterMem.get(key);

  if (!existing || now - existing.windowStartMs >= minuteWindowMs) {
    counterMem.set(key, { windowStartMs: now, used: 1 });
    return { allowed: true, remaining: limit - 1, resetInSec: 60 };
  }

  if (existing.used >= limit) {
    const resetMs = minuteWindowMs - (now - existing.windowStartMs);
    return { allowed: false, remaining: 0, resetInSec: Math.ceil(resetMs / 1000) };
  }

  existing.used += 1;
  counterMem.set(key, existing);
  const resetMs = minuteWindowMs - (now - existing.windowStartMs);
  return { allowed: true, remaining: limit - existing.used, resetInSec: Math.ceil(resetMs / 1000) };
};
