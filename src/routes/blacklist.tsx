import { createFileRoute } from '@tanstack/react-router'
import { BlacklistPanel, PageTitle, RelatedGuides, UsageGuide } from '@/components/QueryPanels'
import { seoMeta } from '@/lib/seo'

export const Route = createFileRoute('/blacklist')({
  head: () => ({
    meta: seoMeta({
      title: 'IP Blacklist Checker - DNSBL / RBL Lookup | DNS.NF',
      description:
        'Check an IPv4 address against public DNS blocklists with DNS.NF. See which RBL zones list the IP and read the listing reasons.',
      keywords: ['IP blacklist checker', 'RBL lookup', 'DNSBL check', 'spam blacklist check', 'IP黑名单查询'],
    }),
  }),
  component: Page,
})

function Page() {
  return (
    <div className="space-y-6">
      <PageTitle title="Blacklist" body="Check an IPv4 address against public DNS blocklists (RBL/DNSBL)." />
      <BlacklistPanel />
      <UsageGuide
        description="Blacklist checks query DNS-based blocklists using the reversed IP address, the same method mail servers use."
        points={[
          'Each zone is queried in parallel and a positive A record means the IP is listed.',
          'TXT records returned by the zone usually explain the listing reason.',
          'A listing does not always mean abuse; some zones list dynamic or unassigned ranges by policy.',
        ]}
        tags={['RBL', 'DNSBL', 'Spamhaus', 'Reputation']}
      />
      <RelatedGuides category="blacklist" />
    </div>
  )
}
