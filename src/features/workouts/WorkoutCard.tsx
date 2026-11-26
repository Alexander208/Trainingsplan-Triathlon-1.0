import { useState } from 'react'
import { ChevronDown, CloudRain, FlaskConical, HeartPulse, Link2 } from 'lucide-react'
import type { Workout } from '../../types'
import { workoutSummary } from '../../lib/workout'
import { SportIcon } from '../../components/SportIcon'
import { formatHr } from '../../lib/workout'
import { StepList } from './StepList'

function Chip({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {children}
    </span>
  )
}


/**
 * Karte für eine Einheit. Eingeklappt: Titel + Eckdaten.
 * Ausgeklappt: Beschreibung, alle Abschnitte, Übungen, Schlechtwetter-Alternative.
 */
export function WorkoutCard({ workout: w, defaultOpen = false }: { workout: Workout; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const hr = formatHr(w.hr)
  const summary = workoutSummary(w)
  const hasDetails = !!(w.description || w.steps.length || w.exercises.length || w.badWeather)
  const isRest = w.sport === 'rest'

  return (
    <div className={isRest ? 'opacity-70' : ''}>
      <button
        type="button"
        onClick={() => hasDetails && setOpen((o) => !o)}
        aria-expanded={hasDetails ? open : undefined}
        className="flex w-full items-center gap-3 text-left"
      >
        <SportIcon sport={w.sport} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="font-semibold">{w.title}</h3>
            {w.isTest && (
              <Chip className="bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <FlaskConical size={12} aria-hidden /> Test
              </Chip>
            )}
            {w.optional && <Chip className="bg-slate-500/10 text-slate-500">optional</Chip>}
          </div>
          <p className="truncate text-sm text-slate-500 dark:text-slate-400">
            {[summary, ...w.tags].filter(Boolean).join(' · ') || (isRest ? 'Erholung' : '')}
          </p>
        </div>
        {hasDetails && (
          <ChevronDown
            size={20}
            className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
        )}
      </button>

      {hr && !isRest && (
        <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-rose-600 dark:text-rose-400">
          <HeartPulse size={15} aria-hidden /> {hr}
          {w.target && <span className="font-normal text-slate-500 dark:text-slate-400">· {w.target}</span>}
        </p>
      )}

      {open && (
        <div className="mt-3 space-y-3">
          {w.description && <p className="text-sm text-slate-700 dark:text-slate-300">{w.description}</p>}
          <StepList steps={w.steps} />
          {w.exercises.length > 0 && (
            <ul className="divide-y divide-slate-100 rounded-xl bg-slate-50 px-3 dark:divide-white/5 dark:bg-white/5">
              {w.exercises.map((e) => (
                <li key={e.id} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                  <span className="font-medium">{e.name}</span>
                  <span className="text-right text-slate-500 tabular-nums dark:text-slate-400">
                    {[
                      e.sets && e.reps && `${e.sets}×${e.reps}`,
                      e.sets && !e.reps && `${e.sets}×`,
                      e.distanceM && `${e.distanceM} m`,
                      e.durationSec && `${e.durationSec} s`,
                      e.weightKg && `${e.weightKg} kg`,
                      e.restSec && `P. ${e.restSec} s`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {w.badWeather && (
            <p className="flex items-start gap-1.5 text-sm text-slate-600 dark:text-slate-300">
              <CloudRain size={15} className="mt-0.5 shrink-0 text-sky-500" aria-hidden />
              <span>
                <span className="font-medium">Schlechtwetter:</span> {w.badWeather}
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}


/** Rahmen um eine Gruppe – zeigt bei mehreren Einheiten „Koppeltraining“ an. */
export function WorkoutGroup({ group, defaultOpen }: { group: Workout[]; defaultOpen?: boolean }) {
  const isBrick = group.length > 1
  const sports = new Set(group.map((w) => w.sport))
  const label = sports.has('bike') && sports.has('run') ? 'Koppeltraining' : 'Direkt hintereinander'

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
      {isBrick && (
        <p className="mb-3 flex items-center gap-1.5 text-xs font-bold tracking-wide text-slate-500 uppercase dark:text-slate-400">
          <Link2 size={14} aria-hidden /> {label}
        </p>
      )}
      <div className={isBrick ? 'space-y-4 border-l-2 border-dashed border-slate-200 pl-3 dark:border-white/10' : ''}>
        {group.map((w) => (
          <WorkoutCard key={w.id} workout={w} defaultOpen={defaultOpen} />
        ))}
      </div>
    </div>
  )
}
