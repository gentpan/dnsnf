<script setup lang="ts">
import { $fetch } from 'ofetch'
const route = useRoute()

interface RDNSRow {
  ip: string
  ptr: string[]
  cname: string[]
  ok: boolean
  error?: string
  updated_at?: string
  checked_at?: string
  score_delta: number
  residential_score: number
  hint: string
}

interface RDNSResponse {
  code: number
  data: {
    target: string
    total: number
    scanned: number
    ok: number
    failed: number
    with_ptr: number
    without_ptr: number
    with_cname: number
    without_cname: number
    match_mode: 'left' | 'middle' | 'right'
    match_target: 'ptr' | 'cname' | 'both'
    keyword: string
    results: RDNSRow[]
  }
  cached: boolean
  timestamp: number
  message?: string
}

// ── Tab state ────────────────────────────────────────────────────────────────
const activeTab = ref<'scan' | 'search'>('scan')

// ── IP / CIDR Scan ───────────────────────────────────────────────────────────
const target = ref('')
const loading = ref(false)
const error = ref('')
const result = ref<RDNSResponse | null>(null)
const cooldownLeft = ref(0)

// ── PTR Reverse Search ───────────────────────────────────────────────────────
interface SearchRecord {
  id: number
  ip: string
  ptr: string
  scanned_at: string
}
interface SearchResponse {
  code: number
  data: {
    keyword: string
    mode: string
    total: number
    records: SearchRecord[]
  }
}

const searchKeyword = ref('')
const searchMode = ref<'left' | 'middle' | 'right'>('middle')
const searchLoading = ref(false)
const searchError = ref('')
const searchResult = ref<SearchResponse | null>(null)

const runSearch = async () => {
  const kw = searchKeyword.value.trim()
  if (!kw || kw.length < 2 || searchLoading.value) return
  searchLoading.value = true
  searchError.value = ''
  searchResult.value = null
  try {
    const resp = await $fetch('/api/rdns-search', {
      query: { keyword: kw, mode: searchMode.value, limit: 500 },
    })
    searchResult.value = resp
  } catch (err: unknown) {
    const e = err as { data?: { message?: string }; message?: string }
    searchError.value = e.data?.message || e.message || 'Search failed'
  } finally {
    searchLoading.value = false
  }
}

let cooldownTimer: ReturnType<typeof setInterval> | null = null

const isCIDR = computed(() => target.value.includes('/'))
const isCoolingDown = computed(() => cooldownLeft.value > 0)
const buttonDisabled = computed(() => loading.value || isCoolingDown.value)
const buttonText = computed(() => {
  if (loading.value) return ''
  if (isCoolingDown.value) return `${cooldownLeft.value}s`
  return isCIDR.value ? 'Scan rDNS' : 'Lookup rDNS'
})

const hintLabel = (hint: string) => {
  const map: Record<string, string> = {
    residential_ptr_keyword: 'Residential PTR',
    datacenter_ptr_keyword: 'Datacenter PTR',
    no_ptr: 'No PTR',
    neutral_ptr: 'Neutral PTR',
  }
  return map[hint] || hint
}

const scoreClass = (score: number) => {
  if (score >= 65) return 'score-high'
  if (score <= 35) return 'score-low'
  return 'score-mid'
}

const formatUpdatedAt = (row: RDNSRow) => {
  const value = row.updated_at || row.checked_at || ''
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString()
}

const startCooldown = () => {
  if (cooldownTimer) {
    clearInterval(cooldownTimer)
    cooldownTimer = null
  }
  cooldownLeft.value = 30
  cooldownTimer = setInterval(() => {
    cooldownLeft.value = Math.max(0, cooldownLeft.value - 1)
    if (cooldownLeft.value === 0 && cooldownTimer) {
      clearInterval(cooldownTimer)
      cooldownTimer = null
    }
  }, 1000)
}

const syncFromRoute = () => {
  const raw = String(route.query.target || '').trim()
  if (raw) target.value = raw
}

