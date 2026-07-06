import { resolveCname, reverse } from 'node:dns/promises'

type RDNSHint =
  | 'residential_ptr_keyword'
  | 'datacenter_ptr_keyword'
  | 'no_ptr'
  | 'neutral_ptr'

type RDNSResult = {
  ip: string
  ptr: string[]
  cname: string[]
  ok: boolean
  error?: string
  updated_at: string
  checked_at?: string
  score_delta: number
  residential_score: number
  hint: RDNSHint
}

const MAX_SCAN = 4096
const DEFAULT_CONCURRENCY = 30
const DEFAULT_TIMEOUT_MS = 1500
const DEFAULT_RATE_PER_SEC = 50
const RDNS_COOLDOWN_MS = 30_000

const lastScanAtByClient = new Map<string, number>()

// GC: remove stale cooldown entries to prevent unbounded memory growth
setInterval(() => {
  const cutoff = Date.now() - RDNS_COOLDOWN_MS * 10
  for (const [ip, ts] of lastScanAtByClient) {
    if (ts < cutoff) lastScanAtByClient.delete(ip)
  }
}, RDNS_COOLDOWN_MS * 10)

const IPV4_RE = /^(\d{1,3}\.){3}\d{1,3}$/
const IPV4_CIDR_RE = /^(\d{1,3}\.){3}\d{1,3}\/(?:[0-9]|[12][0-9]|3[0-2])$/

const parseIPv4 = (ip: string): number[] | null => {
  const parts = ip.split('.')
  if (parts.length !== 4) return null
  const nums = parts.map((p) => Number(p))
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null
  return nums
}

const ipv4ToInt = (ip: string): number | null => {
  const nums = parseIPv4(ip)
  if (!nums) return null
  return nums[0] * 256 * 256 * 256 + nums[1] * 256 * 256 + nums[2] * 256 + nums[3]
}

const intToIPv4 = (value: number) => {
  const a = (value >>> 24) & 255
  const b = (value >>> 16) & 255
  const c = (value >>> 8) & 255
  const d = value & 255
  return `${a}.${b}.${c}.${d}`
}

const parseCIDR = (target: string): { base: number; mask: number } | null => {
  const [ip, maskRaw] = target.split('/')
  if (!ip || !maskRaw) return null
  const mask = Number(maskRaw)
  if (!Number.isInteger(mask) || mask < 0 || mask > 32) return null
  const base = ipv4ToInt(ip)
  if (base === null) return null
  return { base, mask }
}

const withTimeout = async <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('lookup timeout')), ms)
    }),
  ])
}

