// ------------------------------------------------------------------
// src/components/Modal.jsx
// ------------------------------------------------------------------
// Modal genérico reutilizável (overlay escuro, fechar com ESC/clique
// fora, corpo rolável e rodapé opcional de ações).
// ------------------------------------------------------------------
import { useEffect } from 'react'
import { X } from 'lucide-react'

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
}

/**
 * @param {object} props
 * @param {boolean}  props.open
 * @param {string}   props.title
 * @param {string}   [props.subtitle]
 * @param {Function} props.onClose
 * @param {React.ReactNode} props.children
 * @param {React.ReactNode} [props.footer]
 * @param {string}   [props.size]  "sm" | "md" | "lg"
 */
export default function Modal({ open, title, subtitle, onClose, children, footer, size = 'md' }) {
  // Fecha com a tecla ESC
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6 bg-graphite-950/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full ${SIZES[size]} card mt-6 sm:mt-14 overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-graphite-800">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="grid place-items-center h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-graphite-800"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="max-h-[70vh] overflow-y-auto">{children}</div>

        {/* Rodapé de ações */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100 dark:border-graphite-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}