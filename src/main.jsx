// Ponto de entrada da aplicação React da JPS Steel.
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App'
import '@/index.css'

// Opcional: aplica o tema salvo antes da primeira renderização
// para evitar "flash" de tema errado no carregamento.
import { initTheme } from '@/context/ThemeContext'
initTheme()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)