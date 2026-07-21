export type DnsRecordType =
  | 'ALL'
  | 'A'
  | 'AAAA'
  | 'CNAME'
  | 'MX'
  | 'NS'
  | 'PTR'
  | 'SOA'
  | 'SRV'
  | 'TXT'
  | 'CAA'
  | 'HTTPS'
  | 'SVCB'
  | 'DS'
  | 'DNSKEY'
  | 'TLSA'
  | 'SSHFP'
  | 'NAPTR'

export type DnsResolver = 'local' | 'cloudflare' | 'google' | 'ali' | 'tencent' | 'authoritative'

export type ApiResponse<T> = {
  code: number
  data: T
  cached: boolean
  timestamp: number
  message?: string
}

export type DnsRecords = {
  A: string[]
  AAAA: string[]
  CNAME: string[]
  MX: Array<{ host: string; pref: number }>
  NS: string[]
  TXT: string[]
  CAA: Array<{ flag: number; tag: string; value: string }>
  PTR?: string[]
  SOA: {
    ns?: string
    mbox?: string
    serial?: number
    refresh?: number
    retry?: number
    expire?: number
    minttl?: number
  }
  SRV: Array<{ target: string; port: number; priority: number; weight: number }>
  HTTPS?: string[]
  SVCB?: string[]
  DS?: string[]
  DNSKEY?: string[]
  TLSA?: string[]
  SSHFP?: string[]
  NAPTR?: string[]
}

export type DnsLookupData = {
  domain?: string
  ip?: string
  reverse_dns: string[]
  records: DnsRecords
}

export type NamedSourceRow = {
  domain?: string
  host?: string
  sources: string[]
}

export type RDNSSearchData = {
  keyword: string
  mode: string
  total: number
  records: Array<{ id: number; ip: string; ptr: string; scanned_at: string }>
}

export type StatsOverview = {
  query_projects: number
  today_requests: number
  total_queries: number
  today_visitors: number
  updated_at: string
}

export type TrafficRange = '24h' | '7d' | '30d' | 'total'

export type TrafficStats = {
  range: TrafficRange
  requests: number
  visitors: number
  updated_at: string
}

export type SystemResolverInfo = {
  nameservers: string[]
  display: string
  source: string
}

export type HealthStatus = {
  status?: string
  timestamp?: number
  success?: boolean
  data?: { status?: string }
}

export type SSLCertificate = {
  subject_cn: string
  subject_org: string
  issuer_cn: string
  issuer_org: string
  serial_number: string
  version: number
  signature_algorithm: string
  public_key_algorithm: string
  public_key_bits: number
  not_before: string
  not_after: string
  days_remaining: number
  expired: boolean
  is_ca: boolean
  self_signed: boolean
  dns_names: string[]
  ip_addresses: string[]
  email_addresses: string[]
}

export type SSLInspection = {
  target: string
  ip: string
  port: number
  tls_version: string
  cipher_suite: string
  alpn: string
  ocsp_stapled: boolean
  verified: boolean
  verify_error: string
  chain_length: number
  certificate: SSLCertificate
  subject_alt_names: string[]
  chain: SSLCertificate[]
}

export type MailSecurityCheck = {
  found: boolean
  record: string
  warnings: string[]
}

export type MailSecurityData = {
  domain: string
  score: number
  status: string
  spf: MailSecurityCheck & {
    all_qualifier: string
    includes: string[]
    ip4: string[]
    ip6: string[]
    dns_lookups: number
    lookup_limit_ok: boolean
  }
  dmarc: MailSecurityCheck & {
    policy: string
    subdomain_policy: string
    pct: number
    rua: string[]
    ruf: string[]
    adkim: string
    aspf: string
  }
  dkim: MailSecurityCheck & {
    requested_selector: string
    selector: string
    key_type: string
    key_bytes: number
    revoked: boolean
    probed_selectors: string[]
  }
  mta_sts: MailSecurityCheck & { name: string }
  tls_rpt: MailSecurityCheck & { name: string }
  bimi: MailSecurityCheck & { name: string }
  mx: string[]
}

export type BlacklistData = {
  ip: string
  total_lists: number
  listed_count: number
  clean_count: number
  status: string
  note: string
  listed: Array<{ zone: string; a: string[]; reason: string }>
}

export type PropagationResult = {
  resolver: string
  region: string
  status: 'ok' | 'no_data' | 'nxdomain' | 'error'
  answers: string[] | null
  ttl: number
  latency_ms: number
}

export type PropagationData = {
  domain: string
  type: string
  total_resolvers: number
  successful: number
  unique_sets: number
  consistent: boolean
  results: PropagationResult[]
}

export type HealthCheckItem = {
  id: string
  title: string
  status: 'pass' | 'warn' | 'fail' | 'info'
  detail: string
}

export type HealthCheckData = {
  domain: string
  score: number
  status: 'healthy' | 'warnings' | 'critical'
  passed: number
  warned: number
  failed: number
  checks: HealthCheckItem[]
}

export type ECSProbe = {
  region: string
  subnet: string
  resolver: string
  status: 'ok' | 'no_data' | 'nxdomain' | 'error'
  answers: string[]
  echoed_scope: number
  latency_ms: number
}

export type ECSData = {
  domain: string
  probes: ECSProbe[]
  geodns: boolean
  ecs_honored: boolean
}

export type TakeoverFinding = {
  subdomain: string
  cname: string
  service: string
  status: 'vulnerable' | 'dangling' | 'active'
}

export type TakeoverData = {
  domain: string
  subdomains_found: number
  checked: number
  cname_targets: number
  vulnerable_count: number
  status: string
  findings: TakeoverFinding[]
  note: string
}

