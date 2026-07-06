import { createFileRoute } from '@tanstack/react-router'
import { LookupPanel, PageTitle, RelatedGuides, UsageGuide } from '@/components/QueryPanels'
import { seoMeta } from '@/lib/seo'

export const Route = createFileRoute('/dns-lookup')({
  head: () => ({
    meta: seoMeta({
      title: 'DNS Lookup - Check A, AAAA, MX, NS, TXT, SOA, CAA Records | DNS.NF',
      description:
        'Check DNS records online with DNS.NF. Query A, AAAA, CNAME, MX, NS, TXT, SOA, CAA, SRV, PTR, and ALL records from one clean DNS lookup console.',
      keywords: ['DNS lookup', 'DNS records lookup', 'A record lookup', 'MX lookup', 'TXT lookup', 'DNS记录查询'],
    }),
  }),
  component: Page,
})

function Page() {
  return (
    <div className="space-y-6">
      <PageTitle title="DNS Lookup" body="Run focused DNS queries for common record types." />
      <LookupPanel />
      <UsageGuide
        description="DNS Lookup resolves one target and returns normalized record groups."
        points={[
          'Use ALL for a complete DNS overview, or pick a focused record type.',
          'TXT, MX, CAA, and SOA records are formatted for readable operational review.',
          'Responses are available through the same public API used by this console.',
        ]}
        tags={['Record Types', 'Readable Output', 'API-backed']}
      />
      <RelatedGuides category="dns-lookup" />
    </div>
  )
}
