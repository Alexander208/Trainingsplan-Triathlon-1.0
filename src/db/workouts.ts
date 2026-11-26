import { db } from './db'
import type { WorkoutResult } from '../types'

/** Speichert die tatsächlichen Werte und markiert die Einheit als erledigt. */
export async function completeWorkout(id: string, result: Omit<WorkoutResult, 'completedAt'>) {
  const now = new Date().toISOString()
  const existing = await db.workouts.get(id)
  await db.workouts.update(id, {
    status: 'done',
    // Beim Bearbeiten das ursprüngliche Abschlussdatum behalten
    result: { ...result, completedAt: existing?.result?.completedAt ?? now },
    updatedAt: now,
  })
}

/** Markiert eine Einheit als ausgelassen (optional mit Grund). */
export async function skipWorkout(id: string, note?: string) {
  const now = new Date().toISOString()
  await db.workouts.update(id, {
    status: 'skipped',
    result: note ? { note, completedAt: now } : undefined,
    updatedAt: now,
  })
}

/** Setzt eine Einheit zurück auf „geplant“. */
export async function resetWorkout(id: string) {
  await db.workouts.update(id, { status: 'planned', result: undefined, updatedAt: new Date().toISOString() })
}
