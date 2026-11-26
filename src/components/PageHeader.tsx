import type { ReactNode } from 'react'
import { ThemeToggle } from './ThemeToggle'

/** Seitenkopf mit Titel – rechts oben immer der Lampen-Knopf für hell/dunkel. */
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="mb-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        {subtitle && <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{subtitle}</p>}
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {action}
        <ThemeToggle />
      </div>
    </header>
  )
}
