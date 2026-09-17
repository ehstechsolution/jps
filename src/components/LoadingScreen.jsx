// ------------------------------------------------------------------
// src/components/LoadingScreen.jsx
// ------------------------------------------------------------------
// Tela de carregamento exibida enquanto o Dashboard busca os dados.
// Mostra a logo da empresa e um spinner industrial.
// ------------------------------------------------------------------
import { Loader2 } from 'lucide-react'
import logoLocal from '@/assets/logo.png'
import { useConfig } from '@/context/ConfigContext'

export default function LoadingScreen() {
  const { empresaLogo } = useConfig()
  const logo = empresaLogo || logoLocal
  return (
    <div className="min-h-[50vh] grid place-items-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-20 w-20 grid place-items-center">
          <img src={logo} alt="JPS Steel" className="h-full w-full object-contain" />
        </div>
        <div className="flex items-center gap-2 text-steel-600 dark:text-steel-400 text-sm font-semibold">
          <Loader2 size={18} className="animate-spin" />
          Carregando dados em tempo real...
        </div>
      </div>
    </div>
  )
}