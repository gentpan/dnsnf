import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Braces,
  CheckCircle2,
  Clipboard,
  Code2,
  Copy,
  ExternalLink,
  Globe2,
  KeyRound,
  Link as LinkIcon,
  Send,
  ShieldCheck,
  Timer,
  X,
} from 'lucide-react'
import { Select } from '@/components/base-select'
import { Tabs } from '@/components/base-tabs'
import { Badge, Button, Card, CardContent, CardHeader, Input, StatusBadge } from '@/components/ui'
import { seoMeta } from '@/lib/seo'

export const Route = createFileRoute('/api')({
  head: () => ({
    meta: seoMeta({
      title: 'DNS.NF Public API - DNS Lookup API, Reverse IP API, DNSSEC API',
      description:
        'Use the DNS.NF Public API at https://api.dns.nf for DNS lookup, reverse IP, subdomain discovery, reverse NS, reverse MX, rDNS, and DNSSEC checks.',
      keywords: ['DNS API', 'public DNS API', 'DNS lookup API', 'reverse IP API', 'DNSSEC API', 'DNS查询API'],
    }),
  }),
  component: PublicApiPage,
})

const API_BASE = 'https://api.dns.nf'
const WEBSITE = 'https://dns.nf'

type ApiParam = {
  name: string
  type: string
  required?: boolean
  defaultValue: string
  description: string
}

type ApiEndpoint = {
  method: 'GET'
  path: string
  title: string
  description: string
  params: ApiParam[]
}

type ResponseState = {
  status: number
  contentType: string
  body: string
}

const endpoints: ApiEndpoint[] = [
  {
    method: 'GET',
    path: '/v1/dns/lookup',
    title: 'DNS Lookup',
    description: 'Resolve A, AAAA, CNAME, MX, NS, TXT, SOA, CAA, SRV, PTR, or ALL records.',
    params: [
      { name: 'domain', type: 'string', required: true, defaultValue: 'example.com', description: 'Domain name, IPv4 address, or IPv4 CIDR target.' },
      { name: 'type', type: 'string', defaultValue: 'ALL', description: 'Record type. Use ALL for a complete lookup.' },
    ],
  },
  {
    method: 'GET',
    path: '/v1/dns/reverse-ip',
    title: 'Reverse IP',
    description: 'Find domains observed on the same IPv4 address.',
    params: [{ name: 'ip', type: 'string', required: true, defaultValue: '8.8.8.8', description: 'IPv4 address to search.' }],
  },
  {
    method: 'GET',
    path: '/v1/dns/subdomains',
    title: 'Subdomains',
    description: 'Discover public subdomain observations for a registered domain.',
    params: [
      { name: 'domain', type: 'string', required: true, defaultValue: 'example.com', description: 'Root domain to inspect.' },
      { name: 'limit', type: 'integer', defaultValue: '200', description: 'Maximum number of results to return.' },
    ],
  },
  {
    method: 'GET',
    path: '/v1/dns/reverse-ns',
    title: 'Reverse NS',
    description: 'Find domains sharing name-server infrastructure.',
    params: [
      { name: 'domain', type: 'string', required: true, defaultValue: 'example.com', description: 'Domain whose NS records will be correlated.' },
      { name: 'limit', type: 'integer', defaultValue: '50', description: 'Maximum number of results to return.' },
    ],
  },
  {
    method: 'GET',
    path: '/v1/dns/reverse-mx',
    title: 'Reverse MX',
    description: 'Find domains sharing mail exchanger infrastructure.',
    params: [
      { name: 'domain', type: 'string', required: true, defaultValue: 'example.com', description: 'Domain whose MX records will be correlated.' },
      { name: 'limit', type: 'integer', defaultValue: '50', description: 'Maximum number of results to return.' },
    ],
  },
  {
    method: 'GET',
    path: '/v1/dns/rdns',
    title: 'rDNS Search',
    description: 'Search stored PTR records by keyword.',
    params: [
      { name: 'keyword', type: 'string', required: true, defaultValue: 'google', description: 'PTR keyword to match.' },
      { name: 'mode', type: 'string', defaultValue: 'middle', description: 'Search mode: prefix, suffix, exact, or middle.' },
      { name: 'limit', type: 'integer', defaultValue: '200', description: 'Maximum number of results to return.' },
    ],
  },
  {
    method: 'GET',
    path: '/v1/dns/dnssec',
    title: 'DNSSEC',
    description: 'Inspect DS, DNSKEY, RRSIG, and NSEC records.',
    params: [{ name: 'domain', type: 'string', required: true, defaultValue: 'example.com', description: 'Domain to inspect.' }],
  },
]

