/**
 * Datenmodell der App.
 *
 * Grundregeln (wichtig für spätere Funktionen wie Sync und Import):
 * - Jeder Datensatz hat eine eindeutige `id` (Text) sowie `createdAt`/`updatedAt`.
 * - Datumsangaben ohne Uhrzeit sind Text im Format "JJJJ-MM-TT" (z. B. "2026-11-27").
 * - Distanzen immer in Metern, Dauern in Abschnitten in Sekunden, Gesamtdauern in Minuten.
 */

export type ISODate = string // "2026-11-27"
export type ISODateTime = string // "2026-11-27T18:30:00.000Z"

export type Sport = 'swim' | 'bike' | 'run' | 'strength' | 'other' | 'rest'
export type Zone = 1 | 2 | 3 | 4 | 5
export type WorkoutStatus = 'planned' | 'done' | 'skipped'

/** Gemeinsame Felder aller gespeicherten Datensätze. */
export interface BaseRecord {
  id: string
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

/** Puls-Vorgabe in bpm, z. B. 147–162 oder „unter 148“ (nur max). */
export interface HrTarget {
  min?: number
  max?: number
  /** Freitext, wenn (noch) keine Zahl bekannt ist, z. B. „Rad locker“. */
  label?: string
}

// ---------------------------------------------------------------------------
// Wettkämpfe
// ---------------------------------------------------------------------------

export interface Race extends BaseRecord {
  name: string
  date: ISODate
  /** z. B. „Ironman 70.3“, „Halbmarathon“ */
  type: string
  location?: string
  /** A = Saisonhöhepunkt, B = wichtig, C = Trainingswettkampf */
  priority: 'A' | 'B' | 'C'
  swimM?: number
  bikeM?: number
  runM?: number
  bikeElevationM?: number
  runElevationM?: number
  startTime?: string
  notes?: string
}

// ---------------------------------------------------------------------------
// Pläne & Wochen
// ---------------------------------------------------------------------------

export interface Plan extends BaseRecord {
  name: string
  goal?: string
  /** Wochen werden ab diesem Datum gezählt. */
  startDate: ISODate
  endDate?: ISODate
  /** Wettkampf, auf den der Plan hinarbeitet. */
  raceId?: string
  notes?: string
  /** Feste Regeln, die immer gelten (z. B. „Donnerstagsregel“). */
  rules: string[]
  /** Woher der Plan stammt – wichtig für Vorlagen und Import. */
  source: 'manual' | 'import' | 'template' | 'demo'
  /** Wer den Plan erstellt hat, z. B. „Trainer“. */
  author?: string
}

export type Phase =
  | 'Vorbereitung'
  | 'Gewöhnung'
  | 'Grundlage'
  | 'Aufbau'
  | 'Spitze'
  | 'Entlastung'
  | 'Tapering'
  | 'Wettkampf'
  | 'Übergang'

export interface Week extends BaseRecord {
  planId: string
  /** 0 = Vorbereitung, 1 = Woche 1, … */
  index: number
  label: string
  phase?: Phase
  startDate: ISODate
  endDate: ISODate
  /** Kurzer Einleitungstext der Woche. */
  intro?: string
  /** Wichtige Hinweise, z. B. „Mo: HF-Alarm auf 162 umstellen“. */
  callouts: string[]
}

// ---------------------------------------------------------------------------
// Einheiten
// ---------------------------------------------------------------------------

export type StepKind = 'warmup' | 'work' | 'recovery' | 'cooldown' | 'drill'

/** Ein einzelner Abschnitt einer Einheit, z. B. „15′ einrollen“ oder „300 m ein“. */
export interface SegmentStep {
  id: string
  kind: StepKind
  label?: string
  durationSec?: number
  distanceM?: number
  zone?: Zone
  hr?: HrTarget
  /** Pace/Watt/Gefühl als Freitext, z. B. „4:30 min/km“, „hoher Widerstand“ */
  target?: string
  /** Trittfrequenz (Rad) bzw. Schrittfrequenz als Text, z. B. „90–95“ */
  cadence?: string
  /** Pause nach dem Abschnitt (z. B. 20 s zwischen Schwimm-Wiederholungen). */
  restSec?: number
  note?: string
}

/** Wiederholungsblock, z. B. „4× (6′ KA + 3′ locker)“. */
export interface RepeatStep {
  id: string
  kind: 'repeat'
  times: number
  label?: string
  steps: SegmentStep[]
}

export type WorkoutStep = SegmentStep | RepeatStep

/** Eine Kraft- oder Hyrox-Übung. */
export interface StrengthExercise {
  id: string
  name: string
  sets?: number
  reps?: number
  weightKg?: number
  durationSec?: number
  distanceM?: number
  restSec?: number
  note?: string
}

/** Was tatsächlich gemacht wurde. */
export interface WorkoutResult {
  durationMin?: number
  distanceM?: number
  avgHr?: number
  maxHr?: number
  /** Gefühl 1 (sehr leicht) bis 10 (maximal) */
  feeling?: number
  note?: string
  /** Bei Tests: gemessener Schwellenpuls o. Ä. */
  testValue?: string
  completedAt: ISODateTime
}

export interface Workout extends BaseRecord {
  /** Leer = spontane Einheit ohne Plan */
  planId?: string
  weekId?: string
  date: ISODate
  /** Reihenfolge innerhalb eines Tages (0, 1, 2 …) */
  order: number
  sport: Sport
  title: string
  description?: string
  zone?: Zone
  hr?: HrTarget
  target?: string
  steps: WorkoutStep[]
  exercises: StrengthExercise[]
  /** Geplante Gesamtwerte – werden aus den Abschnitten berechnet, wenn leer. */
  plannedDurationMin?: number
  plannedDistanceM?: number
  /** z. B. Gruppenlauf: Dauer hängt von der Gruppe ab. */
  durationVariable?: boolean
  isTest?: boolean
  optional?: boolean
  /** Einheiten mit gleicher Gruppe gehören zusammen (Koppeltraining, Kraft + Lauf). */
  brickGroupId?: string
  /** Ersatz bei schlechtem Wetter, z. B. „Studio, 75′ statt 110′“ */
  badWeather?: string
  /** Kurze Merkmale, z. B. „draußen“, „Studio“ */
  tags: string[]
  status: WorkoutStatus
  result?: WorkoutResult
  /** Für spätere Imports aus Strava/Garmin. */
  external?: { source: 'strava' | 'garmin'; id: string }
}

// ---------------------------------------------------------------------------
// Einstellungen
// ---------------------------------------------------------------------------

export interface ZoneRange {
  zone: Zone
  min: number
  max: number
}

export interface Settings {
  id: 'settings'
  hrZones: {
    run?: ZoneRange[]
    bike?: ZoneRange[]
    swim?: ZoneRange[]
  }
  maxHr?: number
  restingHr?: number
  runThresholdHr?: number
  bikeThresholdHr?: number
  updatedAt: ISODateTime
}

// ---------------------------------------------------------------------------
// Verbindungen zu anderen Diensten
// ---------------------------------------------------------------------------

export interface StravaIntegration {
  id: 'strava'
  clientId: string
  clientSecret: string
  accessToken?: string
  refreshToken?: string
  /** Ablauf des Access-Tokens (Sekunden seit 1970, wie von Strava geliefert) */
  expiresAt?: number
  athleteName?: string
  lastSyncAt?: ISODateTime
}

export type Integration = StravaIntegration

// ---------------------------------------------------------------------------
// Backup / Import
// ---------------------------------------------------------------------------

export const BACKUP_APP_ID = 'triplan'
export const BACKUP_SCHEMA_VERSION = 1

export interface BackupData {
  plans: Plan[]
  weeks: Week[]
  workouts: Workout[]
  races: Race[]
  settings?: Settings
}

export interface BackupFile {
  app: typeof BACKUP_APP_ID
  schemaVersion: number
  exportedAt: ISODateTime
  data: BackupData
}
