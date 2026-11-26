import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { AlertTriangle, CalendarCheck, ChevronDown, ScrollText } from 'lucide-react'
import { Card } from '../../components/Card'
import { PageHeader } from '../../components/PageHeader'
import { db } from '../../db/db'
import { addDays, formatDate } from '../../lib/dates'
import { useToday } from '../../lib/useToday'
import { formatDuration, groupBricks, plannedTotals } from '../../lib/workout'
import type { Workout } from '../../types'
import { WorkoutGroup } from '../workouts/WorkoutCard'
import { RaceCountdown } from './RaceCountdown'
import { StravaStatus } from './StravaStatus'

const DAYS_AHEAD = 6

function dayLabel(date: string, today: string): string {
  if (date === today) return 'Heute'
  if (date === addDays(today, 1)) return 'Morgen'
  if (date === addDays(today, 2)) return 'Übermorgen'
  return formatDate(date, { weekday: 'long' })
}

/** Summe der geplanten Minuten eines Tages (ohne Ruhetage und variable Einheiten). */
function dayMinutes(workouts: Workout[]): number {
  return workouts
    .filter((w) => w.sport !== 'rest' && !w.durationVariable && !w.optional)
    .reduce((sum, w) => sum + (plannedTotals(w).durationMin ?? 0), 0)
}

