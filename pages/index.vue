<script setup lang="ts">
const rdnsTarget = ref('')
const reverseIpTarget = ref('')
const reverseNsTarget = ref('')
const reverseMxTarget = ref('')
const subdomainTarget = ref('')
const heroTypes = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'PTR', 'TXT', 'CAA', 'SOA', 'SRV', 'RDNS']

type HeroStats = {
  query_projects: number
  today_requests: number
  total_queries: number
  today_visitors: number
  updated_at: number
}

const emptyStats: HeroStats = { query_projects: 0, today_requests: 0, total_queries: 0, today_visitors: 0, updated_at: 0 }
const { data: statsRes } = await useFetch<{ code: number; data: HeroStats }>('/api/stats/overview', {
  default: () => ({ code: 0, data: emptyStats }),
})

const heroStats = computed(() => statsRes.value?.data || emptyStats)
const formatMetric = (value: number) => new Intl.NumberFormat('en-US').format(Math.max(0, Number(value) || 0))

const submitRDNS = async () => {
  const target = rdnsTarget.value.trim()
  if (!target) return
  await navigateTo(`/rdns?target=${encodeURIComponent(target)}`)
}

const submitReverseIP = async () => {
  const target = reverseIpTarget.value.trim()
  if (!target) return
  await navigateTo(`/reverse-ip?ip=${encodeURIComponent(target)}`)
}

const submitReverseNs = async () => {
  const target = reverseNsTarget.value.trim().toLowerCase()
  if (!target) return
  await navigateTo(`/reverse-ns?domain=${encodeURIComponent(target)}`)
}

const submitReverseMx = async () => {
  const target = reverseMxTarget.value.trim().toLowerCase()
  if (!target) return
  await navigateTo(`/reverse-mx?domain=${encodeURIComponent(target)}`)
}

const submitSubdomains = async () => {
  const target = subdomainTarget.value.trim().toLowerCase()
  if (!target) return
  await navigateTo(`/subdomains?domain=${encodeURIComponent(target)}`)
}

useSeoMeta({
  title: "DNS.NF - DNS Lookup, rDNS, Reverse IP/NS/MX, Subdomains & DNSSEC",
  description:
    "DNS.NF provides DNS lookup, rDNS CIDR scanning, reverse IP/NS/MX discovery, subdomain search, DNSSEC checks, and DNS history APIs.",
  ogTitle: "DNS.NF - DNS Lookup, rDNS, Reverse IP/NS/MX, Subdomains & DNSSEC",
  ogDescription:
    "Fast DNS tools with structured output: standard records, rDNS scanner, reverse datasets, DNSSEC validation, and API token quota control.",
  twitterTitle: "DNS.NF - DNS Lookup, rDNS, Reverse IP/NS/MX, Subdomains & DNSSEC",
  twitterDescription:
    "Query domains and IPs with DNS lookup, rDNS, reverse IP/NS/MX, subdomains, DNSSEC, and DNS history in one workspace."
})
</script>

