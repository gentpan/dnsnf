import { createFileRoute } from '@tanstack/react-router'
import { LookupPanel, PageTitle, RelatedGuides, UsageGuide } from '@/components/QueryPanels'

export const Route = createFileRoute('/')({
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
