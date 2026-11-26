import { useEffect, useState } from 'react'
import { todayISO } from './dates'

/**
 * Liefert das heutige Datum ("JJJJ-MM-TT") und aktualisiert es automatisch,
 * wenn Mitternacht vorbei ist oder die App wieder in den Vordergrund kommt
 * (wichtig auf dem iPhone, wo die App tagelang im Hintergrund offen bleibt).
 */
export function useToday(): string {
  const [today, setToday] = useState(todayISO)

  useEffect(() => {
    const update = () => setToday(todayISO())
    const timer = window.setInterval(update, 60_000)
    document.addEventListener('visibilitychange', update)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', update)
    }
  }, [])

  return today
}