const responseExample = `{
  "code": 0,
  "data": {
    "query": "example.com",
    "records": {
      "A": ["93.184.216.34"],
      "MX": []
    }
  },
  "cached": false,
  "timestamp": 1783340000
}`

const featureRows = [
  ['DNS Lookup', '/dns-lookup', '/v1/dns/lookup', 'A/AAAA/CNAME/MX/NS/SOA/SRV/TXT/CAA records for domain targets'],
  ['rDNS Scanner', '/rdns', '/v1/dns/rdns', 'IPv4/CIDR concurrent scan, PTR+CNAME match modes, scoring and hint labels'],
  ['Reverse IP', '/reverse-ip', '/api/reverse-ip', 'Find public domains pointing to one IPv4, with source labels and JSON/CSV export'],
  ['Reverse NS', '/reverse-ns', '/api/reverse-ns', 'Find domains sharing authoritative NS servers'],
  ['Reverse MX', '/reverse-mx', '/api/reverse-mx', 'Find domains sharing MX mail servers'],
  ['Subdomain Discovery', '/subdomains', '/api/subdomains', 'Public host/subdomain discovery with source labels and JSON/CSV export'],
  ['DNSSEC', '/dnssec', '/api/dnssec', 'DS / DNSKEY / RRSIG / NSEC checks with 0-100 security score and strong/partial/weak status'],
  ['DNS History', '/dns-history', '/v1/dns/history', 'Read passive DNS records from CIRCL, Robtex, and local query history'],
]

const endpointRows = [
  ['GET', '/v1/dns/lookup', 'domain, type?', 'Standard DNS lookup for domain targets', '60 req/min per client IP'],
  ['GET', '/v1/dns/rdns', 'target (ipv4|cidr)', 'Concurrent reverse DNS scan with PTR/CNAME scoring', '30s cooldown per client'],
  ['GET', '/api/reverse-ip', 'ip', 'Find public domains pointing to an IPv4', 'Public source dependent'],
  ['GET', '/api/reverse-ns', 'domain, limit?', 'Find domains sharing authoritative NS servers', 'Server-side capped and cached'],
  ['GET', '/api/reverse-mx', 'domain, limit?', 'Find domains sharing MX mail servers', 'Server-side capped and cached'],
  ['GET', '/api/subdomains', 'domain', 'Find public host records under target domain', 'Server-side capped and cached'],
  ['GET', '/api/dnssec', 'domain', 'DS/DNSKEY/RRSIG/NSEC checks with 0-100 security score', '60 req/min per client IP'],
  ['GET', '/v1/dns/history', 'domain, limit?', 'Passive DNS history from CIRCL, Robtex, and local records', '60 req/min per client IP'],
  ['GET', '/health', '(none)', 'Health check endpoint', 'No token required'],
]

const recordExplainRows = [
  ['A', 'Domain', 'IPv4 address mapping'],
  ['AAAA', 'Domain', 'IPv6 address mapping'],
  ['CNAME', 'Domain', 'Alias target chain'],
  ['MX', 'Domain', 'Mail server routing and priority'],
  ['NS', 'Domain', 'Authoritative name servers'],
  ['PTR', 'IP/Domain(A/AAAA)', 'Reverse lookup hostname'],
  ['SOA', 'Domain', 'Zone authority metadata'],
  ['SRV', 'Domain', 'Service endpoint target/port/priority'],
  ['TXT', 'Domain', 'Text policies and verification strings'],
  ['CAA', 'Domain', 'Allowed certificate authorities'],
  ['SPF / DMARC / DKIM', 'TXT class', 'Auto-grouped under TXT in this system'],
]

