// ------------------------------------------------------------------
// src/components/modelos/ModelosGaleria.jsx
// ------------------------------------------------------------------
// Grade de modelos de documento disponíveis para geração.
// ------------------------------------------------------------------
import { FileText, ChevronRight } from 'lucide-react'
import { MODELOS } from '@/services/modelosService'

/**
 * @param {object} props
 * @param {Function} props.onSelect  Recebe o modelo escolhido
 */
export default function ModelosGaleria({ onSelect }) {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MODELOS.map((modelo) => (
          <button
            key={modelo.id}
            onClick={() => onSelect(modelo)}
            className="card p-5 text-left group hover:border-steel-500/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <span className="grid place-items-center h-11 w-11 rounded-xl bg-steel-500/10 text-steel-600 dark:text-steel-400 shrink-0">
                <FileText size={20} />
              </span>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  {modelo.titulo}
                  <ChevronRight size={15} className="text-slate-300 dark:text-slate-600 group-hover:text-steel-500 transition-colors" />
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{modelo.descricao}</p>
                <span className="inline-flex mt-2 rounded-full bg-slate-100 dark:bg-graphite-800 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Tipo: {modelo.tipo}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-400 mt-4">
        Os modelos têm campos pré-definidos ({'{nome}'}, {'{cpf}'}, etc.). O documento é gerado
        automaticamente com os dados preenchidos.
      </p>
    </div>
  )
}