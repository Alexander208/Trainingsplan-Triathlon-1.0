import Dexie, { type EntityTable } from 'dexie'
import type { Integration, Plan, Race, Settings, Week, Workout } from '../types'

/**
 * Die Datenbank liegt im Browser (IndexedDB) – also nur auf diesem Gerät.
 *
 * Die Strings bei `stores` legen fest, nach welchen Feldern schnell gesucht
 * werden kann (Index). Alle anderen Felder werden trotzdem gespeichert.
 * Wenn sich das Schema ändert, kommt eine neue `version(n)` dazu – alte Daten bleiben erhalten.
 */
export class TriPlanDB extends Dexie {
  plans!: EntityTable<Plan, 'id'>
  weeks!: EntityTable<Week, 'id'>
  workouts!: EntityTable<Workout, 'id'>
  races!: EntityTable<Race, 'id'>
  settings!: EntityTable<Settings, 'id'>
  /** Zugangsdaten für Strava & Co. – bleiben auf dem Gerät, kommen NICHT ins Backup. */
  integrations!: EntityTable<Integration, 'id'>

  constructor() {
    super('triplan')
    this.version(1).stores({
      plans: 'id, startDate, updatedAt',
      weeks: 'id, planId, [planId+index], startDate',
      workouts: 'id, date, planId, weekId, status, sport, brickGroupId, updatedAt',
      races: 'id, date',
      settings: 'id',
    })
    // Version 2: neue Tabelle für Verbindungen (Strava). Bestehende Daten bleiben erhalten.
    this.version(2).stores({
      integrations: 'id',
    })
  }
}

export const db = new TriPlanDB()

/**
 * Bittet den Browser, die Daten dauerhaft zu behalten.
 * Wichtig auf dem iPhone: Ohne diese Bitte darf Safari Daten bei Speichermangel löschen.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (navigator.storage?.persisted && (await navigator.storage.persisted())) return true
    return (await navigator.storage?.persist?.()) ?? false
  } catch {
    return false
  }
}
