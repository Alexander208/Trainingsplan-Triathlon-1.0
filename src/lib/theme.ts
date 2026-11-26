import { useEffect, useState } from 'react'

export type ThemeSetting = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'theme'

function readSetting(): ThemeSetting {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {
    /* Speicher nicht verfügbar → Standard */
  }
  return 'system'
}

function apply(setting: ThemeSetting) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const dark = setting === 'dark' || (setting === 'system' && prefersDark)
  document.documentElement.classList.toggle('dark', dark)
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', dark ? '#0b0f17' : '#f8fafc')
}

/** Hell/Dunkel/System – wird im Browser gespeichert. */
export function useTheme() {
  const [setting, setSetting] = useState<ThemeSetting>(readSetting)

  useEffect(() => {
    apply(setting)
    try {
      localStorage.setItem(STORAGE_KEY, setting)
    } catch {
      /* ignorieren */
    }
    if (setting !== 'system') return
    // Bei "System" auf Änderungen der Systemeinstellung reagieren
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => apply('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [setting])

  return [setting, setSetting] as const
}
