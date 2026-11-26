import { Lightbulb, LightbulbOff } from 'lucide-react'
import { useTheme } from '../lib/theme'

/** Lampen-Knopf: Antippen wechselt zwischen hell und dunkel. */
export function ThemeToggle() {
  const { dark, toggleTheme } = useTheme()
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? 'Hellen Modus einschalten' : 'Dunklen Modus einschalten'}
      title={dark ? 'Licht an' : 'Licht aus'}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition active:scale-90 ${
        dark
          ? 'border-white/10 bg-white/5 text-slate-400 hover:text-slate-200'
          : 'border-amber-200 bg-amber-50 text-amber-500 shadow-[0_0_18px_rgba(251,191,36,0.45)] hover:text-amber-600'
      }`}
    >
      {dark ? <LightbulbOff size={22} aria-hidden /> : <Lightbulb size={22} fill="currentColor" fillOpacity={0.25} aria-hidden />}
    </button>
  )
}
