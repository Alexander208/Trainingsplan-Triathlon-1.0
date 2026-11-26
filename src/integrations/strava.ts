import { db } from '../db/db'
import { newId } from '../lib/id'
import { addDays, todayISO } from '../lib/dates'
import { plannedTotals } from '../lib/workout'
import type { Sport, StravaIntegration, Workout } from '../types'

/**
 * Strava-Anbindung – läuft komplett im Browser, ohne eigenen Server.
 *
 * Ablauf:
 *  1. Du legst bei Strava eine eigene „API-App“ an und trägst Client-ID + Secret in TriPlan ein.
 *  2. „Mit Strava verbinden“ → Strava fragt nach Erlaubnis → leitet zurück zu TriPlan mit einem Code.
 *  3. TriPlan tauscht den Code gegen Zugangsschlüssel (Tokens) und speichert sie auf dem Gerät.
 *  4. Beim Öffnen der App werden neue Aktivitäten abgeholt und den geplanten Einheiten zugeordnet.
 */

const AUTH_URL = 'https://www.strava.com/oauth/authorize'
const TOKEN_URL = 'https://www.strava.com/oauth/token'
const API = 'https://www.strava.com/api/v3'
const STATE = 'triplan-strava'

export class StravaError extends Error {}

// ---------------------------------------------------------------------------
// Konfiguration speichern / lesen
// ---------------------------------------------------------------------------

export async function getStrava(): Promise<StravaIntegration | undefined> {
  return (await db.integrations.get('strava')) as StravaIntegration | undefined
}

export async function saveStravaApp(clientId: string, clientSecret: string) {
  const existing = await getStrava()
  await db.integrations.put({ ...existing, id: 'strava', clientId: clientId.trim(), clientSecret: clientSecret.trim() })
}

/** Trennt die Verbindung (Client-ID/Secret bleiben gespeichert). */
export async function disconnectStrava() {
  const s = await getStrava()
  if (!s) return
  await db.integrations.put({ id: 'strava', clientId: s.clientId, clientSecret: s.clientSecret })
}

/** Alles zu Strava löschen. */
export async function removeStrava() {
  await db.integrations.delete('strava')
}

export function isConnected(s?: StravaIntegration): boolean {
  return !!s?.refreshToken
}

// ---------------------------------------------------------------------------
// Anmeldung (OAuth)
// ---------------------------------------------------------------------------

/** Adresse, zu der Strava nach der Anmeldung zurückleitet (= diese App). */
export function redirectUri(): string {
  return window.location.origin + window.location.pathname
}

export function authorizeUrl(clientId: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri(),
    approval_prompt: 'auto',
    scope: 'read,activity:read_all',
    state: STATE,
  })
  return `${AUTH_URL}?${params}`
}

interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_at: number
  athlete?: { firstname?: string; lastname?: string }
}

async function tokenRequest(body: Record<string, string>): Promise<TokenResponse> {
  let res: Response
  try {
    res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body),
    })
  } catch {
    throw new StravaError('Strava ist nicht erreichbar. Bist du online?')
  }
  if (!res.ok) {
    throw new StravaError(
      res.status === 400 || res.status === 401
        ? 'Strava hat die Anmeldung abgelehnt. Prüfe Client-ID und Client-Secret.'
        : `Strava-Fehler (${res.status}).`,
    )
  }
  return res.json()
}

/** Tauscht den Code aus der Rückleitung gegen Tokens. */
export async function exchangeCode(code: string): Promise<void> {
  const s = await getStrava()
  if (!s?.clientId || !s.clientSecret) throw new StravaError('Bitte zuerst Client-ID und Client-Secret eintragen.')
  const t = await tokenRequest({
    client_id: s.clientId,
    client_secret: s.clientSecret,
    code: code.trim(),
    grant_type: 'authorization_code',
  })
  const name = [t.athlete?.firstname, t.athlete?.lastname].filter(Boolean).join(' ') || undefined
  await db.integrations.put({
    ...s,
    accessToken: t.access_token,
    refreshToken: t.refresh_token,
    expiresAt: t.expires_at,
    athleteName: name,
  })
}