<template>
  <section class="page-container">
    <div class="hero">
      <div class="hero-top">
        <div class="hero-copy">
          <h1 class="hero-title">
            <svg class="hero-icon" width="40" height="40" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="m40 26h-32c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h32c1.1 0 2-.9 2-2v-12c0-1.1-.9-2-2-2zm-26 12c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4zm26-32h-32c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h32c1.1 0 2-.9 2-2v-12c0-1.1-.9-2-2-2zm-26 12c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z"></path>
            </svg>
            <span class="hero-title-main">DNS.NF</span>
            <span class="hero-title-sub-inline">Unified DNS Intelligence Workspace</span>
          </h1>
          <div class="hero-scope">
            <h3><i class="fa-solid fa-terminal" aria-hidden="true"></i> Query Scope</h3>
            <div class="hero-scope-layout">
              <div class="hero-scope-main">
                <p class="hero-desc">
                  One workspace for DNS lookup, reverse discovery, and DNS security checks.
                </p>
                <ul>
                  <li><span>Domain</span><strong>A / AAAA / CNAME / MX / NS / TXT / CAA / SOA / SRV</strong></li>
                  <li><span>IP / CIDR</span><strong>PTR lookup and rDNS CIDR scan</strong></li>
                  <li><span>Reverse Discovery</span><strong>Reverse IP, Reverse NS, Reverse MX, Subdomains</strong></li>
                  <li><span>Security</span><strong>DNSSEC, DNS history</strong></li>
                </ul>
                <div class="hero-types">
                  <span
                    v-for="type in heroTypes"
                    :key="type"
                    class="app-pill"
                  >
                    {{ type }}
                  </span>
                </div>
              </div>
              <aside class="hero-stats" aria-label="Site statistics">
                <div class="hero-stat-card">
                  <span class="hero-stat-label">Tools</span>
                  <strong class="hero-stat-value">{{ formatMetric(heroStats.query_projects) }}</strong>
                </div>
                <div class="hero-stat-card">
                  <span class="hero-stat-label">Requests Today</span>
                  <strong class="hero-stat-value">{{ formatMetric(heroStats.today_requests) }}</strong>
                </div>
                <div class="hero-stat-card">
                  <span class="hero-stat-label">Total Queries</span>
                  <strong class="hero-stat-value">{{ formatMetric(heroStats.total_queries) }}</strong>
                </div>
                <div class="hero-stat-card">
                  <span class="hero-stat-label">Visitors Today</span>
                  <strong class="hero-stat-value">{{ formatMetric(heroStats.today_visitors) }}</strong>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>

      <div class="hero-footer hero-notes">
        <span><i class="fa-solid fa-square" aria-hidden="true"></i> DNS + reverse datasets in one workflow</span>
        <span><i class="fa-solid fa-square" aria-hidden="true"></i> Structured cards, hint scoring, and query filters</span>
        <span><i class="fa-solid fa-square" aria-hidden="true"></i> JSON output, export actions, and token-aware API access</span>
      </div>
    </div>

    <section class="dns-home-box">
      <div class="dns-home-head">
        <h3><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i> DNS Lookup</h3>
        <span>Domain and IP record query</span>
      </div>
      <div class="search-form-wrap">
        <ClientOnly>
          <DnsForm />
        </ClientOnly>
      </div>
    </section>

    <section class="tool-box rdns-home-box">
      <div class="tool-head rdns-home-head">
        <h3><i class="fa-solid fa-satellite-dish" aria-hidden="true"></i> rDNS Scanner</h3>
        <span>Dedicated reverse DNS lookup and CIDR scan result page</span>
      </div>
      <div class="tool-form-card rdns-form-card">
        <div class="tool-row rdns-home-row">
          <input
            v-model="rdnsTarget"
            type="text"
            class="tool-input rdns-home-input"
            placeholder="Enter IPv4 or CIDR, e.g. 8.8.8.8 or 213.230.74.0/24"
            @keyup.enter="submitRDNS"
          />
          <button type="button" class="tool-btn rdns-home-btn" @click="submitRDNS">
            <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
            Scan rDNS
          </button>
        </div>
      </div>
    </section>

    <section class="tool-box reverseip-home-box">
      <div class="tool-head reverseip-home-head">
        <h3><i class="fa-solid fa-link" aria-hidden="true"></i> Reverse IP Lookup</h3>
        <span>Find public domains that point to a single IPv4</span>
      </div>
      <div class="tool-form-card reverseip-form-card">
        <div class="tool-row reverseip-home-row">
          <input
            v-model="reverseIpTarget"
            type="text"
            class="tool-input reverseip-home-input"
            placeholder="Enter IPv4, e.g. 8.8.8.8"
            @keyup.enter="submitReverseIP"
          />
          <button type="button" class="tool-btn reverseip-home-btn" @click="submitReverseIP">
            <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
            Lookup Domains
          </button>
        </div>
      </div>
    </section>

    <section class="tool-box sharedns-home-box">
      <div class="tool-head sharedns-home-head">
        <h3><i class="fa-solid fa-server" aria-hidden="true"></i> Reverse NS</h3>
        <span>Discover domains that share the same authoritative NS</span>
      </div>
      <div class="tool-form-card sharedns-form-card">
        <div class="tool-row sharedns-home-row">
          <input
            v-model="reverseNsTarget"
            type="text"
            class="tool-input sharedns-home-input"
            placeholder="Enter domain, e.g. example.com"
            @keyup.enter="submitReverseNs"
          />
          <button type="button" class="tool-btn sharedns-home-btn" @click="submitReverseNs">
            <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
            Find Reverse NS
          </button>
        </div>
      </div>
    </section>

    <section class="tool-box reversemx-home-box">
      <div class="tool-head reversemx-home-head">
        <h3><i class="fa-solid fa-envelope" aria-hidden="true"></i> Reverse MX</h3>
        <span>Discover domains that share the same MX mail servers</span>
      </div>
      <div class="tool-form-card reversemx-form-card">
        <div class="tool-row reversemx-home-row">
          <input
            v-model="reverseMxTarget"
            type="text"
            class="tool-input reversemx-home-input"
            placeholder="Enter domain, e.g. example.com"
            @keyup.enter="submitReverseMx"
          />
          <button type="button" class="tool-btn reversemx-home-btn" @click="submitReverseMx">
            <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
            Find Reverse MX
          </button>
        </div>
      </div>
    </section>

    <section class="tool-box subdomain-home-box">
      <div class="tool-head subdomain-home-head">
        <h3><i class="fa-solid fa-sitemap" aria-hidden="true"></i> Find DNS Host Records (Subdomains)</h3>
        <span>Discover public subdomains for a target domain</span>
      </div>
      <div class="tool-form-card subdomain-form-card">
        <div class="tool-row subdomain-home-row">
          <input
            v-model="subdomainTarget"
            type="text"
            class="tool-input subdomain-home-input"
            placeholder="Enter domain, e.g. example.com"
            @keyup.enter="submitSubdomains"
          />
          <button type="button" class="tool-btn subdomain-home-btn" @click="submitSubdomains">
            <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
            Find Subdomains
          </button>
        </div>
      </div>
    </section>

    <section class="home-extra">
      <div class="home-section">
        <div class="home-section-head">
          <h3><i class="fa-solid fa-circle-info" aria-hidden="true"></i> How DNS.NF Works</h3>
          <span>What to use it for and how to read results</span>
        </div>
        <div class="info-grid">
          <article class="info-card">
            <h4>What It Does</h4>
            <p>Lookup DNS records for domains and IPs in one place.</p>
          </article>
          <article class="info-card">
            <h4>Typical Use Cases</h4>
            <p>Propagation checks, mail troubleshooting, and DNS debugging.</p>
          </article>
          <article class="info-card">
            <h4>Service Scope</h4>
            <p>Fast lookup, grouped results, copy actions, and raw JSON.</p>
          </article>
          <article class="info-card">
            <h4>Data Completeness</h4>
            <p>Only publicly resolvable DNS data is returned.</p>
          </article>
        </div>
      </div>
    </section>

    <blockquote class="privacy-quote">
      <i class="fa-solid fa-shield-halved privacy-quote-icon" aria-hidden="true"></i>
      <span>DNS.NF queries only publicly available DNS data. We do not access private/internal DNS zones, and query targets are processed only to return lookup results.</span>
    </blockquote>
  </section>
