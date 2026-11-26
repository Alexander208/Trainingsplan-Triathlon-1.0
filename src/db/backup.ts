import { db } from './db'
import {
  BACKUP_APP_ID,
  BACKUP_SCHEMA_VERSION,
  type BackupData,
  type BackupFile,
  type Plan,
  type Race,
  type Week,
  type Workout,
} from '../types'

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/** Liest alle Daten aus der Datenbank und packt sie in ein Backup-Objekt. */
export async function createBackup(): Promise<BackupFile> {
  const [plans, weeks, workouts, races, settings] = await Promise.all([
    db.plans.toArray(),
    db.weeks.toArray(),
    db.workouts.toArray(),
    db.races.toArray(),
    db.settings.get('settings'),
  ])
  return {
    app: BACKUP_APP_ID,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: { plans, weeks, workouts, races, settings },
  }
}

/**
 * Speichert das Backup als Datei.
 * Auf dem iPhone öffnet sich das Teilen-Menü (→ „In Dateien sichern“, AirDrop …),
 * am Mac wird die Datei heruntergeladen.
 */
export async function downloadBackup(): Promise<void> {
  const backup = await createBackup()
  const stamp = backup.exportedAt.slice(0, 10)
  const fileName = `triplan-backup-${stamp}.json`
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const file = new File([blob], fileName, { type: 'application/json' })

  const isTouch = window.matchMedia('(pointer: coarse)').matches
  if (isTouch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'TriPlan-Backup' })
      return
    } catch (err) {
      if ((err as Error).name === 'AbortError') return // Nutzer hat abgebrochen
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

export class BackupError extends Error {}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0
const isDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)

function checkList<T>(list: unknown, name: string, check: (item: Record<string, unknown>) => boolean): T[] {
  if (list === undefined) return []
  if (!Array.isArray(list)) throw new BackupError(`„${name}“ ist keine Liste.`)
  list.forEach((item, i) => {
    if (!isObj(item) || !isStr(item.id) || !check(item)) {
      throw new BackupError(`Eintrag ${i + 1} in „${name}“ ist ungültig.`)
    }
  })
  return list as T[]
}

/**
 * Prüft eine eingelesene JSON-Datei und gibt die Daten zurück.
 * Fehlende optionale Felder werden ergänzt, damit ältere Dateien weiter funktionieren.
 */
export function parseBackup(raw: unknown): BackupData {
  if (!isObj(raw) || raw.app !== BACKUP_APP_ID || !isObj(raw.data)) {
    throw new BackupError('Das ist keine TriPlan-Datei.')
  }
  const version = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 0
  if (version > BACKUP_SCHEMA_VERSION) {
    throw new BackupError('Die Datei stammt aus einer neueren App-Version. Bitte App aktualisieren.')
  }
  const d = raw.data
  const now = new Date().toISOString()
  const stamp = <T extends object>(r: T) => ({ createdAt: now, updatedAt: now, ...r })

  const plans = checkList<Plan>(d.plans, 'Pläne', (p) => isStr(p.name) && isDate(p.startDate)).map((p) =>
    stamp({ ...p, rules: p.rules ?? [], source: p.source ?? 'import' }),
  )
  const weeks = checkList<Week>(d.weeks, 'Wochen', (w) => isStr(w.planId) && isDate(w.startDate)).map((w) =>
    stamp({ ...w, callouts: w.callouts ?? [] }),
  )
  const workouts = checkList<Workout>(
    d.workouts,
    'Einheiten',
    (w) => isDate(w.date) && isStr(w.sport) && isStr(w.title),
  ).map((w) =>
    stamp({ ...w, steps: w.steps ?? [], exercises: w.exercises ?? [], tags: w.tags ?? [], status: w.status ?? 'planned', order: w.order ?? 0 }),
  )
  const races = checkList<Race>(d.races, 'Wettkämpfe', (r) => isStr(r.name) && isDate(r.date)).map((r) =>
    stamp({ ...r, priority: r.priority ?? 'B' }),
  )
  const settings = isObj(d.settings) ? (d.settings as unknown as BackupData['settings']) : undefined

  return { plans, weeks, workouts, races, settings }
}

export interface ImportSummary {
  plans: number
  weeks: number
  workouts: number
  races: number
  keptResults: number
}

/**
 * Schreibt importierte Daten in die Datenbank.
 * Gleiche ID = Datensatz wird aktualisiert, neue ID = Datensatz kommt dazu.
 * Bereits eingetragene Ergebnisse (erledigt/ausgelassen) bleiben erhalten,
 * wenn die importierte Einheit selbst noch keins hat – so kann ein aktualisierter
 * Plan erneut importiert werden, ohne Fortschritt zu verlieren.
 */
export async function importBackup(data: BackupData): Promise<ImportSummary> {
  let keptResults = 0
  await db.transaction('rw', [db.plans, db.weeks, db.workouts, db.races, db.settings], async () => {
    const existing = await db.workouts.bulkGet(data.workouts.map((w) => w.id))
    const workouts = data.workouts.map((w, i) => {
      const old = existing[i]
      if (old && old.status !== 'planned' && w.status === 'planned') {
        keptResults++
        return { ...w, status: old.status, result: old.result }
      }
      return w
    })
    await db.plans.bulkPut(data.plans)
    await db.weeks.bulkPut(data.weeks)
    await db.workouts.bulkPut(workouts)
    await db.races.bulkPut(data.races)
    if (data.settings) await db.settings.put({ ...data.settings, id: 'settings' })
  })
  return {
    plans: data.plans.length,
    weeks: data.weeks.length,
    workouts: data.workouts.length,
    races: data.races.length,
    keptResults,
  }
}

/** Liest eine vom Nutzer gewählte Datei ein und importiert sie. */
export async function importFile(file: File): Promise<ImportSummary> {
  let raw: unknown
  try {
    raw = JSON.parse(await file.text())
  } catch {
    throw new BackupError('Die Datei ist kein gültiges JSON.')
  }
  return importBackup(parseBackup(raw))
}

/** Löscht ALLE Daten (Einstellungen bleiben). */
export async function deleteAllData(): Promise<void> {
  await db.transaction('rw', [db.plans, db.weeks, db.workouts, db.races], async () => {
    await Promise.all([db.plans.clear(), db.weeks.clear(), db.workouts.clear(), db.races.clear()])
  })
}
