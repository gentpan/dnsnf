<script setup lang="ts">
import type { DnsRecordType } from "~/composables/useDnsLookup";
import { useDnsStore } from "~/stores/dnsStore";

const route = useRoute();
const store = useDnsStore();

const decodeRouteTarget = (raw: unknown) => {
  const value = String(raw || "").trim();
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const target = computed(() => decodeRouteTarget(route.query.domain));
const type = computed<DnsRecordType>(() => {
  const raw = String(route.query.type || "ALL").toUpperCase();
  const supported = ["ALL", "A", "AAAA", "CNAME", "MX", "NS", "PTR", "SOA", "SRV", "TXT", "CAA"];
  return (supported.includes(raw) ? raw : "ALL") as DnsRecordType;
});

useSeoMeta({
  title: () => (target.value ? `DNS Lookup | ${target.value}` : "DNS Lookup | DNS.NF"),
  description: () =>
    target.value
      ? `View ${type.value} DNS records for ${target.value}.`
      : "Query DNS records by domain with structured output.",
});

const clearResult = () => {
  store.result = null;
  store.error = null;
  store.loading = false;
};

const fetchCurrent = async () => {
  if (!target.value) {
    clearResult();
    return;
  }
  await store.fetchLookup(target.value, type.value);
};

onServerPrefetch(fetchCurrent);
onMounted(fetchCurrent);
watch([target, type], fetchCurrent);
</script>

<template>
  <section class="page-container lookup-page">
    <section class="result-panel lookup-panel">
      <h3>
        <span class="panel-title-main"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i> DNS Lookup</span>
      </h3>
      <p class="lookup-hint">Query DNS records by domain and switch record types below.</p>
      <div class="search-form-wrap">
        <ClientOnly>
          <DnsForm
            :loading="store.loading"
            :result="store.result"
            mode="result"
            plain
            lookup-mode="query"
            lookup-path="/dns-lookup"
            lookup-query-key="domain"
          />
        </ClientOnly>
      </div>

      <div class="lookup-result">
        <el-skeleton v-if="store.loading" :rows="8" animated />
        <el-alert v-else-if="store.error" :title="store.error" type="error">
          <template #icon>
            <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
          </template>
        </el-alert>
        <DnsResultCard v-else-if="store.result" :result="store.result" />
      </div>

      <AppUsageGuide
        title="How This Query Works"
        description="DNS Lookup resolves a single target and normalizes records for fast inspection, copy, and API replay."
        :points="[
          'Input accepts one domain target; query type can be switched by record tabs.',
          'TXT-related outputs aggregate TXT/SPF/DMARC/DKIM for operational troubleshooting.',
          'Raw JSON and API URL are designed for repeatable checks in scripts and monitoring.',
          'Results reflect public DNS visibility and may differ by resolver, cache, and timing.',
        ]"
        :tags="['Single Target', 'Record Normalization', 'API Replay', 'Public DNS Scope']"
      />
    </section>

    <blockquote class="privacy-quote">
      <i class="fa-solid fa-shield-halved privacy-quote-icon" aria-hidden="true"></i>
      <span>DNS.NF queries only publicly available DNS data. We do not access private/internal DNS zones, and query targets are processed only to return lookup results.</span>
    </blockquote>
  </section>
</template>

<style scoped>
.lookup-page {
  display: flex;
  flex-direction: column;
}

.lookup-panel {
  border: 1px solid var(--query-line);
  border-radius: 0;
  background: #ffffff;
  padding: 16px;
}

.panel-title-main {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  font-weight: 800;
}

.lookup-hint {
  margin: 6px 0 8px;
  color: #6C757D;
  font-size: 13px;
}

.lookup-result {
  margin-top: 20px;
  font-family: var(--result-font);
}

.privacy-quote {
  margin-top: 10px;
}

.lookup-result :deep(.result-panel h3) {
  font-family: "Poppins", "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif;
}

.lookup-result :deep(.result-row > span),
.lookup-result :deep(.value-title),
.lookup-result :deep(.record-name),
.lookup-result :deep(.reverse-head),
.lookup-result :deep(.value-note) {
  font-family: "Poppins", "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif;
}
</style>