</template>

<style scoped>
.page-container {
  margin: 20px auto 10px;
  display: flex;
  flex-direction: column;
}

.privacy-quote {
  margin-top: 10px;
}

.hero {
  margin-bottom: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  align-items: start;
  position: relative;
  overflow: hidden;
  border: 1px solid #A3CFBB;
  border-radius: 0;
  background: linear-gradient(180deg, #D1E7DD 0%, #C7E0D3 100%);
  padding: 24px 22px;
}

.hero::before {
  content: none;
}

.hero::after {
  content: none;
}

.hero-copy {
  position: relative;
  z-index: 1;
}

.hero-top,
.hero-footer {
  position: relative;
  z-index: 1;
}

.hero-top {
  display: grid;
  grid-template-columns: 1fr;
  gap: 22px;
  align-items: start;
}

.hero-title {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 38px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: 0.2px;
  color: #0A3622;
}

.hero-title-main {
  display: inline-block;
}

.hero-title-sub-inline {
  margin-left: 8px;
  font-size: 16px;
  line-height: 1.2;
  font-weight: 400;
  color: #0A3622;
}

.hero-icon {
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  flex: 0 0 auto;
  display: block;
  color: #0A3622;
}

.hero-icon path {
  fill: currentColor;
}

.hero-subtitle {
  margin-top: 14px;
  font-size: 30px;
  color: #005172;
  font-weight: 600;
}

.hero-desc {
  margin-top: 12px;
  max-width: 640px;
  font-size: 17px;
  line-height: 1.55;
  color: #495057;
}

.hero-copy {
  color: #495057;
}

.hero-scope {
  margin-top: 14px;
  border: 1px solid #8DB9A1;
  background: #EAF3EE;
  padding: 16px;
  display: grid;
  gap: 12px;
}

.hero-scope-layout {
  display: grid;
  grid-template-columns: 1fr 240px;
  gap: 14px;
  align-items: start;
}

.hero-scope h3 {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #0A3622;
  font-size: 22px;
  font-weight: 700;
}

.hero-scope-main {
  display: grid;
  gap: 10px;
}

.hero-scope ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
}