const runScan = async () => {
  const value = target.value.trim()
  if (!value || buttonDisabled.value) return

  loading.value = true
  error.value = ''
  result.value = null
  startCooldown()

  try {
    if (import.meta.client) {
      await navigateTo({ path: '/rdns', query: { target: value } }, { replace: true })
    }
    const resp = await $fetch('/api/rdns', { query: { target: value } })
    result.value = resp
  } catch (err: unknown) {
    const e = err as { data?: { message?: string }; message?: string }
    error.value = e.data?.message || e.message || 'rDNS scan failed'
  } finally {
    loading.value = false
  }
}

onBeforeUnmount(() => {
  if (cooldownTimer) {
    clearInterval(cooldownTimer)
    cooldownTimer = null
  }
})

onMounted(async () => {
  syncFromRoute()
  if (target.value) {
    await runScan()
  }
})

watch(
  () => route.query.target,
  async () => {
    const nextTarget = String(route.query.target || '').trim()
    if (nextTarget && nextTarget !== target.value) {
      target.value = nextTarget
      await runScan()
    }
  },
)

useSeoMeta({
  title: 'DNS.NF | rDNS Scanner',
  description: 'Concurrent rDNS scan for IPv4 and CIDR targets with PTR analysis and residential hint scoring.',
})
</script>

