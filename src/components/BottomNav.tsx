import { NavLink } from 'react-router-dom'
import { BarChart3, CalendarDays, ClipboardList, Settings, Sun } from 'lucide-react'

const items = [
  { to: '/', label: 'Heute', icon: Sun },
  { to: '/woche', label: 'Woche', icon: CalendarDays },
  { to: '/plaene', label: 'Pläne', icon: ClipboardList },
  { to: '/statistik', label: 'Statistik', icon: BarChart3 },
  { to: '/einstellungen', label: 'Einstellungen', icon: Settings },
]

/** Navigationsleiste unten – wie in einer nativen iPhone-App. */
export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg dark:border-white/10 dark:bg-[#0b0f17]/85">
      <ul className="mx-auto flex max-w-xl">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'text-sky-600 dark:text-sky-400'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`
              }
            >
              <Icon size={22} strokeWidth={2} aria-hidden />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
