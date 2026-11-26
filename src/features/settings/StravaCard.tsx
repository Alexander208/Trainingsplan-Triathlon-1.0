import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check, Copy, ExternalLink, Link2Off, RefreshCw } from 'lucide-react'
import { Card } from '../../components/Card'
import {
  authorizeUrl,
  disconnectStrava,
  exchangeCode,
  getStrava,
  isConnected,
  removeStrava,
  saveStravaApp,
  StravaError,
} from '../../integrations/strava'
import { clearCallback, runSync, useSyncState } from '../../integrations/stravaSync'

const input =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 dark:border-white/10 dark:bg-white/5'
const btn = 'flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50'
const stravaBtn = `${btn} bg-[#fc4c02] text-white hover:bg-[#e34402]`
const greyBtn = `${btn} bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15`

function timeAgo(iso?: string): string {
  if (!iso) return 'noch nie'
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60_000)
  if (min < 1) return 'gerade eben'
  if (min < 60) return `vor ${min} min`
  if (min < 24 * 60) return `vor ${Math.round(min / 60)} h`
  return new Date(iso).toLocaleString('de-DE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function Message({ kind, children }: { kind: 'ok' | 'error' | 'info'; children: React.ReactNode }) {
  const style = {
    ok: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300',
    error: 'bg-red-50 text-red-800 dark:bg-red-500/10 dark:text-red-300',
    info: 'bg-sky-50 text-sky-800 dark:bg-sky-500/10 dark:text-sky-200',
  }[kind]
  return <div role="status" className={`mt-3 rounded-lg px-3 py-2 text-sm ${style}`}>{children}</div>
}

/** Schritt 1: eigene Strava-API-App anlegen und Client-ID/Secret eintragen. */
function SetupForm() {
  const [clientId, setClientId] = useState('')
  const [secret, setSecret] = useState('')
  // Strava erlaubt „localhost“ immer – eingetragen wird die Domain der veröffentlichten App
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname) || /^192\.168\./.test(window.location.hostname)
  const host = isLocal ? 'alexander208.github.io' : window.location.hostname
  const valid = /^\d+$/.test(clientId.trim()) && secret.trim().length >= 20

  return (
    <>
      <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-700 dark:text-slate-300">
        <li>
          Öffne{' '}
          <a href="https://www.strava.com/settings/api" target="_blank" rel="noreferrer" className="font-medium text-[#fc4c02] underline">
            strava.com/settings/api
          </a>{' '}
          (mit deinem Strava-Konto angemeldet).
        </li>
        <li>
          Fülle aus: <strong>Anwendungsname</strong> „TriPlan“, <strong>Kategorie</strong> „Training“,{' '}
          <strong>Website</strong> beliebig (z. B. diese Adresse).
        </li>
        <li>
          Bei <strong>„Autorisierungs-Callback-Domain“</strong> genau das eintragen:{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-white/10">{host}</code>
        </li>
        <li>Speichern, dann <strong>Client-ID</strong> und <strong>Client-Secret</strong> (auf „Anzeigen“ tippen) hier eintragen:</li>
      </ol>
      <div className="mt-3 space-y-2">
        <input className={input} inputMode="numeric" placeholder="Client-ID (Zahl)" value={clientId} onChange={(e) => setClientId(e.target.value)} aria-label="Client-ID" />
        <input className={input} type="password" autoComplete="off" placeholder="Client-Secret" value={secret} onChange={(e) => setSecret(e.target.value)} aria-label="Client-Secret" />
        <button type="button" disabled={!valid} onClick={() => saveStravaApp(clientId, secret)} className={`${stravaBtn} w-full`}>
          Speichern
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        Die Daten bleiben nur auf diesem Gerät und kommen nicht ins Backup.
      </p>
    </>
  )
}

