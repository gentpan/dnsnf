import { createFileRoute } from '@tanstack/react-router'
import { LookupPanel, PageTitle, UsageGuide } from '@/components/QueryPanels'
import { seoMeta } from '@/lib/seo'

export const Route = createFileRoute('/lookup/$domain')({
  head: ({ params }) => ({
    meta: seoMeta({
      title: `${params.domain} DNS Lookup - DNS Records | DNS.NF`,
      description: `Check DNS records for ${params.domain} with DNS.NF, including A, AAAA, MX, NS, TXT, SOA, CAA, PTR, and reverse DNS results.`,
      keywords: [`${params.domain} DNS lookup`, `${params.domain} DNS records`, 'domain DNS lookup', '域名DNS查询'],
    }),
  }),
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