.hero-scope li {
  display: grid;
  grid-template-columns: 132px minmax(0, 1fr);
  gap: 10px;
  align-items: baseline;
}

.hero-scope li span {
  color: #0A3622;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.hero-scope li strong {
  color: #495057;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
}

.hero-types {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.hero-types .app-pill {
  border-color: #8DB9A1;
  background: #F2F8F4;
  color: #0A3622;
  font-weight: 600;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.hero-stat-card {
  border: 1px solid #A3CFBB;
  background: #F2F8F4;
  min-height: 76px;
  padding: 10px;
  display: grid;
  align-content: center;
  gap: 4px;
}

.hero-stat-label {
  color: #0A3622;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.hero-stat-value {
  color: #0A3622;
  font-size: 28px;
  line-height: 1;
  font-weight: 800;
}

.hero-notes {
  margin-top: 14px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
  gap: 8px 14px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
  border-top: 1px solid #A3CFBB;
  padding-top: 12px;
}

.hero-notes span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #495057;
  font-size: 12px;
  line-height: 1.3;
  font-weight: 500;
  white-space: nowrap;
}

.hero-notes i {
  color: #0A3622;
  font-size: 10px;
}

.home-extra {
  margin-top: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.dns-home-box {
  margin-top: 0;
  border: 1px solid var(--panel-border);
  border-radius: 0;
  background: #ffffff;
  padding: 16px;
}

.dns-home-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.dns-home-head h3 {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  color: var(--app-accent);
}

.dns-home-head span {
  font-size: 13px;
  color: #6C757D;
}




















































.tool-box,
.rdns-home-box,
.reverseip-home-box,
.sharedns-home-box,
.reversemx-home-box,
.subdomain-home-box {
  margin-top: 0;
  border: 1px solid var(--panel-border);
  border-radius: 0;
  background: #ffffff;
  padding: 16px;
}

.tool-head,
.rdns-home-head,
.reverseip-home-head,
.sharedns-home-head,
.reversemx-home-head,
.subdomain-home-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.tool-head h3,
.rdns-home-head h3,
.reverseip-home-head h3,
.sharedns-home-head h3,
.reversemx-home-head h3,
.subdomain-home-head h3 {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  color: var(--app-accent);
}

.tool-head span,
.rdns-home-head span,
.reverseip-home-head span,
.sharedns-home-head span,
.reversemx-home-head span,
.subdomain-home-head span {
  font-size: 13px;
  color: #6C757D;
}

.tool-row,
.rdns-home-row,
.reverseip-home-row,
.sharedns-home-row,
.reversemx-home-row,
.subdomain-home-row {
  display: grid;
  grid-template-columns: 1fr 170px;
  gap: 12px;
}

.tool-form-card,
.rdns-form-card,
.reverseip-form-card,
.sharedns-form-card,
.reversemx-form-card,
.subdomain-form-card {
  border: 0;
  border-radius: 0;
  background: transparent;
  padding: 0;
}

.tool-input,
.rdns-home-input,
.reverseip-home-input,
.sharedns-home-input,
.reversemx-home-input,
.subdomain-home-input {
  width: 100%;
  min-height: 44px;
  border: 1px solid var(--panel-border);
  border-radius: 0;
  padding: 0 12px;
  font-size: 15px;
  color: #212529;
  background: #ffffff;
}

.tool-input:focus,
.rdns-home-input:focus,
.reverseip-home-input:focus,
.sharedns-home-input:focus,
.reversemx-home-input:focus,
.subdomain-home-input:focus {
  outline: none;
  border-color: var(--app-accent);
  box-shadow: 0 0 0 2px rgba(114, 191, 128, 0.15);
}

.tool-btn,
.rdns-home-btn,
.reverseip-home-btn,
.sharedns-home-btn,
.reversemx-home-btn,
.subdomain-home-btn {
  justify-self: stretch;
  width: 100%;
  min-height: 44px;
  border: 1px solid transparent;
  border-radius: 0;
  background: var(--app-accent);
  color: #f6fffb;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: filter 0.15s ease, transform 0.15s ease;
}

.tool-btn:hover,
.rdns-home-btn:hover,
.reverseip-home-btn:hover,
.sharedns-home-btn:hover,
.reversemx-home-btn:hover,
.subdomain-home-btn:hover {
  filter: brightness(0.94);
  transform: translateY(-1px);
}

.home-section {
  border: 1px solid var(--panel-border);
  border-radius: 0;
  background: #ffffff;
  padding: 18px;
}

.home-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.home-section-head h3 {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--app-accent);
  font-size: 18px;
}

.home-section-head span {
  color: #6C757D;
  font-size: 13px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.info-card {
  border: 1px solid var(--panel-border);
  border-radius: 0;
  background: #fbfdff;
  padding: 10px 11px;
}

.info-card h4 {
  margin: 0 0 6px;
  color: #6C757D;
  font-size: 14px;
  line-height: 1.2;
  font-weight: 700;
}

.info-card p {
  margin: 0;
  color: #6C757D;
  font-size: 13px;
  line-height: 1.45;
}

.page-container > * + * {
  margin-top: 10px;
}

.dns-home-box :deep(.dns-form-card),
.dns-home-box :deep(.el-card),
.dns-home-box :deep(.el-card__body),
.dns-home-box :deep(.el-input__wrapper),
.dns-home-box :deep(.dns-form-type),
.dns-home-box :deep(.dns-search-btn),
.dns-home-box :deep(.dns-quick-item),
.dns-home-box :deep(.dns-quick-link),
.dns-home-box :deep(.dns-quick-remove) {
  border-radius: 0;
}

.dns-home-box :deep(.dns-form-card),
.dns-home-box :deep(.el-card) {
  box-shadow: none;
}

:global(html[data-theme="dark"]) .hero {
  border-color: var(--panel-border);
  background: #151515;
}

:global(html[data-theme="dark"]) .hero-scope {
  border-color: var(--panel-border);
  background: #1A1A1A;
}

:global(html[data-theme="dark"]) .hero-scope h3,
:global(html[data-theme="dark"]) .hero-scope li span,
:global(html[data-theme="dark"]) .hero-types .app-pill {
  color: var(--app-accent);
}

:global(html[data-theme="dark"]) .hero-scope li strong,
:global(html[data-theme="dark"]) .hero-notes span,
:global(html[data-theme="dark"]) .hero-stat-value {
  color: #EBEBEB;
}

:global(html[data-theme="dark"]) .hero-types .app-pill,
:global(html[data-theme="dark"]) .hero-stat-card {
  border-color: var(--panel-border);
  background: #151515;
}

:global(html[data-theme="dark"]) .hero-stat-label {
  color: #99A1AF;
}

:global(html[data-theme="dark"]) .hero-notes {
  border-top-color: var(--panel-border);
}

:global(html[data-theme="dark"]) .hero-notes i {
  color: var(--app-accent);
}

@media (max-width: 640px) {
  .hero {
    grid-template-columns: 1fr;
    gap: 14px;
    padding: 18px 14px;
  }

  .hero-top {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .hero-title {
    font-size: 28px;
  }

  .hero-title-sub-inline {
    margin-left: 6px;
    font-size: 13px;
  }

  .hero-icon {
    width: 28px;
    height: 28px;
    min-width: 28px;
    min-height: 28px;
  }

  .hero-subtitle {
    font-size: 20px;
  }

  .hero-desc {
    margin-top: 10px;
    font-size: 15px;
  }

  .hero-notes {
    margin-top: 12px;
    flex-wrap: nowrap;
    gap: 8px 14px;
    justify-content: flex-start;
  }

  .hero-scope {
    min-height: 0;
    padding: 12px;
  }

  .hero-scope h3 {
    font-size: 17px;
  }

  .hero-scope li {
    grid-template-columns: 96px minmax(0, 1fr);
  }

  .hero-scope li strong {
    font-size: 12px;
  }

  .hero-scope-layout {
    grid-template-columns: 1fr;
  }

  .hero-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hero-stat-card {
    min-height: 64px;
  }

  .hero-stat-value {
    font-size: 22px;
  }

  .home-section-head {
    flex-wrap: wrap;
  }

  
  
  
  
  
  .dns-home-head {
    flex-wrap: wrap;
  }

  
  
  
  
  
  .rdns-home-input,
  
  
  
  
  
  
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
