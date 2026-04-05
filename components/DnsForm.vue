<script setup lang="ts">
import { isDomainTarget } from '~/composables/useDnsLookup'
import type { DnsRecordType, DnsResult } from '~/composables/useDnsLookup'

const props = defineProps<{
  loading?: boolean
  mode?: 'default' | 'result'
  result?: DnsResult | null
  lookupMode?: 'path' | 'query'
  lookupPath?: string
  lookupQueryKey?: string
  plain?: boolean
}>()

interface RecentQueryItem {
  target: string
  type: DnsRecordType
}

const RECENT_QUERY_KEY = 'dns_recent_queries'
const RECENT_QUERY_LIMIT = 6

const route = useRoute()
const target = ref('')
const recordType = ref<DnsRecordType>('ALL')
const submitting = ref(false)
const recentQueries = ref<RecentQueryItem[]>([])
const isBusy = computed(() => submitting.value || !!props.loading)
const isResultMode = computed(() => props.mode === 'result')
const isPlain = computed(() => !!props.plain)
const recordTypes: DnsRecordType[] = ['ALL', 'A', 'AAAA', 'CNAME', 'MX', 'NS', 'SOA', 'SRV', 'TXT', 'CAA']
const isTargetDirty = ref(false)
const lookupMode = computed(() => props.lookupMode || 'path')
const lookupPath = computed(() => props.lookupPath || '/lookup')
const lookupQueryKey = computed(() => props.lookupQueryKey || 'domain')
const validationError = ref('')
const normalizeRecordType = (value: unknown): DnsRecordType => {
  const t = String(value || 'ALL').toUpperCase()
  return (recordTypes.includes(t as DnsRecordType) ? t : 'ALL') as DnsRecordType
}

const onTargetFocus = () => {
  // noop: keep current query visible in input on result page
}

