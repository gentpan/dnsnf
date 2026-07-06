import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { HeadContent, Scripts, createRootRouteWithContext } from '@tanstack/react-router'
import appCss from '../styles.css?url'
import { AppShell } from '@/components/AppShell'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        name: 'description',
        content: 'DNS.NF is a fast DNS lookup and infrastructure discovery toolkit.',
      },
      {
        name: 'keywords',
        content:
          'DNS lookup, DNS checker, DNS records, DNS query, DNS propagation, nslookup, dig DNS, reverse DNS lookup, rDNS lookup, reverse IP lookup, subdomain finder, DNSSEC checker, MX lookup, TXT lookup, SPF check, DMARC check, CNAME lookup, A record lookup, AAAA record lookup, 域名解析, DNS查询, DNS查找, DNS记录查询, DNS检测, DNS解析查询, 域名DNS查询, DNS传播检测, nslookup查询, dig查询, 反向DNS查询, PTR查询, 反向IP查询, 子域名查询, DNSSEC检测, MX记录查询, TXT记录查询, SPF查询, DMARC查询',
      },
      { name: 'theme-color', content: '#09090b' },
      { name: 'msapplication-TileColor', content: '#09090b' },
      { name: 'msapplication-config', content: '/browserconfig.xml' },
      { title: 'DNS.NF' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg?v=squircle-frame' },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png?v=squircle-frame' },
      { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png?v=squircle-frame' },
      { rel: 'shortcut icon', href: '/favicon.ico?v=squircle-frame' },
      { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png?v=squircle-frame' },
      { rel: 'manifest', href: '/site.webmanifest' },
    ],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
})

function RootComponent() {
  const { queryClient } = Route.useRouteContext()
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script defer src="https://tongji.giantaccel.com/script.js" data-website-id="c3e9443d-ed69-450e-8790-9a2aedcd4371" />
        <script defer src="https://tongji.giantaccel.com/recorder.js" data-website-id="c3e9443d-ed69-450e-8790-9a2aedcd4371" />
      </head>
      <body>
        <div className="app-root">{children}</div>
        <Scripts />
      </body>
    </html>
  )
}
