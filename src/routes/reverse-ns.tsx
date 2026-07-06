import { createFileRoute } from '@tanstack/react-router'
import { PageTitle, RelatedGuides, SharedPanel, UsageGuide } from '@/components/QueryPanels'
import { seoMeta } from '@/lib/seo'

export const Route = createFileRoute('/reverse-ns')({
  head: () => ({
    meta: seoMeta({
      title: 'Reverse NS Lookup - Find Domains Sharing Nameservers | DNS.NF',
      description:
        'Discover domains that share authoritative nameserver infrastructure with a target domain using DNS.NF reverse NS lookup.',
      keywords: ['reverse NS lookup', 'shared nameservers', 'nameserver lookup', '反向NS查询', '共享NS查询'],
    }),
  }),
  component: Page,
})

function Page() {
  return (
    <div className="space-y-6">
      <PageTitle title="Shared NS" body="Discover domains that share name-server infrastructure with a target." />
      <SharedPanel kind="ns" />
      <UsageGuide
        description="Reverse NS identifies domains sharing authoritative name servers with your target."
        points={[
          'The target domain is resolved to its authoritative NS set.',
          'Candidate domains are gathered from public infrastructure observations.',
          'Final matches keep domains with confirmed name-server overlap.',
        ]}
        tags={['Authoritative NS', 'Infrastructure Correlation', 'Verified Overlap']}
      />
      <RelatedGuides category="reverse-ns" />
    </div>
  )
}
