import { createFileRoute, Outlet } from '@tanstack/react-router'
import { seoMeta } from '@/lib/seo'

export const Route = createFileRoute('/blog')({
  head: () => ({
    meta: seoMeta({
      title: 'DNS.NF Blog - DNS Lookup, Reverse DNS, DNSSEC Guides',
      description:
        'Read DNS.NF guides for DNS lookup, reverse IP, subdomain discovery, reverse NS, reverse MX, rDNS, DNSSEC, and DNS record interpretation.',
      keywords: ['DNS guides', 'DNS lookup guide', 'reverse DNS guide', 'DNSSEC guide', 'DNS教程'],
    }),
  }),
  component: Outlet,
})
