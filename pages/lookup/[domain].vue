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

const target = computed(() => decodeRouteTarget(route.params.domain));
const type = computed<DnsRecordType>(() => {
  const raw = String(route.query.type || "ALL").toUpperCase();
  const supported = ["ALL", "A", "AAAA", "CNAME", "MX", "NS", "PTR", "SOA", "SRV", "TXT", "CAA"];
  return (supported.includes(raw) ? raw : "ALL") as DnsRecordType;
});

useSeoMeta({
  title: () => `DNS.NF | ${target.value}`,
  description: () => `View ${type.value} DNS records for ${target.value}.`
});

const fetchCurrent = async () => {
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
          <DnsForm :loading="store.loading" :result="store.result" mode="result" plain />
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
        description="Route-based lookup mode keeps target and record type in URL for shareable, reproducible diagnostics."
        :points="[
          'Target is parsed from the route path and loaded on page enter.',
          'Record tabs apply type-focused filtering without changing the target context.',
          'Use copy actions for specific record values and raw JSON for exact payload review.',
          'Differences across runs can come from DNS cache expiration and upstream resolver changes.',
        ]"
        :tags="['Route-driven', 'Shareable URL', 'Structured Output', 'Cache-aware']"
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
  border: 1px solid var(--panel-border);
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
