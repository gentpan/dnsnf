import { Select as BaseSelect } from '@base-ui/react/select'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Select({
  className,
  value,
  onValueChange,
  options,
  placeholder = 'Select',
  ariaLabel,
}: {
  className?: string
  value: string
  onValueChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
  ariaLabel?: string
}) {
  return (
    <BaseSelect.Root value={value} onValueChange={(next) => next !== null && onValueChange(next)} items={options}>
      <BaseSelect.Trigger
        aria-label={ariaLabel || placeholder}
        className={cn(
          'inline-flex h-10 min-w-36 items-center justify-between gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition hover:bg-zinc-50 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 data-[popup-open]:border-zinc-400 data-[popup-open]:bg-zinc-50',
          className,
        )}
      >
        <BaseSelect.Value placeholder={placeholder} />
        <BaseSelect.Icon>
          <ChevronsUpDown className="h-4 w-4 text-zinc-400" />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner sideOffset={6} alignItemWithTrigger={false}>
          <BaseSelect.Popup className="z-50 max-h-72 min-w-[var(--anchor-width)] overflow-hidden rounded-md border border-zinc-200 bg-white p-1 shadow-lg shadow-zinc-900/10 outline-none">
            <BaseSelect.ScrollUpArrow className="flex h-6 items-center justify-center text-zinc-400">
              <ChevronsUpDown className="h-3.5 w-3.5" />
            </BaseSelect.ScrollUpArrow>
            <BaseSelect.List className="max-h-64 overflow-auto">
              {options.map((option) => (
                <BaseSelect.Item
                  key={option.value}
                  value={option.value}
                  className="grid cursor-default grid-cols-[18px_1fr] items-center gap-2 rounded px-2 py-2 text-sm outline-none data-[highlighted]:bg-zinc-100 data-[selected]:font-medium"
                >
                  <BaseSelect.ItemIndicator className="text-zinc-950">
                    <Check className="h-4 w-4" />
                  </BaseSelect.ItemIndicator>
                  <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
            <BaseSelect.ScrollDownArrow className="flex h-6 items-center justify-center text-zinc-400">
              <ChevronsUpDown className="h-3.5 w-3.5" />
            </BaseSelect.ScrollDownArrow>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  )
}
