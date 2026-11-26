import type { ISODate } from '../types'

/** Datum → "JJJJ-MM-TT" in lokaler Zeit (nicht UTC, sonst springt es nachts um einen Tag). */
export function toISODate(d: Date): ISODate {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** "JJJJ-MM-TT" → Date (lokal, 12 Uhr mittags – robust gegen Zeitumstellung). */
export function fromISODate(s: ISODate): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

export function addDays(s: ISODate, days: number): ISODate {
  const d = fromISODate(s)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

/** Montag der Woche, in der das Datum liegt. */
export function startOfWeek(s: ISODate): ISODate {
  const d = fromISODate(s)
  const weekday = (d.getDay() + 6) % 7 // Mo = 0 … So = 6
  return addDays(s, -weekday)
}

export function todayISO(): ISODate {
  return toISODate(new Date())
}

export function formatDate(s: ISODate, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) {
  return fromISODate(s).toLocaleDateString('de-DE', opts)
}
