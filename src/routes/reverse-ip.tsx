import { createFileRoute } from '@tanstack/react-router'
import { PageTitle, RelatedGuides, ReverseIpPanel, UsageGuide } from '@/components/QueryPanels'
import { seoMeta } from '@/lib/seo'

export const Route = createFileRoute('/reverse-ip')({
  head: () => ({
    meta: seoMeta({
      title: 'Reverse IP Lookup - Find Domains on the Same IP | DNS.NF',
      description:
        'Use DNS.NF reverse IP lookup to find domains observed on the same IPv4 address and investigate shared hosting, infrastructure, and domain relationships.',
      keywords: ['reverse IP lookup', 'same IP domains', 'IP domain lookup', '反向IP查询', '同IP域名查询'],
    }),
  }),
  component: Page,
})

function Page() {
  return (
    <div className="space-y-6">
      <PageTitle title="Reverse IP" body="Find domains observed on the same IPv4 address using public datasets." />
      <ReverseIpPanel />
      <UsageGuide
        description="Reverse IP correlates one IPv4 address to candidate domains using passive public datasets."
        points={[
          'Input supports IPv4 targets only.',
          'Source labels indicate where each domain was observed.',
          'Results are best-effort and may be incomplete or delayed.',
        ]}
        tags={['IPv4', 'Passive Datasets', 'Source Labels']}
      />
      <RelatedGuides category="reverse-ip" />
    </div>
  )
}
