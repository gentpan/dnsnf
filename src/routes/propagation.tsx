import { createFileRoute } from '@tanstack/react-router'
import { PageTitle, PropagationPanel, RelatedGuides, UsageGuide } from '@/components/QueryPanels'
import { seoMeta } from '@/lib/seo'

export const Route = createFileRoute('/propagation')({
  head: () => ({
    meta: seoMeta({
      title: 'Global DNS Propagation Checker | DNS.NF',
      description:
        'Check DNS propagation worldwide with DNS.NF. Query A, AAAA, MX, NS, TXT, and more from public resolvers across North America, Europe, and Asia, and compare answer consistency.',
      keywords: ['DNS propagation checker', 'global DNS check', 'DNS传播检测', '全球DNS查询', 'propagation test'],
    }),
  }),
  component: Page,
})

function Page() {
  return (
    <div className="space-y-6">
      <PageTitle
        title="Propagation"
        body="Query a DNS record from public resolvers around the world and compare answers."
      />
      <PropagationPanel />
      <UsageGuide
        description="Propagation checks resolve the same record through independent public resolvers so you can see whether a recent change is visible everywhere."
        points={[
          'Each resolver is queried in parallel over DNS-over-HTTPS and reports answers, TTL, and latency.',
          'Different answers across regions usually mean caches still hold the old record; wait for the old TTL to expire.',
          'Consistent answers everywhere mean the change has fully propagated.',
        ]}
        tags={['Propagation', 'DoH', 'Resolvers', 'TTL']}
      />
      <RelatedGuides category="propagation" />
    </div>
  )
}