const decodeRouteTarget = (raw: unknown) => {
  const value = String(raw || '').trim()
  if (!value) return ''
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const routeTarget = computed(() => {
  const raw = lookupMode.value === 'query'
    ? route.query[lookupQueryKey.value]
    : route.params.domain
  return decodeRouteTarget(raw)
})

const syncFromRoute = () => {
  if (routeTarget.value) {
    target.value = routeTarget.value
  } else if (!target.value) {
    target.value = ''
  }

  recordType.value = normalizeRecordType(route.query.type)
  isTargetDirty.value = false
}

const hasNonEmptyArray = (value: unknown) => Array.isArray(value) && value.length > 0
const hasNonEmptySOA = (value: unknown) =>
  !!value
  && typeof value === 'object'
  && Object.values(value as Record<string, unknown>).some((v) => v !== null && v !== undefined && String(v).trim() !== '')

const availableRecordTypes = computed<DnsRecordType[]>(() => {
  if (!isResultMode.value || isTargetDirty.value) return recordTypes
  const records = (props.result?.data?.records || {}) as Record<string, unknown>
  if (!props.result?.data || !records) return recordTypes

  const txtCount =
    (hasNonEmptyArray(records.TXT) ? (records.TXT as unknown[]).length : 0)
    + (hasNonEmptyArray(records.SPF) ? (records.SPF as unknown[]).length : 0)
    + (hasNonEmptyArray(records.DMARC) ? (records.DMARC as unknown[]).length : 0)
    + (hasNonEmptyArray(records.DKIM) ? (records.DKIM as unknown[]).length : 0)

  return recordTypes.filter((type) => {
    if (type === 'ALL') return true
    if (type === 'TXT') return txtCount > 0
    if (type === 'SOA') return hasNonEmptySOA(records.SOA)
    return hasNonEmptyArray(records[type])
  })
})

const loadRecentQueries = () => {
  if (!import.meta.client) return
  try {
    const raw = localStorage.getItem(RECENT_QUERY_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as Array<{ target?: string; type?: string }>
    recentQueries.value = parsed
      .filter((x) => !!x.target && typeof x.target === 'string')
      .map((x) => ({
        target: String(x.target).toLowerCase(),
        type: normalizeRecordType(x.type),
      }))
      .slice(0, RECENT_QUERY_LIMIT)
  } catch {
    recentQueries.value = []
  }
}

const persistRecentQueries = () => {
  if (!import.meta.client) return
  localStorage.setItem(RECENT_QUERY_KEY, JSON.stringify(recentQueries.value))
}

const pushRecentQuery = (queryTarget: string, queryType: DnsRecordType) => {
  const filtered = recentQueries.value.filter((x) => x.target !== queryTarget)
  recentQueries.value = [{ target: queryTarget, type: queryType }, ...filtered].slice(0, RECENT_QUERY_LIMIT)
  persistRecentQueries()
}

const applyRecentQuery = async (item: RecentQueryItem) => {
  target.value = item.target
  recordType.value = item.type
  await submit()
}

const removeRecentQuery = (queryTarget: string) => {
  recentQueries.value = recentQueries.value.filter((x) => x.target !== queryTarget)
  persistRecentQueries()
}

const submit = async () => {
  const normalized = target.value.trim().toLowerCase()
  if (!normalized) return
  if (!isDomainTarget(normalized)) {
    validationError.value = 'DNS Lookup only supports domain names. Please use rDNS or Reverse IP for IP/CIDR.'
    return
  }
  validationError.value = ''
  const queryType: DnsRecordType = isResultMode.value ? recordType.value : 'ALL'

  pushRecentQuery(normalized, queryType)
  submitting.value = true
  try {
    if (lookupMode.value === 'query') {
      await navigateTo({
        path: lookupPath.value,
        query: {
          [lookupQueryKey.value]: normalized,
          type: queryType,
        },
      })
      return
    }
    await navigateTo(`${lookupPath.value}/${encodeURIComponent(normalized)}?type=${queryType}`)
  } finally {
    submitting.value = false
  }
}

const selectRecordType = async (type: DnsRecordType) => {
  if (recordType.value === type && routeTarget.value) return
  recordType.value = type
  await submit()
}

onMounted(() => {
  syncFromRoute()
  loadRecentQueries()
})

watch(
  () => [routeTarget.value, route.query.type],
  () => {
    syncFromRoute()
  },
)

watch(
  () => target.value,
  (value) => {
    if (validationError.value && isDomainTarget(value.trim().toLowerCase())) {
      validationError.value = ''
    }
    if (!isResultMode.value) return
    const isEdited = value.trim() !== routeTarget.value
    isTargetDirty.value = isEdited
    if (isEdited && recordType.value !== 'ALL') {
      recordType.value = 'ALL'
    }
  },
)

watch(
  availableRecordTypes,
  (types) => {
    if (!types.includes(recordType.value)) {
      recordType.value = 'ALL'
    }
  },
  { immediate: true },
)
</script>

<template>
  <component
    :is="isPlain ? 'div' : 'el-card'"
    class="dns-form-card"
    :class="{ 'dns-form-card-plain': isPlain }"
    v-bind="isPlain ? {} : { shadow: isResultMode ? 'never' : 'hover' }"
  >
    <div class="dns-form-row" :class="{ 'dns-form-row-result': isResultMode }">
      <el-input
        v-model="target"
        placeholder="Enter domain, e.g. example.com"
        @focus="onTargetFocus"
        @keyup.enter="submit"
      />
      <button type="button" class="dns-search-btn" :disabled="isBusy" @click="submit">
        <template v-if="isBusy">
          <span class="dns-loading-dot" aria-hidden="true"></span>
        </template>
        <template v-else>
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          {{ isResultMode ? 'Check' : 'Search' }}
        </template>
      </button>
    </div>
    <p v-if="validationError" class="dns-form-error">{{ validationError }}</p>

    <div v-if="isResultMode" class="dns-record-tabs" role="tablist" aria-label="DNS record types">
      <button
        v-for="type in availableRecordTypes"
        :key="type"
        type="button"
        class="dns-record-tab"
        :class="{ 'is-active': recordType === type }"
        :aria-selected="recordType === type"
        role="tab"
        @click="selectRecordType(type)"
      >
        {{ type }}
      </button>
    </div>

    <div v-else-if="recentQueries.length > 0" class="dns-quick-list">
      <div
        v-for="item in recentQueries"
        :key="item.target"
        class="dns-quick-item"
      >
        <button type="button" class="dns-quick-link" @click="applyRecentQuery(item)">
          <i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i>
          {{ item.target }}
        </button>
        <button type="button" class="dns-quick-remove" @click="removeRecentQuery(item.target)">
          <i class="fa-solid fa-trash" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  </component>
</template>

<style scoped>
.dns-form-card {
  width: 100%;
}

.dns-form-card-plain {
  background: transparent;
}

.dns-record-tabs {
  margin-top: 14px;
  display: flex;
  align-items: stretch;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.dns-form-error {
  margin-top: 8px;
  color: #dc3545;
  font-size: 13px;
  line-height: 1.45;
}

.dns-record-tab {
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: #6C757D;
  font-weight: 600;
  letter-spacing: 0.01em;
  padding: 10px 8px 12px;
  min-width: 52px;
  cursor: pointer;
  white-space: nowrap;
}

.dns-record-tab:hover {
  color: #212529;
}

.dns-record-tab.is-active {
  color: #212529;
  border-bottom-color: var(--app-accent);
}

.dns-quick-list {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.dns-quick-item {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  border-radius: var(--app-radius);
  font-size: 12px;
  line-height: 1;
}

.dns-quick-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  color: var(--app-text-soft);
  cursor: pointer;
  padding: 8px 8px 8px 10px;
}

.dns-quick-remove {
  border: 0;
  border-left: 1px solid var(--app-border);
  background: transparent;
  color: var(--app-text-soft);
  cursor: pointer;
  padding: 8px 8px 8px 8px;
}

.dns-quick-item:hover .dns-quick-link {
  color: var(--app-text);
}

.dns-quick-item:hover,
.dns-quick-remove:hover {
  border-color: color-mix(in srgb, var(--app-accent) 50%, var(--app-border));
  color: var(--app-text);
}

</style>
