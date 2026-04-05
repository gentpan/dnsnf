import { defineStore } from 'pinia'
import { isDomainTarget } from '~/composables/useDnsLookup'
import type { DnsRecordType, DnsResult } from '~/composables/useDnsLookup'

interface DnsState {
  result: DnsResult | null
  loading: boolean
  error: string | null
}

export const useDnsStore = defineStore('dns', {
  state: (): DnsState => ({
    result: null,
    loading: false,
    error: null,
  }),
  actions: {
    async fetchLookup(target: string, type: DnsRecordType) {
      const normalized = String(target || '').trim().toLowerCase()
      if (!isDomainTarget(normalized)) {
        this.result = null
        this.loading = false
        this.error = 'DNS Lookup only supports domain names. Please use rDNS or Reverse IP for IP/CIDR.'
        return
      }

      this.loading = true
      this.error = null
      try {
        const { lookup } = useDnsLookup()
        this.result = await lookup(normalized, type)
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } }; message?: string }
        this.error = e.response?.data?.message || e.message || 'Request failed'
      } finally {
        this.loading = false
      }
    },
  },
})
