// ------------------------------------------------------------------
// src/components/ThemeToggle.jsx
// ------------------------------------------------------------------
// Botão de alternância claro/escuro controlado pelo ThemeContext.
// ------------------------------------------------------------------
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-graphite-700 bg-white dark:bg-graphite-850 text-slate-600 dark:text-slate-300 hover:text-steel-600 dark:hover:text-steel-400 transition-colors"
      title={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      aria-label="Alternar tema"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}