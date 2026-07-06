import { incrementAnalytics } from "../../utils/analytics";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const required = String((config as any).internalToken || "").trim();
  const incoming = String(getHeader(event, "x-internal-token") || "").trim();

  if (!required || incoming !== required) {
    throw createError({ statusCode: 403, statusMessage: "forbidden" });
  }

  const body = await readBody<{
    requests?: number;
    queries?: number;
    visitClientIp?: string;
  }>(event);

  await incrementAnalytics({
    requests: body?.requests,
    queries: body?.queries,
    visitClientIp: body?.visitClientIp,
  });

  return {
    code: 0,
    timestamp: Math.floor(Date.now() / 1000),
  };
});
