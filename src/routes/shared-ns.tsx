import { createFileRoute } from '@tanstack/react-router'
import { PageTitle, RelatedGuides, SharedPanel, UsageGuide } from '@/components/QueryPanels'

export const Route = createFileRoute('/shared-ns')({
  component: Page,
})

function Page() {
  return (
    <div className="space-y-6">
      <PageTitle title="Shared NS" body="Alias route for reverse NS discovery." />
      <SharedPanel kind="ns" />
      <UsageGuide
        description="Shared NS finds domains that overlap with the target's authoritative name-server infrastructure."
        points={[
          'The target domain is resolved to its NS set before correlation.',
          'Public candidate data is rechecked through DNS verification.',
          'Matched domains indicate shared infrastructure, not ownership.',
        ]}
        tags={['NS Overlap', 'DNS Verification', 'Correlation']}
      />
      <RelatedGuides category="reverse-ns" />
    </div>
  )
}
