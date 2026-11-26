import { Activity, BedDouble, Bike, Dumbbell, Footprints, Waves, type LucideIcon } from 'lucide-react'
import type { Sport } from '../types'
import { SPORT_LABEL } from '../lib/workout'
import { SPORT_STYLE } from '../lib/sportStyle'

const ICONS: Record<Sport, LucideIcon> = {
  swim: Waves,
  bike: Bike,
  run: Footprints,
  strength: Dumbbell,
  other: Activity,
  rest: BedDouble,
}


export function SportIcon({ sport, size = 'md' }: { sport: Sport; size?: 'sm' | 'md' }) {
  const Icon = ICONS[sport]
  const s = SPORT_STYLE[sport]
  const box = size === 'sm' ? 'h-8 w-8 rounded-lg' : 'h-11 w-11 rounded-xl'
  return (
    <span className={`flex shrink-0 items-center justify-center ${box} ${s.bg} ${s.text}`} title={SPORT_LABEL[sport]}>
      <Icon size={size === 'sm' ? 16 : 22} strokeWidth={2.2} aria-hidden />
    </span>
  )
}
