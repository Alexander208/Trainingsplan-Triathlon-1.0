import { Monitor, Moon, Sun } from 'lucide-react'
import { Card } from '../../components/Card'
import { PageHeader } from '../../components/PageHeader'
import { useTheme, type ThemeSetting } from '../../lib/theme'
import { DataCard } from './DataCard'
import { InstallCard } from './InstallCard'

const options: { value: ThemeSetting; label: string; icon: typeof Sun }[] = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Hell', icon: Sun },
  { value: 'dark', label: 'Dunkel', icon: Moon },
]

export function SettingsPage() {
  const { setting: theme, setTheme } = useTheme()

  return (
    <>
      <PageHeader title="Einstellungen" />
      <Card>
        <h2 className="mb-3 font-semibold">Darstellung</h2>
        <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1 dark:bg-white/5">
          {options.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition ${
                theme === value
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-white/15 dark:text-white'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon size={16} aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </Card>
      <DataCard />
      <InstallCard />
      <Card className="mt-4">
        <h2 className="mb-1 font-semibold">Herzfrequenzzonen</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">Kommt in Schritt 9.</p>
      </Card>
    </>
  )
}
