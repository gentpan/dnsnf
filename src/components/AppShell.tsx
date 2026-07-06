import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import {
  Activity,
  BookOpen,
  Braces,
  Database,
  Newspaper,
  HelpCircle,
  LockKeyhole,
  Network,
  Search,
  Server,
  ShieldCheck,
} from 'lucide-react'
import { Badge, Button, Card, CardContent, StatusBadge } from './ui'
import { api, type TrafficRange } from '@/lib/api'

const LazyHelpDialogTrigger = React.lazy(() =>
  import('./HelpDialogTrigger').then((module) => ({ default: module.HelpDialogTrigger })),
)

const nav = [
  { to: '/', label: 'Lookup', icon: Search },
  { to: '/reverse-ip', label: 'Reverse IP', icon: Server },
  { to: '/subdomains', label: 'Subdomains', icon: Network },
  { to: '/reverse-ns', label: 'Shared NS', icon: Database },
  { to: '/reverse-mx', label: 'Reverse MX', icon: Activity },
  { to: '/rdns', label: 'rDNS', icon: ShieldCheck },
  { to: '/dnssec', label: 'DNSSEC', icon: LockKeyhole },
  { to: '/api', label: 'Public API', icon: Braces },
  { to: '/blog', label: 'Blog', icon: Newspaper },
  { to: '/docs', label: 'Docs', icon: BookOpen },
]

const socialLinks = [
  { href: 'https://giantaccel.com', label: 'GiantAccel', icon: GiantAccelIcon },
  { href: 'https://github.com/gentpan/dnsnf', label: 'GitHub', icon: GitHubIcon },
  { href: 'https://x.com/gentpan', label: 'X', icon: XIcon },
]

const trafficRanges: Array<{ value: TrafficRange; label: string }> = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: 'total', label: 'Total' },
]
const trafficStatsRefreshMs = 60 * 60 * 1000

