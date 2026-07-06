import * as React from 'react'
import { cn } from '@/lib/utils'

export function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'icon'
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300',
        size === 'default' && 'h-10 px-4',
        size === 'sm' && 'h-8 px-3 text-xs',
        size === 'icon' && 'h-9 w-9',
        variant === 'default' && 'bg-zinc-950 text-white hover:bg-zinc-800',
        variant === 'secondary' && 'bg-zinc-100 text-zinc-950 hover:bg-zinc-200',
        variant === 'outline' && 'border border-zinc-200 bg-white hover:bg-zinc-50',
        variant === 'ghost' && 'hover:bg-zinc-100',
        className,
      )}
      {...props}
    />
  )
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100',
        className,
      )}
      {...props}
    />
  )
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-lg border border-zinc-200 bg-white shadow-sm shadow-zinc-200/40', className)} {...props} />
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('border-b border-zinc-100 px-5 py-4', className)} {...props} />
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)} {...props} />
}

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-700',
        className,
      )}
      {...props}
    />
  )
}

export function StatusBadge({
  tone = 'zinc',
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: 'zinc' | 'green' | 'blue' | 'amber' | 'red' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium',
        tone === 'zinc' && 'border-zinc-200 bg-zinc-50 text-zinc-700',
        tone === 'green' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
        tone === 'blue' && 'border-sky-200 bg-sky-50 text-sky-700',
        tone === 'amber' && 'border-amber-200 bg-amber-50 text-amber-800',
        tone === 'red' && 'border-red-200 bg-red-50 text-red-700',
        className,
      )}
      {...props}
    />
  )
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-white/70 p-8 text-center">
      <div className="text-sm font-medium text-zinc-900">{title}</div>
      <div className="mt-2 text-sm text-zinc-500">{body}</div>
    </div>
  )
}