const ptrHint = (ptrs: string[]): { scoreDelta: number; hint: RDNSHint } => {
  const joined = ptrs.join(' ').toLowerCase()
  const resWords = ['dsl', 'broadband', 'cable', 'pppoe', 'dynamic', 'pool']
  const dcWords = ['vps', 'colo', 'datacenter', 'server', 'cloud', 'host']

  for (const w of resWords) {
    if (joined.includes(w)) {
      return { scoreDelta: 15, hint: 'residential_ptr_keyword' }
    }
  }
  for (const w of dcWords) {
    if (joined.includes(w)) {
      return { scoreDelta: -20, hint: 'datacenter_ptr_keyword' }
    }
  }
  if (ptrs.length === 0) {
    return { scoreDelta: -5, hint: 'no_ptr' }
  }
  return { scoreDelta: 0, hint: 'neutral_ptr' }
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
const normalizeMatchMode = (raw: unknown): 'left' | 'middle' | 'right' => {
  const value = String(raw || 'middle').trim().toLowerCase()
  if (value === 'left' || value === 'right') return value
  return 'middle'
}
const normalizeMatchTarget = (raw: unknown): 'ptr' | 'cname' | 'both' => {
  const value = String(raw || 'ptr').trim().toLowerCase()
  if (value === 'cname' || value === 'both') return value
  return 'ptr'
}
const isMatched = (text: string, keyword: string, mode: 'left' | 'middle' | 'right') => {
  if (!keyword) return true
  const value = text.toLowerCase()
  if (mode === 'left') return value.startsWith(keyword)
  if (mode === 'right') return value.endsWith(keyword)
  return value.includes(keyword)
}
const lookupCNAME = async (hosts: string[], timeoutMs: number) => {
  const out: string[] = []
  for (const host of hosts) {
    try {
      const rows = await withTimeout(resolveCname(host), timeoutMs)
      for (const row of rows) {
        const normalized = String(row || '').replace(/\.$/, '').toLowerCase()
        if (normalized) out.push(normalized)
      }
    } catch {
      // ignore per-host cname errors
    }
  }
  return Array.from(new Set(out))
}

const lookupPTR = async (ip: string, timeoutMs: number): Promise<{ ptr: string[]; ok: boolean; error?: string }> => {
  try {
    const hosts = await withTimeout(reverse(ip), timeoutMs)
    const ptr = hosts.map((h) => h.replace(/\.$/, '').toLowerCase()).filter(Boolean)
    return { ptr, ok: true }
  } catch (err) {
    const code = (err as { code?: string })?.code
    if (code === 'ENOTFOUND' || code === 'ENODATA' || code === 'NOTFOUND') {
      return { ptr: [], ok: true }
    }
    return {
      ptr: [],
      ok: false,
      error: (err as Error)?.message || 'lookup failed',
    }
  }
}

const createRateLimiter = (ratePerSec: number) => {
  const intervalMs = Math.max(1, Math.floor(1000 / Math.max(1, ratePerSec)))
  let nextAllowedAt = Date.now()

  return async () => {
    const now = Date.now()
    const waitMs = Math.max(0, nextAllowedAt - now)
    nextAllowedAt = Math.max(nextAllowedAt, now) + intervalMs
    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs))
    }
  }
}

const buildTargets = (target: string): string[] => {
  const raw = target.trim()
  if (IPV4_RE.test(raw)) return [raw]

  if (!IPV4_CIDR_RE.test(raw)) {
    throw createError({ statusCode: 400, statusMessage: 'target must be ipv4 or ipv4 cidr' })
  }

  const parsed = parseCIDR(raw)
  if (!parsed) {
    throw createError({ statusCode: 400, statusMessage: 'invalid cidr' })
  }

  const size = 2 ** (32 - parsed.mask)
  if (size > MAX_SCAN) {
    throw createError({
      statusCode: 400,
      statusMessage: `cidr range too large, max ${MAX_SCAN}`,
    })
  }

  const networkMask = parsed.mask === 0 ? 0 : (~0 << (32 - parsed.mask)) >>> 0
  const networkBase = parsed.base & networkMask
  const first = networkBase
  const last = networkBase + size - 1

  let start = first
  let end = last
  if (parsed.mask <= 30) {
    start = first + 1
    end = last - 1
  }
  if (start > end) {
    start = first
    end = last
  }

  const out: string[] = []
  for (let i = start; i <= end; i++) {
    out.push(intToIPv4(i >>> 0))
  }
  return out
}

