import { Keyboard } from 'lucide-react'
import { InfoDialog } from './base-overlays'
import { Button } from './ui'

export function HelpDialogTrigger() {
  return (
    <InfoDialog
      title="DNS.NF Console"
      description="A compact DNS intelligence workspace backed by the Go API."
      trigger={
        <Button variant="outline" size="icon" aria-label="Open console help">
          <Keyboard className="h-4 w-4" />
        </Button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          ['Lookup', 'Query DNS records or rDNS for IP and CIDR targets.'],
          ['Reverse IP', 'Find domains observed on the same IPv4 address.'],
          ['Shared NS/MX', 'Discover related domains by infrastructure.'],
          ['DNSSEC', 'Inspect DS, DNSKEY, RRSIG, and NSEC records.'],
        ].map(([title, body]) => (
          <div key={title} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Keyboard className="h-4 w-4 text-sky-600" />
              {title}
            </div>
            <div className="mt-2 text-sm leading-6 text-zinc-600">{body}</div>
          </div>
        ))}
      </div>
    </InfoDialog>
  )
}
