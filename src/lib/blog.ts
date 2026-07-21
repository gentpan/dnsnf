export type BlogArticle = {
  slug: string
  title: string
  description: string
  category: 'dns-lookup' | 'reverse-ip' | 'subdomains' | 'reverse-ns' | 'reverse-mx' | 'rdns' | 'dnssec' | 'ssl' | 'mail-security' | 'blacklist' | 'propagation' | 'health-check' | 'ecs' | 'takeover'
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
  {
    slug: 'ssl-certificate-lookup-explained',
    title: 'SSL certificate lookup explained',
    description: 'Check TLS certificates for any domain or IP and read issuer, validity, chain trust, and negotiated TLS security.',
    category: 'ssl',
    readTime: '4 min read',
    keywords: ['SSL certificate checker', 'TLS certificate lookup', 'certificate expiry', 'certificate chain'],
    sections: [
      {
        heading: 'When to use it',
        body: 'Use an SSL certificate check when a site shows browser trust warnings, before a certificate renewal deadline, after a migration to a new host or CDN, or when verifying that HTTPS is configured on the expected port.',
      },
      {
        heading: 'What to inspect',
        body: 'Start with the issuer and validity window, then confirm the subject alternative names cover the hostname you queried. The chain view shows intermediate certificates, and the handshake details reveal the negotiated TLS version, cipher suite, and ALPN protocol.',
      },
      {
        heading: 'How to read trust failures',
        body: 'A certificate can be unexpired but still untrusted when the chain is incomplete, the hostname does not match the SAN list, or the issuer is not in the system root pool. The verification error message points to the exact reason.',
      },
    ],
  },
  {
    slug: 'spf-dkim-dmarc-checker-guide',
    title: 'SPF, DKIM, and DMARC checker guide',
    description: 'Verify the DNS policies that protect a domain from spoofing and improve mail delivery.',
    category: 'mail-security',
    readTime: '5 min read',
    keywords: ['SPF checker', 'DKIM lookup', 'DMARC checker', 'email authentication'],
    sections: [
      {
        heading: 'When to use it',
        body: 'Run a mail security check when messages land in spam, after changing mail providers, before a domain migration, or when auditing a domain for spoofing exposure.',
      },
      {
        heading: 'What each protocol does',
        body: 'SPF lists authorized sending servers, DKIM signs messages with a domain key published in DNS, and DMARC tells receivers how to handle failures and where to send reports. MTA-STS and TLS-RPT add transport encryption policy and reporting.',
      },
      {
        heading: 'Common problems found',
        body: 'The most frequent issues are SPF records exceeding the 10 DNS lookup limit, DMARC stuck at p=none, missing DKIM selectors, and multiple SPF records. Each check reports the exact warning so you can fix the record directly.',
      },
    ],
  },
  {
    slug: 'ip-blacklist-check-explained',
    title: 'IP blacklist check explained',
    description: 'Understand DNS-based blocklists, why an IP gets listed, and how to read listing reasons.',
    category: 'blacklist',
    readTime: '4 min read',
    keywords: ['IP blacklist checker', 'RBL lookup', 'DNSBL', 'spam blacklist'],
    sections: [
      {
        heading: 'When to use it',
        body: 'Check blocklists when outbound mail is rejected, after moving to a new server or IP range, or when monitoring the reputation of shared hosting infrastructure.',
      },
      {
        heading: 'How DNSBL lookups work',
        body: 'The IP address is reversed and queried as a DNS name under each blocklist zone. A positive A record means the zone lists the IP, and the accompanying TXT record usually explains why.',
      },
      {
        heading: 'How to interpret listings',
        body: 'Not every listing means abuse. Policy zones list dynamic or unassigned ranges by default. Check the reason string, confirm whether the zone affects your receivers, and follow the zone delisting process when needed.',
      },
    ],
  },
  {
    slug: 'dns-propagation-check-explained',
    title: 'DNS propagation check explained',
    description: 'Why DNS changes take time to appear, how caches and TTLs work, and how to verify propagation across regions.',
    category: 'propagation',
    readTime: '5 min read',
    keywords: ['DNS propagation checker', 'global DNS check', 'TTL cache', 'DNS传播检测'],
    sections: [
      {
        heading: 'When to use it',
        body: 'Run a propagation check right after changing a record: moving hosts, switching mail providers, updating nameservers, or rotating TLS-related records.',
      },
      {
        heading: 'Why answers differ across regions',
        body: 'Recursive resolvers cache records for the duration of the TTL. A resolver that cached the old answer five minutes ago keeps serving it until the TTL expires, while a resolver with an empty cache fetches the new answer immediately.',
      },
      {
        heading: 'How to speed up propagation',
        body: 'Lower the TTL well before a planned change, wait one old TTL cycle, make the change, then raise the TTL again. A propagation checker confirms when every region serves the new answer.',
      },
    ],
  },
  {
    slug: 'dns-health-check-guide',
    title: 'DNS health check guide',
    description: 'What a domain DNS audit covers: delegation, nameservers, SOA, mail records, DNSSEC, and security policies.',
    category: 'health-check',
    readTime: '6 min read',
    keywords: ['DNS health check', 'domain audit', 'delegation check', 'DNSSEC audit', 'DNS健康检查'],
    sections: [
      {
        heading: 'When to use it',
        body: 'Audit a domain after changing DNS providers, when email stops flowing, when a site is unreachable in some regions, or as a periodic best-practice review.',
      },
      {
        heading: 'What the audit checks',
        body: 'The audit verifies that NS records exist and match between parent and zone, that nameserver hostnames resolve and span multiple networks, that SOA timers are sane, that MX hosts resolve, and that SPF, DMARC, CAA, DNSSEC, and HTTPS records are in place.',
      },
      {
        heading: 'Reading the score',
        body: 'Each check carries a weight. Passed checks add full credit, warnings add half, and failures add none. A score above 85 with no failures is healthy; anything lower points at specific findings to fix first.',
      },
    ],
  },
  {
    slug: 'edns-client-subnet-explained',
    title: 'EDNS Client Subnet explained',
    description: 'How ECS lets resolvers share client location hints, why GeoDNS depends on it, and how to test it.',
    category: 'ecs',
    readTime: '5 min read',
    keywords: ['EDNS client subnet', 'ECS test', 'GeoDNS', 'CDN steering'],
    sections: [
      {
        heading: 'When to use it',
        body: 'Test ECS when users in different regions report different site versions, when configuring GeoDNS or CDN steering, or when debugging why a resolver returns an unexpected edge location.',
      },
      {
        heading: 'How ECS works',
        body: 'A resolver attaches the leading bits of the client IP (for example 8.8.8.0/24) to the query it sends to the authoritative server. The server can then answer with the closest endpoint and echoes back the scope prefix it actually used.',
      },
      {
        heading: 'Privacy trade-offs',
        body: 'ECS reveals part of the client network to authoritative servers. Some resolvers like Quad9 deliberately strip ECS for privacy, which can result in less localized answers for GeoDNS domains.',
      },
    ],
  },
  {
    slug: 'subdomain-takeover-explained',
    title: 'Subdomain takeover explained',
    description: 'What dangling CNAME records are, why they enable subdomain takeover, and how to find and fix them.',
    category: 'takeover',
    readTime: '6 min read',
    keywords: ['subdomain takeover', 'dangling CNAME', 'DNS security', 'bug bounty'],
    sections: [
      {
        heading: 'When to use it',
        body: 'Scan after decommissioning hosted services, during security audits, when monitoring attack surface, or as part of a bug bounty recon workflow.',
      },
      {
        heading: 'How takeovers happen',
        body: 'A CNAME points blog.example.com at a service like GitHub Pages or Heroku. When the resource is deleted on the provider but the DNS record stays, anyone can claim the same resource name and serve content under your subdomain.',
      },
      {
        heading: 'How to remediate',
        body: 'Remove DNS records before deleting the resource on the provider, not after. Regularly scan for CNAME targets that return NXDOMAIN, and treat flagged findings as leads to verify manually rather than proof of exploitability.',
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
