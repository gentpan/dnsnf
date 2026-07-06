import { createFileRoute } from '@tanstack/react-router'
import { PageTitle, RdnsSearchPanel, RelatedGuides, UsageGuide } from '@/components/QueryPanels'

export const Route = createFileRoute('/rdns')({
  component: Page,
})

function Page() {
  return (
    <div className="space-y-6">
      <PageTitle title="rDNS Search" body="Search stored PTR records collected by the Go API." />
      <RdnsSearchPanel />
      <UsageGuide
        description="rDNS search scans stored PTR records by keyword and match mode."
        points={[
          'Contains, starts-with, and ends-with modes tune how PTR names are matched.',
          'Results map PTR hostnames back to observed IP addresses.',
          'Coverage depends on the stored public PTR dataset.',
        ]}
        tags={['PTR Records', 'Keyword Search', 'Stored Dataset']}
      />
      <RelatedGuides category="rdns" />
    </div>
  )
}
