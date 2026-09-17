// ------------------------------------------------------------------
// src/context/ThemeContext.jsx
// ------------------------------------------------------------------
// Contexto de tema (claro/escuro) da JPS Steel. Nada de biblioteca
// externa: usa a classe `.dark` no <html> (Tailwind darkMode: 'class')
// e persiste a preferência no localStorage.
// ------------------------------------------------------------------
import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const STORAGE_KEY = 'jps-theme'

const ThemeContext = createContext({ theme: 'light', toggleTheme: () => {} })

/**
 * Aplica o tema salvo imediatamente, antes da primeira renderização
 * (chamado em src/main.jsx para evitar "flash" de tema incorreto).
 */
export function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY)
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches
  const theme = saved ?? (prefersDark ? 'dark' : 'light')
  applyTheme(theme)
}

/** Aplica (ou remove) a classe .dark no <html>. */
function applyTheme(theme) {
  const root = document.documentElement
  if (theme === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
}

/**
 * Provider que expõe `theme` e `toggleTheme` para toda a aplicação.
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return (typeof window !== 'undefined'
      ? localStorage.getItem(STORAGE_KEY)
      : null) ?? 'light'
  })

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

/** Hook de acesso ao tema/toggle. */
export function useTheme() {
  return useContext(ThemeContext)
}