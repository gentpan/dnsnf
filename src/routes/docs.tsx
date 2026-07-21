import { createFileRoute, Link } from '@tanstack/react-router'
import { AlertTriangle, BadgeCheck, BookOpen, Database, Globe, Globe2, HeartPulse, Layers3, MailCheck, Radar, Route as RouteIcon, Search, ShieldCheck, ShieldX, TerminalSquare, type LucideIcon } from 'lucide-react'
import { Badge, Card, CardContent, CardHeader } from '@/components/ui'
import { PageTitle } from '@/components/QueryPanels'
import { seoMeta } from '@/lib/seo'

export const Route = createFileRoute('/docs')({
  head: () => ({
    meta: seoMeta({
      title: 'DNS.NF Docs - DNS Lookup, Reverse DNS, Subdomain, DNSSEC Guide',
      description:
        'DNS.NF documentation for using DNS lookup, reverse DNS, reverse IP, subdomain discovery, reverse NS, reverse MX, DNSSEC, result interpretation, and public data limits.',
      keywords: ['DNS.NF docs', 'DNS documentation', 'DNS lookup help', 'DNS工具文档', 'DNS查询说明'],
    }),
  }),
  component: Page,
})

const queryDocs = [
  {
    title: 'DNS Lookup',
    href: '/dns-lookup',
    icon: Search,
    body: 'Use this for direct DNS record checks, resolver visibility, mail routing review, TXT verification, and quick operational troubleshooting.',
    tags: ['A', 'AAAA', 'MX', 'NS', 'TXT', 'SOA', 'CAA'],
  },
  {
    title: 'Reverse IP',
    href: '/reverse-ip',
    icon: Globe2,
    body: 'Use this to discover domains observed on the same IPv4 address. Results are useful for shared hosting, infrastructure mapping, and surface review.',
    tags: ['IPv4', 'Shared Hosting', 'Passive Data'],
  },
  {
    title: 'Subdomains',
    href: '/subdomains',
    icon: Layers3,
    body: 'Use this to collect public subdomain observations under a root domain and build a cleaner asset inventory.',
    tags: ['Inventory', 'Hostnames', 'Sources'],
  },
  {
    title: 'Reverse NS / MX',
    href: '/reverse-ns',
    icon: Database,
    body: 'Use these tools to find domains sharing authoritative nameservers or mail exchangers with a target domain.',
    tags: ['Nameservers', 'Mail Routing', 'Overlap'],
  },
  {
    title: 'rDNS Search',
    href: '/rdns',
    icon: BookOpen,
    body: 'Use rDNS search to match PTR names by keyword and map host naming patterns back to observed IP addresses.',
    tags: ['PTR', 'Hostname', 'Keyword'],
  },
  {
    title: 'DNSSEC',
    href: '/dnssec',
    icon: ShieldCheck,
    body: 'Use DNSSEC checks to inspect DS, DNSKEY, RRSIG, and NSEC records and understand whether a domain has DNSSEC coverage.',
    tags: ['DS', 'DNSKEY', 'RRSIG', 'NSEC'],
  },
  {
    title: 'SSL Certificate',
    href: '/ssl',
    icon: BadgeCheck,
    body: 'Use SSL checks to inspect the TLS certificate of a domain or IP, including issuer, validity dates, chain trust, TLS version, and cipher suite.',
    tags: ['SSL', 'TLS', 'Certificate', 'Expiry'],
  },
  {
    title: 'Mail Security',
    href: '/mail-security',
    icon: MailCheck,
    body: 'Use mail security checks to validate SPF, DKIM, DMARC, MTA-STS, TLS-RPT, and BIMI, including SPF include expansion and lookup counting.',
    tags: ['SPF', 'DKIM', 'DMARC', 'BIMI'],
  },
  {
    title: 'Blacklist',
    href: '/blacklist',
    icon: ShieldX,
    body: 'Use blacklist checks to see whether an IPv4 address is listed on public DNS blocklists and read the listing reasons.',
    tags: ['RBL', 'DNSBL', 'Reputation'],
  },
  {
    title: 'Propagation',
    href: '/propagation',
    icon: Globe,
    body: 'Use propagation checks to query a record from public resolvers across North America, Europe, and Asia, and confirm whether a recent change is visible everywhere.',
    tags: ['Propagation', 'DoH', 'TTL'],
  },
  {
    title: 'Health Check',
    href: '/health-check',
    icon: HeartPulse,
    body: 'Use health checks to audit delegation consistency, nameserver reachability and diversity, SOA timers, MX resolution, and security records such as DNSSEC, SPF, DMARC, and CAA.',
    tags: ['Audit', 'Delegation', 'DNSSEC'],
  },
  {
    title: 'ECS Test',
    href: '/ecs',
    icon: Radar,
    body: 'Use ECS tests to see how resolvers answer for client subnets in different regions, check echoed scopes, and detect GeoDNS steering.',
    tags: ['ECS', 'EDNS', 'GeoDNS'],
  },
  {
    title: 'Takeover',
    href: '/takeover',
    icon: AlertTriangle,
    body: 'Use takeover scans to find subdomains whose CNAME records point at deleted third-party resources that could be claimed by an attacker.',
    tags: ['Takeover', 'Dangling CNAME', 'Security'],
  },
]

