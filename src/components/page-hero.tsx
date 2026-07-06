import * as React from 'react'
import { cn } from '@/lib/utils'
import { StatusBadge } from './ui'

type HeroTone = 'zinc' | 'green' | 'blue' | 'amber' | 'red'

export function PageHero({
  eyebrow,
  title,
  body,
  badge,
  badgeTone = 'zinc',
  eyebrowTone = 'blue',
  variant = 'default',
  actions,
  meta,
  metaClassName,
  className,
}: {
  eyebrow: string
  title: string
  body: React.ReactNode
  badge?: string
  badgeTone?: HeroTone
  eyebrowTone?: HeroTone
  variant?: 'default' | 'dark'
  actions?: React.ReactNode
  meta?: React.ReactNode
  metaClassName?: string
  className?: string
}) {
  const isDark = variant === 'dark'
  const eyebrowClassName = cn(
    'text-xs font-semibold uppercase tracking-normal',
    eyebrowTone === 'zinc' && (isDark ? 'text-zinc-300' : 'text-zinc-500'),
    eyebrowTone === 'green' && 'text-emerald-600',
    eyebrowTone === 'blue' && 'text-sky-600',
    eyebrowTone === 'amber' && 'text-amber-700',
    eyebrowTone === 'red' && 'text-red-600',
  )

  return (
    <section
      className={cn(
        'mb-5 overflow-hidden rounded-lg border shadow-sm',
        isDark ? 'border-zinc-800 bg-zinc-950 text-white shadow-zinc-950/10' : 'border-zinc-200 bg-white text-zinc-950 shadow-zinc-200/40',
        className,
      )}
    >
      <div className={cn('p-5 sm:p-6', isDark ? 'border-b border-white/10' : 'border-b border-zinc-100')}>
        <div className="flex items-start justify-between gap-3">
          <div className={eyebrowClassName}>{eyebrow}</div>
          {badge ? (
            <StatusBadge tone={badgeTone} className="w-fit shrink-0 whitespace-nowrap">
              {badge}
            </StatusBadge>
          ) : null}
        </div>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className={cn('text-2xl font-semibold tracking-normal sm:text-3xl', isDark ? 'text-white' : 'text-zinc-950')}>{title}</h1>
            <p className={cn('mt-2 max-w-3xl text-sm leading-6', isDark ? 'text-zinc-300' : 'text-zinc-600')}>{body}</p>
          </div>
        </div>
        {actions ? <div className="mt-5 grid gap-2 sm:grid-cols-2">{actions}</div> : null}
      </div>
      {meta ? (
        <div className={cn('divide-y', isDark ? 'divide-zinc-800 bg-white text-zinc-950' : 'divide-zinc-100', metaClassName)}>{meta}</div>
      ) : null}
    </section>
  )
}
