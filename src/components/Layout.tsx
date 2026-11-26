import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

/** Rahmen jeder Seite: Inhalt in der Mitte, Navigation unten. */
export function Layout() {
  return (
    <>
      <main className="mx-auto max-w-xl px-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-28">
        <Outlet />
      </main>
      <BottomNav />
    </>
  )
}