/** Holt einen gültigen Access-Token (erneuert ihn bei Bedarf automatisch). */
async function accessToken(): Promise<string> {
  const s = await getStrava()
  if (!s?.refreshToken) throw new StravaError('Nicht mit Strava verbunden.')
  const stillValid = s.accessToken && s.expiresAt && s.expiresAt * 1000 > Date.now() + 60_000
  if (stillValid) return s.accessToken!
  const t = await tokenRequest({
    client_id: s.clientId,
    client_secret: s.clientSecret,
    refresh_token: s.refreshToken,
    grant_type: 'refresh_token',
  })
  await db.integrations.update('strava', {
    accessToken: t.access_token,
    refreshToken: t.refresh_token,
    expiresAt: t.expires_at,
  })
  return t.access_token
}

export type CallbackResult =
  | { kind: 'none' }
  | { kind: 'connected' }
  | { kind: 'denied' }
  | { kind: 'error'; message: string }
  /** Rückleitung landete in einem Browser ohne gespeichertes Secret (z. B. Safari statt installierter App). */
  | { kind: 'code'; code: string }

/**
 * Wird beim Start der App aufgerufen: Kommt der Nutzer gerade von Strava zurück
 * (…?state=triplan-strava&code=…), wird die Anmeldung abgeschlossen und die Adresse aufgeräumt.
 */
export async function handleStravaCallback(): Promise<CallbackResult> {
  const params = new URLSearchParams(window.location.search)
  if (params.get('state') !== STATE) return { kind: 'none' }
  const code = params.get('code')
  const error = params.get('error')
  // Code aus der Adresszeile entfernen, damit er nicht in der Verlaufsliste bleibt
  window.history.replaceState(null, '', redirectUri() + (window.location.hash || '#/einstellungen'))
  if (error || !code) return { kind: 'denied' }
  const s = await getStrava()
  if (!s?.clientSecret) return { kind: 'code', code }
  try {
    await exchangeCode(code)
    return { kind: 'connected' }
  } catch (e) {
    return { kind: 'error', message: e instanceof Error ? e.message : String(e) }
  }
}

// ---------------------------------------------------------------------------
// Aktivitäten abholen und zuordnen
// ---------------------------------------------------------------------------

/** Die Felder einer Strava-Aktivität, die TriPlan nutzt. */
export interface StravaActivity {
  id: number
  name: string
  sport_type?: string
  type?: string
  start_date_local: string
  moving_time: number
  elapsed_time: number
  distance: number
  average_heartrate?: number
  max_heartrate?: number
}

/** Strava-Sportart → TriPlan-Sportart */
export function mapSport(a: Pick<StravaActivity, 'sport_type' | 'type'>): Sport {
  const t = a.sport_type ?? a.type ?? ''
  if (/Run/.test(t)) return 'run' // Run, TrailRun, VirtualRun
  if (/Ride|Velomobile|Handcycle/.test(t)) return 'bike' // Ride, VirtualRide, GravelRide, MountainBikeRide …
  if (/Swim/.test(t)) return 'swim'
  if (/WeightTraining|Crossfit|HighIntensityIntervalTraining/.test(t)) return 'strength'
  return 'other'
}

