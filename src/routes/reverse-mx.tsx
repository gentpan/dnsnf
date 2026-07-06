import { createFileRoute } from '@tanstack/react-router'
import { PageTitle, RelatedGuides, SharedPanel, UsageGuide } from '@/components/QueryPanels'
import { seoMeta } from '@/lib/seo'

export const Route = createFileRoute('/reverse-mx')({
  head: () => ({
    meta: seoMeta({
      title: 'Reverse MX Lookup - Find Shared Mail Infrastructure | DNS.NF',
      description:
        'Find domains sharing MX mail servers with DNS.NF reverse MX lookup. Review mail routing relationships and email infrastructure overlap.',
      keywords: ['reverse MX lookup', 'MX lookup', 'shared mail servers', '反向MX查询', '邮件服务器查询'],
    }),
  }),
  component: Page,
})

function Page() {
  return (
    <div className="space-y-6">
      <PageTitle title="Reverse MX" body="Find domains sharing mail exchanger infrastructure with a domain or MX host." />
      <SharedPanel kind="mx" />
      <UsageGuide
        description="Reverse MX performs overlap matching on mail exchanger records."
        points={[
          'Domain input resolves target MX records before correlation.',
          'Candidates are discovered from public infrastructure observations.',
          'Final results keep domains with confirmed shared MX hosts.',
        ]}
        tags={['MX Revalidation', 'Mail Infrastructure', 'Shared Hosts']}
      />
      <RelatedGuides category="reverse-mx" />
    </div>
  )
}
