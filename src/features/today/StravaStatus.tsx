import { useLiveQuery } from 'dexie-react-hooks'
import { RefreshCw } from 'lucide-react'
import { getStrava, isConnected } from '../../integrations/strava'
import { runSync, useSyncState } from '../../integrations/stravaSync'

/** Kleine Statuszeile auf der Startseite: letzter Strava-Abgleich + Knopf zum Aktualisieren. */
export function StravaStatus() {
  const strava = useLiveQuery(() => getStrava(), [])
  const sync = useSyncState()
  if (!isConnected(strava)) return null

  const syncing = sync.phase === 'syncing'
  const text = syncing
    ? 'Strava wird abgeglichen …'
    : sync.message
      ? `Strava: ${sync.message}`
      : `Strava verbunden${strava?.lastSyncAt ? ` · zuletzt ${new Date(strava.lastSyncAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}` : ''}`

  return (
    <button
      type="button"
      onClick={() => !syncing && runSync()}
      className={`mb-4 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
        sync.phase === 'error'
          ? 'bg-red-500/10 text-red-700 dark:text-red-300'
          : 'bg-[#fc4c02]/10 text-[#c23a00] dark:text-[#ff8a50]'
      }`}
    >
      <RefreshCw size={15} className={`shrink-0 ${syncing ? 'animate-spin' : ''}`} aria-hidden />
      <span className="min-w-0 flex-1 truncate">{text}</span>
    </button>
  )
}
