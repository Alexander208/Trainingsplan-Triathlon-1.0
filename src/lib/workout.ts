import type { HrTarget, Sport, Workout, WorkoutStep } from '../types'

/** Summiert Dauer und Distanz aller Abschnitte (Wiederholungen werden mitgezählt). */
export function stepTotals(steps: WorkoutStep[]): { durationSec: number; distanceM: number } {
  let durationSec = 0
  let distanceM = 0
  for (const step of steps) {
    if (step.kind === 'repeat') {
      const inner = stepTotals(step.steps)
      durationSec += inner.durationSec * step.times
      distanceM += inner.distanceM * step.times
    } else {
      durationSec += step.durationSec ?? 0
      distanceM += step.distanceM ?? 0
    }
  }
  return { durationSec, distanceM }
}

/** Geplante Dauer (Minuten) und Distanz (Meter) einer Einheit. */
export function plannedTotals(w: Pick<Workout, 'steps' | 'plannedDurationMin' | 'plannedDistanceM'>) {
  const t = stepTotals(w.steps)
  return {
    durationMin: w.plannedDurationMin ?? (t.durationSec ? Math.round(t.durationSec / 60) : undefined),
    distanceM: w.plannedDistanceM ?? (t.distanceM || undefined),
  }
}

export const SPORT_LABEL: Record<Sport, string> = {
  swim: 'Schwimmen',
  bike: 'Rad',
  run: 'Laufen',
  strength: 'Kraft',
  other: 'Sonstiges',
  rest: 'Ruhetag',
}

export function formatDuration(min?: number): string {
  if (min == null) return '–'
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}:${String(m).padStart(2, '0')} h` : `${h} h`
}

export function formatDistance(m?: number, sport?: Sport): string {
  if (m == null) return '–'
  if (sport === 'swim' || m < 1000) return `${m.toLocaleString('de-DE')} m`
  return `${(m / 1000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} km`
}

export function formatHr(hr?: HrTarget): string | undefined {
  if (!hr) return undefined
  const { min, max, label } = hr
  let range: string | undefined
  if (min != null && max != null) range = `${min}–${max} bpm`
  else if (max != null) range = `unter ${max} bpm`
  else if (min != null) range = `über ${min} bpm`
  if (range && label) return `${label} (${range})`
  return range ?? label
}
