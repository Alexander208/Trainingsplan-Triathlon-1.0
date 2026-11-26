import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

/**
 * Fenster, das von unten hereinfährt (wie in iOS-Apps).
 * Schließt per Tippen auf den Hintergrund, X-Knopf oder Escape-Taste.
 */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    // Hintergrund nicht mitscrollen lassen
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Schließen" onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-2xl sm:rounded-3xl dark:bg-[#141a24]">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300 sm:hidden dark:bg-white/20" aria-hidden />
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300"
          >
            <X size={18} aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