const terminalExamples = [
  {
    id: 'dns-all',
    label: 'DNS ALL',
    description: 'Lookup full standard record set for a domain',
    endpoint: '/v1/dns/lookup',
    query: 'domain=microsoft.com&type=ALL',
    response: {
      code: 0,
      data: {
        domain: 'microsoft.com',
        reverse_dns: ['13.107.253.44 r-0001.example.net'],
        records: {
          A: ['13.107.253.44', '13.107.226.44'],
          AAAA: ['2603:1030:b:3::152'],
          MX: [{ host: 'microsoft-com.mail.protection.outlook.com', pref: 10 }],
          NS: ['ns1-39.azure-dns.com', 'ns2-39.azure-dns.net'],
          TXT: ['SPF: v=spf1 include:spf.protection.outlook.com -all'],
        },
      },
      cached: false,
      timestamp: 1771545000,
    },
  },
  {
    id: 'rdns-cidr',
    label: 'rDNS CIDR',
    description: 'Scan PTR/CNAME over CIDR with match filters',
    endpoint: '/v1/dns/rdns',
    query: 'target=8.8.8.0/30&match_mode=middle&match_target=both',
    response: {
      code: 0,
      data: {
        target: '8.8.8.0/30',
        scanned: 2,
        with_ptr: 1,
        without_ptr: 1,
        results: [
          {
            ip: '8.8.8.1',
            ptr: ['dns.google'],
            cname: [],
            ok: true,
            residential_score: 30,
            hint: 'datacenter_ptr_keyword',
            updated_at: '2026-02-20T06:15:20Z',
          },
        ],
      },
      cached: false,
      timestamp: 1771545050,
    },
  },
  {
    id: 'reverse-ip',
    label: 'Reverse IP',
    description: 'Find public domains that resolve to one IPv4',
    endpoint: '/api/reverse-ip',
    origin: WEBSITE,
    query: 'ip=8.8.8.8',
    response: {
      code: 0,
      data: {
        ip: '8.8.8.8',
        total: 2,
        domains: [
          { domain: 'dns.google', sources: ['hackertarget'] },
          { domain: 'resolver.google', sources: ['yougetsignal'] },
        ],
      },
      cached: true,
      timestamp: 1771545100,
    },
  },
  {
    id: 'reverse-ns',
    label: 'Reverse NS',
    description: 'Find domains sharing authoritative NS',
    endpoint: '/api/reverse-ns',
    origin: WEBSITE,
    query: 'domain=example.com&limit=20',
    response: {
      code: 0,
      data: {
        target: 'example.com',
        ns: ['ns1.example-dns.com', 'ns2.example-dns.com'],
        total_shared: 3,
        items: [{ domain: 'sample.net', shared_ns: ['ns1.example-dns.com'], source_ips: ['93.184.216.34'] }],
      },
      cached: false,
      timestamp: 1771545150,
    },
  },
  {
    id: 'reverse-mx',
    label: 'Reverse MX',
    description: 'Find domains sharing MX mail servers',
    endpoint: '/api/reverse-mx',
    origin: WEBSITE,
    query: 'domain=example.com&limit=20',
    response: {
      code: 0,
      data: {
        target: 'example.com',
        mx: ['mx1.example-mail.com'],
        total_shared: 2,
        items: [{ domain: 'sample.org', shared_mx: ['mx1.example-mail.com'], source_ips: ['203.0.113.10'] }],
      },
      cached: false,
      timestamp: 1771545180,
    },
  },
  {
    id: 'dns-history',
    label: 'DNS History',
    description: 'Passive DNS records from CIRCL, Robtex, and local query history',
    endpoint: '/v1/dns/history',
    query: 'domain=cloudflare.com&limit=10',
    response: {
      code: 0,
      data: {
        domain: 'cloudflare.com',
        records: [
          { type: 'A', value: '104.16.133.229', first_seen: '2024-01-15T08:30:00Z', last_seen: '2026-02-20T12:00:00Z', source: 'circl' },
          { type: 'A', value: '104.16.132.229', first_seen: '2024-01-15T08:30:00Z', last_seen: '2026-02-20T12:00:00Z', source: 'robtex' },
          { type: 'AAAA', value: '2606:4700::6810:85e5', first_seen: '2024-03-10T14:20:00Z', last_seen: '2026-02-18T09:15:00Z', source: 'local' },
        ],
        total: 3,
      },
      cached: true,
      timestamp: 1771545200,
    },
  },
]

