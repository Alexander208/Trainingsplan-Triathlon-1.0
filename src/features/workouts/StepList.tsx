import type { SegmentStep, StepKind, WorkoutStep } from '../../types'
import { formatHr } from '../../lib/workout'

const KIND: Record<StepKind, { label: string; bar: string }> = {
  warmup: { label: 'Einlaufen', bar: 'bg-sky-400' },
  work: { label: 'Hauptteil', bar: 'bg-amber-500' },
  recovery: { label: 'Erholung', bar: 'bg-emerald-400' },
  cooldown: { label: 'Auslaufen', bar: 'bg-sky-400' },
  drill: { label: 'Technik', bar: 'bg-violet-400' },
}

function formatSec(sec: number): string {
  if (sec < 60) return `${sec} s`
  const min = sec / 60
  if (min < 90) return Number.isInteger(min) ? `${min} min` : `${Math.floor(min)}:${String(sec % 60).padStart(2, '0')} min`
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return `${h}:${String(m).padStart(2, '0')} h`
}

/** Menge eines Abschnitts: „300 m“, „15 min“ oder beides. */
function amount(step: SegmentStep): string | undefined {
  const parts: string[] = []
  if (step.distanceM) parts.push(step.distanceM >= 5000 && step.distanceM % 100 === 0
    ? `${(step.distanceM / 1000).toLocaleString('de-DE')} km`
    : `${step.distanceM.toLocaleString('de-DE')} m`)
  if (step.durationSec) parts.push(formatSec(step.durationSec))
  return parts.join(' · ') || undefined
}

function Segment({ step, inRepeat }: { step: SegmentStep; inRepeat?: boolean }) {
  const k = KIND[step.kind]
  const details = [
    formatHr(step.hr),
    step.zone && `Z${step.zone}`,
    step.target,
    step.cadence && `TF ${step.cadence}`,
    step.restSec && `${formatSec(step.restSec)} Pause`,
  ].filter(Boolean)

  return (
    <li className="flex gap-3">
      <span className={`w-1 shrink-0 rounded-full ${k.bar}`} aria-hidden />
      <div className="min-w-0 flex-1 py-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className={`text-sm ${inRepeat ? '' : 'font-medium'}`}>{step.label ?? k.label}</span>
          {amount(step) && <span className="shrink-0 text-sm font-semibold tabular-nums">{amount(step)}</span>}
        </div>
        {details.length > 0 && <p className="text-xs text-slate-500 dark:text-slate-400">{details.join(' · ')}</p>}
        {step.note && <p className="text-xs text-slate-500 italic dark:text-slate-400">{step.note}</p>}
      </div>
    </li>
  )
}

/** Zeigt die Abschnitte einer Einheit als übersichtliche Liste. */
export function StepList({ steps }: { steps: WorkoutStep[] }) {
  if (steps.length === 0) return null
  return (
    <ol className="space-y-1.5">
      {steps.map((step) =>
        step.kind === 'repeat' ? (
          <li key={step.id} className="rounded-xl bg-slate-50 p-2.5 dark:bg-white/5">
            <p className="mb-1 text-xs font-bold tracking-wide text-slate-500 uppercase dark:text-slate-400">
              {step.times}× {step.label ?? 'Wiederholen'}
            </p>
            <ol className="space-y-1">
              {step.steps.map((s) => (
                <Segment key={s.id} step={s} inRepeat />
              ))}
            </ol>
          </li>
        ) : (
          <Segment key={step.id} step={step} />
        ),
      )}
    </ol>
  )
}
