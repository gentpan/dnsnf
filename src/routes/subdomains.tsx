import { createFileRoute } from '@tanstack/react-router'
import { PageTitle, RelatedGuides, SubdomainPanel, UsageGuide } from '@/components/QueryPanels'

export const Route = createFileRoute('/subdomains')({
  component: Page,
})

function Page() {
  return (
    <div className="space-y-6">
      <PageTitle title="Subdomains" body="Collect public subdomain observations from certificate and DNS datasets." />
      <SubdomainPanel />
      <UsageGuide
        description="Subdomain discovery aggregates passive public feeds and keeps hostnames under the target root zone."
        points={[
          'Input should be one root domain such as example.com.',
          'Only in-scope hosts ending with the target root are retained.',
          'Source labels help compare confidence across public datasets.',
        ]}
        tags={['Root-zone Scope', 'Deduplicated Hosts', 'Inventory']}
      />
      <RelatedGuides category="subdomains" />
    </div>
  )
}