async function fetchActivities(afterEpochSec: number): Promise<StravaActivity[]> {
  const token = await accessToken()
  const all: StravaActivity[] = []
  for (let page = 1; page <= 10; page++) {
    let res: Response
    try {
      res = await fetch(`${API}/athlete/activities?after=${afterEpochSec}&per_page=100&page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch {
      throw new StravaError('Strava ist nicht erreichbar. Bist du online?')
    }
    if (res.status === 401) throw new StravaError('Strava-Zugang abgelaufen – bitte neu verbinden.')
    if (res.status === 429) throw new StravaError('Zu viele Anfragen an Strava – in 15 Minuten nochmal versuchen.')
    if (!res.ok) throw new StravaError(`Strava-Fehler (${res.status}).`)
    const batch: StravaActivity[] = await res.json()
    all.push(...batch)
    if (batch.length < 100) break
  }
  return all
}

export interface SyncSummary {
  fetched: number
  matched: number
  created: number
}

/**
 * Ordnet Aktivitäten den geplanten Einheiten zu:
 * gleicher Tag + gleiche Sportart → die geplante Einheit wird erledigt (bei mehreren: die mit der
 * ähnlichsten Dauer). Ohne passende Einheit wird eine neue, ungeplante Einheit angelegt.
 * Bereits übernommene Aktivitäten (gleiche Strava-ID) werden übersprungen.
 */
export async function applyActivities(activities: StravaActivity[]): Promise<SyncSummary> {
  const summary: SyncSummary = { fetched: activities.length, matched: 0, created: 0 }
  if (activities.length === 0) return summary
  const dates = activities.map((a) => a.start_date_local.slice(0, 10)).sort()
  const now = new Date().toISOString()

  await db.transaction('rw', db.workouts, async () => {
    const candidates = await db.workouts.where('date').between(dates[0], dates[dates.length - 1], true, true).toArray()
    const known = new Set(candidates.filter((w) => w.external?.source === 'strava').map((w) => w.external!.id))

    // Älteste zuerst, damit z. B. bei Koppeltraining Rad vor Lauf zugeordnet wird
    for (const a of [...activities].sort((x, y) => x.start_date_local.localeCompare(y.start_date_local))) {
      const id = String(a.id)
      if (known.has(id)) continue
      const date = a.start_date_local.slice(0, 10)
      const sport = mapSport(a)
      const durationMin = Math.round(a.moving_time / 60)
      const result = {
        durationMin,
        distanceM: a.distance > 0 ? Math.round(a.distance) : undefined,
        avgHr: a.average_heartrate ? Math.round(a.average_heartrate) : undefined,
        maxHr: a.max_heartrate ? Math.round(a.max_heartrate) : undefined,
        completedAt: now,
      }

      const open = candidates.filter((w) => w.date === date && w.sport === sport && w.status === 'planned')
      const target = open.sort((x, y) => {
        const dx = Math.abs((plannedTotals(x).durationMin ?? durationMin) - durationMin)
        const dy = Math.abs((plannedTotals(y).durationMin ?? durationMin) - durationMin)
        return dx - dy || x.order - y.order
      })[0]

      if (target) {
        const updated: Partial<Workout> = {
          status: 'done',
          result: { ...result, feeling: target.result?.feeling, note: target.result?.note },
          external: { source: 'strava', id },
          updatedAt: now,
        }
        await db.workouts.update(target.id, updated)
        Object.assign(target, updated) // nicht zweimal derselben Einheit zuordnen
        summary.matched++
      } else {
        const sameDay = candidates.filter((w) => w.date === date)
        const w: Workout = {
          id: newId(),
          createdAt: now,
          updatedAt: now,
          date,
          order: sameDay.length ? Math.max(...sameDay.map((x) => x.order)) + 1 : 0,
          sport,
          title: a.name || 'Strava-Aktivität',
          steps: [],
          exercises: [],
          tags: ['Strava', 'ungeplant'],
          status: 'done',
          result,
          external: { source: 'strava', id },
        }
        await db.workouts.add(w)
        candidates.push(w)
        summary.created++
      }
      known.add(id)
    }
  })
  return summary
}

/** Startdatum für den ersten Abgleich: Beginn des frühesten Plans, höchstens 90 Tage zurück. */
async function firstSyncStart(): Promise<string> {
  const earliest = (await db.plans.orderBy('startDate').first())?.startDate
  const limit = addDays(todayISO(), -90)
  return earliest && earliest > limit ? earliest : limit
}

let running: Promise<SyncSummary> | null = null

/** Holt neue Aktivitäten von Strava und trägt sie ein. Läuft nie doppelt gleichzeitig. */
export function syncStrava(): Promise<SyncSummary> {
  running ??= (async () => {
    try {
      const s = await getStrava()
      if (!isConnected(s)) throw new StravaError('Nicht mit Strava verbunden.')
      // 2 Tage Puffer: Garmin lädt manchmal verspätet hoch
      const from = s!.lastSyncAt ? addDays(s!.lastSyncAt.slice(0, 10), -2) : await firstSyncStart()
      const after = Math.floor(new Date(`${from}T00:00:00`).getTime() / 1000)
      const summary = await applyActivities(await fetchActivities(after))
      await db.integrations.update('strava', { lastSyncAt: new Date().toISOString() })
      return summary
    } finally {
      running = null
    }
  })()
  return running
}
