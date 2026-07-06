import { createFileRoute } from '@tanstack/react-router'
import { LookupPanel, PageTitle, RelatedGuides, UsageGuide } from '@/components/QueryPanels'
import { seoMeta } from '@/lib/seo'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: seoMeta({
      title: 'DNS.NF - DNS Lookup Tool, DNS Checker and Nameserver Lookup',
      description:
        'Use DNS.NF as a fast DNS lookup tool and DNS checker. Check A, AAAA, CNAME, MX, NS, TXT, SOA, CAA, PTR, nameservers, DNS propagation, reverse DNS, reverse IP, subdomains, and DNSSEC.',
      keywords: [
        'DNS lookup tool',
        'DNS checker online',
        'DNS propagation checker',
        'DNS record lookup',
        'Check DNS records',
        'check nameservers',
        'nameserver lookup',
        'DNS records checker',
        'DNS.NF',
        '查询DNS记录',
        '域名NS查询',
        '域名解析工具',
        'DNS在线查询',
      ],
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
