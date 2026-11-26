import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { Card } from '../../components/Card'
import { PageHeader } from '../../components/PageHeader'
import { db } from '../../db/db'
import { formatDate } from '../../lib/dates'

/** Vorerst nur eine Liste – Bearbeiten, Duplizieren usw. folgen in Schritt 6. */
export function PlansPage() {
  const plans = useLiveQuery(async () => {
    const list = await db.plans.orderBy('startDate').reverse().toArray()
    return Promise.all(
      list.map(async (p) => {
        const workouts = await db.workouts.where('planId').equals(p.id).toArray()
        const weeks = await db.weeks.where('planId').equals(p.id).count()
        const race = p.raceId ? await db.races.get(p.raceId) : undefined
        return {
          plan: p,
          weeks,
          total: workouts.filter((w) => w.sport !== 'rest').length,
          done: workouts.filter((w) => w.status === 'done').length,
          race,
        }
      }),
    )
  })

  return (
    <>
      <PageHeader title="Pläne" />
      {plans?.length === 0 && (
        <Card>
          <p className="text-slate-600 dark:text-slate-300">
            Noch kein Plan vorhanden. Importiere deinen Plan oder lade die Demo-Woche unter{' '}
            <Link to="/einstellungen" className="font-medium text-sky-600 dark:text-sky-400">
              Einstellungen → Daten
            </Link>
            .
          </p>
        </Card>
      )}
      <ul className="space-y-3">
        {plans?.map(({ plan, weeks, total, done, race }) => (
          <li key={plan.id}>
            <Card>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{plan.name}</h2>
                  {plan.goal && <p className="text-sm text-slate-600 dark:text-slate-300">{plan.goal}</p>}
                </div>
                {plan.author && (
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-white/10 dark:text-slate-300">
                    {plan.author}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {formatDate(plan.startDate)}
                {plan.endDate && ` – ${formatDate(plan.endDate, { day: 'numeric', month: 'short', year: 'numeric' })}`}
                {' · '}
                {weeks} {weeks === 1 ? 'Woche' : 'Wochen'} · {done}/{total} Einheiten erledigt
              </p>
              {race && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Ziel: {race.name} am {formatDate(race.date, { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                <div className="h-full rounded-full bg-sky-500" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </>
  )
}
