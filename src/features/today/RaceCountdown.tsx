import { Flag } from 'lucide-react'
import type { Race } from '../../types'
import { daysBetween, formatDate } from '../../lib/dates'


const PRIORITY_STYLE: Record<Race['priority'], string> = {
  A: 'from-sky-600 to-indigo-600 text-white',
  B: 'from-slate-100 to-slate-100 text-slate-900 dark:from-white/10 dark:to-white/5 dark:text-white',
  C: 'from-slate-100 to-slate-100 text-slate-900 dark:from-white/10 dark:to-white/5 dark:text-white',
}

/** Countdown-Kacheln für die nächsten Wettkämpfe (A-Wettkampf hervorgehoben). */
export function RaceCountdown({ races, today }: { races: Race[]; today: string }) {
  if (races.length === 0) return null
  return (
    <div className="mb-5 grid grid-cols-2 gap-3">
      {races.slice(0, 2).map((r) => {
        const days = daysBetween(today, r.date)
        return (
          <div
            key={r.id}
            className={`min-w-0 rounded-2xl bg-gradient-to-br p-4 ${PRIORITY_STYLE[r.priority]}`}
          >
            <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase opacity-80">
              <Flag size={13} aria-hidden /> {r.type}
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums">
              {days === 0 ? 'Heute!' : days}
              {days > 0 && <span className="ml-1 text-base font-medium opacity-80">Tage</span>}
            </p>
            <p className="mt-1 truncate text-sm font-medium">{r.name}</p>
            <p className="text-xs opacity-75">
              {formatDate(r.date, { day: 'numeric', month: 'short', year: 'numeric' })}
              {days > 13 && <><br />noch {Math.floor(days / 7)} Wochen</>}
            </p>
          </div>
        )
      })}
    </div>
  )
}
