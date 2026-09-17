// ------------------------------------------------------------------
// src/components/ConfigBanner.jsx
// ------------------------------------------------------------------
// Aviso exibido no topo quando o Firebase ainda não foi configurado
// (modo demonstração ativo). Some automaticamente ao criar o .env.
// ------------------------------------------------------------------
import { AlertTriangle, Info } from 'lucide-react'
import { isFirebaseConfigured } from '@/config/firebase'

export default function ConfigBanner() {
  if (isFirebaseConfigured) return null

  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-300/60 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
      <Info size={18} className="shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold flex items-center gap-1.5">
          <AlertTriangle size={14} />
          Modo demonstração ativo
        </p>
        <p className="text-amber-700 dark:text-amber-300/90">
          O Firebase não foi configurado. Crie um arquivo <code className="font-mono">.env</code> com as
          variáveis <code className="font-mono">VITE_FIREBASE_*</code> (veja o <code className="font-mono">.env.example</code>)
          para conectar ao banco de dados em tempo real.
        </p>
      </div>
    </div>
  )
}