const API_BASE = (import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? '/api-proxy' : 'https://api.dns.nf')).replace(/\/$/, '')
const REQUEST_STATS_EVENT = 'dnsnf:request-stats'

export type ClientRequestStats = {
  today: number
  total: number
  session: number
  day: string
}

async function request<T>(path: string, params: Record<string, string | number | undefined> = {}, options: { count?: boolean } = {}) {
  if (options.count !== false) recordClientRequest()
  const url = new URL(`${API_BASE}${path}`, browserOrigin())
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value))
  }
  const response = await fetch(url)
  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null
  if (!response.ok || !payload) {
    throw new Error(payload?.message || response.statusText || 'Request failed')
  }
  return payload
}

function browserOrigin() {
  return typeof window === 'undefined' ? 'http://localhost:3000' : window.location.origin
}

export const api = {
  health: () => requestRaw<HealthStatus>('/health'),
  stats: () => request<StatsOverview>('/v1/dns/stats/overview'),
  trafficStats: (range: TrafficRange) => request<TrafficStats>('/v1/dns/stats/traffic', { range }),
  systemResolver: () => request<SystemResolverInfo>('/v1/dns/resolvers/system', {}, { count: false }),
  lookup: (target: string, type: DnsRecordType, resolver: DnsResolver = 'cloudflare') => {
    const isIp = target.includes(':') || /^(\d{1,3}\.){3}\d{1,3}(?:\/\d{1,2})?$/.test(target)
    return request<DnsLookupData>(
      '/v1/dns/lookup',
      isIp ? { ip: target, type, resolver } : { domain: target, type, resolver },
    )
  },
  rdnsSearch: (keyword: string, mode: string, limit = 200) =>
    request<RDNSSearchData>('/v1/dns/rdns', { keyword, mode, limit }),
  reverseIp: (ip: string) =>
    request<{ ip: string; total: number; domains: NamedSourceRow[]; errors: string[] }>('/v1/dns/reverse-ip', { ip }),
  subdomains: (domain: string, limit = 200) =>
    request<{ target: string; total: number; items: NamedSourceRow[]; errors: string[] }>('/v1/dns/subdomains', {
      domain,
      limit,
    }),
  reverseNs: (domain: string, limit = 50) =>
    request<{
      target: string
      ns: string[]
      source_ips: string[]
      total_candidates: number
      total_shared: number
      items: Array<{ domain: string; shared_ns: string[]; source_ips: string[] }>
      errors: string[]
    }>('/v1/dns/reverse-ns', { domain, limit }),
  reverseMx: (domain: string, limit = 50) =>
    request<{
      target: string
      input_mode: string
      mx: string[]
      source_ips: string[]
      total_candidates: number
      total_shared: number
      items: Array<{ domain: string; shared_mx: string[]; source_ips: string[] }>
      errors: string[]
    }>('/v1/dns/reverse-mx', { domain, limit }),
  dnssec: (domain: string) =>
    request<{ domain: string; score: number; status: string; records: Record<string, { values: string[] }> }>(
      '/v1/dns/dnssec',
      { domain },
    ),
  ssl: (target: string, port?: number) => request<SSLInspection>('/v1/dns/ssl', { target, port }),
  mailSecurity: (domain: string, selector?: string) =>
    request<MailSecurityData>('/v1/dns/mail-security', { domain, selector }),
  blacklist: (ip: string) => request<BlacklistData>('/v1/dns/blacklist', { ip }),
  propagation: (domain: string, type: string) =>
    request<PropagationData>('/v1/dns/propagation', { domain, type }),
  healthCheck: (domain: string) => request<HealthCheckData>('/v1/dns/health-check', { domain }),
  ecs: (domain: string, subnet?: string) => request<ECSData>('/v1/dns/ecs', { domain, subnet }),
  takeover: (domain: string) => request<TakeoverData>('/v1/dns/takeover', { domain }),
}

export function getClientRequestStats(): ClientRequestStats {
  if (typeof window === 'undefined') return emptyClientStats()

  const today = currentDay()
  const storedDay = window.localStorage.getItem('dnsnf:requests:day') || today
  const storedToday = Number(window.localStorage.getItem('dnsnf:requests:today') || '0')
  const total = Number(window.localStorage.getItem('dnsnf:requests:total') || '0')
  const session = Number(window.sessionStorage.getItem('dnsnf:requests:session') || '0')

  if (storedDay !== today) {
    window.localStorage.setItem('dnsnf:requests:day', today)
    window.localStorage.setItem('dnsnf:requests:today', '0')
    return { today: 0, total, session, day: today }
  }

  return { today: storedToday, total, session, day: today }
}

export function subscribeClientRequestStats(listener: () => void) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(REQUEST_STATS_EVENT, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(REQUEST_STATS_EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}

function recordClientRequest() {
  if (typeof window === 'undefined') return

  const current = getClientRequestStats()
  const today = current.today + 1
  const total = current.total + 1
  const session = current.session + 1

  window.localStorage.setItem('dnsnf:requests:day', current.day)
  window.localStorage.setItem('dnsnf:requests:today', String(today))
  window.localStorage.setItem('dnsnf:requests:total', String(total))
  window.sessionStorage.setItem('dnsnf:requests:session', String(session))
  window.dispatchEvent(new Event(REQUEST_STATS_EVENT))
}

function emptyClientStats(): ClientRequestStats {
  return { today: 0, total: 0, session: 0, day: currentDay() }
}

function currentDay() {
  return new Date().toISOString().slice(0, 10)
}

async function requestRaw<T>(path: string) {
  const response = await fetch(new URL(`${API_BASE}${path}`, browserOrigin()))
  const payload = (await response.json().catch(() => null)) as T | null
  if (!response.ok || !payload) {
    throw new Error(response.statusText || 'Request failed')
  }
  return payload
}
