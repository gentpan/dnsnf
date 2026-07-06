import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { HeadContent, Scripts, createRootRouteWithContext } from '@tanstack/react-router'
import appCss from '../styles.css?url'
import { AppShell } from '@/components/AppShell'
import { seoKeywords } from '@/lib/seo'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        name: 'description',
        content:
          'Check DNS records and nameservers with DNS.NF. Run DNS lookup, NS lookup, MX lookup, TXT lookup, reverse DNS, reverse IP, subdomain discovery, DNSSEC checks, and public DNS API queries.',
      },
      {
        name: 'keywords',
        content: seoKeywords.join(', '),
      },
      { name: 'theme-color', content: '#09090b' },
      { name: 'msapplication-TileColor', content: '#09090b' },
      { name: 'msapplication-config', content: '/browserconfig.xml' },
      { title: 'DNS.NF - Check DNS Records and Nameservers Online' },
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
