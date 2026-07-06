import { incrementAnalytics } from "../utils/analytics";

const QUERY_ENDPOINTS = new Set<string>([
  "/api/v1/dns",
  "/api/rdns",
  "/api/rdns-search",
  "/api/reverse-ip",
  "/api/reverse-ns",
  "/api/reverse-mx",
  "/api/subdomains",
  "/api/dnssec",
  "/api/dns-history",
]);

const isAssetPath = (pathname: string) =>
  pathname.startsWith("/_nuxt/")
  || pathname.startsWith("/favicon")
  || pathname.startsWith("/robots.txt")
  || pathname.startsWith("/site.webmanifest")
  || pathname.startsWith("/logo");

const getClientIp = (event: any) => {
  const xff = String(getHeader(event, "x-forwarded-for") || "").trim();
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  const xri = String(getHeader(event, "x-real-ip") || "").trim();
  if (xri) return xri;
  return String(event.node.req.socket.remoteAddress || "unknown");
};

const isInternalNuxtRequest = (event: any) => {
  return !!getHeader(event, "x-nuxt-internal");
};

export default defineEventHandler(async (event) => {
  const method = String(event.node.req.method || "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD") return;

  const pathname = getRequestURL(event).pathname || "/";
  if (isAssetPath(pathname)) return;

  // Skip SSR internal fetches that intentionally mark themselves.
  if (isInternalNuxtRequest(event)) return;

  const isApi = pathname.startsWith("/api/");
  const isStatsApi = pathname.startsWith("/api/stats/");
  const isInternalApi = pathname.startsWith("/api/internal/");

  // Count direct traffic and proxied traffic. SSR/internal fetches opt out with
  // x-nuxt-internal so local deploys still get working analytics.
  const countable = !isInternalNuxtRequest(event);
  const requests = countable && isApi && !isStatsApi && !isInternalApi ? 1 : 0;
  const queries = countable && method === "GET" && QUERY_ENDPOINTS.has(pathname) ? 1 : 0;
  const visitClientIp = countable && !isStatsApi && !isInternalApi ? getClientIp(event) : "";

  try {
    await incrementAnalytics({ requests, queries, visitClientIp });
  } catch {
    // Analytics must never break query APIs.
  }
});
