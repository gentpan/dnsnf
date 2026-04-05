<script setup lang="ts">
import { $fetch } from 'ofetch'
const route = useRoute();

interface ReverseIpRow {
  domain: string;
  sources: string[];
}

interface ReverseIpResponse {
  code: number;
  data: {
    ip: string;
    total: number;
    domains: ReverseIpRow[];
    sources: string[];
    completeness: string;
    note: string;
    errors: string[];
  };
  cached: boolean;
  timestamp: number;
  message?: string;
}

const ip = ref("");
const loading = ref(false);
const error = ref("");
const result = ref<ReverseIpResponse | null>(null);
const { copiedKey, copyText, clearCopied } = useCopyState(1400);

const downloadBlob = (filename: string, content: string, type: string) => {
  if (!import.meta.client) return;
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const runLookup = async () => {
  const value = ip.value.trim();
  if (!value || loading.value) return;

  loading.value = true;
  error.value = "";
  clearCopied();
  try {
    if (import.meta.client) {
      await navigateTo({ path: "/reverse-ip", query: { ip: value } }, { replace: true });
    }
    const resp = await $fetch("/api/reverse-ip", {
      query: { ip: value },
    });
    result.value = resp;
  } catch (err: unknown) {
    const e = err as { data?: { message?: string }; message?: string };
    error.value = e.data?.message || e.message || "Reverse IP lookup failed";
    result.value = null;
  } finally {
    loading.value = false;
  }
};

const copyDomain = async (domain: string) => {
  await copyText(domain, domain);
};

const downloadJson = () => {
  if (!result.value) return;
  const filename = `reverse-ip-${result.value.data.ip}-${Date.now()}.json`;
  const payload = JSON.stringify(result.value, null, 2);
  downloadBlob(filename, payload, "application/json;charset=utf-8");
};

const downloadCsv = () => {
  if (!result.value) return;
  const rows = result.value.data.domains;
  const head = "domain,sources\n";
  const body = rows
    .map((row) => {
      const domain = `"${row.domain.replace(/"/g, '""')}"`;
      const sources = `"${row.sources.join("|").replace(/"/g, '""')}"`;
      return `${domain},${sources}`;
    })
    .join("\n");
  const csv = `${head}${body}${body ? "\n" : ""}`;
  const filename = `reverse-ip-${result.value.data.ip}-${Date.now()}.csv`;
  downloadBlob(filename, csv, "text/csv;charset=utf-8");
};

onMounted(async () => {
  const raw = String(route.query.ip || "").trim();
  if (raw) {
    ip.value = raw;
    await runLookup();
  }
});

useSeoMeta({
  title: "DNS.NF | Reverse IP Lookup",
  description:
    "Reverse IP lookup for IPv4 targets. Find publicly indexed domains that resolve to an IP, with source labels.",
});
</script>

<template>
  <section class="page-container reverse-page">
    <section class="result-panel reverse-panel">
      <h3>
        <span class="panel-title-main"><i class="fa-solid fa-link" aria-hidden="true"></i> Reverse IP Lookup</span>
      </h3>

      <p class="reverse-hint">This uses public datasets and returns best-effort reverse mappings.</p>

      <div class="reverse-form-row">
        <input
          v-model="ip"
          class="reverse-input"
          type="text"
          placeholder="Enter IPv4, e.g. 8.8.8.8"
          @keyup.enter="runLookup"
        />
        <button class="reverse-btn" type="button" :disabled="loading" @click="runLookup">
          <span v-if="loading" class="dns-loading-dot" aria-hidden="true"></span>
          <template v-else>
            <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
            Lookup Domains
          </template>
        </button>
      </div>

      <el-alert v-if="error" :title="error" type="error" class="reverse-alert">
        <template #icon>
          <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
        </template>
      </el-alert>

      <template v-if="result">
        <div class="reverse-summary">
          <div class="record-cell"><span class="record-name">Target</span><strong class="record-count">{{ result.data.ip }}</strong></div>
          <div class="record-cell"><span class="record-name">Domains</span><strong class="record-count">{{ result.data.total }}</strong></div>
          <div class="record-cell"><span class="record-name">Sources</span><strong class="record-count">{{ result.data.sources.length }}</strong></div>
          <div class="record-cell"><span class="record-name">Cached</span><strong class="record-count">{{ result.cached ? "Yes" : "No" }}</strong></div>
        </div>

        <div class="reverse-table-wrap">
          <div v-if="result.data.errors.length > 0" class="reverse-source-errors">
            <strong>Data source errors:</strong>
            <ul>
              <li v-for="(errMsg, idx) in result.data.errors" :key="`src-err-${idx}`">{{ errMsg }}</li>
            </ul>
          </div>
          <div class="reverse-actions">
            <button type="button" class="reverse-action-btn" title="Download JSON" @click="downloadJson">
              <i class="fa-solid fa-file-arrow-down" aria-hidden="true"></i>
              JSON
            </button>
            <button type="button" class="reverse-action-btn" title="Download CSV" @click="downloadCsv">
              <i class="fa-solid fa-table" aria-hidden="true"></i>
              CSV
            </button>
          </div>
          <table class="reverse-table">
            <thead>
              <tr>
                <th>Domain</th>
                <th>Sources</th>
                <th class="ta-r">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in result.data.domains" :key="row.domain">
                <td><code class="reverse-code">{{ row.domain }}</code></td>
                <td>
                  <span class="source-list">
                    <span v-for="source in row.sources" :key="`${row.domain}-${source}`" class="source-pill">
                      {{ source }}
                    </span>
                  </span>
                </td>
                <td class="ta-r">
                  <CopyIconButton
                    :copied="copiedKey === row.domain"
                    copy-title="Copy domain"
                    aria-label="Copy domain"
                    @click="copyDomain(row.domain)"
                  />
                </td>
              </tr>
              <tr v-if="result.data.domains.length === 0">
                <td colspan="3" class="muted">No domains found in current public sources.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <AppUsageGuide
        title="How This Query Works"
        description="Reverse IP correlates one IPv4 to candidate domains using passive public datasets, then returns normalized source labels."
        :points="[
          'Input supports IPv4 only; each query builds a merged candidate list from external public providers.',
          'Source count indicates dataset agreement, not strict DNS authority confidence.',
          'Data source errors reveal rate limits or upstream unavailability during that request window.',
          'Use JSON/CSV export for downstream validation and historical diff workflows.',
        ]"
        :tags="['IPv4', 'Passive Datasets', 'Source Trace', 'Export-ready']"
      />
    </section>

    <blockquote class="privacy-quote">
      <i class="fa-solid fa-shield-halved privacy-quote-icon" aria-hidden="true"></i>
      <span>Reverse IP lookup results come from public datasets and may be incomplete or delayed.</span>
    </blockquote>
  </section>
