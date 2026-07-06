import { createFileRoute } from '@tanstack/react-router'
import { LookupPanel, PageTitle, RelatedGuides, UsageGuide } from '@/components/QueryPanels'
import { seoMeta } from '@/lib/seo'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: seoMeta({
      title: 'DNS.NF - DNS Lookup, Reverse DNS, Reverse IP, Subdomain Finder',
      description:
        'Run fast DNS lookups for A, AAAA, MX, NS, TXT, SOA, CAA, and PTR records, plus reverse DNS, reverse IP, subdomain discovery, and DNSSEC checks.',
      keywords: ['DNS.NF', 'DNS lookup tool', 'DNS checker online', '域名解析工具', 'DNS在线查询'],
    }),
  }),
  component: Home,
})

function Home() {
  return (
    <div className="space-y-6">
      <PageTitle title="DNS Lookup" body="Query DNS records, reverse DNS, and CIDR rDNS scans through the Go API." />
      <LookupPanel />
      <UsageGuide
        description="DNS Lookup resolves a single target and normalizes records for fast inspection, copy, and API replay."
        points={[
          'Input accepts one domain, IP address, or IPv4 CIDR target.',
          'Record type can be switched between ALL, A, AAAA, MX, NS, TXT, SOA, CAA, SRV, and PTR.',
          'Results reflect public DNS visibility and may differ by resolver, cache, and timing.',
        ]}
        tags={['Single Target', 'Record Normalization', 'Public DNS Scope']}
      />
      <RelatedGuides category="dns-lookup" />
    </div>
  )
}