const getClientIp = (event: any) => {
  const xff = getHeader(event, 'x-forwarded-for')
  if (xff) {
    const first = xff.split(',')[0]?.trim()
    if (first) return first
  }
  const xri = getHeader(event, 'x-real-ip')
  if (xri) return xri.trim()
  return event.node.req.socket.remoteAddress || 'unknown'
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const target = String(query.target || query.ip || '').trim()
  if (!target) {
    throw createError({ statusCode: 400, statusMessage: 'target is required' })
  }

  const timeoutMs = Math.max(300, Number(query.timeout_ms) || DEFAULT_TIMEOUT_MS)
  const concurrency = Math.max(1, Math.min(128, Number(query.concurrency) || DEFAULT_CONCURRENCY))
  const ratePerSec = Math.max(1, Math.min(500, Number(query.rate) || DEFAULT_RATE_PER_SEC))
  const keyword = String(query.keyword || '').trim().toLowerCase()
  const matchMode = normalizeMatchMode(query.match_mode)
  const matchTarget = normalizeMatchTarget(query.match_target)
  const clientIp = getClientIp(event)
  const now = Date.now()
  const lastAt = lastScanAtByClient.get(clientIp) || 0
  const delta = now - lastAt
  if (delta < RDNS_COOLDOWN_MS) {
    const waitSeconds = Math.ceil((RDNS_COOLDOWN_MS - delta) / 1000)
    throw createError({
      statusCode: 429,
      statusMessage: `rdns scan limited: retry in ${waitSeconds}s`,
    })
  }

  const targets = buildTargets(target)
  lastScanAtByClient.set(clientIp, now)
  const throttle = createRateLimiter(ratePerSec)

  const results: RDNSResult[] = []
  let cursor = 0

  const workers = Array.from({ length: Math.min(concurrency, targets.length) }, () =>
    (async () => {
      while (true) {
        const index = cursor
        cursor += 1
        if (index >= targets.length) break

        const ip = targets[index]
        await throttle()

        const { ptr, ok, error } = await lookupPTR(ip, timeoutMs)
        const cname = ok && ptr.length > 0 ? await lookupCNAME(ptr, timeoutMs) : []
        const { scoreDelta, hint } = ptrHint(ptr)
        results.push({
          ip,
          ptr,
          cname,
          ok,
          error,
          updated_at: new Date().toISOString(),
          checked_at: new Date().toISOString(),
          score_delta: scoreDelta,
          residential_score: clamp(50 + scoreDelta, 0, 100),
          hint,
        })
      }
    })(),
  )

  await Promise.all(workers)
  results.sort((a, b) => (a.ip < b.ip ? -1 : a.ip > b.ip ? 1 : 0))

  const filteredResults = keyword
    ? results.filter((row) => {
        const pool =
          matchTarget === 'ptr'
            ? row.ptr
            : matchTarget === 'cname'
              ? row.cname
              : [...row.ptr, ...row.cname]
        return pool.some((item) => isMatched(item, keyword, matchMode))
      })
    : results

  const okCount = filteredResults.filter((x) => x.ok).length
  const withPtrCount = filteredResults.filter((x) => x.ptr.length > 0).length

  // Persist PTR records to Go backend (fire-and-forget)
  const ptrItems: Array<{ ip: string; ptr: string }> = []
  for (const row of results) {
    for (const ptr of row.ptr) {
      ptrItems.push({ ip: row.ip, ptr })
    }
  }
  if (ptrItems.length > 0) {
    const config = useRuntimeConfig(event)
    const apiBase = String(
      config.apiInternalBase || (config.public as any)?.apiBase || "http://localhost:8080",
    ).replace(/\/$/, "")
    const internalToken = String((config as any).internalToken || "").trim()
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (internalToken) headers["X-Internal-Token"] = internalToken
    $fetch(`${apiBase}/v2/dns/rdns-records`, {
      method: "POST",
      body: ptrItems,
      headers,
    }).catch(() => { /* non-critical */ })
  }

  return {
    code: 0,
    data: {
      target,
      total: targets.length,
      scanned: filteredResults.length,
      ok: okCount,
      failed: filteredResults.length - okCount,
      with_ptr: withPtrCount,
      without_ptr: filteredResults.length - withPtrCount,
      with_cname: filteredResults.filter((x) => x.cname.length > 0).length,
      without_cname: filteredResults.filter((x) => x.cname.length === 0).length,
      match_mode: matchMode,
      match_target: matchTarget,
      keyword,
      results: filteredResults,
    },
    cached: false,
    timestamp: Math.floor(Date.now() / 1000),
  }
})
