import type { ReactNode } from 'react'

/** Einfache Karte – Grundbaustein für fast alle Ansichten. */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none ${className}`}
    >
      {children}
    </div>
  )
}