const oldLanguageTabs = ['curl', 'node', 'php', 'python', 'go', 'java'] as const

const oldErrorRows = [
  ['200', 'Success - response body contains code, data, cached, timestamp.'],
  ['400', 'Bad Request - missing or invalid query parameters.'],
  ['404', 'Not Found - no records found for the requested target.'],
  ['429', 'Too Many Requests - public rate limit or scan cooldown exceeded.'],
  ['500', 'Internal Server Error - upstream lookup failure.'],
] satisfies Array<readonly [string, string]>

const DEFAULT_ENDPOINT = endpoints[0]!

function PublicApiPage() {
  const [language, setLanguage] = React.useState('curl')
  const [terminalLanguage, setTerminalLanguage] = React.useState<(typeof oldLanguageTabs)[number]>('curl')
  const [terminalExampleId, setTerminalExampleId] = React.useState(terminalExamples[0]!.id)
  const [serverUrl, setServerUrl] = React.useState(API_BASE)
  const [endpointPath, setEndpointPath] = React.useState(DEFAULT_ENDPOINT.path)
  const [params, setParams] = React.useState<Record<string, string>>(() => defaultsFor(DEFAULT_ENDPOINT))
  const [response, setResponse] = React.useState<ResponseState | null>(null)
  const [isSending, setIsSending] = React.useState(false)

  const endpoint = endpoints.find((item) => item.path === endpointPath) ?? DEFAULT_ENDPOINT
  const terminalExample = terminalExamples.find((item) => item.id === terminalExampleId) ?? terminalExamples[0]!
  const fullUrl = buildRequestUrl(serverUrl, endpoint, params)
  const codeExamples = React.useMemo(() => buildExamples(serverUrl, endpoint, params), [endpoint, params, serverUrl])
  const terminalRequest = buildOldRequestSnippet(terminalLanguage, terminalExample)
  const terminalResponse = JSON.stringify(terminalExample.response, null, 2)

  function chooseEndpoint(nextPath: string) {
    const nextEndpoint = endpoints.find((item) => item.path === nextPath) ?? DEFAULT_ENDPOINT
    setEndpointPath(nextEndpoint.path)
    setParams(defaultsFor(nextEndpoint))
    setResponse(null)
  }

  function updateParam(name: string, value: string) {
    setParams((current) => ({ ...current, [name]: value }))
  }

  async function sendRequest() {
    setIsSending(true)
    setResponse(null)

    try {
      const result = await fetch(toBrowserRequestUrl(fullUrl), {
        method: endpoint.method,
        headers: { Accept: 'application/json' },
      })
      const contentType = result.headers.get('content-type') || 'text/plain'
      const text = await result.text()
      setResponse({
        status: result.status,
        contentType,
        body: formatBody(text, contentType),
      })
    } catch (error) {
      setResponse({
        status: 0,
        contentType: 'text/plain',
        body: error instanceof Error ? error.message : 'Request failed',
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm shadow-zinc-200/40">
        <div className="border-b border-zinc-100 bg-zinc-950 p-6 text-white">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <StatusBadge tone="green">Public API</StatusBadge>
                <span className="inline-flex items-center rounded-md border border-white/15 bg-white/10 px-2 py-1 text-xs font-medium text-zinc-100">
                  v1
                </span>
              </div>
              <h1 className="text-3xl font-semibold tracking-normal">DNS.NF Public API</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-300">
                Query DNS records, reverse IP data, infrastructure relationships, PTR search, and DNSSEC records from {API_BASE}.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" className="h-9 text-xs" onClick={() => copyText(markdownFor(endpoint, fullUrl, codeExamples.curl))}>
                <Clipboard className="h-4 w-4" />
                Copy
              </Button>
              <Button variant="secondary" size="sm" className="h-9 text-xs" onClick={() => openUrl(fullUrl)}>
                <ExternalLink className="h-4 w-4" />
                Open
              </Button>
            </div>
          </div>
        </div>
        <div className="divide-y divide-zinc-100">
          <ApiFact icon={Globe2} title="Website" value={WEBSITE} />
          <ApiFact icon={KeyRound} title="Auth" value="No API key required" />
          <ApiFact icon={Timer} title="Limit" value="60 requests / minute" />
          <ApiFact icon={ShieldCheck} title="Transport" value="HTTPS JSON" />
        </div>
      </section>

      <Card className="overflow-hidden">
        <CardHeader className="bg-zinc-50 p-0">
          <div className="space-y-3 border-b border-zinc-100 p-4">
            <div className="grid gap-2">
              <label className="text-xs font-medium uppercase text-zinc-500">Server URL</label>
              <div className="flex min-w-0 items-center rounded-lg border border-zinc-200 bg-white p-1 shadow-sm shadow-zinc-200/50">
                <Input
                  value={serverUrl}
                  onChange={(event) => setServerUrl(event.target.value)}
                  className="h-9 border-0 bg-transparent font-mono focus:border-0 focus:ring-0"
                  aria-label="Server URL"
                />
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Copy server URL" onClick={() => copyText(serverUrl)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-medium uppercase text-zinc-500">Endpoint</label>
              <Select
                value={endpoint.path}
                onValueChange={chooseEndpoint}
                options={endpoints.map((item) => ({ value: item.path, label: item.title }))}
                ariaLabel="Endpoint"
              />
            </div>
          </div>
          <div className="space-y-3 px-4 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone="blue" className="font-mono">
                {endpoint.method}
              </StatusBadge>
              <div className="min-w-0 flex-1 break-all font-mono text-sm text-zinc-950">{endpoint.path}</div>
            </div>
            <Button onClick={sendRequest} disabled={isSending} className="w-full">
              <Send className="h-4 w-4" />
              {isSending ? 'Sending' : 'Send'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-0">
          <div className="border-b border-zinc-100 bg-zinc-50/70 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={responseTone(response?.status)}>{response ? displayStatus(response.status) : 'Ready'}</StatusBadge>
              <span className="text-xs font-medium text-zinc-500">{response?.contentType || 'application/json'}</span>
              {response ? (
                <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setResponse(null)}>
                  <X className="h-4 w-4" />
                  Close
                </Button>
              ) : null}
            </div>
            <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm shadow-zinc-200/40">
              <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2">
                <LinkIcon className="h-4 w-4 shrink-0 text-zinc-400" />
                <span className="min-w-0 flex-1 break-all font-mono text-xs text-zinc-600">{fullUrl}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Copy request URL" onClick={() => copyText(fullUrl)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words p-4 text-xs leading-6 text-zinc-800">
                {response?.body || '{\n  "message": "Click Send to run this request from your browser."\n}'}
              </pre>
            </div>
          </div>

          <section className="space-y-3 px-5 pb-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-normal text-zinc-950">Query Parameters</h2>
                <p className="mt-1 text-sm leading-6 text-zinc-500">{endpoint.description}</p>
              </div>
              <Badge>GET</Badge>
            </div>
            <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-200">
              {endpoint.params.map((param) => (
                <div key={param.name} className="grid gap-3 p-4">
                  <div>
                    <div className="font-mono text-sm font-semibold text-zinc-950">
                      {param.name}
                      {param.required ? <span className="text-red-500">*</span> : null}{' '}
                      <span className="font-normal text-zinc-400">{param.type}</span>
                    </div>
                    <div className="mt-1 text-sm leading-6 text-zinc-600">{param.description}</div>
                  </div>
                  <Input value={params[param.name] ?? ''} onChange={(event) => updateParam(param.name, event.target.value)} />
                </div>
              ))}
            </div>
          </section>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between bg-zinc-50/60">
          <div>
            <div className="text-sm font-medium">Code Examples</div>
            <div className="mt-1 text-xs text-zinc-500">Generated from the request above.</div>
          </div>
          <Code2 className="h-4 w-4 text-zinc-400" />
        </CardHeader>
        <CardContent>
          <Tabs
            value={language}
            onValueChange={setLanguage}
            tabs={Object.entries(codeExamples).map(([key, code]) => ({
              value: key,
              label: key === 'javascript' ? 'JavaScript' : key === 'python' ? 'Python' : key === 'curl' ? 'cURL' : key.toUpperCase(),
              content: <CodeBlock code={code} />,
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between bg-zinc-50/60">
          <div className="text-sm font-medium">200 Response</div>
          <Button variant="ghost" size="icon" aria-label="Copy response example" onClick={() => copyText(responseExample)}>
            <Copy className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <CodeBlock code={responseExample} />
        </CardContent>
      </Card>

      <ReferenceTable
        title="Feature Matrix"
        headers={['Feature', 'Page', 'API', 'Description']}
        rows={featureRows}
        codeColumns={[1, 2]}
      />

      <ReferenceTable
        title="API Endpoints"
        headers={['Method', 'Path', 'Query', 'Purpose', 'Limit / Rule']}
        rows={endpointRows}
        codeColumns={[1, 2]}
        methodColumn={0}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between bg-zinc-50/60">
          <div>
            <div className="text-sm font-medium">Interactive Terminal Demo</div>
            <div className="mt-1 text-xs text-zinc-500">Examples from the original API documentation, restyled for this console.</div>
          </div>
          <Code2 className="h-4 w-4 text-zinc-400" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {oldLanguageTabs.map((item) => (
              <Button key={item} variant={terminalLanguage === item ? 'default' : 'outline'} size="sm" onClick={() => setTerminalLanguage(item)}>
                {item === 'node' ? 'Node.js' : item.toUpperCase()}
              </Button>
            ))}
          </div>
          <div className="grid gap-4">
            <div className="grid content-start gap-2">
              {terminalExamples.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTerminalExampleId(item.id)}
                  className={`rounded-lg border p-3 text-left transition ${
                    terminalExampleId === item.id ? 'border-zinc-950 bg-zinc-950 text-white' : 'border-zinc-200 bg-white hover:bg-zinc-50'
                  }`}
                >
                  <div className="text-sm font-semibold">{item.label}</div>
                  <div className={`mt-1 text-xs leading-5 ${terminalExampleId === item.id ? 'text-zinc-300' : 'text-zinc-500'}`}>
                    {item.description}
                  </div>
                </button>
              ))}
            </div>
            <div className="grid gap-4">
              <CodeBlock code={terminalRequest} />
              <CodeBlock code={terminalResponse} />
            </div>
          </div>
        </CardContent>
      </Card>

      <ReferenceTable
        title="Record Types And Meaning"
        headers={['Type', 'Target', 'What It Means']}
        rows={recordExplainRows}
        codeColumns={[0]}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between bg-zinc-50/60">
          <div className="text-sm font-medium">Response & Errors</div>
          <Braces className="h-4 w-4 text-zinc-400" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {oldErrorRows.map(([code, meaning]) => (
              <LimitCard key={code} code={code} title={code} body={meaning} />
            ))}
          </div>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 font-mono text-xs text-zinc-700">
            {'{ code: number, data: any, cached: boolean, timestamp: number }'}
          </div>
        </CardContent>
      </Card>

      <blockquote className="rounded-lg border border-zinc-200 bg-white p-5 text-sm leading-6 text-zinc-600 shadow-sm shadow-zinc-200/40">
        DNS.NF queries only publicly available DNS data and public datasets. Some results may be incomplete or delayed.
      </blockquote>
    </div>
  )
}

function defaultsFor(endpoint: ApiEndpoint) {
  return Object.fromEntries(endpoint.params.map((param) => [param.name, param.defaultValue]))
}

function buildRequestUrl(baseUrl: string, endpoint: ApiEndpoint, params: Record<string, string>) {
  const cleanBase = baseUrl.replace(/\/+$/, '') || API_BASE
  const url = new URL(`${cleanBase}${endpoint.path}`, browserOrigin())

  endpoint.params.forEach((param) => {
    const value = params[param.name]?.trim()
    if (value) url.searchParams.set(param.name, value)
  })

  return url.toString()
}

function toBrowserRequestUrl(value: string) {
  if (typeof window === 'undefined' || !isLocalDevHost(window.location.hostname)) return value

  const url = new URL(value)
  if (url.hostname !== 'api.dns.nf') return value

  return `/api-proxy${url.pathname}${url.search}`
}

function buildExamples(baseUrl: string, endpoint: ApiEndpoint, params: Record<string, string>) {
  const url = buildRequestUrl(baseUrl, endpoint, params)
  const cleanBase = baseUrl.replace(/\/+$/, '') || API_BASE
  const queryPairs = endpoint.params
    .map((param) => [param.name, params[param.name]?.trim()] as const)
    .filter(([, value]) => Boolean(value))

  const jsParams = queryPairs.map(([key, value]) => `url.searchParams.set("${key}", "${escapeDouble(value || '')}");`).join('\n')
  const pyParams = queryPairs.map(([key, value]) => `        "${key}": "${escapeDouble(value || '')}",`).join('\n')
  const goParams = queryPairs.map(([key, value]) => `	q.Set("${key}", "${escapeDouble(value || '')}")`).join('\n')
  const phpParams = queryPairs.map(([key, value]) => `    "${key}" => "${escapeDouble(value || '')}",`).join('\n')

  return {
    curl: `curl -X ${endpoint.method} "${url}" \\
  -H "Accept: application/json"`,
    javascript: `const url = new URL("${cleanBase}${endpoint.path}");
${jsParams}

const response = await fetch(url, {
  headers: { "Accept": "application/json" },
});

if (!response.ok) throw new Error(await response.text());

const result = await response.json();
console.log(result);`,
    python: `import requests

response = requests.get(
    "${cleanBase}${endpoint.path}",
    params={
${pyParams}
    },
    headers={"Accept": "application/json"},
    timeout=10,
)
response.raise_for_status()

print(response.json())`,
    go: `package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"
)

func main() {
	u, _ := url.Parse("${cleanBase}${endpoint.path}")
	q := u.Query()
${goParams}
	u.RawQuery = q.Encode()

	client := &http.Client{Timeout: 10 * time.Second}
	req, _ := http.NewRequest("${endpoint.method}", u.String(), nil)
	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	var payload map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		panic(err)
	}
	fmt.Println(payload)
}`,
    php: `<?php
$url = "${cleanBase}${endpoint.path}?" . http_build_query([
${phpParams}
]);

$context = stream_context_create([
    "http" => [
        "header" => "Accept: application/json\\r\\n",
        "timeout" => 10,
    ],
]);

$json = file_get_contents($url, false, $context);
if ($json === false) {
    throw new RuntimeException("DNS.NF API request failed");
}

print_r(json_decode($json, true));`,
  }
}

function formatBody(text: string, contentType: string) {
  if (!text) return ''
  if (!contentType.includes('json')) return text

  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return text
  }
}

function responseTone(status?: number) {
  if (!status) return 'zinc'
  if (status >= 200 && status < 300) return 'green'
  if (status === 429) return 'amber'
  return 'red'
}

function displayStatus(status: number) {
  return status === 0 ? 'Network error' : String(status)
}

function escapeDouble(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function copyText(value: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    void navigator.clipboard.writeText(value)
  }
}

function openUrl(value: string) {
  if (typeof window !== 'undefined') {
    window.open(value, '_blank', 'noopener,noreferrer')
  }
}

function browserOrigin() {
  return typeof window === 'undefined' ? API_BASE : window.location.origin
}

function isLocalDevHost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

function markdownFor(endpoint: ApiEndpoint, url: string, curl: string) {
  return `# ${endpoint.title}

${endpoint.description}

Base URL: ${API_BASE}
Website: ${WEBSITE}
Rate limit: 60 requests / minute

\`\`\`bash
${curl}
\`\`\`

Request URL:
${url}
`
}

function buildOldRequestSnippet(language: (typeof oldLanguageTabs)[number], example: (typeof terminalExamples)[number]) {
  const url = `${example.origin ?? API_BASE}${example.endpoint}?${example.query}`

  if (language === 'curl') {
    return `curl -sS "${url}" \\
  -H "Accept: application/json"`
  }

  if (language === 'node') {
    return `const response = await fetch("${url}", {
  headers: { "Accept": "application/json" },
});

if (!response.ok) {
  throw new Error(await response.text());
}

const data = await response.json();
console.log(data);`
  }

  if (language === 'php') {
    return `<?php
$context = stream_context_create([
    "http" => [
        "header" => "Accept: application/json\\r\\n",
        "timeout" => 10,
    ],
]);

$json = file_get_contents("${url}", false, $context);
if ($json === false) {
    throw new RuntimeException("DNS.NF API request failed");
}

print_r(json_decode($json, true));`
  }

  if (language === 'python') {
    return `import requests

response = requests.get(
    "${url}",
    headers={"Accept": "application/json"},
    timeout=10,
)
response.raise_for_status()

print(response.json())`
  }

  if (language === 'go') {
    return `package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

func main() {
	client := &http.Client{Timeout: 10 * time.Second}
	req, _ := http.NewRequest("GET", "${url}", nil)
	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	var payload map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		panic(err)
	}
	fmt.Println(payload)
}`
  }

  return `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class DnsNfExample {
  public static void main(String[] args) throws Exception {
    HttpClient client = HttpClient.newHttpClient();
    HttpRequest request = HttpRequest.newBuilder()
      .uri(URI.create("${url}"))
      .header("Accept", "application/json")
      .GET()
      .build();

    HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
    System.out.println(response.body());
  }
}`
}

function ReferenceTable({
  title,
  headers,
  rows,
  codeColumns = [],
  methodColumn,
}: {
  title: string
  headers: string[]
  rows: string[][]
  codeColumns?: number[]
  methodColumn?: number
}) {
  return (
    <Card>
      <CardHeader className="bg-zinc-50/60">
        <div className="text-sm font-medium">{title}</div>
      </CardHeader>
      <CardContent className="grid gap-3">
        {rows.map((row) => (
          <div key={row.join('|')} className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="grid gap-3">
              {row.map((cell, index) => (
                <div key={`${cell}-${index}`} className="grid gap-1">
                  <div className="text-xs font-medium uppercase text-zinc-400">{headers[index]}</div>
                  <div className="text-sm leading-6 text-zinc-700">
                    {methodColumn === index ? (
                      <StatusBadge tone="blue" className="font-mono">
                        {cell}
                      </StatusBadge>
                    ) : codeColumns.includes(index) ? (
                      <code className="break-all rounded-md bg-zinc-100 px-1.5 py-1 font-mono text-xs text-zinc-900">{cell}</code>
                    ) : (
                      cell
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function ApiFact({ icon: Icon, title, value }: { icon: typeof Globe2; title: string; value: string }) {
  return (
    <div className="p-5">
      <div className="flex items-center gap-2 text-xs font-medium uppercase text-zinc-500">
        <Icon className="h-4 w-4 text-sky-600" />
        {title}
      </div>
      <div className="mt-2 break-words font-mono text-sm text-zinc-950">{value}</div>
    </div>
  )
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-950">
      <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words p-4 text-xs leading-6 text-zinc-50">{code}</pre>
    </div>
  )
}

function LimitCard({ code, title, body }: { code: string; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <StatusBadge tone={code === '200' ? 'green' : code === '429' ? 'amber' : code === '404' ? 'zinc' : 'red'}>{code}</StatusBadge>
      <div className="mt-3 flex items-center gap-2 text-sm font-medium text-zinc-950">
        <CheckCircle2 className="h-4 w-4 text-zinc-400" />
        {title}
      </div>
      <div className="mt-2 text-sm leading-6 text-zinc-600">{body}</div>
    </div>
  )
}
