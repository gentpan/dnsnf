import { createFileRoute } from '@tanstack/react-router'
import { PageTitle, RelatedGuides, SharedPanel, UsageGuide } from '@/components/QueryPanels'

export const Route = createFileRoute('/reverse-ns')({
  component: Page,
})

function Page() {
  return (
    <div className="space-y-6">
      <PageTitle title="Shared NS" body="Discover domains that share name-server infrastructure with a target." />
      <SharedPanel kind="ns" />
      <UsageGuide
        description="Reverse NS identifies domains sharing authoritative name servers with your target."
        points={[
          'The target domain is resolved to its authoritative NS set.',
          'Candidate domains are gathered from public infrastructure observations.',
          'Final matches keep domains with confirmed name-server overlap.',
        ]}
        tags={['Authoritative NS', 'Infrastructure Correlation', 'Verified Overlap']}
      />
      <RelatedGuides category="reverse-ns" />
    </div>
  )
}