export function TodayPage() {
  const today = useToday()
  const until = addDays(today, DAYS_AHEAD)

  const data = useLiveQuery(async () => {
    const [workouts, allWeeks, plans, races, totalWorkouts] = await Promise.all([
      db.workouts.where('date').between(today, until, true, true).toArray(),
      db.weeks.where('startDate').belowOrEqual(today).toArray(),
      db.plans.toArray(),
      db.races.where('date').aboveOrEqual(today).sortBy('date'),
      db.workouts.count(),
    ])
    workouts.sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order)
    const activePlans = plans.filter((p) => p.startDate <= until && (!p.endDate || p.endDate >= today))
    const currentWeeks = allWeeks
      .filter((w) => w.endDate >= today)
      .map((w) => ({ week: w, plan: plans.find((p) => p.id === w.planId) }))
      .filter((x) => x.plan && x.plan.source !== 'demo')
    // Verpasste Einheiten der letzten 7 Tage, die noch weder erledigt noch ausgelassen sind
    const open = (await db.workouts.where('date').between(addDays(today, -7), today, true, false).toArray())
      .filter((w) => w.status === 'planned' && w.sport !== 'rest')
      .sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order)
    const nextWorkout = workouts.length
      ? undefined
      : await db.workouts.where('date').above(until).first()
    return { workouts, open, currentWeeks, activePlans, races: [...races.filter((r) => r.priority === 'A').slice(0, 1), ...races.filter((r) => r.priority !== 'A')].slice(0, 2).sort((a, b) => a.date.localeCompare(b.date)), totalWorkouts, nextWorkout }
  }, [today, until])

  const subtitle = formatDate(today, { weekday: 'long', day: 'numeric', month: 'long' })
  if (!data) return <PageHeader title="Heute" subtitle={subtitle} />

  const { workouts, open, currentWeeks, activePlans, races, totalWorkouts, nextWorkout } = data
  const byDate = new Map<string, Workout[]>()
  for (const w of workouts) byDate.set(w.date, [...(byDate.get(w.date) ?? []), w])
  const todays = byDate.get(today) ?? []
  const upcoming = [...byDate.entries()].filter(([d]) => d !== today)
  const endingPlans = activePlans.filter((p) => p.endDate && p.endDate < until && p.source !== 'demo')
  const rules = activePlans.flatMap((p) => p.rules)

  return (
    <>
      <PageHeader title="Heute" subtitle={subtitle} />

      <StravaStatus />
      <RaceCountdown races={races} today={today} />

      {currentWeeks.map(({ week, plan }) => (
        <div key={week.id} className="mb-4">
          <p className="text-sm font-semibold">
            {plan!.name} · {week.label}
            {week.phase && week.phase !== week.label && (
              <span className="ml-2 rounded-full bg-sky-500/15 px-2 py-0.5 text-xs font-medium text-sky-700 dark:text-sky-300">
                {week.phase}
              </span>
            )}
          </p>
          {week.intro && <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{week.intro}</p>}
          {week.callouts.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {week.callouts.map((c) => (
                <li
                  key={c}
                  className="flex items-start gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200"
                >
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden /> {c}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      {totalWorkouts === 0 ? (
        <Card>
          <p className="text-slate-600 dark:text-slate-300">
            Noch keine Einheiten vorhanden. Importiere deinen Plan unter{' '}
            <Link to="/einstellungen" className="font-medium text-sky-600 dark:text-sky-400">
              Einstellungen → Daten
            </Link>
            .
          </p>
        </Card>
      ) : (
        <>
          <section aria-labelledby="h-today">
            <h2 id="h-today" className="mb-2 flex items-baseline justify-between text-lg font-bold">
              Training heute
              {dayMinutes(todays) > 0 && (
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {formatDuration(dayMinutes(todays))}
                </span>
              )}
            </h2>
            {todays.length === 0 ? (
              <Card>
                <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <CalendarCheck size={18} aria-hidden /> Heute ist kein Training geplant.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {groupBricks(todays).map((g) => (
                  <WorkoutGroup key={g[0].id} group={g} defaultOpen />
                ))}
              </div>
            )}
          </section>

          {open.length > 0 && (
            <details open={open.length <= 3} className="group mt-6">
              <summary className="flex cursor-pointer list-none items-center justify-between text-lg font-bold">
                <span>
                  Noch offen
                  <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-sm text-amber-700 dark:text-amber-300">
                    {open.length}
                  </span>
                </span>
                <ChevronDown size={20} className="text-slate-400 transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <p className="mt-1 mb-2 text-sm text-slate-500 dark:text-slate-400">
                Aus den letzten 7 Tagen – abhaken oder als ausgelassen markieren.
              </p>
              <div className="space-y-3">
                {groupBricks(open).map((g) => (
                  <div key={g[0].id}>
                    <p className="mb-1 text-xs font-semibold text-slate-500 uppercase dark:text-slate-400">
                      {formatDate(g[0].date, { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                    <WorkoutGroup group={g} />
                  </div>
                ))}
              </div>
            </details>
          )}

          {endingPlans.map((p) => (
            <p key={p.id} className="mt-4 rounded-xl bg-sky-500/10 px-3 py-2 text-sm text-sky-800 dark:text-sky-200">
              „{p.name}“ endet am {formatDate(p.endDate!, { weekday: 'long', day: 'numeric', month: 'long' })}. Denk
              daran, den nächsten Block zu importieren.
            </p>
          ))}

          {upcoming.length > 0 && (
            <section aria-labelledby="h-next" className="mt-6">
              <h2 id="h-next" className="mb-2 text-lg font-bold">
                Nächste Tage
              </h2>
              <div className="space-y-4">
                {upcoming.map(([date, list]) => (
                  <div key={date}>
                    <p className="mb-1.5 flex items-baseline justify-between text-sm">
                      <span className="font-semibold">
                        {dayLabel(date, today)}
                        <span className="ml-1.5 font-normal text-slate-500 dark:text-slate-400">
                          {formatDate(date, { day: 'numeric', month: 'short' })}
                        </span>
                      </span>
                      {dayMinutes(list) > 0 && (
                        <span className="text-slate-500 dark:text-slate-400">{formatDuration(dayMinutes(list))}</span>
                      )}
                    </p>
                    <div className="space-y-2">
                      {groupBricks(list).map((g) => (
                        <WorkoutGroup key={g[0].id} group={g} actions={false} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {workouts.length === 0 && (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              {nextWorkout
                ? `Nächste geplante Einheit: ${formatDate(nextWorkout.date, { weekday: 'long', day: 'numeric', month: 'long' })}.`
                : 'In den nächsten Tagen ist nichts geplant.'}
            </p>
          )}
        </>
      )}

      {rules.length > 0 && (
        <details className="group mt-6 rounded-2xl border border-slate-200 p-4 dark:border-white/10">
          <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold">
            <ScrollText size={18} aria-hidden /> Regeln deines Plans
          </summary>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-700 dark:text-slate-300">
            {rules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </details>
      )}
    </>
  )
}
