import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/blog')({
  head: () => ({
    meta: [
      { title: 'DNS.NF Blog' },
      {
        name: 'description',
        content: 'DNS.NF blog and guides for DNS lookup, reverse IP, subdomain discovery, reverse NS, reverse MX, rDNS, and DNSSEC.',
      },
    ],
  }),
  component: Outlet,
})
