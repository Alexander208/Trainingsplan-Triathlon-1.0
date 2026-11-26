import { useSyncExternalStore } from 'react'

export type ThemeSetting = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'theme'
const media = window.matchMedia('(prefers-color-scheme: dark)')

function readSetting(): ThemeSetting {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {
    /* Speicher nicht verfügbar → Standard */
  }
  return 'system'
}

// ---------------------------------------------------------------------------
// Gemeinsamer Speicher: Lampen-Knopf und Einstellungen zeigen immer denselben Stand.
// ---------------------------------------------------------------------------

let setting: ThemeSetting = readSetting()
const listeners = new Set<() => void>()

function isDark(): boolean {
  return setting === 'dark' || (setting === 'system' && media.matches)
}

function apply() {
  const dark = isDark()
  document.documentElement.classList.toggle('dark', dark)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0b0f17' : '#f8fafc')
  listeners.forEach((l) => l())
}

// Bei „System“ auf Änderungen der Geräte-Einstellung reagieren
media.addEventListener('change', () => setting === 'system' && apply())
apply()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function setTheme(next: ThemeSetting) {
  setting = next
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    /* ignorieren */
  }
  apply()
}

/** Wechselt zwischen hell und dunkel (für den Lampen-Knopf). */
export function toggleTheme() {
  setTheme(isDark() ? 'light' : 'dark')
}

/** Aktuelle Einstellung und ob gerade dunkel angezeigt wird. */
export function useTheme() {
  const current = useSyncExternalStore(subscribe, () => setting)
  const dark = useSyncExternalStore(subscribe, isDark)
  return { setting: current, dark, setTheme, toggleTheme }
}
