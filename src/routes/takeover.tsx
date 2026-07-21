import { createFileRoute } from '@tanstack/react-router'
import { PageTitle, RelatedGuides, TakeoverPanel, UsageGuide } from '@/components/QueryPanels'
import { seoMeta } from '@/lib/seo'

export const Route = createFileRoute('/takeover')({
  head: () => ({
    meta: seoMeta({
      title: 'Subdomain Takeover Checker - Dangling CNAME Scan | DNS.NF',
      description:
        'Detect subdomain takeover risks with DNS.NF. Scan discovered subdomains for dangling CNAME records pointing at claimable services like GitHub Pages, Heroku, S3, and Azure.',
      keywords: ['subdomain takeover checker', 'dangling CNAME', 'subdomain takeover scan', '子域名接管检测', 'dangling DNS'],
    }),
  }),
  component: Page,
})

function Page() {
  return (
    <div className="space-y-6">
      <PageTitle
        title="Takeover"
        body="Scan subdomains for dangling CNAME records that could allow subdomain takeover."
      />
      <TakeoverPanel />
      <UsageGuide
        description="A subdomain takeover happens when a CNAME points at a third-party service whose resource was deleted but the DNS record remains."
        points={[
          'Subdomains are discovered from public certificate transparency and DNS datasets, then their CNAME targets are resolved.',
          'A CNAME target that returns NXDOMAIN on a claimable platform (GitHub Pages, Heroku, S3, Azure, and more) is flagged as potentially vulnerable.',
          'Always verify manually on the provider before assuming a target is claimable; fingerprints are heuristic.',
        ]}
        tags={['Takeover', 'Dangling CNAME', 'Security', 'Bug bounty']}
      />
      <RelatedGuides category="takeover" />
    </div>
  )
}
