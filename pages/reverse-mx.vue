<script setup lang="ts">
import { $fetch } from 'ofetch'
const route = useRoute();

interface ReverseMxRow {
  domain: string;
  shared_mx: string[];
  source_ips: string[];
}

interface ReverseMxResponse {
  code: number;
  data: {
    target: string;
    input_mode?: "domain" | "mx_host";
    mx: string[];
    source_ips: string[];
    total_candidates: number;
    total_shared: number;
    items: ReverseMxRow[];
    note: string;
    errors: string[];
  };
  cached: boolean;
  timestamp: number;
  message?: string;
}

const domain = ref("");
const loading = ref(false);
const error = ref("");
const result = ref<ReverseMxResponse | null>(null);
const { copiedKey, copyText: copyToClipboard, clearCopied } = useCopyState();

const runLookup = async () => {
  const value = domain.value.trim().toLowerCase();
  if (!value || loading.value) return;
  loading.value = true;
  error.value = "";
  clearCopied();
  try {
    if (import.meta.client) {
      await navigateTo({ path: "/reverse-mx", query: { domain: value } }, { replace: true });
    }
    const resp = await $fetch("/api/reverse-mx", {
      query: { domain: value, limit: 50 },
    });
    result.value = resp;
  } catch (err: unknown) {
    const e = err as { data?: { message?: string }; message?: string };
    error.value = e.data?.message || e.message || "Reverse MX lookup failed";
    result.value = null;
  } finally {
    loading.value = false;
  }
};

const copyDomain = async (value: string) => {
  await copyToClipboard(value, value);
};

onMounted(async () => {
  const raw = String(route.query.domain || "").trim();
  if (raw) {
    domain.value = raw;
    await runLookup();
  }
});

useSeoMeta({
  title: "DNS.NF | Reverse MX",
  description:
    "Find domains sharing the same MX mail servers. Best-effort discovery using public datasets with DNS MX verification.",
});
</script>

<template>
  <section class="page-container shared-page">
    <section class="result-panel shared-panel">
      <h3>
        <span class="panel-title-main"><i class="fa-solid fa-envelope" aria-hidden="true"></i> Reverse MX</span>
      </h3>

      <p class="shared-hint">Enter a domain or an MX host (e.g. hzmx01.xmail.ntesmail.com). We verify shared MX from public datasets.</p>

      <div class="shared-form-row">
        <input
          v-model="domain"
          class="shared-input"
          type="text"
          placeholder="Enter domain, e.g. example.com"
          @keyup.enter="runLookup"
        />
        <button class="shared-btn" type="button" :disabled="loading" @click="runLookup">
          <span v-if="loading" class="dns-loading-dot" aria-hidden="true"></span>
          <template v-else>
            <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
            Find Reverse MX
          </template>
        </button>
      </div>

      <el-alert v-if="error" :title="error" type="error" class="shared-alert">
        <template #icon>
          <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
        </template>
      </el-alert>

      <template v-if="result">
        <div class="shared-summary">
          <div class="record-cell"><span class="record-name">Target</span><strong class="record-count">{{ result.data.target }}</strong></div>
          <div class="record-cell"><span class="record-name">Target MX</span><strong class="record-count">{{ result.data.mx.length }}</strong></div>
          <div class="record-cell"><span class="record-name">Candidates</span><strong class="record-count">{{ result.data.total_candidates }}</strong></div>
          <div class="record-cell"><span class="record-name">Matched</span><strong class="record-count">{{ result.data.total_shared }}</strong></div>
          <div class="record-cell"><span class="record-name">Cached</span><strong class="record-count">{{ result.cached ? "Yes" : "No" }}</strong></div>
        </div>

        <div class="shared-list">
          <strong class="list-title">
            Target MX
            <span class="mode-tag">{{ result.data.input_mode === "mx_host" ? "MX Host Mode" : "Domain Mode" }}</span>
          </strong>
          <span class="pill-list">
            <code v-for="mx in result.data.mx" :key="mx" class="shared-code">{{ mx }}</code>
          </span>
        </div>

        <div class="shared-table-wrap">
          <div v-if="result.data.errors.length > 0" class="shared-source-errors">
            <strong>Data source errors:</strong>
            <ul>
              <li v-for="(errMsg, idx) in result.data.errors" :key="`mx-src-err-${idx}`">{{ errMsg }}</li>
            </ul>
          </div>
          <table class="shared-table">
            <thead>
              <tr>
                <th>Domain</th>
                <th>Shared MX</th>
                <th>Source IPs</th>
                <th class="ta-r">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in result.data.items" :key="row.domain">
                <td><code class="shared-code shared-domain">{{ row.domain }}</code></td>
                <td>
                  <span class="pill-list">
                    <code v-for="mx in row.shared_mx" :key="`${row.domain}-${mx}`" class="shared-code">{{ mx }}</code>
                  </span>
                </td>
                <td>
                  <span class="pill-list">
                    <code v-for="ip in row.source_ips" :key="`${row.domain}-${ip}`" class="shared-code shared-ip">{{ ip }}</code>
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
              <tr v-if="result.data.items.length === 0">
                <td colspan="4" class="muted">No reverse MX domains found from current data sources.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <AppUsageGuide
        title="How This Query Works"
        description="Reverse MX supports Domain Mode and MX Host Mode, then performs verified overlap matching on mail exchanger records."
        :points="[
          'Domain input resolves target MX set directly; MX host input enters MX Host Mode automatically.',
          'Candidates are discovered from reverse IP sources tied to MX host infrastructure.',
          'Final results keep only domains with confirmed shared MX hosts after DNS revalidation.',
          'When matched stays zero, review source errors: this usually indicates passive-source coverage limits.',
        ]"
        :tags="['Domain/MX Host Modes', 'MX Revalidation', 'Source Diagnostics', 'Higher Recall']"
      />
    </section>

    <blockquote class="privacy-quote">
      <i class="fa-solid fa-shield-halved privacy-quote-icon" aria-hidden="true"></i>
      <span>Reverse MX results are best-effort from public data plus DNS verification, and may be incomplete.</span>
    </blockquote>
  </section>
</template>

<style scoped>
/* Shared page styles moved to main.css */

.mode-tag {
  margin-left: 8px;
  border: 1px solid var(--query-line);
  background: #ffffff;
  color: #64748B;
  padding: 1px 7px;
  font-size: 11px;
  font-weight: 700;
}

.shared-source-errors {
  border-bottom: 1px solid #f2d3ab;
  background: #fff7ed;
  color: #9a3412;
  padding: 8px 10px;
  font-size: 12px;
}

.shared-source-errors ul {
  margin: 6px 0 0;
  padding-left: 16px;
}

.shared-source-errors li {
  line-height: 1.4;
}

:global(html[data-theme="dark"]) .mode-tag {
  border-color: var(--panel-border);
  background: #151515;
  color: #EBEBEB;
}

:global(html[data-theme="dark"]) .shared-source-errors {
  border-bottom-color: #5b3a12;
  background: #2a1d10;
  color: #fbbf24;
}
</style>