<template>
  <section class="page-container rdns-page">
    <section class="result-panel rdns-panel">
      <h3>
        <span class="panel-title-main"><i class="fa-solid fa-satellite-dish panel-heading-icon" aria-hidden="true"></i> rDNS Scanner</span>
      </h3>

      <div class="rdns-tabs">
        <button
          class="rdns-tab-btn"
          :class="{ 'is-active': activeTab === 'scan' }"
          type="button"
          @click="activeTab = 'scan'"
        >
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i> IP / CIDR Scan
        </button>
        <button
          class="rdns-tab-btn"
          :class="{ 'is-active': activeTab === 'search' }"
          type="button"
          @click="activeTab = 'search'"
        >
          <i class="fa-solid fa-database" aria-hidden="true"></i> PTR Reverse Search
        </button>
      </div>

      <!-- ── IP / CIDR Scan tab ─────────────────────────────────────────── -->
      <template v-if="activeTab === 'scan'">
      <p class="rdns-hint">CIDR scan runs concurrent PTR lookups and returns structured result rows.</p>

      <div class="rdns-form-row">
        <input
          v-model="target"
          class="rdns-input"
          type="text"
          placeholder="Enter IPv4 or CIDR, e.g. 8.8.8.8 or 213.230.74.0/24"
          @keyup.enter="runScan"
        />
        <button class="dns-search-btn" type="button" :disabled="buttonDisabled" @click="runScan">
          <span v-if="loading" class="dns-loading-dot" aria-hidden="true"></span>
          <template v-else>
            <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
            {{ buttonText }}
          </template>
        </button>
      </div>
      <el-alert v-if="error" :title="error" type="error" class="rdns-alert">
        <template #icon>
          <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
        </template>
      </el-alert>

      <template v-if="result">
        <div class="rdns-summary">
          <div class="record-cell"><span class="record-name">Target</span><strong class="record-count">{{ result.data.target }}</strong></div>
          <div class="record-cell"><span class="record-name">Scanned</span><strong class="record-count">{{ result.data.scanned }}</strong></div>
          <div class="record-cell"><span class="record-name">With PTR</span><strong class="record-count">{{ result.data.with_ptr }}</strong></div>
          <div class="record-cell"><span class="record-name">With CNAME</span><strong class="record-count">{{ result.data.with_cname }}</strong></div>
          <div class="record-cell"><span class="record-name">No PTR</span><strong class="record-count">{{ result.data.without_ptr }}</strong></div>
          <div class="record-cell"><span class="record-name">Failed</span><strong class="record-count">{{ result.data.failed }}</strong></div>
        </div>

        <div class="rdns-table-wrap">
          <table class="rdns-table">
            <thead>
              <tr>
                <th>IP</th>
                <th>PTR</th>
                <th>CNAME</th>
                <th>Hint</th>
                <th>Score</th>
                <th>Updated At</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in result.data.results" :key="row.ip">
                <td><code class="rdns-code rdns-code-ip">{{ row.ip }}</code></td>
                <td>
                  <span v-if="row.ptr.length" class="rdns-ptr-list">
                    <code
                      v-for="ptr in row.ptr"
                      :key="`${row.ip}-${ptr}`"
                      class="rdns-code rdns-code-ptr"
                    >{{ ptr }}</code>
                  </span>
                  <span v-else class="muted">-</span>
                </td>
                <td>
                  <span v-if="row.cname.length" class="rdns-cname-list">
                    <code
                      v-for="cname in row.cname"
                      :key="`${row.ip}-${cname}`"
                      class="rdns-code rdns-code-cname"
                    >{{ cname }}</code>
                  </span>
                  <span v-else class="muted">-</span>
                </td>
                <td>{{ hintLabel(row.hint) }}</td>
                <td>
                  <span class="score-badge" :class="scoreClass(row.residential_score)">{{ row.residential_score }}</span>
                </td>
                <td>{{ formatUpdatedAt(row) }}</td>
                <td>
                  <span v-if="row.ok" class="status-badge"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> ok</span>
                  <span v-else class="status-badge status-badge-err"><i class="fa-solid fa-circle-xmark" aria-hidden="true"></i> fail</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
      </template>
      <!-- end IP / CIDR Scan tab -->

      <!-- ── PTR Reverse Search tab ─────────────────────────────────────── -->
      <template v-if="activeTab === 'search'">
        <p class="rdns-hint">Search stored PTR records by hostname pattern. Data is collected from rDNS scans.</p>

        <div class="rdns-search-row">
          <input
            v-model="searchKeyword"
            class="rdns-input"
            type="text"
            placeholder="Enter hostname pattern, e.g. google, amazonaws.com, .static"
            @keyup.enter="runSearch"
          />
          <select v-model="searchMode" class="rdns-select rdns-search-select">
            <option value="left">Left Match</option>
            <option value="middle">Middle Match</option>
            <option value="right">Right Match</option>
          </select>
          <button class="dns-search-btn rdns-search-btn" type="button" :disabled="searchLoading" @click="runSearch">
            <span v-if="searchLoading" class="dns-loading-dot" aria-hidden="true"></span>
            <template v-else>
              <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i> Search
            </template>
          </button>
        </div>

        <div class="rdns-usage">
          <div class="rdns-usage-title">How it works</div>
          <div class="rdns-usage-items">
            <span>1. Left Match: finds PTR records <strong>starting with</strong> the keyword (e.g. <code>static</code> → <code>static.example.com</code>).</span>
            <span>2. Middle Match: finds PTR records <strong>containing</strong> the keyword anywhere (default).</span>
            <span>3. Right Match: finds PTR records <strong>ending with</strong> the keyword (e.g. <code>.google.com</code> → <code>dns.google.com</code>).</span>
            <span>4. Data is accumulated from rDNS scans. Run an IP / CIDR scan first to populate records.</span>
          </div>
        </div>

        <el-alert v-if="searchError" :title="searchError" type="error" class="rdns-alert">
          <template #icon>
            <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
          </template>
        </el-alert>

        <template v-if="searchResult">
          <div class="rdns-summary">
            <div class="record-cell">
              <span class="record-name">Keyword</span>
              <strong class="record-count">{{ searchResult.data.keyword }}</strong>
            </div>
            <div class="record-cell">
              <span class="record-name">Mode</span>
              <strong class="record-count" style="font-size:16px">{{ searchResult.data.mode }}</strong>
            </div>
            <div class="record-cell">
              <span class="record-name">Results</span>
              <strong class="record-count">{{ searchResult.data.total }}</strong>
            </div>
          </div>

          <div v-if="searchResult.data.records.length" class="rdns-table-wrap">
            <table class="rdns-table">
              <thead>
                <tr>
                  <th>IP</th>
                  <th>PTR</th>
                  <th>Last Scanned</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in searchResult.data.records" :key="`${row.ip}-${row.ptr}`">
                  <td><code class="rdns-code rdns-code-ip">{{ row.ip }}</code></td>
                  <td><code class="rdns-code rdns-code-ptr">{{ row.ptr }}</code></td>
                  <td>{{ new Date(row.scanned_at).toLocaleString() }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="rdns-empty">No PTR records found matching <strong>{{ searchResult.data.keyword }}</strong>.</div>
        </template>
      </template>
      <!-- end PTR Reverse Search tab -->
    </section>

    <blockquote class="privacy-quote">
      <i class="fa-solid fa-shield-halved privacy-quote-icon" aria-hidden="true"></i>
      <span>DNS.NF queries only publicly available DNS data. We do not access private/internal DNS zones, and query targets are processed only to return lookup results.</span>
    </blockquote>
  </section>
</template>

<style scoped>
.rdns-page {
  margin-top: 10px;
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
}

.result-panel {
  border: 1px solid var(--query-line);
  border-radius: 0;
  background: #ffffff;
}

.result-panel h3 {
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #1E293B;
  font-size: 17px;
}

.panel-title-main {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: #1E293B;
  font-weight: 800;
}

.rdns-panel {
  padding: 16px;
}

.rdns-tabs {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--query-line);
  padding-bottom: 0;
}

