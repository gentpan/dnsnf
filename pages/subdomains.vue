<script setup lang="ts">
import { $fetch } from 'ofetch'
const route = useRoute();

interface SubdomainRow {
  host: string;
  sources: string[];
}

interface SubdomainResponse {
  code: number;
  data: {
    target: string;
    total: number;
    items: SubdomainRow[];
    sources: string[];
    note: string;
    errors: string[];
  };
  cached: boolean;
  timestamp: number;
}

const domain = ref("");
const loading = ref(false);
const error = ref("");
const result = ref<SubdomainResponse | null>(null);
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
  const value = domain.value.trim().toLowerCase();
  if (!value || loading.value) return;
  loading.value = true;
  error.value = "";
  clearCopied();
  try {
    if (import.meta.client) {
      await navigateTo({ path: "/subdomains", query: { domain: value } }, { replace: true });
    }
    const resp = await $fetch("/api/subdomains", {
      query: { domain: value, limit: 500 },
    });
    result.value = resp;
  } catch (err: unknown) {
    const e = err as { data?: { message?: string }; message?: string };
    error.value = e.data?.message || e.message || "Subdomain lookup failed";
    result.value = null;
  } finally {
    loading.value = false;
  }
};

const copyHost = async (host: string) => {
  await copyText(host, host);
};

const downloadJson = () => {
  if (!result.value) return;
  const filename = `subdomains-${result.value.data.target}-${Date.now()}.json`;
  downloadBlob(filename, JSON.stringify(result.value, null, 2), "application/json;charset=utf-8");
};

const downloadCsv = () => {
  if (!result.value) return;
  const head = "host,sources\n";
  const body = result.value.data.items
    .map((row) => {
      const host = `"${row.host.replace(/"/g, '""')}"`;
      const sources = `"${row.sources.join("|").replace(/"/g, '""')}"`;
      return `${host},${sources}`;
    })
    .join("\n");
  const filename = `subdomains-${result.value.data.target}-${Date.now()}.csv`;
  downloadBlob(filename, `${head}${body}${body ? "\n" : ""}`, "text/csv;charset=utf-8");
};

onMounted(async () => {
  const raw = String(route.query.domain || "").trim();
  if (raw) {
    domain.value = raw;
    await runLookup();
  }
});

useSeoMeta({
  title: "DNS.NF | Find DNS Host Records (Subdomains)",
  description:
    "Find DNS host records (subdomains) for a domain using public datasets with source labels and export options.",
});
</script>

<template>
  <section class="page-container subdomain-page">
    <section class="result-panel subdomain-panel">
      <h3>
        <span class="panel-title-main"><i class="fa-solid fa-sitemap" aria-hidden="true"></i> Find DNS Host Records (Subdomains)</span>
      </h3>

      <p class="subdomain-hint">Best-effort discovery from public sources. Results can be incomplete.</p>

      <div class="subdomain-form-row">
        <input
          v-model="domain"
          class="subdomain-input"
          type="text"
          placeholder="Enter domain, e.g. example.com"
          @keyup.enter="runLookup"
        />
        <button class="subdomain-btn" type="button" :disabled="loading" @click="runLookup">
          <span v-if="loading" class="dns-loading-dot" aria-hidden="true"></span>
          <template v-else>
            <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
            Find Subdomains
          </template>
        </button>
      </div>

      <el-alert v-if="error" :title="error" type="error" class="subdomain-alert">
        <template #icon>
          <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
        </template>
      </el-alert>

      <template v-if="result">
        <div class="subdomain-summary">
          <div class="record-cell"><span class="record-name">Target</span><strong class="record-count">{{ result.data.target }}</strong></div>
          <div class="record-cell"><span class="record-name">Hosts</span><strong class="record-count">{{ result.data.total }}</strong></div>
          <div class="record-cell"><span class="record-name">Sources</span><strong class="record-count">{{ result.data.sources.length }}</strong></div>
          <div class="record-cell"><span class="record-name">Cached</span><strong class="record-count">{{ result.cached ? "Yes" : "No" }}</strong></div>
        </div>

        <div class="subdomain-table-wrap">
          <div class="subdomain-actions">
            <button type="button" class="subdomain-action-btn" title="Download JSON" @click="downloadJson">
              <i class="fa-solid fa-file-arrow-down" aria-hidden="true"></i> JSON
            </button>
            <button type="button" class="subdomain-action-btn" title="Download CSV" @click="downloadCsv">
              <i class="fa-solid fa-table" aria-hidden="true"></i> CSV
            </button>
          </div>
          <table class="subdomain-table">
            <thead>
              <tr>
                <th>Host</th>
                <th>Sources</th>
                <th class="ta-r">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in result.data.items" :key="row.host">
                <td><code class="subdomain-code subdomain-host">{{ row.host }}</code></td>
                <td>
                  <span class="source-list">
                    <span v-for="source in row.sources" :key="`${row.host}-${source}`" class="source-pill">
                      {{ source }}
                    </span>
                  </span>
                </td>
                <td class="ta-r">
                  <CopyIconButton
                    :copied="copiedKey === row.host"
                    copy-title="Copy host"
                    aria-label="Copy host"
                    @click="copyHost(row.host)"
                  />
                </td>
              </tr>
              <tr v-if="result.data.items.length === 0">
                <td colspan="3" class="muted">No host records found from current public sources.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <AppUsageGuide
        title="How This Query Works"
        description="Subdomain discovery aggregates passive public feeds, normalizes hostnames, and removes duplicates under the target root zone."
        :points="[
          'Input should be one root domain (for example example.com).',
          'Only in-scope hosts ending with the target root are retained after normalization.',
          'Source labels indicate where each hostname was observed, useful for confidence scoring.',
          'Use JSON/CSV export for inventory baseline, drift checks, and external enrichment.',
        ]"
        :tags="['Root-zone Scope', 'Deduplicated Hosts', 'Source Labels', 'Inventory Export']"
      />
    </section>

    <blockquote class="privacy-quote">
      <i class="fa-solid fa-shield-halved privacy-quote-icon" aria-hidden="true"></i>
      <span>Subdomain discovery uses public data only and may not be complete.</span>
    </blockquote>
  </section>
