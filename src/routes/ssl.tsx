import { createFileRoute } from '@tanstack/react-router'
import { PageTitle, RelatedGuides, SSLPanel, UsageGuide } from '@/components/QueryPanels'
import { seoMeta } from '@/lib/seo'

export const Route = createFileRoute('/ssl')({
  head: () => ({
    meta: seoMeta({
      title: 'SSL Certificate Checker - TLS Certificate Lookup | DNS.NF',
      description:
        'Check SSL/TLS certificates for any domain or IP with DNS.NF. Inspect issuer, validity dates, days remaining, certificate chain, TLS version, and cipher suite.',
      keywords: ['SSL certificate checker', 'SSL lookup', 'TLS certificate check', 'certificate expiry', 'SSL证书查询', '证书有效期查询'],
    }),
  }),
  component: Page,
})

function Page() {
  return (
    <div className="space-y-6">
      <PageTitle title="SSL Certificate" body="Inspect the TLS certificate, chain, and negotiated security for a domain or IP." />
      <SSLPanel />
      <UsageGuide
        description="SSL inspection connects to the target over TLS and summarizes the presented certificate and handshake."
        points={[
          'The leaf certificate, issuer, validity window, and days remaining are shown first.',
          'Trust is verified against the system root pool; broken or expired chains are reported with the reason.',
          'TLS version, cipher suite, ALPN, and OCSP stapling describe the negotiated connection security.',
        ]}
        tags={['SSL', 'TLS', 'Certificate Chain', 'Expiry']}
      />
      <RelatedGuides category="ssl" />
    </div>
  )
}
