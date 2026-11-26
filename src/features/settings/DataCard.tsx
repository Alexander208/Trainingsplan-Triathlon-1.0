import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Download, FlaskConical, Trash2, Upload } from 'lucide-react'
import { Card } from '../../components/Card'
import { db } from '../../db/db'
import { BackupError, deleteAllData, downloadBackup, importBackup, importFile, parseBackup } from '../../db/backup'
import { buildDemoBackup } from '../../data/demoPlan'

type Message = { kind: 'ok' | 'error'; text: string } | null

const btn =
  'flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition active:scale-[0.98] disabled:opacity-50'

/** Backup erstellen, Datei importieren, Demo laden, alles löschen. */
export function DataCard() {
  const fileInput = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<Message>(null)

  const counts = useLiveQuery(async () => ({
    plans: await db.plans.count(),
    workouts: await db.workouts.count(),
    races: await db.races.count(),
  }))

  async function run(action: () => Promise<string>) {
    setBusy(true)
    setMessage(null)
    try {
      setMessage({ kind: 'ok', text: await action() })
    } catch (err) {
      const text = err instanceof BackupError ? err.message : 'Unerwarteter Fehler – siehe Browser-Konsole.'
      if (!(err instanceof BackupError)) console.error(err)
      setMessage({ kind: 'error', text })
    } finally {
      setBusy(false)
    }
  }

  async function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // gleiche Datei später erneut wählbar
    if (!file) return
    await run(async () => {
      const s = await importFile(file)
      const kept = s.keptResults ? ` ${s.keptResults} bereits erledigte Einheiten wurden beibehalten.` : ''
      return `Importiert: ${s.plans} Plan/Pläne, ${s.weeks} Wochen, ${s.workouts} Einheiten, ${s.races} Wettkämpfe.${kept}`
    })
  }

  return (
    <Card className="mt-4">
      <h2 className="mb-1 font-semibold">Daten</h2>
      <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
        {counts
          ? `${counts.plans} Pläne · ${counts.workouts} Einheiten · ${counts.races} Wettkämpfe`
          : 'Lade …'}
        <br />
        <span className="text-slate-500 dark:text-slate-400">
          Gespeichert nur auf diesem Gerät. Mach regelmäßig ein Backup.
        </span>
      </p>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => run(async () => (await downloadBackup(), 'Backup erstellt.'))}
          className={`${btn} bg-sky-600 text-white hover:bg-sky-500`}
        >
          <Download size={16} aria-hidden /> Backup
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => fileInput.current?.click()}
          className={`${btn} bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15`}
        >
          <Upload size={16} aria-hidden /> Importieren
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            run(async () => {
              const s = await importBackup(parseBackup(buildDemoBackup()))
              return `Demo-Woche geladen (${s.workouts} Einheiten).`
            })
          }
          className={`${btn} bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15`}
        >
          <FlaskConical size={16} aria-hidden /> Demo laden
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (!confirm('Wirklich ALLE Pläne, Einheiten und Wettkämpfe löschen? Das kann nicht rückgängig gemacht werden.')) return
            run(async () => (await deleteAllData(), 'Alle Daten gelöscht.'))
          }}
          className={`${btn} text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10`}
        >
          <Trash2 size={16} aria-hidden /> Alles löschen
        </button>
      </div>

      <input ref={fileInput} type="file" accept=".json,application/json" className="hidden" onChange={onFileChosen} />

      {message && (
        <p
          role="status"
          className={`mt-3 rounded-lg px-3 py-2 text-sm ${
            message.kind === 'ok'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300'
              : 'bg-red-50 text-red-800 dark:bg-red-500/10 dark:text-red-300'
          }`}
        >
          {message.text}
        </p>
      )}
    </Card>
  )
}