</template>

<style scoped>
.subdomain-page {
  margin-top: 10px;
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
}
.subdomain-panel {
  border: 1px solid var(--query-line);
  border-radius: 0;
  background: #ffffff;
  padding: 16px;
}
.panel-title-main {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: #1E293B;
  font-weight: 800;
}
.subdomain-form-row {
  margin-top: 0;
  display: grid;
  grid-template-columns: 1fr 170px;
  gap: 10px;
}
.subdomain-input {
  min-height: 46px;
  height: 46px;
  border: 1px solid var(--query-line);
  border-radius: 0;
  padding: 0 12px;
  font-size: 16px;
  color: #1E293B;
  background: #fff;
}
.subdomain-input:focus {
  outline: none;
  border-color: var(--app-accent);
  box-shadow: 0 0 0 2px rgba(76, 154, 255, 0.15);
}
.subdomain-btn {
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
.subdomain-btn:hover:not(:disabled) {
  filter: brightness(0.94);
}
.subdomain-btn:disabled {
  cursor: not-allowed;
}
.subdomain-hint {
  margin: 6px 0 8px;
  color: #64748B;
  font-size: 13px;
}
.subdomain-alert {
  margin-top: 12px;
}
.subdomain-summary {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0;
  border: 1px solid var(--query-line);
  border-radius: 0;
  overflow: hidden;
}
.subdomain-summary .record-cell {
  min-height: 78px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  padding: 10px 12px;
  border-right: 1px solid var(--query-line);
}
.subdomain-summary .record-cell:last-child {
  border-right: 0;
}
.record-name {
  color: #64748B;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}
.record-count {
  color: #1E293B;
  font-size: 18px;
  font-weight: 700;
}
.subdomain-table-wrap {
  margin-top: 12px;
  border: 1px solid var(--query-line);
  border-radius: 0;
  overflow: visible;
}
.subdomain-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--query-line);
  background: #ffffff;
}
.subdomain-action-btn {
  border: 1px solid var(--query-line);
  border-radius: 0;
  background: #ffffff;
  color: #64748B;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.subdomain-action-btn:hover {
  color: var(--app-accent);
  border-color: var(--app-accent);
}
.subdomain-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.subdomain-table th,
.subdomain-table td {
  border-bottom: 1px solid var(--query-line);
  padding: 10px;
  text-align: left;
  vertical-align: top;
  color: #1E293B;
  word-break: break-word;
}
.subdomain-table th {
  background: #F8FAFC;
  font-weight: 700;
}
.ta-r { text-align: right; }
.subdomain-code {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 8px;
  border: 1px solid var(--query-line);
  border-radius: 0;
  background: #f8f9fa;
}
.subdomain-host { color: #1d4ed8; }
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
  color: #64748B;
  font-size: 12px;
}
.muted { color: #6C757D; }
.privacy-quote {
  margin-top: 10px;
}
@media (max-width: 768px) {
  .subdomain-form-row { grid-template-columns: 1fr; }
  .subdomain-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
