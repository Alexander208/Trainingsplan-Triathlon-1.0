import type { ReactNode } from 'react'

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="mb-5 flex items-end justify-between gap-3">
      <div>
        {subtitle && <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{subtitle}</p>}
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      </div>
      {action}
    </header>
  )
}
