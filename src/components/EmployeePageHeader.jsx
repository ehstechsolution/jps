import { Menu } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

export default function EmployeePageHeader({ title, subtitle, onOpenMenu }) {
  return (
    <header className="flex items-start justify-between gap-4 mb-6">
      <div className="flex items-start gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMenu}
          className="lg:hidden mt-1 grid place-items-center h-9 w-9 rounded-xl border border-slate-200 dark:border-graphite-700 bg-white dark:bg-graphite-850 text-slate-600 dark:text-slate-300"
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white truncate">{title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <ThemeToggle />
    </header>
  )
}
