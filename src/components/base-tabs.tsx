import * as React from 'react'
import { Tabs as BaseTabs } from '@base-ui/react/tabs'

export function Tabs({
  value,
  onValueChange,
  tabs,
}: {
  value: string
  onValueChange: (value: string) => void
  tabs: Array<{ value: string; label: string; content: React.ReactNode }>
}) {
  return (
    <BaseTabs.Root value={value} onValueChange={onValueChange}>
      <BaseTabs.List className="relative flex gap-1 rounded-lg border border-zinc-200 bg-zinc-100 p-1">
        {tabs.map((tab) => (
          <BaseTabs.Tab
            key={tab.value}
            value={tab.value}
            className="relative z-10 h-9 rounded-md px-3 text-sm font-medium text-zinc-600 outline-none transition hover:text-zinc-950 data-[selected]:text-zinc-950"
          >
            {tab.label}
          </BaseTabs.Tab>
        ))}
        <BaseTabs.Indicator className="absolute z-0 h-9 rounded-md bg-white shadow-sm transition-all" />
      </BaseTabs.List>
      {tabs.map((tab) => (
        <BaseTabs.Panel key={tab.value} value={tab.value} className="mt-4 outline-none">
          {tab.content}
        </BaseTabs.Panel>
      ))}
    </BaseTabs.Root>
  )
}
