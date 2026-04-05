import { createHash, randomBytes } from "node:crypto";

type TokenRecord = {
  id: string;
  name: string;
  hash: string;
  createdAt: number;
  status: "active" | "revoked";
  perMinuteLimit: number;
};

type CounterBucket = { windowStartMs: number; used: number };

const counterMem = new Map<string, CounterBucket>();
const TOKENS_KEY = "api-auth:tokens";

const hashToken = (plain: string) => createHash("sha256").update(plain).digest("hex");
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

const maskToken = (token: string) => {
  if (token.length <= 10) return `${token.slice(0, 2)}***${token.slice(-2)}`;
  return `${token.slice(0, 6)}...${token.slice(-4)}`;
};

export const parseBearerToken = (raw: string | undefined) => {
  const value = String(raw || "").trim();
  if (!value) return "";
  if (/^bearer\s+/i.test(value)) return value.replace(/^bearer\s+/i, "").trim();
  return value;
};

export const listApiTokens = async () => {
  const store = useStorage("apiAuth");
  return ((await store.getItem<TokenRecord[]>(TOKENS_KEY)) || []).sort((a, b) => b.createdAt - a.createdAt);
};

export const createApiToken = async (name: string, perMinuteLimit: number) => {
  const store = useStorage("apiAuth");
  const tokens = (await listApiTokens()) || [];
  const plain = `dnsnf_${randomBytes(18).toString("base64url")}`;
  const record: TokenRecord = {
    id: randomBytes(8).toString("hex"),
    name: name.trim() || "default",
    hash: hashToken(plain),
    createdAt: nowMs(),
    status: "active",
    perMinuteLimit: Math.max(1, Math.min(10_000, Number(perMinuteLimit) || 300)),
  };
  tokens.push(record);
  await store.setItem(TOKENS_KEY, tokens);
  return { token: plain, record };
};

export const revokeApiToken = async (id: string) => {
  const store = useStorage("apiAuth");
  const tokens = await listApiTokens();
  const next = tokens.map((t) => (t.id === id ? { ...t, status: "revoked" as const } : t));
  await store.setItem(TOKENS_KEY, next);
  return next.find((x) => x.id === id) || null;
};

export const resolveTokenRecord = async (plainToken: string) => {
  if (!plainToken) return null;
  const hash = hashToken(plainToken);
  const tokens = await listApiTokens();
  return tokens.find((x) => x.hash === hash && x.status === "active") || null;
};

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

export const publicTokenView = (row: TokenRecord) => ({
  id: row.id,
  name: row.name,
  createdAt: row.createdAt,
  status: row.status,
  perMinuteLimit: row.perMinuteLimit,
});

export const tokenPreview = (plain: string) => maskToken(plain);
