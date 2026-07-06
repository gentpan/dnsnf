export type BlogArticle = {
  slug: string
  title: string
  description: string
  category: 'dns-lookup' | 'reverse-ip' | 'subdomains' | 'reverse-ns' | 'reverse-mx' | 'rdns' | 'dnssec'
  readTime: string
  keywords: string[]
  sections: Array<{
    heading: string
    body: string
  }>
}

export const blogArticles: BlogArticle[] = [
  {
    slug: 'what-is-dns-lookup-used-for',
    title: 'What is DNS lookup used for?',
    description: 'Use DNS lookup to inspect records, verify routing, troubleshoot mail, and compare public DNS visibility.',
    category: 'dns-lookup',
    readTime: '4 min read',
    keywords: ['DNS lookup', 'DNS records', 'A record', 'MX lookup', 'TXT lookup'],
    sections: [
      {
        heading: 'When to use it',
        body: 'DNS lookup is the first check when a domain does not load, email delivery is failing, a new record was added, or a migration needs verification. It shows how public resolvers currently see the domain.',
      },
      {
        heading: 'What to inspect',
        body: 'A and AAAA records show web routing, MX records show mail routing, NS records show authoritative DNS, TXT records often contain SPF, DMARC, DKIM, and ownership verification data, while SOA records expose zone metadata.',
      },
      {
        heading: 'How to read results',
        body: 'A single missing record is not always an outage. Compare the requested record type, the resolver cache window, and whether the zone has recently changed. For migrations, check multiple record groups instead of only A records.',
      },
    ],
  },
  {
    slug: 'reverse-ip-lookup-explained',
    title: 'Reverse IP lookup explained',
    description: 'Find domains observed on the same IPv4 address and understand shared hosting or infrastructure relationships.',
    category: 'reverse-ip',
    readTime: '3 min read',
    keywords: ['reverse IP lookup', 'shared hosting', 'IP intelligence', 'domain discovery'],
    sections: [
      {
        heading: 'When to use it',
        body: 'Reverse IP lookup is useful when you want to understand what else has been observed on an IP address. It helps with asset discovery, hosting analysis, abuse review, and infrastructure mapping.',
      },
      {
        heading: 'What it can reveal',
        body: 'The same IP can host unrelated websites, staging domains, customer domains, or infrastructure aliases. Source labels help show where each domain was observed, but public datasets may not be complete.',
      },
      {
        heading: 'Important limitation',
        body: 'Shared IP does not prove common ownership. Treat it as a lead for investigation, then confirm using DNS records, certificates, HTTP responses, and organization metadata.',
      },
    ],
  },
  {
    slug: 'subdomain-discovery-for-asset-inventory',
    title: 'Subdomain discovery for asset inventory',
    description: 'Use public subdomain data to build a cleaner domain inventory and find exposed hosts.',
    category: 'subdomains',
    readTime: '4 min read',
    keywords: ['subdomain finder', 'subdomain discovery', 'asset inventory', 'DNS host records'],
    sections: [
      {
        heading: 'When to use it',
        body: 'Subdomain discovery is useful before audits, migrations, monitoring setup, or security reviews. It helps find public hosts that may not be documented internally.',
      },
      {
        heading: 'What to look for',
        body: 'Pay attention to staging, admin, API, mail, CDN, and old application hostnames. These names often explain how a domain is structured and where operational risk may exist.',
      },
      {
        heading: 'How to validate',
        body: 'Public feeds can contain stale names. Recheck important hosts with DNS lookup, HTTP status, and certificate data before treating them as active assets.',
      },
    ],
  },
  {
    slug: 'reverse-ns-lookup-and-shared-nameservers',
    title: 'Reverse NS lookup and shared nameservers',
    description: 'Discover domains that share authoritative name-server infrastructure with a target.',
    category: 'reverse-ns',
    readTime: '3 min read',
    keywords: ['reverse NS lookup', 'shared nameservers', 'authoritative DNS', 'DNS infrastructure'],
    sections: [
      {
        heading: 'When to use it',
        body: 'Reverse NS lookup helps identify domains that use the same authoritative name servers. It is useful for finding related projects, parked domains, and domains managed under the same DNS provider setup.',
      },
      {
        heading: 'What it means',
        body: 'A shared NS result means domains overlap on name-server infrastructure. This may indicate common management, the same DNS provider, or simply many customers using a popular hosted DNS service.',
      },
      {
        heading: 'How to avoid false assumptions',
        body: 'Always compare the actual NS hostnames and the provider context. Shared public DNS providers can create broad overlaps that do not imply ownership.',
      },
    ],
  },
  {
    slug: 'reverse-mx-lookup-for-mail-infrastructure',
    title: 'Reverse MX lookup for mail infrastructure',
    description: 'Find domains that share mail exchanger hosts and understand email routing relationships.',
    category: 'reverse-mx',
    readTime: '3 min read',
    keywords: ['reverse MX lookup', 'MX lookup', 'mail infrastructure', 'email routing'],
    sections: [
      {
        heading: 'When to use it',
        body: 'Reverse MX lookup is useful when investigating email infrastructure, hosted mail migrations, deliverability issues, or domains that rely on the same mail service.',
      },
      {
        heading: 'What it shows',
        body: 'The query compares MX records and returns domains that share mail exchanger hosts. It can reveal use of Google Workspace, Microsoft 365, custom mail gateways, or shared filtering infrastructure.',
      },
      {
        heading: 'How to use the result',
        body: 'Treat shared MX as an infrastructure relationship. Confirm ownership separately with domain records, web content, certificates, and account-level evidence.',
      },
    ],
  },
  {
    slug: 'rdns-and-ptr-record-search',
    title: 'rDNS and PTR record search',
    description: 'Search reverse DNS names to map IP addresses back to hostnames and infrastructure patterns.',
    category: 'rdns',
    readTime: '4 min read',
    keywords: ['rDNS lookup', 'PTR record lookup', 'reverse DNS search', 'IP hostname'],
    sections: [
      {
        heading: 'When to use it',
        body: 'rDNS search is useful when an IP range needs context. PTR names can reveal host roles, provider naming patterns, mail server identities, or customer allocation hints.',
      },
      {
        heading: 'What PTR records mean',
        body: 'A PTR record maps an IP address back to a hostname. It is commonly used for mail reputation, logging, network operations, and infrastructure labeling.',
      },
      {
        heading: 'How to search effectively',
        body: 'Use contains mode for broad discovery, starts-with for provider prefixes, and ends-with for domain suffixes. Combine rDNS results with forward DNS checks before drawing conclusions.',
      },
    ],
  },
  {
    slug: 'dnssec-checker-guide',
    title: 'DNSSEC checker guide',
    description: 'Understand DS, DNSKEY, RRSIG, and NSEC records when reviewing domain DNSSEC posture.',
    category: 'dnssec',
    readTime: '4 min read',
    keywords: ['DNSSEC checker', 'DS record', 'DNSKEY', 'RRSIG', 'NSEC'],
    sections: [
      {
        heading: 'When to use it',
        body: 'Use a DNSSEC check when validating whether a domain has signed DNS records and whether the expected DNSSEC-related records are visible publicly.',
      },
      {
        heading: 'What to inspect',
        body: 'DS records connect the parent zone to the child zone, DNSKEY records publish signing keys, RRSIG records carry signatures, and NSEC or related records support authenticated denial of existence.',
      },
      {
        heading: 'How to interpret missing records',
        body: 'Missing DNSSEC records can mean DNSSEC is not enabled, only partially configured, or not visible from the resolver path being queried. Compare registrar settings and authoritative DNS output.',
      },
    ],
  },
]

export function getBlogArticle(slug: string) {
  return blogArticles.find((article) => article.slug === slug)
}

export function getRelatedArticles(category: BlogArticle['category'], limit = 3) {
  const exact = blogArticles.filter((article) => article.category === category)
  const fallback = blogArticles.filter((article) => article.category !== category)
  return [...exact, ...fallback].slice(0, limit)
}
