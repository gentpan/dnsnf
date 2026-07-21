import { createFileRoute } from '@tanstack/react-router'
import { ECSPanel, PageTitle, RelatedGuides, UsageGuide } from '@/components/QueryPanels'
import { seoMeta } from '@/lib/seo'

export const Route = createFileRoute('/ecs')({
  head: () => ({
    meta: seoMeta({
      title: 'EDNS Client Subnet (ECS) Test - GeoDNS Checker | DNS.NF',
      description:
        'Test EDNS Client Subnet behaviour with DNS.NF. See how resolvers answer for client subnets in different regions and detect GeoDNS responses.',
      keywords: ['EDNS client subnet test', 'ECS test', 'GeoDNS checker', 'DNS地理位置测试', 'ECS检测'],
    }),
  }),
  component: Page,
})

function Page() {
  return (
    <div className="space-y-6">
      <PageTitle
        title="ECS Test"
        body="Query a domain with EDNS Client Subnet options from different regions and compare GeoDNS answers."
      />
      <ECSPanel />
      <UsageGuide
        description="EDNS Client Subnet lets recursive resolvers forward part of the client IP so authoritative servers can return location-aware answers."
        points={[
          'Each probe sends the same A query with a different client subnet to ECS-aware resolvers.',
          'The echoed scope shows how much of your subnet the authoritative server used for its decision.',
          'Different answers per region confirm GeoDNS or CDN steering is active for the domain.',
        ]}
        tags={['ECS', 'EDNS', 'GeoDNS', 'CDN']}
      />
      <RelatedGuides category="ecs" />
    </div>
  )
}
