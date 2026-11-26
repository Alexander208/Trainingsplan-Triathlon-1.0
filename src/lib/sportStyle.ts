import type { Sport } from '../types'

/** Farbklassen pro Sportart (Tailwind braucht die Klassen ausgeschrieben). */
export const SPORT_STYLE: Record<Sport, { bg: string; text: string; bar: string }> = {
  swim: { bg: 'bg-swim/15', text: 'text-swim', bar: 'bg-swim' },
  bike: { bg: 'bg-bike/15', text: 'text-bike', bar: 'bg-bike' },
  run: { bg: 'bg-run/15', text: 'text-run', bar: 'bg-run' },
  strength: { bg: 'bg-strength/15', text: 'text-strength', bar: 'bg-strength' },
  other: { bg: 'bg-other/15', text: 'text-other', bar: 'bg-other' },
  rest: { bg: 'bg-slate-500/10', text: 'text-slate-400', bar: 'bg-slate-400' },
}
