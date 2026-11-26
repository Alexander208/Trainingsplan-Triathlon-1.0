import { useState } from 'react'
import { Sheet } from '../../components/Sheet'
import { completeWorkout } from '../../db/workouts'
import type { Workout } from '../../types'
import { distanceUnit, formatPace, plannedTotals } from '../../lib/workout'

const FEELING_LABEL: Record<number, string> = {
  1: 'sehr leicht',
  3: 'leicht',
  5: 'mittel',
  7: 'hart',
  9: 'sehr hart',
  10: 'maximal',
}

/** Text → Zahl ("12,5" und "12.5" erlaubt). Leer = undefined. */
function num(v: string): number | undefined {
  const n = parseFloat(v.replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : undefined
}

const input =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base tabular-nums outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 dark:border-white/10 dark:bg-white/5'

function Field({ label, unit, children }: { label: string; unit?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
        {label}
        {unit && <span className="font-normal text-slate-400"> ({unit})</span>}
      </span>
      {children}
    </label>
  )
}

/** Formular „Einheit abschließen“ – vorausgefüllt mit den geplanten Werten. */
export function CompleteSheet({ workout: w, onClose }: { workout: Workout; onClose: () => void }) {
  const planned = plannedTotals(w)
  const unit = distanceUnit(w.sport)
  const r = w.result
  const toUnit = (m?: number) => (m == null ? '' : unit === 'km' ? String(+(m / 1000).toFixed(2)).replace('.', ',') : String(m))

  const [duration, setDuration] = useState(String(r?.durationMin ?? (w.durationVariable ? '' : planned.durationMin ?? '')))
  const [distance, setDistance] = useState(toUnit(r?.distanceM ?? planned.distanceM))
  const [avgHr, setAvgHr] = useState(r?.avgHr ? String(r.avgHr) : '')
  const [maxHr, setMaxHr] = useState(r?.maxHr ? String(r.maxHr) : '')
  const [feeling, setFeeling] = useState<number | undefined>(r?.feeling)
  const [note, setNote] = useState(r?.note ?? '')
  const [testValue, setTestValue] = useState(r?.testValue ?? '')
  const [saving, setSaving] = useState(false)

  const durationMin = num(duration)
  const distanceM = num(distance) != null ? Math.round(num(distance)! * (unit === 'km' ? 1000 : 1)) : undefined
  const pace = formatPace(w.sport, durationMin, distanceM)
  const showDistance = w.sport === 'swim' || w.sport === 'bike' || w.sport === 'run' || w.sport === 'other'
  const showHr = w.sport !== 'rest'

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await completeWorkout(w.id, {
      durationMin: durationMin != null ? Math.round(durationMin) : undefined,
      distanceM,
      avgHr: num(avgHr) && Math.round(num(avgHr)!),
      maxHr: num(maxHr) && Math.round(num(maxHr)!),
      feeling,
      note: note.trim() || undefined,
      testValue: testValue.trim() || undefined,
    })
    onClose()
  }

  return (
    <Sheet title={`${w.title} abschließen`} onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dauer" unit="min">
            <input className={input} inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="z. B. 50" />
          </Field>
          {showDistance && (
            <Field label="Distanz" unit={unit}>
              <input className={input} inputMode="decimal" value={distance} onChange={(e) => setDistance(e.target.value)} placeholder={unit === 'km' ? 'z. B. 8,5' : 'z. B. 1900'} />
            </Field>
          )}
          {showHr && (
            <>
              <Field label="Ø-Puls" unit="bpm">
                <input className={input} inputMode="numeric" value={avgHr} onChange={(e) => setAvgHr(e.target.value)} placeholder="z. B. 148" />
              </Field>
              <Field label="Max-Puls" unit="bpm">
                <input className={input} inputMode="numeric" value={maxHr} onChange={(e) => setMaxHr(e.target.value)} placeholder="optional" />
              </Field>
            </>
          )}
        </div>

        {pace && <p className="text-sm text-slate-500 dark:text-slate-400">Tempo: <strong className="text-slate-800 dark:text-slate-100">{pace}</strong></p>}

        {w.hr?.max != null && num(avgHr) != null && num(avgHr)! > w.hr.max && (
          <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
            Ø-Puls liegt über der Vorgabe ({w.hr.max} bpm).
          </p>
        )}

        {w.isTest && (
          <Field label="Testergebnis" unit="z. B. Schwellenpuls oder Zeit">
            <input className={input} value={testValue} onChange={(e) => setTestValue(e.target.value)} placeholder={w.sport === 'swim' ? 'z. B. 38:20' : 'z. B. 168 bpm'} />
          </Field>
        )}

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
            Gefühl {feeling ? <span className="font-normal text-slate-400">– {feeling}/10 {FEELING_LABEL[feeling] ?? ''}</span> : <span className="font-normal text-slate-400">(1 = sehr leicht, 10 = maximal)</span>}
          </legend>
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setFeeling(feeling === n ? undefined : n)}
                aria-pressed={feeling === n}
                className={`rounded-lg py-2 text-sm font-semibold tabular-nums transition ${
                  feeling === n
                    ? n <= 4 ? 'bg-emerald-500 text-white' : n <= 7 ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'
                    : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </fieldset>

        <Field label="Notiz">
          <textarea className={`${input} min-h-20`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Wie lief's? Beine, Wetter, Besonderheiten …" />
        </Field>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-500 active:scale-[0.99] disabled:opacity-60"
        >
          {r ? 'Änderungen speichern' : 'Als erledigt speichern'}
        </button>
      </form>
    </Sheet>
  )
}
