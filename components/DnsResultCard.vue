<script setup lang="ts">
import type { DnsResult } from '~/composables/useDnsLookup'

const props = defineProps<{ result: DnsResult }>()
const route = useRoute()
const { copiedKey, copyText } = useCopyState()
const expandedGroups = ref<Record<string, boolean>>({})
const showRawJson = ref(false)
const requestURL = useRequestURL()

const normalizedRecords = computed(() => {
  const records = props.result?.data?.records as (DnsResult['data']['records'] & {
    SPF?: string[]
    DMARC?: string[]
    DKIM?: string[]
  }) | null | undefined
  return {
    A: Array.isArray(records?.A) ? records.A : [],
    AAAA: Array.isArray(records?.AAAA) ? records.AAAA : [],
    CNAME: Array.isArray(records?.CNAME) ? records.CNAME : [],
    MX: Array.isArray(records?.MX) ? records.MX : [],
    NS: Array.isArray(records?.NS) ? records.NS : [],
    PTR: Array.isArray(records?.PTR) ? records.PTR : [],
    TXT: Array.isArray(records?.TXT) ? records.TXT : [],
    CAA: Array.isArray(records?.CAA) ? records.CAA : [],
    SPF: Array.isArray(records?.SPF) ? records.SPF : [],
    DMARC: Array.isArray(records?.DMARC) ? records.DMARC : [],
    DKIM: Array.isArray(records?.DKIM) ? records.DKIM : [],
    SOA: records?.SOA && typeof records.SOA === 'object' ? records.SOA : {},
    SRV: Array.isArray(records?.SRV) ? records.SRV : [],
  }
})

const txtMergedRecords = computed(() => {
  const r = normalizedRecords.value
  return [
    ...r.TXT,
    ...r.SPF.map((item) => `SPF: ${item}`),
    ...r.DMARC.map((item) => `DMARC: ${item}`),
    ...r.DKIM.map((item) => `DKIM: ${item}`),
  ]
})

const targetLabel = computed(() => props.result.data.domain || props.result.data.ip || 'unknown')
const currentLookupType = computed(() => String(route.query.type || 'ALL').toUpperCase())
const showSoaGroup = computed(() => currentLookupType.value === 'SOA' || currentLookupType.value === 'ALL')

const detailRows = computed(() => [
  { label: 'Target', value: targetLabel.value },
])
const timestampText = computed(() => new Date(props.result.timestamp * 1000).toLocaleString())

const countRows = computed(() => {
  const records = normalizedRecords.value
  const soaCount = Object.keys(records.SOA || {}).length ? 1 : 0
  return [
    { label: 'A', value: String(records.A.length) },
    { label: 'AAAA', value: String(records.AAAA.length) },
    { label: 'CNAME', value: String(records.CNAME.length) },
    { label: 'MX', value: String(records.MX.length) },
    { label: 'NS', value: String(records.NS.length) },
    { label: 'PTR', value: String(records.PTR.length) },
    { label: 'SOA', value: String(soaCount) },
    { label: 'SRV', value: String(records.SRV.length) },
    { label: 'TXT', value: String(txtMergedRecords.value.length) },
    { label: 'CAA', value: String(records.CAA.length) },
  ]
})
const totalRecordCount = computed(() =>
  countRows.value.reduce((sum, row) => sum + Number.parseInt(row.value, 10), 0),
)

const recordGridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${Math.max(countRows.value.length, 1)}, minmax(0, 1fr))`,
}))

const reverseDnsRows = computed(() =>
  props.result.data.reverse_dns.map((item) => {
    const trimmed = String(item).trim()
    const firstSpace = trimmed.indexOf(' ')
    if (firstSpace > 0) {
      const ip = trimmed.slice(0, firstSpace).trim()
      const ptr = trimmed.slice(firstSpace + 1).trim()
      if (ip && ptr && (ip.includes('.') || ip.includes(':'))) {
        return { ip, ptr, raw: trimmed }
      }
    }
    return { ip: '-', ptr: trimmed, raw: trimmed }
  }),
)

const reverseDnsByIp = computed<Record<string, string[]>>(() => {
  const grouped: Record<string, string[]> = {}
  for (const row of reverseDnsRows.value) {
    if (!row.ip || row.ip === '-') continue
    grouped[row.ip] = grouped[row.ip] || []
    grouped[row.ip].push(row.ptr)
  }
  return grouped
})

const withReverseDnsItems = (ips: string[]) => {
  const merged = [...ips]
  for (const ip of ips) {
    const ptrList = reverseDnsByIp.value[ip] || []
    for (const ptr of ptrList) {
      merged.push(`PTR: ${ip} -> ${ptr}`)
    }
  }
  return merged
}

const valueGroups = computed(() => {
  const r = normalizedRecords.value
  const groups: Array<{ title: string; items: string[] }> = [
    { title: 'A', items: withReverseDnsItems(r.A) },
    { title: 'AAAA', items: withReverseDnsItems(r.AAAA) },
    { title: 'CNAME', items: r.CNAME },
    { title: 'NS', items: r.NS },
    { title: 'TXT', items: txtMergedRecords.value },
    { title: 'MX', items: r.MX.map((x) => `${x.host} (pref ${x.pref})`) },
    { title: 'CAA', items: r.CAA.map((x) => `${x.tag}: ${x.value}`) },
    { title: 'SRV', items: r.SRV.map((x) => `${x.target}:${x.port} p${x.priority} w${x.weight}`) },
  ]

  if (props.result.data.domain && showSoaGroup.value) {
    groups.push({
      title: 'SOA',
      items: [
        `NS: ${r.SOA.ns || '-'}`,
        `MBox: ${r.SOA.mbox || '-'}`,
        `Serial: ${r.SOA.serial ?? '-'}`,
        `Refresh: ${r.SOA.refresh ?? '-'}`,
        `Retry: ${r.SOA.retry ?? '-'}`,
        `Expire: ${r.SOA.expire ?? '-'}`,
      ],
    })
  }

  return groups.filter((g) => g.items.length > 0)
})

const soaComments: Record<string, string> = {
  NS: "Primary authoritative DNS server",
  MBox: "Administrator mailbox",
  Serial: "Zone version number for synchronization",
  Refresh: "Secondary DNS refresh interval (seconds)",
  Retry: "Retry interval after failed refresh (seconds)",
  Expire: "Secondary DNS expiry time (seconds)",
}

const soaCommentText = (item: string) => {
  const key = item.split(":")[0]?.trim()
  return key ? (soaComments[key] || "") : ""
}

const formatSoaItem = (item: string) => {
  if (!item.startsWith("MBox:")) return item
  const raw = item.slice(5).trim()
  if (!raw || raw === "-") return item
  const at = raw.replace(".", "@")
  return `MBox: ${at}`
}

const copyEnabledGroups = new Set(['A', 'AAAA', 'NS', 'MX', 'TXT'])
const compactInlineGroups = new Set(['NS'])
const groupIcons: Record<string, string> = {
  A: 'fa-network-wired',
  AAAA: 'fa-globe',
  CNAME: 'fa-link',
  MX: 'fa-envelope',
  NS: 'fa-server',
  TXT: 'fa-file-lines',
  CAA: 'fa-certificate',
  SOA: 'fa-circle-info',
  SRV: 'fa-diagram-project',
}
const apiQuery = computed(() =>
  props.result.data.ip
    ? `ip=${encodeURIComponent(props.result.data.ip)}`
    : `domain=${encodeURIComponent(props.result.data.domain || '')}`,
)
const apiDisplayUrl = computed(() => `https://api.dns.nf/v1/dns/lookup?${apiQuery.value}`)
const rawJsonText = computed(() => JSON.stringify(props.result, null, 2))
const rawJsonHighlighted = computed(() => {
  const escaped = rawJsonText.value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return escaped.replace(
    /("(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"\s*:?)|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    (match, strToken, boolToken, numToken) => {
      if (strToken) {
        if (strToken.endsWith(':')) return `<span class="json-key">${strToken}</span>`
        return `<span class="json-string">${strToken}</span>`
      }
      if (boolToken) return `<span class="json-boolean">${match}</span>`
      if (numToken) return `<span class="json-number">${match}</span>`
      return match
    },
  )
})

const canCopy = (groupTitle: string) => copyEnabledGroups.has(groupTitle)
const isCompactInlineGroup = (groupTitle: string) => compactInlineGroups.has(groupTitle)
const iconForGroup = (groupTitle: string) => groupIcons[groupTitle] || 'fa-tag'
const canCollapseGroup = (groupTitle: string, count: number) => groupTitle === 'TXT' && count > 3
const isGroupExpanded = (groupTitle: string) => !!expandedGroups.value[groupTitle]
const visibleGroupItems = (groupTitle: string, items: string[]) => {
  if (!canCollapseGroup(groupTitle, items.length)) return items
  return isGroupExpanded(groupTitle) ? items : items.slice(0, 3)
}
const toggleGroupExpand = (groupTitle: string) => {
  expandedGroups.value[groupTitle] = !expandedGroups.value[groupTitle]
}

