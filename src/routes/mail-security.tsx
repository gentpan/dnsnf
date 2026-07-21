import { createFileRoute } from '@tanstack/react-router'
import { MailSecurityPanel, PageTitle, RelatedGuides, UsageGuide } from '@/components/QueryPanels'
import { seoMeta } from '@/lib/seo'

export const Route = createFileRoute('/mail-security')({
  head: () => ({
    meta: seoMeta({
      title: 'SPF, DKIM, DMARC Checker - Mail Security Lookup | DNS.NF',
      description:
        'Verify SPF, DKIM, DMARC, MTA-STS, TLS-RPT, and BIMI records for a domain with DNS.NF. Expand SPF includes, count DNS lookups, and read policy warnings.',
      keywords: ['SPF checker', 'DKIM lookup', 'DMARC checker', 'mail security check', 'SPF查询', 'DMARC查询', 'DKIM查询'],
    }),
  }),
  component: Page,
})

function Page() {
  return (
    <div className="space-y-6">
      <PageTitle title="Mail Security" body="Validate SPF, DKIM, DMARC, MTA-STS, TLS-RPT, and BIMI for a domain." />
      <MailSecurityPanel />
      <UsageGuide
        description="Mail security checks read the DNS policies that receivers use to verify your senders."
        points={[
          'SPF is expanded recursively, including nested includes, with the RFC 7208 limit of 10 DNS lookups enforced.',
          'DMARC tags are parsed into policy, subdomain policy, coverage, and reporting addresses.',
          'DKIM requires a selector; without one, common selectors are probed and the first match is shown.',
        ]}
        tags={['SPF', 'DKIM', 'DMARC', 'MTA-STS', 'BIMI']}
      />
      <RelatedGuides category="mail-security" />
    </div>
  )
}