</template>

<style scoped>
.reverse-page {
  margin-top: 10px;
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
}

.reverse-panel {
  border: 1px solid var(--query-line);
  border-radius: 0;
  background: #ffffff;
  padding: 16px;
}

.reverse-panel h3 {
  margin: 0;
  color: #212529;
  font-size: 17px;
}

.panel-title-main {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: #212529;
  font-weight: 800;
}

.reverse-form-row {
  margin-top: 0;
  display: grid;
  grid-template-columns: 1fr 170px;
  gap: 10px;
}

.reverse-input {
  min-height: 46px;
  height: 46px;
  border: 1px solid var(--query-line);
  border-radius: 0;
  padding: 0 12px;
  font-size: 16px;
  color: #212529;
  background: #fff;
}

.reverse-input:focus {
  outline: none;
  border-color: var(--app-accent);
  box-shadow: 0 0 0 2px rgba(114, 191, 128, 0.15);
}

.reverse-btn {
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
}

.reverse-btn:hover:not(:disabled) {
  filter: brightness(0.94);
}

.reverse-btn:disabled {
  cursor: not-allowed;
}

.reverse-hint {
  margin: 6px 0 8px;
  color: #6C757D;
  font-size: 13px;
}

.reverse-alert {
  margin-top: 12px;
}

.reverse-summary {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0;
  border: 1px solid var(--query-line);
  border-radius: 0;
  overflow: hidden;
  background: #ffffff;
}

.reverse-summary .record-cell {
  min-height: 78px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  padding: 10px 12px;
  border-right: 1px solid var(--query-line);
}

.reverse-summary .record-cell:last-child {
  border-right: 0;
}

.reverse-summary .record-name {
  color: #6C757D;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.reverse-summary .record-count {
  color: #212529;
  font-size: 18px;
  font-weight: 700;
}

.reverse-table-wrap {
  margin-top: 12px;
  border: 1px solid var(--query-line);
  border-radius: 0;
  overflow: visible;
}

.reverse-source-errors {
  border-bottom: 1px solid #f2d3ab;
  background: #fff7ed;
  color: #9a3412;
  padding: 8px 10px;
  font-size: 12px;
}

.reverse-source-errors ul {
  margin: 6px 0 0;
  padding-left: 16px;
}

.reverse-source-errors li {
  line-height: 1.4;
}

.reverse-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--query-line);
  background: #ffffff;
}

.reverse-action-btn {
  border: 1px solid var(--query-line);
  border-radius: 0;
  background: #ffffff;
  color: #6C757D;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.reverse-action-btn:hover {
  color: var(--app-accent);
  border-color: var(--app-accent);
}

.reverse-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.reverse-table th,
.reverse-table td {
  border-bottom: 1px solid var(--query-line);
  padding: 10px;
  text-align: left;
  vertical-align: top;
  color: #212529;
  word-break: break-word;
}

.reverse-table th {
  background: #F8F9FA;
  font-weight: 700;
}

.ta-r {
  text-align: right;
}

.reverse-code {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 8px;
  border: 1px solid var(--query-line);
  border-radius: 0;
  background: #f8f9fa;
  color: #1d4ed8;
}

.source-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.source-pill {
  border: 1px solid var(--query-line);
  border-radius: 0;
  background: #f8f9fa;
  padding: 2px 6px;
  color: #6C757D;
  font-size: 12px;
}

.muted {
  color: #6C757D;
}

:global(html[data-theme="dark"]) .reverse-source-errors {
  border-bottom-color: #5b3a12;
  background: #2a1d10;
  color: #fbbf24;
}

.privacy-quote {
  margin-top: 10px;
}

@media (max-width: 768px) {
  .reverse-form-row {
    grid-template-columns: 1fr;
  }

  .reverse-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .reverse-summary .record-cell {
    border-right: 1px solid var(--query-line);
    border-bottom: 1px solid var(--query-line);
  }

  .reverse-summary .record-cell:nth-child(2n) {
    border-right: 0;
  }

  .reverse-summary .record-cell:nth-last-child(-n + 2) {
    border-bottom: 0;
  }
}
</style>
