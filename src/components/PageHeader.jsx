// ------------------------------------------------------------------
// src/components/PageHeader.jsx
// ------------------------------------------------------------------
// Cabeçalho padrão das páginas internas: título, subtítulo, botão de
// abrir menu (mobile), sino de alertas, toggle de tema e ações opcionais.
// ------------------------------------------------------------------
import { Menu } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import AlertBell from '@/components/AlertBell'

export default function PageHeader({ title, subtitle, actions, onOpenMenu, onNavigate }) {
  return (
    <header className="flex items-start justify-between gap-4 mb-6">
      <div className="flex items-start gap-3 min-w-0">
        {onOpenMenu && (
          <button
            onClick={onOpenMenu}
            className="lg:hidden mt-1 grid place-items-center h-9 w-9 rounded-xl border border-slate-200 dark:border-graphite-700 bg-white dark:bg-graphite-850 text-slate-600 dark:text-slate-300"
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <AlertBell onNavigate={onNavigate} />
        {actions}
        <ThemeToggle />
      </div>
    </header>
  )
}