.rdns-tab-btn {
  border: 1px solid var(--query-line);
  border-bottom: none;
  border-radius: 0;
  background: #f8f9fa;
  color: #64748B;
  font-size: 13px;
  font-weight: 700;
  padding: 8px 16px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-bottom: -1px;
}

.rdns-tab-btn.is-active {
  background: #ffffff;
  color: var(--app-accent);
  border-color: var(--query-line);
  border-bottom-color: #ffffff;
}

.rdns-search-row {
  display: grid;
  grid-template-columns: 1fr 160px 130px;
  gap: 10px;
  margin-top: 0;
}

.rdns-search-select {
  font-size: 14px;
}

.rdns-search-btn {
  width: 100%;
}

.rdns-empty {
  margin-top: 14px;
  padding: 14px;
  border: 1px solid var(--query-line);
  color: #64748B;
  font-size: 13px;
  text-align: center;
}

.dns-search-btn {
  border: 1px solid transparent;
  border-radius: 0;
  background: var(--app-accent);
  color: #f6fffb;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 14px;
  height: 46px;
  width: 100%;
  cursor: pointer;
  transition: filter 0.15s ease, transform 0.15s ease;
}

.dns-search-btn:hover:not(:disabled) {
  filter: brightness(0.94);
  transform: translateY(-1px);
}

.dns-search-btn:disabled {
  cursor: not-allowed;
}

.rdns-form-row {
  margin-top: 0;
  display: grid;
  grid-template-columns: 1fr 170px;
  gap: 10px;
}

.rdns-filter-row {
  margin-top: 10px;
  display: grid;
  grid-template-columns: 1fr 180px 220px;
  gap: 10px;
}

