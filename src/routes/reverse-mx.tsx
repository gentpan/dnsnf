import { createFileRoute } from '@tanstack/react-router'
import { PageTitle, RelatedGuides, SharedPanel, UsageGuide } from '@/components/QueryPanels'

export const Route = createFileRoute('/reverse-mx')({
  component: Page,
})

function Page() {
  return (
    <div className="space-y-6">
      <PageTitle title="Reverse MX" body="Find domains sharing mail exchanger infrastructure with a domain or MX host." />
      <SharedPanel kind="mx" />
      <UsageGuide
        description="Reverse MX performs overlap matching on mail exchanger records."
        points={[
          'Domain input resolves target MX records before correlation.',
          'Candidates are discovered from public infrastructure observations.',
          'Final results keep domains with confirmed shared MX hosts.',
        ]}
        tags={['MX Revalidation', 'Mail Infrastructure', 'Shared Hosts']}
      />
      <RelatedGuides category="reverse-mx" />
    </div>
  )
}
