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

export interface DnsResult {
  code: number
  data: {
    domain?: string
    ip?: string
    reverse_dns: string[]
    records: {
      A: string[]
      AAAA: string[]
      CNAME: string[]
      MX: Array<{ host: string; pref: number }>
      NS: string[]
      PTR: string[]
      TXT: string[]
      CAA: Array<{ flag: number; tag: string; value: string }>
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
    }
  }
  cached: boolean
  timestamp: number
  message?: string
}

const IPV4_OCTET = '(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)'
const IPV4_RE = new RegExp(`^(${IPV4_OCTET}\\.){3}${IPV4_OCTET}$`)
const IPV4_CIDR_RE = new RegExp(`^(${IPV4_OCTET}\\.){3}${IPV4_OCTET}\\/([0-9]|[12][0-9]|3[0-2])$`)
const IPV6_LIKE_RE = /^[0-9a-f:.]+$/i
const DOMAIN_LABEL_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/i

export const isIpLikeTarget = (value: string) => {
  const v = value.trim()
  return IPV4_RE.test(v) || IPV4_CIDR_RE.test(v) || (v.includes(':') && IPV6_LIKE_RE.test(v))
}

export const isDomainTarget = (value: string) => {
  const v = value.trim().toLowerCase().replace(/\.$/, '')
  if (!v || v.length > 253) return false
  if (isIpLikeTarget(v)) return false
  if (!v.includes('.')) return false
  const labels = v.split('.')
  return labels.every((label) => DOMAIN_LABEL_RE.test(label))
}

export const useDnsLookup = () => {
  const localFetch = import.meta.server ? useRequestFetch() : $fetch

  const lookup = async (target: string, type: DnsRecordType) => {
    const params: Record<string, string> = { type }
    if (isIpLikeTarget(target)) {
      params.ip = target
    } else {
      params.domain = target
    }

    return await localFetch<DnsResult>('/api/v1/dns', {
      query: params,
      headers: import.meta.server ? { 'x-nuxt-internal': '1' } : undefined,
    })
  }

  return { lookup }
}
