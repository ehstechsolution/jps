// ------------------------------------------------------------------
// src/components/AlertBell.jsx
// ------------------------------------------------------------------
// Sino de alertas de documentos SST: badge com a quantidade de
// vencidos/próximos do vencimento e dropdown agrupado. Clicar no item
// ou no rodapé leva ao módulo de Documentos.
// ------------------------------------------------------------------
import { useState, useEffect, useRef } from 'react'
import { Bell, XCircle, Clock3, ChevronRight } from 'lucide-react'
import { useAlertas } from '@/hooks/useAlertas'
import { formatDate } from '@/utils/format'

/**
 * @param {object} props
 * @param {Function} props.onNavigate  Navega para o módulo de documentos
 */
export default function AlertBell({ onNavigate }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const { vencidos, proximos, count } = useAlertas()

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  function goToDocumentos() {
    setOpen(false)
    onNavigate?.('documentos')
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative grid place-items-center h-9 w-9 rounded-xl border border-slate-200 dark:border-graphite-700 bg-white dark:bg-graphite-850 text-slate-600 dark:text-slate-300 hover:text-steel-600 dark:hover:text-steel-400 transition-colors"
        aria-label="Alertas de documentos"
      >
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 card overflow-hidden shadow-xl z-50">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-graphite-800 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-900 dark:text-white">Alertas de documentos</p>
            <button onClick={goToDocumentos} className="text-xs text-steel-600 dark:text-steel-400 hover:underline">
              Ver todos
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 dark:divide-graphite-800">
            {count === 0 && (
              <p className="px-4 py-6 text-center text-sm text-slate-400">
                Nenhum documento vencido ou próximo do vencimento. 🎉
              </p>
            )}

            {vencidos.length > 0 && (
              <AlertGroup
                titulo={`Vencidos (${vencidos.length})`}
                icon={<XCircle size={14} />}
                iconClass="text-red-500"
                itens={vencidos}
                onSelect={goToDocumentos}
              />
            )}

            {proximos.length > 0 && (
              <AlertGroup
                titulo={`Vencem em breve (${proximos.length})`}
                icon={<Clock3 size={14} />}
                iconClass="text-amber-500"
                itens={proximos}
                onSelect={goToDocumentos}
              />
            )}
          </div>

          <button
            onClick={goToDocumentos}
            className="w-full flex items-center justify-center gap-1 px-4 py-3 text-sm font-semibold text-steel-700 dark:text-steel-300 hover:bg-slate-50 dark:hover:bg-graphite-850 border-t border-slate-100 dark:border-graphite-800"
          >
            Abrir módulo de Documentos
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

/** Grupo de alertas dentro do dropdown. */
function AlertGroup({ titulo, icon, iconClass, itens, onSelect }) {
  return (
    <div className="px-4 py-3">
      <p className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide mb-2 ${iconClass}`}>
        {icon}
        {titulo}
      </p>
      <ul className="space-y-2">
        {itens.map((alerta) => (
          <li key={alerta.id}>
            <button onClick={onSelect} className="w-full text-left group">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                {alerta.funcionario_nome} · {alerta.tipoDocumento ?? alerta.tipo}
              </p>
              <p className={`text-xs ${alerta.critico ? 'text-red-500' : 'text-amber-600 dark:text-amber-400'}`}>
                {alerta.dias == null
                  ? 'Sem data de validade'
                  : alerta.dias < 0
                    ? `Vencido há ${Math.abs(alerta.dias)} dia${Math.abs(alerta.dias) === 1 ? '' : 's'} (${formatDate(alerta.dataValidade ?? alerta.data_validade)})`
                    : alternativa(alerta.dias)}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Rótulo de "vence em N dias" (incluindo hoje). */
function alternativa(dias) {
  if (dias === 0) return 'Vence HOJE!'
  if (dias === 1) return 'Vence amanhã.'
  return `Vence em ${dias} dias.`
}