import { useSyncExternalStore } from 'react'
import { getStrava, handleStravaCallback, isConnected, StravaError, syncStrava, type CallbackResult } from './strava'

/** Mindestabstand zwischen zwei automatischen Abgleichen. */
const AUTO_INTERVAL_MS = 10 * 60_000

export interface SyncState {
  phase: 'idle' | 'syncing' | 'ok' | 'error'
  message?: string
  /** Ergebnis der letzten Rückleitung von Strava (für die Einstellungen). */
  callback?: CallbackResult
}

let state: SyncState = { phase: 'idle' }
const listeners = new Set<() => void>()
const set = (patch: Partial<SyncState>) => {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

export function useSyncState(): SyncState {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => state,
  )
}

export function clearCallback() {
  set({ callback: undefined })
}

/** Startet einen Abgleich und meldet das Ergebnis in verständlichen Worten. */
export async function runSync(): Promise<void> {
  set({ phase: 'syncing', message: undefined })
  try {
    const r = await syncStrava()
    const parts = []
    if (r.matched) parts.push(`${r.matched} ${r.matched === 1 ? 'Einheit' : 'Einheiten'} abgehakt`)
    if (r.created) parts.push(`${r.created} ungeplante ${r.created === 1 ? 'Aktivität' : 'Aktivitäten'} eingetragen`)
    set({ phase: 'ok', message: parts.length ? parts.join(', ') : 'Keine neuen Aktivitäten' })
  } catch (e) {
    set({ phase: 'error', message: e instanceof StravaError ? e.message : 'Unerwarteter Fehler beim Strava-Abgleich.' })
    if (!(e instanceof StravaError)) console.error(e)
  }
}

async function autoSync() {
  const s = await getStrava()
  if (!isConnected(s) || state.phase === 'syncing' || !navigator.onLine) return
  const last = s?.lastSyncAt ? new Date(s.lastSyncAt).getTime() : 0
  if (Date.now() - last < AUTO_INTERVAL_MS) return
  await runSync()
}

let started = false

/**
 * Einmal beim App-Start aufrufen:
 * - schließt eine Strava-Anmeldung ab, falls der Nutzer gerade von Strava zurückkommt
 * - gleicht automatisch ab – beim Start und immer, wenn die App wieder in den Vordergrund kommt
 */
export function startStravaAutoSync() {
  if (started) return
  started = true
  void (async () => {
    const callback = await handleStravaCallback()
    if (callback.kind !== 'none') set({ callback })
    if (callback.kind === 'connected') await runSync()
    else await autoSync()
  })()
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void autoSync()
  })
}