/** Code aus der Rückleitung von Strava von Hand einfügen (Notlösung, falls die Rückleitung in Safari statt in der App landet). */
function PasteCode() {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  async function submit() {
    // Akzeptiert den Code allein oder die komplette Adresse mit „code=…“
    const code = value.match(/code=([^&#\s]+)/)?.[1] ?? value.trim()
    setBusy(true)
    setError(undefined)
    try {
      await exchangeCode(code)
      await runSync()
    } catch (e) {
      setError(e instanceof StravaError ? e.message : 'Der Code hat nicht funktioniert – bitte neu verbinden.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-slate-500 dark:text-slate-400">Code von Hand einfügen</summary>
      <div className="mt-2 flex gap-2">
        <input className={input} placeholder="Code oder Adresse mit code=…" value={value} onChange={(e) => setValue(e.target.value)} aria-label="Strava-Code" />
        <button type="button" disabled={!value.trim() || busy} onClick={submit} className={greyBtn}>
          OK
        </button>
      </div>
      {error && <Message kind="error">{error}</Message>}
    </details>
  )
}

/** Anzeige, wenn die Rückleitung in einem Browser ohne gespeicherte Zugangsdaten gelandet ist. */
function CodeHandOver({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Message kind="info">
      <p className="font-semibold">Fast geschafft!</p>
      <p className="mt-1">
        Strava hat dich hierher (in den Browser) zurückgeschickt, aber TriPlan ist als App installiert. Kopiere diesen
        Code, öffne die TriPlan-App und füge ihn unter <strong>Strava → Code von Hand einfügen</strong> ein:
      </p>
      <div className="mt-2 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded bg-white/60 px-2 py-1 text-xs dark:bg-black/30">{code}</code>
        <button
          type="button"
          className={greyBtn}
          onClick={async () => {
            await navigator.clipboard.writeText(code)
            setCopied(true)
          }}
        >
          {copied ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />} {copied ? 'Kopiert' : 'Kopieren'}
        </button>
      </div>
      <p className="mt-1 text-xs opacity-80">Der Code ist nur wenige Minuten gültig.</p>
    </Message>
  )
}

export function StravaCard() {
  const strava = useLiveQuery(() => getStrava(), [], null)
  const sync = useSyncState()
  if (strava === null) return null // lädt noch

  const connected = isConnected(strava)
  const cb = sync.callback

  return (
    <Card className="mt-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-semibold">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#fc4c02] text-xs font-black text-white" aria-hidden>
            S
          </span>
          Strava
        </h2>
        {connected && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">verbunden</span>}
      </div>
      <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
        Garmin → Strava → TriPlan: Trainings werden beim Öffnen der App automatisch übernommen und passende Einheiten abgehakt.
      </p>

      {cb?.kind === 'code' && <CodeHandOver code={cb.code} />}
      {cb?.kind === 'denied' && <Message kind="error">Verbindung abgebrochen – Strava hat keinen Zugriff erlaubt.</Message>}
      {cb?.kind === 'error' && <Message kind="error">{cb.message}</Message>}

      {!strava?.clientSecret ? (
        <SetupForm />
      ) : !connected ? (
        <>
          <a href={authorizeUrl(strava.clientId)} onClick={clearCallback} className={`${stravaBtn} w-full`}>
            <ExternalLink size={16} aria-hidden /> Mit Strava verbinden
          </a>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Du wirst zu Strava weitergeleitet, erlaubst den Zugriff und kommst automatisch zurück.
          </p>
          <PasteCode />
          <button
            type="button"
            onClick={() => confirm('Client-ID und Secret löschen?') && removeStrava()}
            className="mt-3 text-xs text-slate-500 underline dark:text-slate-400"
          >
            Client-ID/Secret ändern
          </button>
        </>
      ) : (
        <>
          <p className="text-sm">
            Angemeldet{strava.athleteName ? <> als <strong>{strava.athleteName}</strong></> : ''} · letzter Abgleich{' '}
            {timeAgo(strava.lastSyncAt)}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" disabled={sync.phase === 'syncing'} onClick={runSync} className={stravaBtn}>
              <RefreshCw size={16} className={sync.phase === 'syncing' ? 'animate-spin' : ''} aria-hidden />
              {sync.phase === 'syncing' ? 'Lädt …' : 'Jetzt abgleichen'}
            </button>
            <button
              type="button"
              onClick={() => confirm('Verbindung zu Strava trennen? Bereits übernommene Trainings bleiben erhalten.') && disconnectStrava()}
              className={greyBtn}
            >
              <Link2Off size={16} aria-hidden /> Trennen
            </button>
          </div>
          {sync.phase === 'ok' && sync.message && <Message kind="ok">{sync.message}</Message>}
          {sync.phase === 'error' && sync.message && <Message kind="error">{sync.message}</Message>}
        </>
      )}
    </Card>
  )
}
