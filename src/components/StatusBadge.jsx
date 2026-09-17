// ------------------------------------------------------------------
// src/components/StatusBadge.jsx
// ------------------------------------------------------------------
// Badge visual de status usado em tabelas e listas.
// Mapeia os status do sistema para cores semafóricas:
//   verde  -> válido/ativo/disponível/concluído
//   amarelo-> próximo do vencimento / pendente / manutenção
//   vermelho-> vencido
//   azul/gelo -> demais estados de fluxo
// ------------------------------------------------------------------
import { statusLabel } from '@/utils/sst'

const STYLES = {
  // Grupo verde
  VALIDO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 ring-emerald-600/20',
  VIGENTE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 ring-emerald-600/20',
  ATIVO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 ring-emerald-600/20',
  Ativo: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 ring-emerald-600/20',
  'DISPONIVEL': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 ring-emerald-600/20',
  CONCLUIDO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 ring-emerald-600/20',
  'Disponível': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 ring-emerald-600/20',

  // Grupo amarelo
  PROXIMO_VENCIMENTO: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 ring-amber-600/20',
  EM_ANALISE: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 ring-amber-600/20',
  EM_ANDAMENTO: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 ring-amber-600/20',
  APROVADO: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 ring-amber-600/20',
  MANUTENCAO: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 ring-amber-600/20',
  'Manutenção': 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 ring-amber-600/20',
  Afastado: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 ring-amber-600/20',

  // Grupo vermelho
  VENCIDO: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400 ring-red-600/20',
  CANCELADO: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400 ring-red-600/20',
  Desligado: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400 ring-red-600/20',

  // Grupo azul / neutro
  PENDENTE: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400 ring-sky-600/20',
  EM_USO: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400 ring-sky-600/20',
  Férias: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400 ring-sky-600/20',
  INATIVO: 'bg-slate-200 text-slate-700 dark:bg-slate-700/30 dark:text-slate-300 ring-slate-600/20',
  ARQUIVADO: 'bg-slate-200 text-slate-700 dark:bg-slate-700/30 dark:text-slate-300 ring-slate-600/20',
}

/**
 * @param {object} props
 * @param {string} props.status  Status canônico (ex.: "EM_ANDAMENTO")
 */
export default function StatusBadge({ status, dot = true }) {
  const style = STYLES[status] ?? STYLES.INATIVO
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full px-2.5 py-1
        text-[11px] font-semibold ring-1 ring-inset whitespace-nowrap ${style}
      `}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {statusLabel(status)}
    </span>
  )
}