const recordDocs = [
  ['A / AAAA', 'Maps a domain to IPv4 or IPv6 addresses. Use it to confirm website and service routing.'],
  ['CNAME', 'Shows alias targets. Use it to understand hosted services, CDN targets, and chained names.'],
  ['MX', 'Shows mail exchangers and priority. Use it to debug email routing and provider configuration.'],
  ['NS', 'Shows authoritative nameservers. Use it to confirm delegation and DNS hosting.'],
  ['TXT', 'Stores verification and policy text, including SPF, DMARC, DKIM selectors, and ownership checks.'],
  ['SOA', 'Shows zone authority metadata such as primary nameserver, serial, refresh, retry, and expiry values.'],
  ['CAA', 'Limits which certificate authorities may issue TLS certificates for a domain.'],
  ['PTR', 'Maps IP addresses back to hostnames. Use it for reverse DNS and infrastructure naming review.'],
  ['HTTPS / SVCB', 'Service binding records with protocol hints and ECH config. Increasingly used by browsers and CDNs.'],
  ['DS / DNSKEY / TLSA / SSHFP / NAPTR', 'Security and advanced record types for DNSSEC, DANE, SSH fingerprint, and naming authority checks.'],
]

const faq = [
  ['Why can results differ from another DNS tool?', 'DNS answers can vary by resolver, cache timing, geography, delegation changes, and public data source coverage.'],
  ['Are empty results always proof that a record does not exist?', 'No. Empty results mean DNS.NF did not receive a usable public answer for that query and record type at that time.'],
  ['Does DNS.NF require an API key?', 'The public API does not require an API key and is rate limited to 60 requests per minute per client.'],
  ['What data does DNS.NF query?', 'DNS.NF uses live DNS queries plus public/passive datasets for discovery-style features such as reverse IP and subdomain search.'],
]

function Page() {
  return (
    <div className="space-y-6">
      <PageTitle
        title="DNS.NF Docs"
        eyebrow="DNS.NF docs"
        badge="Guide"
        badgeTone="zinc"
        body="Practical guidance for choosing the right DNS query, reading results, and understanding public data limits."
      />

      <Card>
        <CardHeader className="bg-zinc-50/60">
          <div className="text-sm font-medium">Start Here</div>
          <div className="mt-1 text-xs leading-5 text-zinc-500">A short path for using the console without guessing which tool to open first.</div>
        </CardHeader>
        <CardContent className="grid gap-3">
          <GuideStep
            icon={RouteIcon}
            title="Choose the query by question"
            body="Use DNS Lookup for direct records, Reverse IP for shared IPv4 hosts, Subdomains for inventory, and Reverse NS/MX for infrastructure overlap."
          />
          <GuideStep
            icon={BookOpen}
            title="Read empty results carefully"
            body="No rows means DNS.NF did not receive a usable public answer from the selected resolver or public source at that time."
          />
          <GuideStep
            icon={TerminalSquare}
            title="Automate with the API"
            body="The Public API page mirrors the console endpoints and includes a live request builder plus cURL, JavaScript, Python, Go, PHP, and Java examples."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-zinc-50/60">
          <div className="text-sm font-medium">Choose a Query</div>
          <div className="mt-1 text-xs leading-5 text-zinc-500">Start from the question you are trying to answer.</div>
        </CardHeader>
        <CardContent className="grid gap-3">
          {queryDocs.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.title}
                to={item.href}
                className="block rounded-lg border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 hover:bg-zinc-50"
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-sky-100 bg-sky-50">
                    <Icon className="h-4 w-4 text-sky-600" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-semibold tracking-normal text-zinc-950">{item.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-zinc-600">{item.body}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5 pl-12">
                  {item.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              </Link>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-zinc-50/60">
          <div className="text-sm font-medium">Record Types</div>
          <div className="mt-1 text-xs leading-5 text-zinc-500">Common DNS records and what they usually mean.</div>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white">
            {recordDocs.map(([name, body]) => (
              <div key={name} className="grid gap-2 p-4 sm:grid-cols-[120px_1fr]">
                <div className="font-mono text-sm font-medium text-zinc-950">{name}</div>
                <p className="text-sm leading-6 text-zinc-600">{body}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-zinc-50/60">
          <div className="text-sm font-medium">Result Notes</div>
        </CardHeader>
        <CardContent className="grid gap-3">
          <p className="text-sm leading-6 text-zinc-600">
            DNS.NF is designed for public DNS visibility. Discovery results are best-effort and can be incomplete, delayed, or different from private resolver views.
          </p>
          <p className="text-sm leading-6 text-zinc-600">
            For automation, use the dedicated <Link to="/api" className="font-medium text-zinc-950 underline underline-offset-4">Public API</Link> page. It contains request builders, response examples, and language snippets.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-zinc-50/60">
          <div className="text-sm font-medium">FAQ</div>
        </CardHeader>
        <CardContent className="grid gap-3">
          {faq.map(([question, answer]) => (
            <div key={question} className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="text-sm font-semibold tracking-normal text-zinc-950">{question}</div>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{answer}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function GuideStep({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon
  title: string
  body: string
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-zinc-200 bg-white p-4">
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50">
        <Icon className="h-4 w-4 text-zinc-700" />
      </span>
      <div className="min-w-0">
        <div className="text-sm font-semibold tracking-normal text-zinc-950">{title}</div>
        <p className="mt-1 text-sm leading-6 text-zinc-600">{body}</p>
      </div>
    </div>
  )
}
