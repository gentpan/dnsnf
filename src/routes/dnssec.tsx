import { createFileRoute } from '@tanstack/react-router'
import { DnssecPanel, PageTitle, RelatedGuides, UsageGuide } from '@/components/QueryPanels'

export const Route = createFileRoute('/dnssec')({
  component: Page,
})

function Page() {
  return (
    <div className="space-y-6">
      <PageTitle title="DNSSEC" body="Inspect DS, DNSKEY, RRSIG, and NSEC records for a domain." />
      <DnssecPanel />
      <UsageGuide
        description="DNSSEC inspection checks public DNSSEC-related records and summarizes posture."
        points={[
          'DS, DNSKEY, RRSIG, and NSEC records are queried when available.',
          'The score summarizes observed DNSSEC coverage for the target.',
          'Missing records can indicate partial deployment or no DNSSEC support.',
        ]}
        tags={['DS', 'DNSKEY', 'RRSIG', 'DNSSEC Posture']}
      />
      <RelatedGuides category="dnssec" />
    </div>
  )
}
