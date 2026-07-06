import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Tabs } from '@/components/base-tabs'
import { Card, CardContent, CardHeader, StatusBadge } from '@/components/ui'
import { PageTitle } from '@/components/QueryPanels'

export const Route = createFileRoute('/docs')({
  component: Page,
})

const endpoints = [
  ['GET', '/v1/dns/lookup?domain=example.com&type=ALL'],
  ['GET', '/v1/dns/lookup?ip=8.8.8.8&type=RDNS'],
  ['GET', '/v1/dns/reverse-ip?ip=8.8.8.8'],
  ['GET', '/v1/dns/subdomains?domain=example.com'],
  ['GET', '/v1/dns/reverse-ns?domain=example.com'],
  ['GET', '/v1/dns/reverse-mx?domain=example.com'],
  ['GET', '/v1/dns/rdns?keyword=google&mode=middle'],
  ['GET', '/v1/dns/dnssec?domain=example.com'],
]

function Page() {
  const [tab, setTab] = React.useState('public')
  const publicPanel = <EndpointTable endpoints={endpoints} />
  const internalPanel = (
    <EndpointTable
      endpoints={[
        ['GET', '/v2/dns/history?domain=example.com'],
        ['POST', '/v2/dns/history'],
        ['POST', '/v2/dns/rdns-records'],
      ]}
      tone="amber"
    />
  )
  const examplesPanel = (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between bg-zinc-50/60">
        <div className="text-sm font-medium">Examples</div>
        <StatusBadge tone="zinc">curl</StatusBadge>
      </CardHeader>
      <CardContent>
        <pre className="overflow-auto rounded-md bg-zinc-950 p-4 text-xs leading-6 text-zinc-50">
{`curl "http://localhost:8080/v1/dns/lookup?domain=cloudflare.com&type=ALL"
curl "http://localhost:8080/v1/dns/reverse-ip?ip=8.8.8.8"
curl "http://localhost:8080/v1/dns/dnssec?domain=example.com"`}
        </pre>
      </CardContent>
    </Card>
  )

  return (
    <>
      <PageTitle title="API Docs" body="Public endpoints are served by the Go API. Internal write endpoints remain under /v2 and require a token." />
      <Tabs
        value={tab}
        onValueChange={setTab}
        tabs={[
          { value: 'public', label: 'Public', content: publicPanel },
          { value: 'internal', label: 'Internal', content: internalPanel },
          { value: 'examples', label: 'Examples', content: examplesPanel },
        ]}
      />
    </>
  )
}

function EndpointTable({ endpoints, tone = 'blue' }: { endpoints: string[][]; tone?: 'blue' | 'amber' }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between bg-zinc-50/60">
        <div className="text-sm font-medium">{tone === 'blue' ? 'Public endpoints' : 'Internal endpoints'}</div>
        <StatusBadge tone={tone === 'blue' ? 'green' : 'amber'}>{tone === 'blue' ? 'v1' : 'v2'}</StatusBadge>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-zinc-100">
          {endpoints.map(([method, path]) => (
            <div key={path} className="grid gap-2 p-4 transition hover:bg-zinc-50/80 sm:grid-cols-[80px_1fr]">
              <StatusBadge tone={tone} className="w-fit font-mono">
                {method}
              </StatusBadge>
              <div className="overflow-auto font-mono text-sm">{path}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
