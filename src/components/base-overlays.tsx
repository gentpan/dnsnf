import * as React from 'react'
import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import { Popover as BasePopover } from '@base-ui/react/popover'
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip'
import { X } from 'lucide-react'

export function Tooltip({ children, content }: { children: React.ReactNode; content: React.ReactNode }) {
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger render={children as React.ReactElement} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner
          positionMethod="fixed"
          sideOffset={8}
          collisionPadding={12}
          collisionAvoidance={{ side: 'flip', align: 'shift', fallbackAxisSide: 'none' }}
          className="z-[1000]"
        >
          <BaseTooltip.Popup className="max-w-64 rounded-md border border-zinc-200 bg-zinc-950 px-2.5 py-1.5 text-xs leading-5 text-white shadow-lg shadow-zinc-900/20">
            <BaseTooltip.Arrow className="fill-zinc-950" />
            {content}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  )
}

export function InfoDialog({
  trigger,
  title,
  description,
  children,
}: {
  trigger: React.ReactNode
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <BaseDialog.Root>
      <BaseDialog.Trigger render={trigger as React.ReactElement} />
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="fixed inset-0 z-40 bg-zinc-950/35 backdrop-blur-sm" />
        <BaseDialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(calc(100vw-32px),620px)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-zinc-200 bg-white shadow-xl shadow-zinc-950/20 outline-none">
          <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4">
            <div>
              <BaseDialog.Title className="text-base font-semibold text-zinc-950">{title}</BaseDialog.Title>
              {description ? (
                <BaseDialog.Description className="mt-1 text-sm leading-6 text-zinc-500">
                  {description}
                </BaseDialog.Description>
              ) : null}
            </div>
            <BaseDialog.Close className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950">
              <X className="h-4 w-4" />
            </BaseDialog.Close>
          </div>
          <div className="max-h-[70vh] overflow-auto p-5">{children}</div>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  )
}

export function InfoPopover({
  trigger,
  title,
  children,
}: {
  trigger: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <BasePopover.Root>
      <BasePopover.Trigger render={trigger as React.ReactElement} />
      <BasePopover.Portal>
        <BasePopover.Positioner
          positionMethod="fixed"
          sideOffset={8}
          collisionPadding={12}
          collisionAvoidance={{ side: 'flip', align: 'shift', fallbackAxisSide: 'none' }}
          className="z-[1000]"
        >
          <BasePopover.Popup className="w-[min(18rem,calc(100vw-1.5rem))] rounded-lg border border-zinc-200 bg-white p-4 shadow-lg shadow-zinc-900/10 outline-none">
            <BasePopover.Arrow className="fill-white stroke-zinc-200" />
            <BasePopover.Title className="text-sm font-semibold text-zinc-950">{title}</BasePopover.Title>
            <BasePopover.Description className="mt-2 text-sm leading-6 text-zinc-600">
              {children}
            </BasePopover.Description>
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  )
}
