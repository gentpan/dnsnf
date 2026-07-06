import { consumeRateLimit } from "../utils/api-access";

const getClientIp = (event: any) => {
  const xff = getHeader(event, "x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  const xri = getHeader(event, "x-real-ip");
  if (xri) return xri.trim();
  return event.node.req.socket.remoteAddress || "unknown";
};

export default defineEventHandler(async (event) => {
  const path = event.path || "";
  if (!path.startsWith("/api/")) return;
  if (path.startsWith("/api/stats/")) return;
  if (path.startsWith("/api/internal/")) return;

  const config = useRuntimeConfig(event);
  const publicPerMinute = Math.max(1, Number(config.apiPublicPerMinute || 30));

  // Admin APIs require admin key.
  if (path.startsWith("/api/admin/")) {
    const required = String(config.apiAdminKey || "").trim();
    if (!required) {
      throw createError({ statusCode: 503, statusMessage: "admin api disabled: missing API_ADMIN_KEY" });
    }
    const incoming = String(getHeader(event, "x-admin-key") || "").trim();
    if (!incoming || incoming !== required) {
      throw createError({ statusCode: 401, statusMessage: "unauthorized admin key" });
    }
    return;
  }

  const clientIp = getClientIp(event);

  const publicResult = consumeRateLimit(`ip:${clientIp}`, publicPerMinute);
  setHeader(event, "x-ratelimit-limit", String(publicPerMinute));
  setHeader(event, "x-ratelimit-remaining", String(publicResult.remaining));
  setHeader(event, "x-ratelimit-reset", String(publicResult.resetInSec));
  if (!publicResult.allowed) {
    throw createError({
      statusCode: 429,
      statusMessage: `public rate limit exceeded: retry in ${publicResult.resetInSec}s`,
    });
  }
});