const copyValue = async (groupTitle: string, item: string, index: number) => {
  if (!import.meta.client || !canCopy(groupTitle)) return
  await copyText(item, `${groupTitle}-${index}`)
}

const copyApiUrl = async () => {
  await copyText(apiDisplayUrl.value, 'api-url')
}

const toggleRawJson = () => {
  showRawJson.value = !showRawJson.value
}

const copyRawJson = async () => {
  await copyText(rawJsonText.value, 'raw-json')
}

const downloadRawJson = () => {
  if (!import.meta.client) return
  const blob = new Blob([rawJsonText.value], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const target = props.result.data.domain || props.result.data.ip || 'dns-result'
  a.href = url
  a.download = `${target}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="result-stack">
    <section class="result-panel">
      <h3>
        <span class="panel-title-main"><i class="fa-solid fa-list-check panel-heading-icon" aria-hidden="true"></i> Details</span>
        <span class="panel-head-badges">
          <span v-if="props.result.cached" class="head-badge head-badge-cached">
            <i class="fa-solid fa-database" aria-hidden="true"></i>
            Cached
          </span>
          <span class="head-badge head-badge-time">
            <i class="fa-regular fa-clock" aria-hidden="true"></i>
            {{ timestampText }}
          </span>
        </span>
      </h3>
      <div class="result-rows result-table">
        <div
          v-for="row in detailRows"
          :key="row.label"
          class="result-row"
          :class="{ 'result-row-target': row.label === 'Target' }"
        >
          <span>{{ row.label }}</span>
          <strong>{{ row.value }}</strong>
        </div>
        <div class="result-row">
          <span>Status</span>
          <span class="status-badge"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> ok</span>
        </div>
      </div>
      <div class="result-link result-table">
        <span class="result-link-text">API URL</span>
        <span
          class="result-link-url"
          role="button"
          tabindex="0"
          :title="apiDisplayUrl"
          @click="copyApiUrl"
          @keydown.enter.prevent="copyApiUrl"
          @keydown.space.prevent="copyApiUrl"
        >{{ apiDisplayUrl }}</span>
        <div class="result-actions">
          <CopyIconButton
            class="copy-btn icon-only-btn"
            :copied="copiedKey === 'api-url'"
            copy-title="Copy API URL"
            aria-label="Copy api url"
            @click="copyApiUrl"
          />
          <button type="button" class="copy-btn icon-only-btn" :aria-label="showRawJson ? 'Collapse raw json' : 'Expand raw json'" @click="toggleRawJson">
            <i :class="['fa-solid', showRawJson ? 'fa-compress' : 'fa-expand']" aria-hidden="true"></i>
          </button>
        </div>
      </div>
      <div v-if="showRawJson" class="raw-json-wrap">
        <div class="raw-json-actions">
          <CopyIconButton
            class="copy-btn icon-only-btn"
            :copied="copiedKey === 'raw-json'"
            copy-title="Copy raw json"
            aria-label="Copy raw json"
            @click="copyRawJson"
          />
          <button type="button" class="copy-btn icon-only-btn" aria-label="Download json" @click="downloadRawJson">
            <i class="fa-solid fa-download" aria-hidden="true"></i>
          </button>
        </div>
        <pre class="raw-json"><code class="raw-json-code" v-html="rawJsonHighlighted"></code></pre>
      </div>
    </section>

    <section class="result-panel">
      <h3>
        <span class="panel-title-main"><i class="fa-solid fa-table-list panel-heading-icon" aria-hidden="true"></i> Records</span>
        <span class="record-total-badge">Total {{ totalRecordCount }}</span>
      </h3>
      <div class="record-grid" :style="recordGridStyle">
        <div v-for="row in countRows" :key="row.label" class="record-cell">
          <span class="record-name">{{ row.label }}</span>
          <strong class="record-count">{{ row.value }}</strong>
        </div>
      </div>
    </section>

    <section class="result-panel">
      <h3><span class="panel-title-main"><i class="fa-solid fa-layer-group panel-heading-icon" aria-hidden="true"></i> Values</span></h3>
      <div class="value-grid">
        <div v-for="group in valueGroups" :key="group.title" class="value-group">
          <div class="value-title result-meta-title">
            <span class="value-title-left">
              <i :class="['fa-solid', iconForGroup(group.title)]" aria-hidden="true"></i>
              {{ group.title }}
            </span>
            <span class="value-title-count">{{ group.items.length }}</span>
          </div>
          <div class="value-tags" :class="{ 'value-tags-compact': isCompactInlineGroup(group.title) }">
            <div
              v-for="(item, index) in visibleGroupItems(group.title, group.items)"
              :key="`${group.title}-${index}-${item}`"
              class="value-item"
              :class="{ 'value-item-compact': isCompactInlineGroup(group.title) }"
            >
              <div v-if="group.title === 'SOA'" class="value-text-row">
                <span class="value-text">{{ formatSoaItem(item) }}</span>
                <span class="value-note">{{ soaCommentText(item) }}</span>
              </div>
              <span v-else class="value-text">{{ item }}</span>
              <CopyIconButton
                v-if="canCopy(group.title)"
                class="copy-btn"
                :copied="copiedKey === `${group.title}-${index}`"
                :copy-title="`Copy ${group.title} record`"
                :aria-label="`Copy ${group.title} record`"
                @click="copyValue(group.title, item, index)"
              />
            </div>
            <button
              v-if="canCollapseGroup(group.title, group.items.length)"
              type="button"
              class="group-toggle-btn"
              @click="toggleGroupExpand(group.title)"
            >
              {{ isGroupExpanded(group.title) ? 'Collapse' : `Expand (${group.items.length - 3} more)` }}
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.result-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-panel {
  border: 1px solid var(--panel-border);
  background: #ffffff;
  border-radius: var(--app-radius);
  padding: 22px;
}

.result-panel h3 {
  margin: 0 0 12px;
  text-align: left;
  font-size: 22px;
  line-height: 1.1;
  font-weight: 700;
  color: #6C757D;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.panel-title-main {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: inherit;
}

.panel-heading-icon {
  color: var(--app-accent);
  transition: transform 0.16s ease;
}

.result-panel h3:hover .panel-heading-icon {
  transform: scale(1.12);
}

.panel-head-badges {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.head-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  border-radius: 999px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.head-badge-cached {
  border: 1px solid rgba(114, 191, 128, 0.45);
  background: rgba(114, 191, 128, 0.12);
  color: #278451;
}

.head-badge-time {
  border: 1px solid var(--panel-border);
  background: #f2f4f7;
  color: #6C757D;
}

.result-meta-title {
  color: var(--app-accent);
  font-size: 12px;
  line-height: 1.1;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.result-meta-value {
  color: #212529;
  font-size: 16px;
  font-weight: 500;
  margin-top: 10px;
}

.record-total-badge {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 10px;
  border: 1px solid var(--panel-border);
  background: #f2f4f7;
  color: #6C757D;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

.result-table {
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  overflow: visible;
}

.result-rows {
  margin-top: 8px;
}

.result-row {
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid var(--panel-border);
  padding: 0 14px;
}

.result-row:last-child {
  border-bottom: 0;
}

.result-row span {
  color: #212529;
  font-size: 13px;
  font-weight: 500;
}

.result-row strong {
  color: #212529;
  font-size: 13px;
  font-weight: 500;
  text-align: right;
}

.result-row-target strong {
  font-size: 15px;
  font-weight: 600;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 34px;
  min-width: 90px;
  border-radius: 999px;
  border: 1px solid rgba(114, 191, 128, 0.45);
  background: rgba(114, 191, 128, 0.12);
  color: #278451;
  text-transform: lowercase;
  font-size: 12px;
  font-weight: 700;
}

.result-link {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  width: 100%;
  margin-top: 16px;
  background: #ffffff;
  padding: 10px 12px;
  color: #212529;
  font-size: 12px;
  font-weight: 500;
}

.result-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.result-link-text {
  text-transform: uppercase;
  font-weight: 600;
}

.result-link-url {
  display: block;
  min-width: 0;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  background: #f4f6fa;
  border: 1px solid var(--panel-border);
  border-radius: 0;
  padding: 6px 8px;
  color: #212529;
  cursor: pointer;
}

.raw-json-wrap {
  margin-top: 10px;
  border: 1px solid var(--panel-border);
  border-radius: 10px;
  background: #fbfcfe;
  overflow: visible;
  position: relative;
  padding-top: 42px;
}

.raw-json-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: inline-flex;
  gap: 6px;
  z-index: 3;
}

.raw-json {
  margin: 0;
  padding: 10px 14px 14px;
  font-size: 13px;
  line-height: 1.5;
  color: #2d3748;
  white-space: pre;
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.raw-json-code :deep(.json-key),
.raw-json-code .json-key {
  color: #0f766e;
}

.raw-json-code :deep(.json-string),
.raw-json-code .json-string {
  color: #212529;
}

.raw-json-code :deep(.json-number),
.raw-json-code .json-number {
  color: var(--app-accent);
}

.raw-json-code :deep(.json-boolean),
.raw-json-code .json-boolean {
  color: #1d4ed8;
}


.value-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

.value-group {
  border: 1px solid var(--panel-border);
  background: #ffffff;
  border-radius: 12px;
  padding: 12px 12px 10px;
}

.value-title {
  display: flex;
  justify-content: space-between;
  width: 100%;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.value-title-left {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.value-title-count {
  min-width: 34px;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  border: 1px solid var(--panel-border);
  background: #ffffff;
  color: #6C757D;
  font-size: 11px;
  line-height: 22px;
  text-align: center;
}

.value-tags {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.reverse-table {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reverse-head,
.reverse-row {
  display: grid;
  grid-template-columns: minmax(120px, 0.34fr) minmax(0, 1fr) 22px;
  align-items: center;
  gap: 10px;
}

.reverse-head {
  color: #6C757D;
  font-size: 11px;
  font-weight: 700;
  padding: 0 6px;
}

.reverse-row {
  color: #212529;
  border: 1px solid var(--panel-border);
  background: #ffffff;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.35;
  padding: 8px 10px;
}

.reverse-ip {
  color: #4c5f7f;
  font-weight: 600;
}

.reverse-ptr {
  display: block;
  word-break: break-all;
}

.value-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: #212529;
  border: 1px solid var(--panel-border);
  background: #ffffff;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.35;
  padding: 8px 10px;
}

.value-tags-compact {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.value-item-compact {
  min-height: 34px;
  padding: 6px 8px;
  width: auto;
  max-width: 100%;
}

.value-item-compact .value-text {
  white-space: nowrap;
  overflow: visible;
  text-overflow: clip;
}

.value-text {
  display: block;
  word-break: break-all;
  color: #212529;
}

.value-text-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
}

.group-toggle-btn {
  margin-top: 8px;
  border: 1px solid #d0d8e6;
  background: #f7f9fc;
  color: #4a5870;
  border-radius: 8px;
  height: 32px;
  padding: 0 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.group-toggle-btn:hover {
  background: #eef3f9;
}

.value-note {
  color: #96a0af;
  font-size: 11px;
  white-space: nowrap;
  text-align: right;
  flex: 0 0 auto;
}

.copy-btn {
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
}

.value-group .copy-btn {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
}

.icon-only-btn {
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  border: 1px solid var(--panel-border);
  background: #ffffff;
  color: #6C757D;
  padding: 0;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
}

.icon-only-btn:hover {
  color: var(--app-accent);
  border-color: var(--app-accent);
  background: #f4fbf6;
}

.icon-only-btn:focus-visible {
  outline: 2px solid rgba(114, 191, 128, 0.28);
  outline-offset: 1px;
}

:global(html[data-theme="dark"]) .icon-only-btn {
  border-color: var(--panel-border);
  background: #1a1a1a;
  color: #EBEBEB;
}

:global(html[data-theme="dark"]) .icon-only-btn:hover {
  color: var(--app-accent);
  border-color: var(--app-accent);
  background: #151515;
}

.record-grid {
  display: grid;
  width: 100%;
  overflow-x: hidden;
  overflow-y: hidden;
  gap: 6px;
  padding: 0 1px 2px 0;
  border: 0;
  background: transparent;
}

.record-cell {
  border: 1px solid var(--panel-border);
  background: #ffffff;
  padding: 0;
  min-height: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 0;
  border-radius: 0;
}

.record-name {
  width: 100%;
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #212529;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  background: #f2f5fa;
  border-bottom: 1px solid var(--panel-border);
}

.record-count {
  width: 100%;
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #212529;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
}

@media (max-width: 900px) {
  .result-panel h3 {
    font-size: 20px;
    align-items: flex-start;
    flex-direction: column;
  }

  .panel-head-badges {
    width: 100%;
    overflow-x: auto;
    padding-bottom: 2px;
  }

  .result-row strong {
    font-size: 16px;
  }

  .result-row span {
    font-size: 16px;
  }

  .result-meta-title {
    font-size: 13px;
  }

  .result-meta-value {
    font-size: 16px;
  }

  .result-link {
    grid-template-columns: 84px 1fr auto;
    font-size: 14px;
  }

  .record-grid {
    display: flex;
    flex-wrap: wrap;
    overflow-x: hidden;
  }

  .record-cell {
    min-width: 74px;
  }

  .record-name {
    font-size: 11px;
  }

  .value-item,
  .reverse-row {
    font-size: 14px;
  }

  .value-note {
    font-size: 11px;
  }
}
</style>
