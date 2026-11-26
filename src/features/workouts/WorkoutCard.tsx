import { useState } from 'react'
import { Check, ChevronDown, CloudRain, FlaskConical, HeartPulse, Link2, Pencil, RotateCcw, X } from 'lucide-react'
import type { Workout } from '../../types'
import { SportIcon } from '../../components/SportIcon'
import { formatDistance, formatDuration, formatHr, formatPace, workoutSummary } from '../../lib/workout'
import { resetWorkout, skipWorkout } from '../../db/workouts'
import { StepList } from './StepList'
import { CompleteSheet } from './CompleteSheet'

function Chip({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {children}
    </span>
  )
}

/** Zeigt die tatsächlich erreichten Werte einer erledigten Einheit. */
function ResultBox({ w }: { w: Workout }) {
  const r = w.result
  if (!r) return null
  const values = [
    r.durationMin != null && formatDuration(r.durationMin),
    r.distanceM != null && formatDistance(r.distanceM, w.sport),
    formatPace(w.sport, r.durationMin, r.distanceM),
    r.avgHr != null && `Ø ${r.avgHr} bpm`,
    r.maxHr != null && `max ${r.maxHr}`,
    r.feeling != null && `Gefühl ${r.feeling}/10`,
  ].filter(Boolean)
  return (
    <div className="mt-3 rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-900 dark:text-emerald-100">
      {values.length > 0 && <p className="font-medium tabular-nums">{values.join(' · ')}</p>}
      {r.testValue && <p className="mt-0.5">Testergebnis: <strong>{r.testValue}</strong></p>}
      {r.note && <p className="mt-0.5 text-emerald-800/80 italic dark:text-emerald-200/80">„{r.note}“</p>}
    </div>
  )
}

const actionBtn =
  'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold transition active:scale-[0.98]'

/**
 * Karte für eine Einheit. Eingeklappt: Titel + Eckdaten.
 * Ausgeklappt: Beschreibung, alle Abschnitte, Übungen, Schlechtwetter-Alternative.
 */
export function WorkoutCard({
  workout: w,
  defaultOpen = false,
  actions = true,
}: {
  workout: Workout
  defaultOpen?: boolean
  /** Knöpfe „Erledigt/Auslassen“ zeigen (nicht bei zukünftigen Einheiten) */
  actions?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen && w.status === 'planned')
  const [completing, setCompleting] = useState(false)
  const hr = formatHr(w.hr)
  const summary = workoutSummary(w)
  const hasDetails = !!(w.description || w.steps.length || w.exercises.length || w.badWeather)
  const isRest = w.sport === 'rest'
  const done = w.status === 'done'
  const skipped = w.status === 'skipped'

  function onSkip() {
    const reason = prompt('Einheit auslassen – Grund (optional):')
    if (reason === null) return // abgebrochen
    void skipWorkout(w.id, reason.trim() || undefined)
  }

  return (
    <div className={isRest || skipped ? 'opacity-60' : ''}>
      <button
        type="button"
        onClick={() => hasDetails && setOpen((o) => !o)}
        aria-expanded={hasDetails ? open : undefined}
        className="flex w-full items-center gap-3 text-left"
      >
        <span className="relative">
          <SportIcon sport={w.sport} />
          {done && (
            <span className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white dark:ring-[#0b0f17]">
              <Check size={13} strokeWidth={3} aria-label="erledigt" />
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className={`font-semibold ${skipped ? 'line-through' : ''}`}>{w.title}</h3>
            {skipped && <Chip className="bg-slate-500/10 text-slate-500">ausgelassen</Chip>}
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

      {done && <ResultBox w={w} />}
      {skipped && w.result?.note && (
        <p className="mt-2 text-sm text-slate-500 italic dark:text-slate-400">Grund: {w.result.note}</p>
      )}

      {hr && !isRest && !done && (
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
      {!isRest && (actions || w.status !== 'planned') && (
        <div className="mt-3 flex gap-2">
          {w.status === 'planned' && (
            <>
              <button type="button" onClick={() => setCompleting(true)} className={`${actionBtn} bg-emerald-600 text-white hover:bg-emerald-500`}>
                <Check size={16} aria-hidden /> Erledigt
              </button>
              <button type="button" onClick={onSkip} className={`${actionBtn} bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15`}>
                <X size={16} aria-hidden /> Auslassen
              </button>
            </>
          )}
          {done && (
            <button type="button" onClick={() => setCompleting(true)} className={`${actionBtn} bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300`}>
              <Pencil size={15} aria-hidden /> Bearbeiten
            </button>
          )}
          {w.status !== 'planned' && (
            <button
              type="button"
              onClick={() => confirm('Einheit wieder auf „geplant“ setzen? Eingetragene Werte gehen verloren.') && resetWorkout(w.id)}
              className={`${actionBtn} bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300`}
            >
              <RotateCcw size={15} aria-hidden /> Zurücksetzen
            </button>
          )}
        </div>
      )}

      {completing && <CompleteSheet workout={w} onClose={() => setCompleting(false)} />}
    </div>
  )
}


/** Rahmen um eine Gruppe – zeigt bei mehreren Einheiten „Koppeltraining“ an. */
export function WorkoutGroup({ group, defaultOpen, actions = true }: { group: Workout[]; defaultOpen?: boolean; actions?: boolean }) {
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
          <WorkoutCard key={w.id} workout={w} defaultOpen={defaultOpen} actions={actions} />
        ))}
      </div>
    </div>
  )
}
