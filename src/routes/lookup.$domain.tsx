import { createFileRoute } from '@tanstack/react-router'
import { LookupPanel, PageTitle, UsageGuide } from '@/components/QueryPanels'

export const Route = createFileRoute('/lookup/$domain')({
  component: Page,
})

function Page() {
  const { domain } = Route.useParams()
  return (
    <div className="space-y-6">
      <PageTitle title={`Lookup ${domain}`} body="Preloaded domain lookup route." />
      <LookupPanel initialTarget={domain} />
      <UsageGuide
        description="This route preloads a target into the standard DNS lookup workflow."
        points={[
          'The query target is taken from the URL so checks can be shared directly.',
          'Changing the record type reuses the same public lookup endpoint.',
          'Results reflect current public resolver visibility and cache timing.',
        ]}
        tags={['Shareable URL', 'Preloaded Target', 'Public DNS Scope']}
      />
    </div>
  )
}
