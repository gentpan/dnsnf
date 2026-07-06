import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
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
import { PageHero } from '@/components/page-hero'
import { Badge, Button, Card, CardContent, CardHeader, Input, StatusBadge } from '@/components/ui'
import { seoMeta } from '@/lib/seo'

export const Route = createFileRoute('/api')({
  head: () => ({
    meta: seoMeta({
      title: 'DNS.NF Public API - DNS Lookup API, Reverse IP API, DNSSEC API',
      description:
        'Use the DNS.NF Public API at https://api.dns.nf for DNS lookup, reverse IP, subdomain discovery, reverse NS, reverse MX, rDNS search, DNS history, and DNSSEC checks.',
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
  response: string
  notes?: string[]
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
    description: 'Resolve standard DNS records for domains, IPv4 addresses, or IPv4 CIDR targets.',
    params: [
      { name: 'domain', type: 'string', required: true, defaultValue: 'example.com', description: 'Domain name, IPv4 address, or IPv4 CIDR target. The API also accepts ip as an alias.' },
      { name: 'type', type: 'string', defaultValue: 'ALL', description: 'Record type: ALL, A, AAAA, CNAME, MX, NS, TXT, SOA, CAA, SRV, or PTR.' },
      { name: 'resolver', type: 'string', defaultValue: 'cloudflare', description: 'Resolver: local, cloudflare, google, ali, or tencent. local uses the api.dns.nf server system resolver.' },
    ],
    response: `{
  "code": 0,
  "data": {
    "domain": "example.com",
    "records": {
      "A": ["93.184.216.34"],
      "MX": []
    }
  },
  "cached": false,
  "timestamp": 1783340000
}`,
    notes: ['Use resolver=cloudflare for the default public resolver behavior.', 'Use type=ALL when you want the normalized record set shown in the DNS.NF console.'],
  },
  {
    method: 'GET',
    path: '/v1/dns/reverse-ip',
    title: 'Reverse IP',
    description: 'Find public domains observed on the same IPv4 address using best-effort public datasets.',
    params: [{ name: 'ip', type: 'string', required: true, defaultValue: '8.8.8.8', description: 'IPv4 address to search.' }],
    response: `{
  "code": 0,
  "data": {
    "ip": "8.8.8.8",
    "total": 2,
    "domains": [
      { "name": "dns.google", "sources": ["hackertarget"] }
    ],
    "completeness": "best_effort_public_sources"
  },
  "cached": true,
  "timestamp": 1783340000
}`,
    notes: ['Results depend on public source availability and may be incomplete.', 'The website paginates large result sets for easier review.'],
  },
  {
    method: 'GET',
    path: '/v1/dns/subdomains',
    title: 'Subdomains',
    description: 'Discover observed subdomains for a registered domain.',
    params: [
      { name: 'domain', type: 'string', required: true, defaultValue: 'example.com', description: 'Root domain to inspect.' },
      { name: 'limit', type: 'integer', defaultValue: '200', description: 'Maximum number of returned rows. Server cap applies.' },
    ],
    response: `{
  "code": 0,
  "data": {
    "target": "example.com",
    "total": 1,
    "items": [
      { "name": "www.example.com", "sources": ["crtsh"] }
    ]
  },
  "cached": false,
  "timestamp": 1783340000
}`,
  },
  {
    method: 'GET',
    path: '/v1/dns/reverse-ns',
    title: 'Reverse NS',
    description: 'Find domains sharing authoritative name-server infrastructure.',
    params: [
      { name: 'domain', type: 'string', required: true, defaultValue: 'example.com', description: 'Domain whose NS records will be correlated.' },
      { name: 'limit', type: 'integer', defaultValue: '50', description: 'Maximum number of returned rows.' },
    ],
    response: `{
  "code": 0,
  "data": {
    "target": "example.com",
    "ns": ["ns1.example-dns.com"],
    "total": 1,
    "items": [
      { "domain": "sample.net", "shared_ns": ["ns1.example-dns.com"] }
    ]
  },
  "cached": false,
  "timestamp": 1783340000
}`,
  },
  {
    method: 'GET',
    path: '/v1/dns/reverse-mx',
    title: 'Reverse MX',
    description: 'Find domains sharing mail exchanger infrastructure.',
    params: [
      { name: 'domain', type: 'string', required: true, defaultValue: 'example.com', description: 'Domain whose MX records will be correlated.' },
      { name: 'limit', type: 'integer', defaultValue: '50', description: 'Maximum number of returned rows.' },
    ],
    response: `{
  "code": 0,
  "data": {
    "target": "example.com",
    "mx": ["mx1.example-mail.com"],
    "total": 1,
    "items": [
      { "domain": "sample.org", "shared_mx": ["mx1.example-mail.com"] }
    ]
  },
  "cached": false,
  "timestamp": 1783340000
}`,
  },
  {
    method: 'GET',
    path: '/v1/dns/rdns',
    title: 'rDNS Search',
    description: 'Search stored PTR records by keyword.',
    params: [
      { name: 'keyword', type: 'string', required: true, defaultValue: 'google', description: 'PTR keyword. Minimum length is 2 characters.' },
      { name: 'mode', type: 'string', defaultValue: 'middle', description: 'Search mode: left, middle, or right.' },
      { name: 'limit', type: 'integer', defaultValue: '200', description: 'Maximum number of returned records. Maximum accepted value is 1000.' },
    ],
    response: `{
  "code": 0,
  "data": {
    "keyword": "google",
    "mode": "middle",
    "total": 1,
    "records": [
      { "ip": "8.8.8.8", "ptr": "dns.google" }
    ]
  },
  "timestamp": 1783340000
}`,
  },
  {
    method: 'GET',
    path: '/v1/dns/dnssec',
    title: 'DNSSEC',
    description: 'Inspect DS, DNSKEY, RRSIG, and NSEC records with a simple security score.',
    params: [{ name: 'domain', type: 'string', required: true, defaultValue: 'cloudflare.com', description: 'Domain to inspect.' }],
    response: `{
  "code": 0,
  "data": {
    "domain": "cloudflare.com",
    "score": 100,
    "status": "strong",
    "records": {
      "DS": { "values": ["..."], "confidence": "high" }
    }
  },
  "cached": false,
  "timestamp": 1783340000
}`,
  },
  {
    method: 'GET',
    path: '/v1/dns/history',
    title: 'DNS History',
    description: 'Read passive DNS history records stored by DNS.NF.',
    params: [
      { name: 'domain', type: 'string', required: true, defaultValue: 'cloudflare.com', description: 'Domain to search.' },
      { name: 'limit', type: 'integer', defaultValue: '500', description: 'Maximum number of records. Maximum accepted value is 2000.' },
    ],
    response: `{
  "code": 0,
  "data": {
    "domain": "cloudflare.com",
    "total": 1,
    "records": [
      { "type": "A", "value": "104.16.132.229", "source": "local" }
    ]
  },
  "timestamp": 1783340000
}`,
  },
]

const languageLabels: Record<string, string> = {
  curl: 'cURL',
  javascript: 'JavaScript',
  python: 'Python',
  go: 'Go',
  php: 'PHP',
  java: 'Java',
}

const errorRows = [
  ['200', 'Request succeeded. The response body contains code, data, cached when applicable, and timestamp.'],
  ['400', 'Missing or invalid query parameter.'],
  ['404', 'No matching DNS or relationship records were found.'],
  ['405', 'Unsupported HTTP method. Public endpoints use GET.'],
  ['429', 'Rate limit exceeded. The public v1 API is limited to 60 requests per minute per client IP.'],
  ['500 / 502', 'Server or upstream source error. Retry later or reduce request scope.'],
] satisfies Array<readonly [string, string]>

const recordRows = [
  ['A', 'IPv4 address mapping'],
  ['AAAA', 'IPv6 address mapping'],
  ['CNAME', 'Alias target chain'],
  ['MX', 'Mail routing host and priority'],
  ['NS', 'Authoritative name servers'],
  ['TXT', 'SPF, DMARC, DKIM, and verification strings'],
  ['SOA', 'Zone authority metadata'],
  ['CAA', 'Allowed certificate authorities'],
  ['SRV', 'Service target, port, priority, and weight'],
  ['PTR', 'Reverse lookup hostname'],
] satisfies Array<readonly [string, string]>

const DEFAULT_ENDPOINT = endpoints[0]!

function PublicApiPage() {
  const [language, setLanguage] = React.useState('curl')
  const [serverUrl, setServerUrl] = React.useState(API_BASE)
  const [endpointPath, setEndpointPath] = React.useState(DEFAULT_ENDPOINT.path)
  const [params, setParams] = React.useState<Record<string, string>>(() => defaultsFor(DEFAULT_ENDPOINT))
  const [response, setResponse] = React.useState<ResponseState | null>(null)
  const [isSending, setIsSending] = React.useState(false)

  const endpoint = endpoints.find((item) => item.path === endpointPath) ?? DEFAULT_ENDPOINT
  const fullUrl = buildRequestUrl(serverUrl, endpoint, params)
  const codeExamples = React.useMemo(() => buildExamples(serverUrl, endpoint, params), [endpoint, params, serverUrl])

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
      <PageHero
        variant="dark"
        eyebrow="Public API"
        title="DNS.NF Public API"
        badge="v1"
        badgeTone="green"
        body={<>Query DNS records, reverse IP relationships, subdomains, rDNS records, DNS history, and DNSSEC data from {API_BASE}.</>}
        actions={
          <>
            <Button variant="secondary" size="sm" className="h-10 justify-center" onClick={() => copyText(markdownFor(endpoint, fullUrl, codeExamples.curl))}>
              <Clipboard className="h-4 w-4" />
              Copy Markdown
            </Button>
            <Button variant="secondary" size="sm" className="h-10 justify-center" onClick={() => openUrl(fullUrl)}>
              <ExternalLink className="h-4 w-4" />
              Open Request
            </Button>
          </>
        }
        meta={
          <>
            <ApiFact icon={Globe2} title="Base URL" value={API_BASE} />
            <ApiFact icon={KeyRound} title="Authentication" value="No API key required" />
            <ApiFact icon={Timer} title="Rate Limit" value="60 requests / minute / client IP" />
            <ApiFact icon={ShieldCheck} title="Transport" value="HTTPS JSON" />
          </>
        }
        metaClassName="grid divide-y-0 sm:grid-cols-2 lg:grid-cols-4"
      />

      <Card>
        <CardHeader className="space-y-4 bg-zinc-50/70">
          <div>
            <div className="text-sm font-medium">Request Builder</div>
            <div className="mt-1 text-xs text-zinc-500">Choose an endpoint, edit parameters, then send a live request from this page.</div>
          </div>
          <div className="grid gap-3">
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
                options={endpoints.map((item) => ({ value: item.path, label: `${item.title} - ${item.path}` }))}
                ariaLabel="Endpoint"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone="blue" className="font-mono">
                {endpoint.method}
              </StatusBadge>
              <code className="min-w-0 flex-1 break-all rounded-md bg-zinc-100 px-2 py-1 font-mono text-xs text-zinc-900">{endpoint.path}</code>
            </div>
            <p className="text-sm leading-6 text-zinc-600">{endpoint.description}</p>
            {endpoint.notes ? (
              <div className="grid gap-2">
                {endpoint.notes.map((note) => (
                  <div key={note} className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs leading-5 text-zinc-600">
                    {note}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold tracking-normal text-zinc-950">Parameters</h2>
              <Badge>Query String</Badge>
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

          <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm shadow-zinc-200/40">
            <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2">
              <LinkIcon className="h-4 w-4 shrink-0 text-zinc-400" />
              <span className="min-w-0 flex-1 break-all font-mono text-xs text-zinc-600">{fullUrl}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Copy request URL" onClick={() => copyText(fullUrl)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-3 bg-zinc-50/70 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone={responseTone(response?.status)}>{response ? displayStatus(response.status) : 'Ready'}</StatusBadge>
                <span className="text-xs font-medium text-zinc-500">{response?.contentType || 'application/json'}</span>
                {response ? (
                  <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setResponse(null)}>
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                ) : null}
              </div>
              <Button onClick={sendRequest} disabled={isSending} className="w-full">
                <Send className="h-4 w-4" />
                {isSending ? 'Sending' : 'Send Request'}
              </Button>
            </div>
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words p-4 text-xs leading-6 text-zinc-800">
              {response?.body || '{\n  "message": "Click Send Request to run this endpoint from your browser."\n}'}
            </pre>
          </section>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between bg-zinc-50/60">
          <div>
            <div className="text-sm font-medium">Code Examples</div>
            <div className="mt-1 text-xs text-zinc-500">Generated from the request builder.</div>
          </div>
          <Code2 className="h-4 w-4 text-zinc-400" />
        </CardHeader>
        <CardContent>
          <Tabs
            value={language}
            onValueChange={setLanguage}
            tabs={Object.entries(codeExamples).map(([key, code]) => ({
              value: key,
              label: languageLabels[key] ?? key,
              content: <CodeBlock code={code} />,
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between bg-zinc-50/60">
          <div>
            <div className="text-sm font-medium">Response Example</div>
            <div className="mt-1 text-xs text-zinc-500">Shape for the selected endpoint.</div>
          </div>
          <Button variant="ghost" size="icon" aria-label="Copy response example" onClick={() => copyText(endpoint.response)}>
            <Copy className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <CodeBlock code={endpoint.response} />
        </CardContent>
      </Card>

      <ReferenceSection title="Endpoints" description="All public endpoints are GET endpoints under https://api.dns.nf.">
        {endpoints.map((item) => (
          <EndpointCard key={item.path} endpoint={item} />
        ))}
      </ReferenceSection>

      <ReferenceSection title="DNS Record Types" description="Record types supported by the DNS lookup endpoint.">
        {recordRows.map(([type, meaning]) => (
          <InfoRow key={type} label={type} value={meaning} code />
        ))}
      </ReferenceSection>

      <ReferenceSection title="Response & Errors" description="Common response codes returned by the public API.">
        {errorRows.map(([code, meaning]) => (
          <InfoRow key={code} label={code} value={meaning} code={code === '200'} tone={code === '200' ? 'green' : code === '429' ? 'amber' : 'zinc'} />
        ))}
      </ReferenceSection>

      <blockquote className="rounded-lg border border-zinc-200 bg-white p-5 text-sm leading-6 text-zinc-600 shadow-sm shadow-zinc-200/40">
        DNS.NF queries public DNS infrastructure and public datasets. Reverse relationships and subdomain results are best-effort and may be incomplete or delayed.
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
  const javaParams = queryPairs.map(([key, value]) => `    query.add("${key}=" + URLEncoder.encode("${escapeDouble(value || '')}", StandardCharsets.UTF_8));`).join('\n')

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
    java: `import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.StringJoiner;

public class DnsNfExample {
  public static void main(String[] args) throws Exception {
    StringJoiner query = new StringJoiner("&");
${javaParams}
    String url = "${cleanBase}${endpoint.path}?" + query;

    HttpRequest request = HttpRequest.newBuilder()
      .uri(URI.create(url))
      .header("Accept", "application/json")
      .GET()
      .build();

    HttpResponse<String> response = HttpClient.newHttpClient()
      .send(request, HttpResponse.BodyHandlers.ofString());

    System.out.println(response.body());
  }
}`,
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
Rate limit: 60 requests / minute / client IP

\`\`\`bash
${curl}
\`\`\`

Request URL:
${url}
`
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

function ReferenceSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="bg-zinc-50/60">
        <div className="text-sm font-medium">{title}</div>
        <div className="mt-1 text-xs leading-5 text-zinc-500">{description}</div>
      </CardHeader>
      <CardContent className="grid gap-3">{children}</CardContent>
    </Card>
  )
}

function EndpointCard({ endpoint }: { endpoint: ApiEndpoint }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge tone="blue" className="font-mono">
          {endpoint.method}
        </StatusBadge>
        <code className="break-all rounded-md bg-zinc-100 px-1.5 py-1 font-mono text-xs text-zinc-900">{endpoint.path}</code>
      </div>
      <div className="mt-3 text-sm font-semibold text-zinc-950">{endpoint.title}</div>
      <div className="mt-1 text-sm leading-6 text-zinc-600">{endpoint.description}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {endpoint.params.map((param) => (
          <span key={param.name} className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 font-mono text-xs text-zinc-700">
            {param.name}
            {param.required ? '*' : ''}
          </span>
        ))}
      </div>
    </div>
  )
}

function InfoRow({ label, value, code = false, tone = 'zinc' }: { label: string; value: string; code?: boolean; tone?: 'zinc' | 'green' | 'amber' }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap items-start gap-3">
        {code ? (
          <code className="rounded-md bg-zinc-100 px-1.5 py-1 font-mono text-xs text-zinc-900">{label}</code>
        ) : (
          <StatusBadge tone={tone}>{label}</StatusBadge>
        )}
        <div className="min-w-0 flex-1 text-sm leading-6 text-zinc-600">{value}</div>
      </div>
    </div>
  )
}
