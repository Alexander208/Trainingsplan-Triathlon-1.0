import { BACKUP_APP_ID, BACKUP_SCHEMA_VERSION, type BackupFile, type Workout } from '../types'
import { addDays, startOfWeek, todayISO } from '../lib/dates'

/**
 * Anonymer Beispielplan (eine Woche ab dem aktuellen Montag) zum Ausprobieren.
 * Persönliche Pläne gehören NICHT hierher, sondern in eine Importdatei.
 */
export function buildDemoBackup(): BackupFile {
  const now = new Date().toISOString()
  const monday = startOfWeek(todayISO())
  const base = { createdAt: now, updatedAt: now }
  const planId = 'demo-plan'
  const weekId = 'demo-week-1'
  const day = (n: number) => addDays(monday, n)

  const w = (id: string, data: Omit<Workout, 'id' | 'createdAt' | 'updatedAt' | 'planId' | 'weekId' | 'exercises' | 'tags' | 'status' | 'order'> & Partial<Workout>): Workout => ({
    id: `demo-${id}`,
    planId,
    weekId,
    order: 0,
    exercises: [],
    tags: [],
    status: 'planned',
    ...base,
    ...data,
  })

  const workouts: Workout[] = [
    w('mo', { date: day(0), sport: 'rest', title: 'Ruhetag', steps: [], description: 'Optional 15 min Mobilisation.' }),
    w('di', {
      date: day(1),
      sport: 'run',
      title: 'Intervalle 6×800 m',
      zone: 4,
      steps: [
        { id: 's1', kind: 'warmup', durationSec: 900, zone: 1, label: 'Einlaufen' },
        {
          id: 's2',
          kind: 'repeat',
          times: 6,
          steps: [
            { id: 's2a', kind: 'work', distanceM: 800, zone: 4, target: '4:20 min/km' },
            { id: 's2b', kind: 'recovery', durationSec: 120, zone: 1, label: 'Trabpause' },
          ],
        },
        { id: 's3', kind: 'cooldown', durationSec: 600, zone: 1, label: 'Auslaufen' },
      ],
    }),
    w('mi', {
      date: day(2),
      sport: 'swim',
      title: 'Technik & Grundlage',
      steps: [
        { id: 's1', kind: 'warmup', distanceM: 300, label: 'Einschwimmen' },
        { id: 's2', kind: 'repeat', times: 8, steps: [{ id: 's2a', kind: 'drill', distanceM: 50, label: 'Technik', restSec: 20 }] },
        { id: 's3', kind: 'repeat', times: 6, steps: [{ id: 's3a', kind: 'work', distanceM: 100, zone: 2, restSec: 20 }] },
        { id: 's4', kind: 'cooldown', distanceM: 200, label: 'Ausschwimmen' },
      ],
    }),
    w('do', {
      date: day(3),
      sport: 'strength',
      title: 'Hyrox-Kraft',
      steps: [],
      plannedDurationMin: 45,
      exercises: [
        { id: 'e1', name: 'SkiErg', distanceM: 500, sets: 3, restSec: 90 },
        { id: 'e2', name: 'Kniebeuge', sets: 4, reps: 8, weightKg: 60 },
        { id: 'e3', name: 'Ausfallschritte mit Sandsack', sets: 3, distanceM: 50 },
        { id: 'e4', name: 'Wall Balls', sets: 3, reps: 20, weightKg: 6 },
      ],
    }),
    w('sa-bike', {
      date: day(5),
      sport: 'bike',
      title: 'Lange Ausfahrt + Koppellauf',
      zone: 2,
      brickGroupId: 'demo-brick',
      badWeather: 'Rolle, 75 min',
      tags: ['draußen'],
      steps: [
        { id: 's1', kind: 'drill', durationSec: 900, label: 'Fahrtechnik', cadence: '90–95' },
        { id: 's2', kind: 'work', durationSec: 4500, zone: 2, note: 'Nach 45 min essen' },
      ],
    }),
    w('sa-run', {
      date: day(5),
      order: 1,
      sport: 'run',
      title: 'Koppellauf',
      zone: 2,
      brickGroupId: 'demo-brick',
      steps: [{ id: 's1', kind: 'work', durationSec: 600, zone: 2 }],
    }),
    w('so', {
      date: day(6),
      sport: 'run',
      title: 'Langer Lauf',
      zone: 2,
      hr: { min: 135, max: 150 },
      steps: [{ id: 's1', kind: 'work', durationSec: 4200, zone: 2, hr: { min: 135, max: 150 } }],
    }),
  ]

  return {
    app: BACKUP_APP_ID,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: now,
    data: {
      plans: [
        {
          id: planId,
          ...base,
          name: 'Demo-Woche',
          goal: 'Zum Ausprobieren – kann gelöscht werden',
          startDate: monday,
          endDate: day(6),
          rules: [],
          source: 'demo',
        },
      ],
      weeks: [{ id: weekId, ...base, planId, index: 1, label: 'Woche 1', phase: 'Grundlage', startDate: monday, endDate: day(6), callouts: [] }],
      workouts,
      races: [],
    },
  }
}