.rdns-quick-row {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.rdns-usage {
  margin-top: 10px;
  border: 1px solid var(--query-line);
  background: #f8f9fa;
  padding: 10px 12px;
}

.rdns-usage-title {
  color: #1E293B;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.rdns-usage-items {
  margin-top: 6px;
  display: grid;
  gap: 4px;
  color: #495057;
  font-size: 13px;
  line-height: 1.5;
}

.rdns-quick-btn {
  border: 1px solid var(--query-line);
  border-radius: 0;
  background: #ffffff;
  color: #64748B;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  padding: 8px 10px;
  text-transform: lowercase;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}

.rdns-quick-btn:hover {
  color: var(--app-accent);
  border-color: var(--app-accent);
}

.rdns-quick-btn.is-active {
  color: var(--app-accent);
  border-color: var(--app-accent);
  background: rgba(76, 154, 255, 0.08);
}

.rdns-quick-clear {
  text-transform: uppercase;
}

.rdns-input {
  min-height: 46px;
  height: 46px;
  border: 1px solid var(--query-line);
  border-radius: 0;
  padding: 0 12px;
  font-size: 16px;
  color: #1E293B;
  background: #fff;
}

.rdns-select {
  min-height: 46px;
  border: 1px solid var(--query-line);
  border-radius: 0;
  padding: 0 10px;
  font-size: 15px;
  color: #1E293B;
  background: #fff;
}

.rdns-input:focus {
  outline: none;
  border-color: var(--app-accent);
  box-shadow: 0 0 0 2px rgba(76, 154, 255, 0.15);
}

.rdns-select:focus {
  outline: none;
  border-color: var(--app-accent);
  box-shadow: 0 0 0 2px rgba(76, 154, 255, 0.15);
}

.rdns-hint {
  margin: 6px 0 8px;
  color: #64748B;
  font-size: 13px;
}

.rdns-alert {
  margin-top: 12px;
}

.rdns-summary {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0;
  border: 1px solid var(--query-line);
  border-radius: 0;
  overflow: hidden;
  background: #ffffff;
}

.rdns-summary .record-cell {
  min-height: 78px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  padding: 10px 12px;
  border-right: 1px solid var(--query-line);
  background: #ffffff;
}

.rdns-summary .record-cell:last-child {
  border-right: 0;
}

.rdns-summary .record-name {
  color: #64748B;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.rdns-summary .record-count {
  color: #1E293B;
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
}

.rdns-summary .record-cell:first-child .record-count {
  font-size: 16px;
  line-height: 1.2;
  word-break: break-all;
}

.rdns-table-wrap {
  margin-top: 12px;
  border: 1px solid var(--query-line);
  border-radius: 0;
  overflow: visible;
}

.rdns-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.rdns-table th,
.rdns-table td {
  border-bottom: 1px solid var(--query-line);
  padding: 10px;
  text-align: left;
  vertical-align: top;
  color: #1E293B;
  word-break: break-word;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(76, 154, 255, 0.35);
  border-radius: 0;
  color: var(--app-accent);
  background: rgba(76, 154, 255, 0.12);
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
}

.rdns-table th {
  background: #F8FAFC;
  font-weight: 700;
}

.muted {
  color: #64748B;
}

.score-badge {
  display: inline-flex;
  min-width: 42px;
  justify-content: center;
  border-radius: 0;
  border: 1px solid var(--query-line);
  padding: 2px 8px;
  font-weight: 600;
}

.score-high {
  color: var(--app-accent);
  border-color: rgba(76, 154, 255, 0.4);
  background: rgba(76, 154, 255, 0.1);
}

.score-mid {
  color: #64748B;
}

.score-low {
  color: #dc3545;
  border-color: rgba(220, 53, 69, 0.35);
  background: rgba(220, 53, 69, 0.1);
}

.status-badge-err {
  color: #dc3545;
  border-color: rgba(220, 53, 69, 0.35);
  background: rgba(220, 53, 69, 0.1);
}

.privacy-quote {
  margin-top: 10px;
}

.rdns-ptr-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.rdns-cname-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.rdns-code {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 8px;
  border: 1px solid var(--query-line);
  border-radius: 0;
  background: #f8f9fa;
  font-family: var(--result-font);
  font-size: 12px;
  line-height: 1.2;
}

.rdns-code-ip {
  color: #1d4ed8;
}

.rdns-code-ptr {
  color: var(--app-accent);
}

.rdns-code-cname {
  color: #495057;
}

@media (max-width: 900px) {
  .rdns-summary {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .rdns-summary .record-cell {
    border-right: 1px solid var(--query-line);
    border-bottom: 1px solid var(--query-line);
  }

  .rdns-summary .record-cell:nth-child(3n) {
    border-right: 0;
  }

  .rdns-summary .record-cell:nth-last-child(-n + 3) {
    border-bottom: 0;
  }
}

@media (max-width: 640px) {
  .rdns-form-row {
    grid-template-columns: 1fr;
  }

  .rdns-filter-row {
    grid-template-columns: 1fr;
  }

  .rdns-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .rdns-summary .record-cell:nth-child(3n) {
    border-right: 1px solid var(--query-line);
  }

  .rdns-summary .record-cell:nth-child(2n) {
    border-right: 0;
  }

  .rdns-summary .record-cell:nth-last-child(-n + 3) {
    border-bottom: 1px solid var(--query-line);
  }

  .rdns-summary .record-cell:nth-last-child(-n + 2) {
    border-bottom: 0;
  }
}
</style>
