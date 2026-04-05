<script setup lang="ts">
const route = useRoute()

type BannerContent = {
  title: string
  subtitle: string
  pills: string[]
}

const byPath = (path: string): BannerContent => {
  if (path === '/rdns') {
    return {
      title: 'Scan reverse DNS by IPv4 or CIDR',
      subtitle: 'Run concurrent PTR lookups, filter by keyword mode, and inspect hint + score per IP.',
      pills: ['PTR', 'CNAME', 'CIDR', 'LEFT', 'MIDDLE', 'RIGHT', 'SCORE', 'HINT'],
    }
  }
  if (path === '/reverse-ip') {
    return {
      title: 'Discover domains mapped to one IPv4',
      subtitle: 'Reverse IP uses public datasets plus DNS checks to return domain candidates and sources.',
      pills: ['REVERSE IP', 'A', 'SOURCES', 'TOTAL', 'EXPORT', 'JSON', 'CSV'],
    }
  }
  if (path === '/reverse-ns') {
    return {
      title: 'Find domains sharing authoritative NS',
      subtitle: 'Resolve target NS and list domains that overlap on authoritative nameservers.',
      pills: ['NS', 'AUTHORITATIVE', 'SHARED NS', 'CANDIDATES', 'MATCHED'],
    }
  }
  if (path === '/reverse-mx') {
    return {
      title: 'Find domains sharing MX mail servers',
      subtitle: 'Resolve target MX records and discover domains using the same mail infrastructure.',
      pills: ['MX', 'MAIL', 'SHARED MX', 'CANDIDATES', 'MATCHED'],
    }
  }
  if (path === '/subdomains') {
    return {
      title: 'Discover public host records under a domain',
      subtitle: 'Subdomain lookup aggregates public sources and returns exportable host records.',
      pills: ['SUBDOMAIN', 'HOST', 'SOURCES', 'TOTAL', 'EXPORT', 'JSON', 'CSV'],
    }
  }
  if (path === '/docs') {
    return {
      title: 'Read API coverage and query rules',
      subtitle: 'See endpoint parameters, limits, examples, and response structures for all DNS.NF features.',
      pills: ['API', 'DNS', 'RDNS', 'REVERSE', 'DNSSEC', 'TOKENS', 'LIMITS'],
    }
  }
  if (path === '/dns-lookup' || path.startsWith('/lookup/')) {
    return {
      title: 'Query DNS records instantly with DNS.NF',
      subtitle: 'Query A/AAAA/CNAME/MX/NS/TXT/SOA/SRV/CAA/PTR records from a single domain or IP input.',
      pills: ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'PTR', 'TXT', 'CAA', 'SOA', 'SRV'],
    }
  }
  if (path === '/') {
    return {
      title: 'Query DNS records instantly with DNS.NF',
      subtitle: 'Lookup domain and IP records with clean outputs and focused query tools.',
      pills: ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'PTR', 'TXT', 'CAA', 'SOA', 'SRV', 'RDNS'],
    }
  }

  return {
    title: 'Query DNS data with DNS.NF',
    subtitle: 'Use DNS lookup, reverse tools, and API endpoints for fast diagnostics.',
    pills: ['DNS', 'RDNS', 'REVERSE', 'API'],
  }
}

const banner = computed(() => byPath(route.path))
</script>

<template>
  <section class="page-container site-announce-wrap">
    <div class="site-announce">
      <span class="site-announce-title">
        {{ banner.title }}
      </span>
      <span class="site-announce-subtitle">
        {{ banner.subtitle }}
      </span>
      <div class="site-types">
        <span
          v-for="pill in banner.pills"
          :key="pill"
          class="app-pill"
        >
          {{ pill }}
        </span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.site-announce-wrap {
  margin: 14px auto 0;
}

.site-announce {
  width: 100%;
  min-height: 124px;
  border: 1px solid #A3CFBB;
  background: #D1E7DD;
  border-radius: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  justify-content: center;
  margin-bottom: 0;
  color: #0A3622;
  font-size: 16px;
  font-weight: 400;
  padding: 14px 18px;
}

.site-announce-title {
  line-height: 1.2;
  font-weight: 700;
}

.site-announce-subtitle {
  color: #0A3622;
  font-size: 14px;
  text-align: center;
  line-height: 1.4;
  font-weight: 400;
}

.site-types {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
}

.site-types .app-pill {
  border-color: #0A3622;
  background: rgba(255, 255, 255, 0.72);
  color: #0A3622;
  font-weight: 600;
}

@media (max-width: 640px) {
  .site-announce {
    min-height: 66px;
    font-size: 15px;
    padding: 0 10px;
    text-align: center;
  }

  .site-types {
    gap: 6px;
  }

  .site-announce-subtitle {
    font-size: 13px;
  }
}
</style>
