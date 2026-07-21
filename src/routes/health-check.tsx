import { createFileRoute } from '@tanstack/react-router'
import { HealthCheckPanel, PageTitle, RelatedGuides, UsageGuide } from '@/components/QueryPanels'
import { seoMeta } from '@/lib/seo'

export const Route = createFileRoute('/health-check')({
  head: () => ({
    meta: seoMeta({
      title: 'DNS Health Check - Domain Configuration Audit | DNS.NF',
      description:
        'Run a DNS health check with DNS.NF. Audit delegation, nameservers, SOA, MX, DNSSEC, SPF, DMARC, and CAA records, and get a weighted health score for any domain.',
      keywords: ['DNS health check', 'domain audit', 'DNS体检', 'DNS健康检查', 'delegation check', 'DNSSEC audit'],
    }),
  }),
  component: Page,
})

function Page() {
  return (
    <div className="space-y-6">
      <PageTitle
        title="Health Check"
        body="Audit a domain's DNS configuration and get a weighted health score."
      />
      <HealthCheckPanel />
      <UsageGuide
        description="The health check audits the full DNS setup of a domain, from parent delegation down to security records, and scores each area."
        points={[
          'Delegation consistency compares NS records served by the parent with those in the zone itself.',
          'Mail checks verify MX hosts resolve and that SPF and DMARC policies exist.',
          'DNSSEC, CAA, and HTTPS records are graded so misconfigurations stand out at a glance.',
        ]}
        tags={['Audit', 'Delegation', 'DNSSEC', 'Best practices']}
      />
      <RelatedGuides category="health-check" />
    </div>
  )
}
