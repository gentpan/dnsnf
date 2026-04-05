import { $fetch } from 'ofetch'
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const keyword = String(query.keyword || "").trim()
  if (!keyword || keyword.length < 2) {
    throw createError({ statusCode: 400, statusMessage: "keyword too short (min 2 chars)" })
  }

  const rawMode = String(query.mode || "").trim().toLowerCase()
  const mode = rawMode === "left" || rawMode === "right" ? rawMode : "middle"
  const limit = Math.max(1, Math.min(1000, Number(query.limit) || 200))

  const config = useRuntimeConfig(event)
  const apiBase = String(
    config.apiInternalBase || (config.public as any)?.apiBase || "http://localhost:8080",
  ).replace(/\/$/, "")
  const internalToken = String((config as any).internalToken || "").trim()

  const headers: Record<string, string> = {}
  if (internalToken) headers["X-Internal-Token"] = internalToken

  const resp = await $fetch(`${apiBase}/v1/dns/rdns`, {
    query: { keyword, mode, limit },
    headers,
  })
  return resp
})
