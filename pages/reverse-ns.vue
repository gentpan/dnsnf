<script setup lang="ts">
import { $fetch } from 'ofetch'
const route = useRoute();

interface ReverseNsRow {
  domain: string;
  shared_ns: string[];
  source_ips: string[];
}

interface ReverseNsResponse {
  code: number;
  data: {
    target: string;
    ns: string[];
    source_ips: string[];
    total_candidates: number;
    total_shared: number;
    items: ReverseNsRow[];
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
const result = ref<ReverseNsResponse | null>(null);
const { copiedKey, copyText: copyToClipboard, clearCopied } = useCopyState();

const runLookup = async () => {
  const value = domain.value.trim().toLowerCase();
  if (!value || loading.value) return;
  loading.value = true;
  error.value = "";
  clearCopied();
  try {
    if (import.meta.client) {
      await navigateTo({ path: "/reverse-ns", query: { domain: value } }, { replace: true });
    }
    const resp = await $fetch("/api/reverse-ns", {
      query: { domain: value, limit: 50 },
    });
    result.value = resp;
  } catch (err: unknown) {
    const e = err as { data?: { message?: string }; message?: string };
    error.value = e.data?.message || e.message || "Reverse NS lookup failed";
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
  title: "DNS.NF | Reverse NS",
  description:
    "Find domains sharing the same authoritative DNS servers (NS). Best-effort discovery using public datasets with DNS verification.",
});
</script>

<template>
  <section class="page-container shared-page">
    <section class="result-panel shared-panel">
      <h3>
        <span class="panel-title-main"><i class="fa-solid fa-server" aria-hidden="true"></i> Reverse NS</span>
      </h3>

      <p class="shared-hint">This scans domains that share one or more authoritative NS with your target.</p>

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
            Find Reverse NS
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
          <div class="record-cell"><span class="record-name">Target NS</span><strong class="record-count">{{ result.data.ns.length }}</strong></div>
          <div class="record-cell"><span class="record-name">Candidates</span><strong class="record-count">{{ result.data.total_candidates }}</strong></div>
          <div class="record-cell"><span class="record-name">Matched</span><strong class="record-count">{{ result.data.total_shared }}</strong></div>
          <div class="record-cell"><span class="record-name">Cached</span><strong class="record-count">{{ result.cached ? "Yes" : "No" }}</strong></div>
        </div>

        <div class="shared-list">
          <strong class="list-title">Target NS</strong>
          <span class="pill-list">
            <code v-for="ns in result.data.ns" :key="ns" class="shared-code">{{ ns }}</code>
          </span>
        </div>

        <div class="shared-table-wrap">
          <table class="shared-table">
            <thead>
              <tr>
                <th>Domain</th>
                <th>Shared NS</th>
                <th>Source IPs</th>
                <th class="ta-r">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in result.data.items" :key="row.domain">
                <td><code class="shared-code shared-domain">{{ row.domain }}</code></td>
                <td>
                  <span class="pill-list">
                    <code v-for="ns in row.shared_ns" :key="`${row.domain}-${ns}`" class="shared-code">{{ ns }}</code>
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
                <td colspan="4" class="muted">No reverse NS domains found from current data sources.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <AppUsageGuide
        title="How This Query Works"
        description="Reverse NS identifies domains sharing authoritative name servers with your target through candidate discovery and DNS verification."
        :points="[
          'Step 1: resolve authoritative NS for the target domain.',
          'Step 2: collect candidate domains from reverse IP intelligence on NS infrastructure.',
          'Step 3: re-resolve candidate NS and keep only domains with real NS overlap.',
          'Matched count is strict verification output; candidates reflect pre-verification recall.',
        ]"
        :tags="['Authoritative NS', '3-step Verification', 'Strict Match', 'Infrastructure Correlation']"
      />
    </section>

    <blockquote class="privacy-quote">
      <i class="fa-solid fa-shield-halved privacy-quote-icon" aria-hidden="true"></i>
      <span>Reverse NS results are best-effort from public data plus DNS verification, and may be incomplete.</span>
    </blockquote>
  </section>
</template>

<style scoped>
/* Styles moved to main.css shared section */
</style>
