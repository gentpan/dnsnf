import { createFileRoute } from '@tanstack/react-router'
import { LookupPanel, PageTitle, RelatedGuides, UsageGuide } from '@/components/QueryPanels'

export const Route = createFileRoute('/dns-lookup')({
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
