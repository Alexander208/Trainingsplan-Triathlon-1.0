import { useEffect, useState } from 'react'
import { CheckCircle2, Share, Smartphone, SquarePlus } from 'lucide-react'
import { Card } from '../../components/Card'

/** Läuft die App als installierte App (vom Home-Bildschirm gestartet)? */
function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // Safari auf dem iPhone kennt eine eigene Eigenschaft dafür
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)

/** Erklärt die Installation aufs iPhone und zeigt, ob die Daten dauerhaft gespeichert sind. */
export function InstallCard() {
  const [persisted, setPersisted] = useState<boolean | null>(null)
  const standalone = isStandalone()

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted).catch(() => setPersisted(null))
  }, [])

  return (
    <Card className="mt-4">
      <h2 className="mb-2 flex items-center gap-2 font-semibold">
        <Smartphone size={18} aria-hidden /> App aufs iPhone
      </h2>

      {standalone ? (
        <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 size={16} aria-hidden /> Installiert – läuft auch offline.
        </p>
      ) : (
        <>
          <ol className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <li>
              1. Diese Seite in <strong>Safari</strong> öffnen{isIOS ? '' : ' (auf dem iPhone)'}.
            </li>
            <li className="flex flex-wrap items-center gap-1">
              2. Unten auf <Share size={15} className="inline text-sky-500" aria-label="Teilen" /> <strong>Teilen</strong>{' '}
              tippen.
            </li>
            <li className="flex flex-wrap items-center gap-1">
              3. <SquarePlus size={15} className="inline" aria-hidden /> <strong>„Zum Home-Bildschirm“</strong> wählen
              und „Hinzufügen“ tippen.
            </li>
          </ol>
          <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
            Wichtig: Die installierte App hat auf dem iPhone ihren eigenen Speicher. Importiere deinen Plan deshalb
            erst <strong>in der installierten App</strong> (Einstellungen → Daten → Importieren).
          </p>
        </>
      )}

      {persisted !== null && (
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Daten-Speicher: {persisted ? 'dauerhaft geschützt ✓' : 'nicht garantiert – regelmäßig ein Backup machen'}
        </p>
      )}
    </Card>
  )
}