export function AppShell() {
  const [trafficRange, setTrafficRange] = React.useState<TrafficRange>('24h')
  const routeState = useRouterState({
    select: (state) => ({
      isLoading: state.status === 'pending',
      path: state.location.pathname,
    }),
  })
  const health = useQuery({
    queryKey: ['api-health'],
    queryFn: measureApiHealth,
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: 1,
  })
  const traffic = useQuery({
    queryKey: ['traffic-stats', trafficRange],
    queryFn: () => api.trafficStats(trafficRange),
    refetchInterval: trafficStatsRefreshMs,
    refetchOnWindowFocus: false,
    staleTime: trafficStatsRefreshMs,
    retry: 1,
  })
  const healthPayload = health.data?.payload
  const latencyMs = health.data?.latencyMs
  const isHealthy = healthPayload?.status === 'ok' || healthPayload?.data?.status === 'ok' || healthPayload?.success === true
  const statusTone = health.isLoading ? 'zinc' : isHealthy ? latencyTone(latencyMs) : 'red'
  const statusLabel = health.isLoading ? 'Pinging' : isHealthy && latencyMs ? `API ${latencyMs}ms` : 'API Offline'
  const statusTitle =
    isHealthy && latencyMs
      ? `HTTP check to api.dns.nf: ${latencyMs}ms.`
      : health.isLoading
        ? 'Checking local network latency to api.dns.nf.'
        : 'api.dns.nf health check failed.'

  return (
    <div className="app-bg flex min-h-screen flex-col text-zinc-950">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[960px] items-center justify-between gap-4 px-4 py-3">
          <Link
            to="/"
            onClick={(event) => {
              if (typeof window !== 'undefined' && window.location.pathname === '/') {
                event.preventDefault()
                window.location.reload()
              }
            }}
            className="group flex items-center gap-3"
          >
            <img
              src="/logo.svg?v=squircle-frame"
              alt="DNS.NF"
              className="h-9 w-9 drop-shadow-sm transition-transform duration-200 group-hover:scale-110 group-active:scale-105"
            />
            <div>
              <div className="font-semibold tracking-normal">DNS.NF</div>
              <div className="text-xs text-zinc-500">DNS intelligence toolkit</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <StatusBadge tone={statusTone} title={statusTitle} className="gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {statusLabel}
            </StatusBadge>
            <Badge className="hidden sm:inline-flex" title="TanStack Start + React frontend.">
              React
            </Badge>
            <React.Suspense
              fallback={
                <Button variant="outline" size="icon" aria-label="Open console help">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              }
            >
              <LazyHelpDialogTrigger />
            </React.Suspense>
          </div>
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-[960px] flex-1 grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-3">
          <nav className="flex gap-2 overflow-x-auto rounded-lg border border-zinc-200 bg-white/80 p-2 shadow-sm shadow-zinc-200/40 lg:block lg:overflow-visible">
            {nav.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  preload="intent"
                  preloadDelay={40}
                  title={item.label}
                  className="flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-600 transition duration-150 hover:bg-zinc-50 hover:text-zinc-950 active:scale-[0.98] [&.active]:bg-zinc-950 [&.active]:font-medium [&.active]:text-white [&.active]:shadow-sm"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <Card className="hidden lg:block">
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Braces className="h-4 w-4 text-sky-600" />
                Requests
              </div>
              <div className="grid grid-cols-4 gap-1 rounded-lg bg-zinc-100 p-1">
                {trafficRanges.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setTrafficRange(item.value)}
                    className={[
                      'rounded-md px-1.5 py-1.5 text-[11px] font-medium transition',
                      trafficRange === item.value
                        ? 'bg-white text-zinc-950 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-950',
                    ].join(' ')}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="grid gap-2">
                {traffic.isError ? (
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    Stats unavailable
                  </div>
                ) : (
                  <>
                    {trafficRange !== 'total' ? (
                      <MetricRow label="Visitors" value={traffic.data?.data.visitors} loading={traffic.isLoading} />
                    ) : null}
                    <MetricRow label="Requests" value={traffic.data?.data.requests} loading={traffic.isLoading} />
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </aside>
        <main className="relative min-w-0">
          <AjaxRouteProgress active={routeState.isLoading} />
          <RouteContentTransition routeKey={routeState.path}>
            <Outlet />
          </RouteContentTransition>
        </main>
      </div>
      <AppFooter />
      <OverlayScrollBar />
    </div>
  )
}

function RouteContentTransition({ children, routeKey }: { children: React.ReactNode; routeKey: string }) {
  return (
    <div key={routeKey} className="min-w-0 animate-[dnsnf-route-enter_180ms_ease-out_both]">
      {children}
      <style>
        {`
          @keyframes dnsnf-route-enter {
            0% {
              opacity: 0;
              transform: translateY(6px);
            }

            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  )
}

function AjaxRouteProgress({ active }: { active: boolean }) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isVisible = mounted && active

  return (
    <div
      aria-hidden="true"
      className={[
        'pointer-events-none absolute left-0 right-0 top-0 z-10 h-0.5 overflow-hidden rounded-full bg-transparent transition-opacity duration-100',
        isVisible ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
    >
      <div className="h-full w-1/2 animate-[dnsnf-route-progress_0.55s_ease-in-out_infinite] rounded-full bg-sky-600" />
      <style>
        {`
          @keyframes dnsnf-route-progress {
            0% {
              transform: translateX(-100%) scaleX(0.25);
            }

            50% {
              transform: translateX(50%) scaleX(1);
            }

            100% {
              transform: translateX(220%) scaleX(0.25);
            }
          }
        `}
      </style>
    </div>
  )
}

async function measureApiHealth() {
  const startedAt = performance.now()
  const payload = await api.health()
  return {
    payload,
    latencyMs: Math.max(1, Math.round(performance.now() - startedAt)),
  }
}

function latencyTone(latencyMs?: number) {
  if (!latencyMs) return 'zinc'
  if (latencyMs < 500) return 'green'
  if (latencyMs < 1_200) return 'amber'
  return 'red'
}

function AppFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-zinc-200 bg-white/70">
      <div className="mx-auto flex max-w-[960px] flex-col gap-4 px-4 py-5 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
        <div className="leading-6">
          © {year} <span className="font-semibold text-zinc-950">DNS.NF</span>. All rights reserved.
        </div>
        <div className="flex items-center gap-2">
          {socialLinks.map((item) => {
            const Icon = item.icon
            return (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                aria-label={item.label}
                title={item.label}
                className="inline-flex h-9 w-9 items-center justify-center text-zinc-500 transition duration-200 hover:scale-125 hover:text-zinc-950"
              >
                <Icon className="h-4 w-4" />
              </a>
            )
          })}
        </div>
      </div>
    </footer>
  )
}

function OverlayScrollBar() {
  const [state, setState] = React.useState({ visible: false, canScroll: false, top: 0, height: 0 })
  const hideTimerRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    const update = (visible: boolean) => {
      const doc = document.documentElement
      const scrollHeight = doc.scrollHeight
      const viewportHeight = window.innerHeight
      const maxScrollTop = Math.max(1, scrollHeight - viewportHeight)
      const canScroll = scrollHeight > viewportHeight + 1
      const height = canScroll ? Math.max(36, (viewportHeight / scrollHeight) * viewportHeight) : 0
      const top = canScroll ? (window.scrollY / maxScrollTop) * (viewportHeight - height) : 0

      setState({ visible: visible && canScroll, canScroll, top, height })
    }

    const showWhileScrolling = () => {
      update(true)
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = window.setTimeout(() => update(false), 650)
    }

    update(false)
    window.addEventListener('scroll', showWhileScrolling, { passive: true })
    window.addEventListener('resize', showWhileScrolling)

    return () => {
      window.removeEventListener('scroll', showWhileScrolling)
      window.removeEventListener('resize', showWhileScrolling)
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current)
    }
  }, [])

  if (!state.canScroll) return null

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed right-1 top-0 z-50 w-1 rounded-full bg-zinc-950/35 transition-opacity duration-200"
      style={{
        height: `${state.height}px`,
        transform: `translate3d(0, ${state.top}px, 0)`,
        opacity: state.visible ? 1 : 0,
      }}
    />
  )
}

function GiantAccelIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M512 851.456c187.904 0 340.992-152.064 343.04-339.456h-145.408c-2.048 107.52-89.6 194.048-197.632 194.048S316.416 619.52 314.368 512H168.96c2.048 187.392 155.136 339.456 343.04 339.456zM550.912 216.064H855.04v145.408h-304.128z"
        fill="currentColor"
      />
    </svg>
  )
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.592 2 12.253c0 4.529 2.865 8.371 6.839 9.728.5.095.683-.222.683-.494 0-.244-.009-.89-.014-1.747-2.782.62-3.369-1.375-3.369-1.375-.455-1.185-1.11-1.501-1.11-1.501-.908-.636.069-.623.069-.623 1.004.073 1.532 1.057 1.532 1.057.892 1.567 2.341 1.115 2.91.852.091-.662.35-1.115.636-1.371-2.221-.26-4.555-1.139-4.555-5.066 0-1.119.39-2.034 1.03-2.751-.103-.26-.446-1.304.098-2.715 0 0 .84-.276 2.75 1.051A9.37 9.37 0 0 1 12 6.952a9.37 9.37 0 0 1 2.504.346c1.909-1.327 2.748-1.051 2.748-1.051.546 1.411.203 2.455.1 2.715.64.717 1.028 1.632 1.028 2.751 0 3.937-2.337 4.803-4.566 5.058.359.318.679.945.679 1.904 0 1.374-.013 2.482-.013 2.82 0 .274.18.594.688.493C19.138 20.62 22 16.78 22 12.253 22 6.592 17.523 2 12 2Z"
      />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        fill="currentColor"
        d="M13.778 10.47 20.74 2h-1.65l-6.045 7.353L8.217 2H2.648l7.302 11.12L2.648 22h1.65l6.385-7.765L15.783 22h5.569l-7.574-11.53Zm-2.26 2.75-.74-1.107L4.891 3.301h2.535l4.75 7.112.74 1.107 6.174 9.244h-2.535l-5.037-7.544Z"
      />
    </svg>
  )
}

function MetricRow({ label, value, loading = false }: { label: string; value?: number; loading?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="font-mono text-sm font-semibold text-zinc-950">
        {loading || value === undefined ? <RequestLoadingBar className="h-1 w-10" /> : value.toLocaleString()}
      </span>
    </div>
  )
}

function RequestLoadingBar({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 40 4" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <style>
        {`
          .dnsnf-request-loading {
            transform-box: fill-box;
            transform-origin: left center;
            animation: dnsnf-request-loading 1s ease-in-out infinite;
          }

          @keyframes dnsnf-request-loading {
            0% {
              transform: translateX(0) scaleX(0);
            }

            50% {
              transform: translateX(0) scaleX(1);
            }

            100% {
              transform: translateX(40px) scaleX(0);
            }
          }
        `}
      </style>
      <rect className="dnsnf-request-loading" width="40" height="4" fill="currentColor" />
    </svg>
  )
}
