import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Check, ChevronLeft, ChevronRight, Clipboard, House, LockKeyhole, Search, XCircle } from 'lucide-react'
import { api, type DnsRecordType, type DnsResolver } from '@/lib/api'
import { getRelatedArticles, type BlogArticle } from '@/lib/blog'
import { Select } from './base-select'
import { PageHero } from './page-hero'
import { Badge, Button, Card, CardContent, CardHeader, EmptyState, Input, StatusBadge } from './ui'

const recordTypes: DnsRecordType[] = ['ALL', 'A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'CAA', 'SOA', 'SRV', 'PTR']
const displayRecordTypes = recordTypes.filter((recordType) => recordType !== 'ALL')
const recordTypeOptions = recordTypes.map((value) => ({ value, label: value }))
const resolverOptions: Array<{
  value: DnsResolver
  label: string
  detail: string
  icon?: React.ComponentType<{ className?: string }>
  logoSrc?: string
}> = [
  { value: 'local', label: '本地', detail: 'Server resolver', icon: House },
  { value: 'cloudflare', label: 'Cloudflare', detail: '1.1.1.1 · 1.0.0.1', logoSrc: '/resolver-icons/cloudflare.svg' },
  { value: 'google', label: 'Google', detail: '8.8.8.8 · 8.8.4.4', logoSrc: '/resolver-icons/google.svg' },
  { value: 'ali', label: '阿里 DNS', detail: '223.5.5.5 · 223.6.6.6', logoSrc: '/resolver-icons/alibabacloud.svg' },
  { value: 'tencent', label: '腾讯 DNS', detail: '119.29.29.29 · 182.254.116.116', logoSrc: '/resolver-icons/tencentcloud.svg' },
]
const rdnsModeOptions = [
  { value: 'middle', label: 'Contains' },
  { value: 'left', label: 'Starts with' },
  { value: 'right', label: 'Ends with' },
]
const pageSizeOptions = [50, 100, 200, 500].map((value) => ({ value: String(value), label: String(value) }))

export function PageTitle({
  title,
  body,
  eyebrow = 'DNS.NF console',
  badge = 'Live DNS Query',
  badgeTone = 'blue',
}: {
  title: string
  body: string
  eyebrow?: string
  badge?: string
  badgeTone?: 'zinc' | 'green' | 'blue' | 'amber' | 'red'
}) {
  return (
    <PageHero eyebrow={eyebrow} title={title} body={body} badge={badge} badgeTone={badgeTone} />
  )
}

export function UsageGuide({
  description,
  points,
  tags,
}: {
  description: string
  points: string[]
  tags: string[]
}) {
  return (
    <Card>
      <CardHeader className="bg-zinc-50/60">
        <div className="text-sm font-medium">How This Query Works</div>
        <div className="mt-1 text-xs leading-5 text-zinc-500">{description}</div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          {points.map((point) => (
            <div key={point} className="flex gap-3 rounded-md border border-zinc-200 bg-white p-3 text-sm leading-6 text-zinc-600">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-950" />
              <span>{point}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function RelatedGuides({ category }: { category: BlogArticle['category'] }) {
  const articles = getRelatedArticles(category, 3)

  return (
    <Card>
      <CardHeader className="bg-zinc-50/60">
        <div className="text-sm font-medium">Related Guides</div>
        <div className="mt-1 text-xs leading-5 text-zinc-500">Short articles explaining when and why to use this query.</div>
      </CardHeader>
      <CardContent className="grid gap-3">
        {articles.map((article) => (
          <Link
            key={article.slug}
            to="/blog/$slug"
            params={{ slug: article.slug }}
            className="block rounded-lg border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 hover:bg-zinc-50"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold tracking-normal text-zinc-950">{article.title}</h2>
              <Badge>{article.readTime}</Badge>
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{article.description}</p>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}

export function LookupPanel({ initialTarget = '' }: { initialTarget?: string }) {
  const [target, setTarget] = React.useState(initialTarget)
  const [submitted, setSubmitted] = React.useState(initialTarget)
  const [type, setType] = React.useState<DnsRecordType>('ALL')
  const [resolver, setResolver] = React.useState<DnsResolver>('cloudflare')
  const systemResolver = useQuery({
    queryKey: ['system-resolver'],
    queryFn: api.systemResolver,
    staleTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
  const localResolverDetail = systemResolver.data?.data.display || 'Server resolver'
  const lookupResolverOptions = resolverOptions.map((option) =>
    option.value === 'local' ? { ...option, detail: localResolverDetail } : option,
  )
  const selectedResolver = lookupResolverOptions.find((option) => option.value === resolver) || lookupResolverOptions[1]!
  const query = useQuery({
    queryKey: ['lookup', submitted, type, resolver],
    queryFn: () => api.lookup(submitted, type, resolver),
    enabled: submitted.length > 0,
  })

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden">
        <CardHeader className="space-y-3 bg-zinc-50/70">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Search className="h-4 w-4 text-sky-600" />
              Query target
            </div>
            <Badge className="hidden max-w-[min(22rem,60vw)] gap-1 truncate sm:inline-flex">
              <span>{selectedResolver.label}</span>
              <span className="text-zinc-400">/</span>
              <span className="truncate font-mono">{selectedResolver.detail}</span>
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-1 rounded-lg border border-zinc-200 bg-white p-1 shadow-sm shadow-zinc-200/40 sm:grid-cols-5">
            {lookupResolverOptions.map((option) => (
              <ResolverButton
                key={option.value}
                label={option.label}
                icon={option.icon}
                logoSrc={option.logoSrc}
                selected={resolver === option.value}
                onClick={() => setResolver(option.value)}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 sm:grid-cols-[1fr_150px_auto]"
            onSubmit={(event) => {
              event.preventDefault()
              setSubmitted(target.trim())
            }}
          >
            <Input value={target} onChange={(event) => setTarget(event.target.value)} placeholder="example.com or 8.8.8.8" />
            <Select
              value={type}
              onValueChange={(next) => setType(next as DnsRecordType)}
              options={recordTypeOptions}
              ariaLabel="Record type"
            />
            <Button disabled={query.isFetching}>
              {query.isFetching ? <LoadingRingIcon className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              Lookup
            </Button>
          </form>
        </CardContent>
      </Card>
      {renderQueryState(query.isFetching, query.error)}
      {query.data ? <DnsResult payload={query.data.data} cached={query.data.cached} selectedType={type} /> : null}
      {!query.data && !query.isFetching ? <EmptyState title="Ready for a lookup" body="Enter a domain, IP, or CIDR range." /> : null}
    </div>
  )
}

function ResolverButton({
  label,
  icon: Icon,
  logoSrc,
  selected,
  onClick,
}: {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  logoSrc?: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex h-14 items-center justify-center gap-2 rounded-md px-2.5 py-2 text-center transition sm:px-3',
        selected
          ? 'bg-zinc-950 text-white shadow-sm'
          : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950',
      ].join(' ')}
    >
      {logoSrc ? (
        <span className="inline-flex h-5 w-5 items-center justify-center">
          <img src={logoSrc} alt="" className="max-h-[18px] max-w-[18px] object-contain" />
        </span>
      ) : Icon ? (
        <Icon className="h-4 w-4 shrink-0" />
      ) : null}
      <span className="min-w-0 truncate text-sm font-semibold">{label}</span>
    </button>
  )
}

function DnsResult({
  payload,
  cached,
  selectedType,
}: {
  payload: Awaited<ReturnType<typeof api.lookup>>['data']
  cached: boolean
  selectedType: DnsRecordType
}) {
  const records = payload.records || {}
  const groups = (selectedType === 'ALL' ? displayRecordTypes : [selectedType]).map((recordType) => ({
    type: recordType,
    value: records[recordType as keyof typeof records],
  }))
  const nonEmptyGroups = groups.filter((group) => hasRecordValue(group.value))
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between bg-zinc-50/60">
        <div>
          <div className="font-mono text-sm font-medium">{payload.domain || payload.ip}</div>
          <div className="mt-1 text-xs text-zinc-500">
            {nonEmptyGroups.length} record groups · {payload.reverse_dns.length} reverse DNS rows
          </div>
        </div>
        <StatusBadge tone={cached ? 'amber' : 'green'}>{cached ? 'cached' : 'fresh'}</StatusBadge>
      </CardHeader>
      <CardContent className="grid gap-4">
        {payload.reverse_dns.length > 0 ? <KeyValue title="Reverse DNS" value={payload.reverse_dns.join('\n')} /> : null}
        {nonEmptyGroups.map((group) => (
          <KeyValue key={group.type} title={group.type} value={formatRecordValue(group.value)} />
        ))}
      </CardContent>
    </Card>
  )
}

export function ReverseIpPanel() {
  const [ip, setIp] = React.useState('')
  const [submitted, setSubmitted] = React.useState('')
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(100)
  const query = useQuery({ queryKey: ['reverse-ip', submitted], queryFn: () => api.reverseIp(submitted), enabled: !!submitted })
  const rows = React.useMemo(
    () => query.data?.data.domains.map((row) => ({ name: row.domain || '', detail: row.sources.join(', ') })) || [],
    [query.data],
  )

  React.useEffect(() => {
    setPage(1)
  }, [submitted, pageSize])

  return (
    <div className="space-y-5">
      <Card>
        <CardContent>
          <form
            className="grid gap-3 sm:grid-cols-[1fr_auto]"
            onSubmit={(event) => {
              event.preventDefault()
              setSubmitted(ip.trim())
            }}
          >
            <Input value={ip} onChange={(event) => setIp(event.target.value)} placeholder="8.8.8.8" />
            <Button disabled={query.isFetching}>
              {query.isFetching ? <LoadingRingIcon className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              Search
            </Button>
          </form>
        </CardContent>
      </Card>
      {renderQueryState(query.isFetching, query.error)}
      <PaginatedRows
        rows={rows}
        empty="Search an IPv4 address to find domains observed on the same server."
        page={page}
        pageSize={pageSize}
        setPage={setPage}
        setPageSize={setPageSize}
      />
    </div>
  )
}

export function SubdomainPanel() {
  const [domain, setDomain] = React.useState('')
  const [submitted, setSubmitted] = React.useState('')
  const query = useQuery({ queryKey: ['subdomains', submitted], queryFn: () => api.subdomains(submitted), enabled: !!submitted })
  return (
    <GenericRowsPanel
      value={domain}
      setValue={setDomain}
      submit={() => setSubmitted(domain.trim())}
      placeholder="example.com"
      button="Discover"
      loading={query.isFetching}
      error={query.error}
      rows={query.data?.data.items.map((row) => ({ name: row.host || row.domain || '', detail: row.sources.join(', ') })) || []}
      empty="Search a domain to collect public subdomain observations."
    />
  )
}

export function SharedPanel({ kind }: { kind: 'ns' | 'mx' }) {
  const [domain, setDomain] = React.useState('')
  const [submitted, setSubmitted] = React.useState('')
  const nsQuery = useQuery({
    queryKey: ['reverse-ns', submitted],
    queryFn: () => api.reverseNs(submitted),
    enabled: kind === 'ns' && !!submitted,
  })
  const mxQuery = useQuery({
    queryKey: ['reverse-mx', submitted],
    queryFn: () => api.reverseMx(submitted),
    enabled: kind === 'mx' && !!submitted,
  })
  const rows =
    kind === 'ns'
      ? nsQuery.data?.data.items.map((row) => ({ name: row.domain, detail: row.shared_ns.join(', ') })) || []
      : mxQuery.data?.data.items.map((row) => ({ name: row.domain, detail: row.shared_mx.join(', ') })) || []
  const loading = kind === 'ns' ? nsQuery.isFetching : mxQuery.isFetching
  const error = kind === 'ns' ? nsQuery.error : mxQuery.error
  return (
    <GenericRowsPanel
      value={domain}
      setValue={setDomain}
      submit={() => setSubmitted(domain.trim())}
      placeholder={kind === 'ns' ? 'example.com' : 'example.com or mx.example.com'}
      button="Find shared"
      loading={loading}
      error={error}
      rows={rows}
      empty={`Search a domain to find other domains sharing ${kind.toUpperCase()} infrastructure.`}
    />
  )
}

export function RdnsSearchPanel() {
  const [keyword, setKeyword] = React.useState('')
  const [mode, setMode] = React.useState('middle')
  const [submitted, setSubmitted] = React.useState('')
  const query = useQuery({
    queryKey: ['rdns-search', submitted, mode],
    queryFn: () => api.rdnsSearch(submitted, mode),
    enabled: submitted.length >= 2,
  })
  return (
    <div className="space-y-5">
      <form
        className="grid gap-3 sm:grid-cols-[1fr_150px_auto]"
        onSubmit={(event) => {
          event.preventDefault()
          setSubmitted(keyword.trim())
        }}
      >
        <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="google" />
        <Select value={mode} onValueChange={setMode} options={rdnsModeOptions} ariaLabel="Match mode" />
        <Button disabled={query.isFetching}>
          {query.isFetching ? <LoadingRingIcon className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          Search
        </Button>
      </form>
      {renderQueryState(query.isFetching, query.error)}
      <Rows rows={query.data?.data.records.map((row) => ({ name: row.ptr, detail: row.ip })) || []} empty="Search stored PTR records." />
    </div>
  )
}

export function DnssecPanel() {
  const [domain, setDomain] = React.useState('')
  const [submitted, setSubmitted] = React.useState('')
  const query = useQuery({
    queryKey: ['dnssec', submitted],
    queryFn: () => api.dnssec(submitted),
    enabled: !!submitted,
  })
  const data = query.data?.data
  const rows = data
    ? Object.entries(data.records).map(([type, record]) => ({
        name: type,
        detail: `${record.values.length} records`,
      }))
    : []

  return (
    <div className="space-y-5">
      <Card>
        <CardContent>
          <form
            className="grid gap-3 sm:grid-cols-[1fr_auto]"
            onSubmit={(event) => {
              event.preventDefault()
              setSubmitted(domain.trim())
            }}
          >
            <Input value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="example.com" />
            <Button disabled={query.isFetching}>
              {query.isFetching ? <LoadingRingIcon className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4" />}
              Check DNSSEC
            </Button>
          </form>
        </CardContent>
      </Card>
      {renderQueryState(query.isFetching, query.error)}
      {data ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between bg-zinc-50/60">
            <div>
              <div className="font-mono text-sm font-medium">{data.domain}</div>
              <div className="mt-1 text-xs text-zinc-500">DNSSEC posture score</div>
            </div>
            <StatusBadge tone={data.status === 'strong' ? 'green' : data.status === 'partial' ? 'amber' : 'red'}>
              {data.score}/100
            </StatusBadge>
          </CardHeader>
          <CardContent>
            <Rows rows={rows} empty="No DNSSEC records returned." />
          </CardContent>
        </Card>
      ) : (
        <EmptyState title="No check yet" body="Enter a domain to inspect DNSSEC records." />
      )}
    </div>
  )
}

function GenericRowsPanel({
  value,
  setValue,
  submit,
  placeholder,
  button,
  loading,
  error,
  rows,
  empty,
}: {
  value: string
  setValue: (value: string) => void
  submit: () => void
  placeholder: string
  button: string
  loading: boolean
  error: Error | null
  rows: Array<{ name: string; detail: string }>
  empty: string
}) {
  return (
    <div className="space-y-5">
      <Card>
        <CardContent>
          <form
            className="grid gap-3 sm:grid-cols-[1fr_auto]"
            onSubmit={(event) => {
              event.preventDefault()
              submit()
            }}
          >
            <Input value={value} onChange={(event) => setValue(event.target.value)} placeholder={placeholder} />
            <Button disabled={loading}>
              {loading ? <LoadingRingIcon className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              {button}
            </Button>
          </form>
        </CardContent>
      </Card>
      {renderQueryState(loading, error)}
      <Rows rows={rows} empty={empty} />
    </div>
  )
}

function Rows({ rows, empty }: { rows: Array<{ name: string; detail: string }>; empty: string }) {
  if (rows.length === 0) return <EmptyState title="No rows yet" body={empty} />
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between bg-zinc-50/60">
        <div className="text-sm font-medium">Results</div>
        <Badge>{rows.length} rows</Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-zinc-100">
          {rows.map((row) => (
            <ResultRow key={`${row.name}-${row.detail}`} row={row} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function PaginatedRows({
  rows,
  empty,
  page,
  pageSize,
  setPage,
  setPageSize,
}: {
  rows: Array<{ name: string; detail: string }>
  empty: string
  page: number
  pageSize: number
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
}) {
  if (rows.length === 0) return <EmptyState title="No rows yet" body={empty} />

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * pageSize
  const end = Math.min(start + pageSize, rows.length)
  const visibleRows = rows.slice(start, end)

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 bg-zinc-50/60 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-medium">Results</div>
          <div className="mt-1 text-xs text-zinc-500">
            Showing {start + 1}-{end} of {rows.length} rows
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={String(pageSize)}
            onValueChange={(next) => setPageSize(Number(next))}
            options={pageSizeOptions}
            ariaLabel="Rows per page"
            className="h-8 min-w-32 text-xs"
          />
          <Badge>
            Page {currentPage} / {totalPages}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-zinc-100">
          {visibleRows.map((row) => (
            <ResultRow key={`${row.name}-${row.detail}`} row={row} />
          ))}
        </div>
        <div className="flex flex-col gap-3 border-t border-zinc-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-zinc-500">
            Results are paginated in the browser. Changing pages does not run a new query.
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPage(Math.max(1, currentPage - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ResultRow({ row }: { row: { name: string; detail: string } }) {
  const [copied, setCopied] = React.useState(false)
  const copyTimerRef = React.useRef<number | null>(null)
  const copyValue = row.detail ? `${row.name}\t${row.detail}` : row.name

  React.useEffect(() => {
    return () => {
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current)
    }
  }, [])

  async function copyRow() {
    try {
      await navigator.clipboard.writeText(copyValue)
      setCopied(true)
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current)
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 1200)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="group relative grid gap-1 p-4 pr-14 transition hover:bg-zinc-50/80 sm:grid-cols-[1fr_260px] sm:items-center">
      <div className="min-w-0 truncate font-mono text-sm text-zinc-900">{row.name}</div>
      <div className="truncate text-sm text-zinc-500 sm:text-right">{row.detail}</div>
      <button
        type="button"
        onClick={copyRow}
        className={[
          'absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md border bg-white shadow-sm transition duration-150',
          copied
            ? 'border-emerald-200 text-emerald-600 opacity-100'
            : 'border-zinc-200 text-zinc-500 opacity-0 hover:text-zinc-950 group-hover:opacity-100 focus:opacity-100',
        ].join(' ')}
        aria-label={copied ? 'Copied' : 'Copy row'}
        title={copied ? 'Copied' : 'Copy'}
      >
        {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
      </button>
    </div>
  )
}

function KeyValue({ title, value, empty = false }: { title: string; value: string; empty?: boolean }) {
  return (
    <div className="min-w-0 rounded-lg border border-zinc-200 bg-zinc-50/50 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-xs font-medium uppercase text-zinc-500">{title}</div>
        <Badge>{empty ? 0 : value.split('\n').filter(Boolean).length}</Badge>
      </div>
      <pre
        className={
          empty
            ? 'rounded-md border border-dashed border-zinc-200 bg-white p-3 text-xs leading-5 text-zinc-400'
            : 'max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-md bg-zinc-950 p-3 text-xs leading-5 text-zinc-50'
        }
      >
        {empty ? 'No records' : value}
      </pre>
    </div>
  )
}

function hasRecordValue(value: unknown) {
  if (Array.isArray(value)) return value.length > 0
  if (value && typeof value === 'object') return Object.keys(value).length > 0
  return value !== undefined && value !== null && value !== ''
}

function renderQueryState(loading: boolean, error: Error | null) {
  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <div className="inline-flex h-11 w-20 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm shadow-zinc-200/60">
          <LoadingDotsIcon className="h-6 w-10 text-zinc-950" />
        </div>
      </div>
    )
  }
  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        <XCircle className="h-4 w-4" />
        {error.message}
      </div>
    )
  }
  return null
}

function LoadingRingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" opacity=".25" />
      <path d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z">
        <animateTransform attributeName="transform" type="rotate" dur="0.75s" values="0 12 12;360 12 12" repeatCount="indefinite" />
      </path>
    </svg>
  )
}

function LoadingDotsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="4" cy="12" r="3" opacity="1">
        <animate attributeName="opacity" begin="0s" dur="0.75s" values="1;.2;1" repeatCount="indefinite" />
      </circle>
      <circle cx="12" cy="12" r="3" opacity=".4">
        <animate attributeName="opacity" begin="0.15s" dur="0.75s" values="1;.2;1" repeatCount="indefinite" />
      </circle>
      <circle cx="20" cy="12" r="3" opacity=".3">
        <animate attributeName="opacity" begin="0.3s" dur="0.75s" values="1;.2;1" repeatCount="indefinite" />
      </circle>
    </svg>
  )
}

function formatRecordValue(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((row) => {
        if (typeof row === 'string') return row
        if (row && typeof row === 'object') {
          return Object.entries(row)
            .map(([key, itemValue]) => `${key}: ${String(itemValue)}`)
            .join(' · ')
        }
        return String(row)
      })
      .join('\n')
  }
  if (value && typeof value === 'object') {
    return Object.entries(value)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([key, v]) => `${key}: ${String(v)}`)
      .join('\n')
  }
  return String(value ?? '')
}
