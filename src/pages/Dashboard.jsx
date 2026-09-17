// ------------------------------------------------------------------
// src/pages/Dashboard.jsx
// ------------------------------------------------------------------
// Página principal (Visão Geral) do Backoffice da JPS Steel.
//
// Contém:
//  1. Quatro cartões de resumo (métricas-chave);
//  2. Tabela "Próximos Vencimentos de SST" (verde/amarelo/vermelho);
//  3. Lista das últimas Ordens de Serviço;
//  4. Gráfico simples do fluxo financeiro (gastos por categoria) + totais.
//
// Os dados são reativos: qualquer alteração no Firestore reflete na tela
// instantaneamente (onSnapshot). Sem Firebase configurado, exibe dados
// fictícios em modo demonstração.
// ------------------------------------------------------------------
import { useMemo } from 'react'
import {
  Users,
  Wrench,
  FileText,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  CircleDollarSign,
  Wallet,
} from 'lucide-react'

// Hooks e serviços
import { useDashboardData, useDashboardMetrics } from '@/hooks/useDashboardData'
import { useTheme } from '@/context/ThemeContext'

// Componentes
import PageHeader from '@/components/PageHeader'
import StatCard from '@/components/StatCard'
import StatusBadge from '@/components/StatusBadge'
import LoadingScreen from '@/components/LoadingScreen'
import ConfigBanner from '@/components/ConfigBanner'

// Utilitários
import { formatCurrency, formatDate, normalizeDate } from '@/utils/format'
import { diffInDays } from '@/utils/sst'

export default function Dashboard({ onOpenMenu, onNavigate }) {
  const data = useDashboardData()
  const metrics = useDashboardMetrics(data)
  const { theme } = useTheme()

  // ---------- Derivados: documentos SST ordenados por status/de validade ------
  const sstDocuments = useMemo(() => {
    const docs = [...(data.documentos_sst ?? [])]
    const order = { VENCIDO: 0, EM_ANALISE: 1, VIGENTE: 2, ARQUIVADO: 3 }
    return docs.sort((a, b) => {
      const crit = (order[a.status] ?? 3) - (order[b.status] ?? 3)
      if (crit !== 0) return crit
      const da = a.data_validade_date?.getTime() ?? Infinity
      const db = b.data_validade_date?.getTime() ?? Infinity
      return da - db
    })
  }, [data.documentos_sst])

  // ---------- Derivados: últimas OS (mais recentes primeiro) ----------
  const recentOs = useMemo(() => {
    return [...(data.orcamentos_os ?? [])]
      .sort((a, b) => {
        const da = normalizeDate(a.data_emissao)?.getTime() ?? 0
        const db = normalizeDate(b.data_emissao)?.getTime() ?? 0
        return db - da
      })
      .slice(0, 5)
  }, [data.orcamentos_os])

  // ---------- Derivados: fluxo financeiro -----------------------------
  const finance = useMemo(() => {
    const gastos = data.gastos ?? []
    const oss = data.orcamentos_os ?? []

    // Soma por categoria de gasto
    const porCategoria = gastos.reduce((acc, g) => {
      const cat = g.categoria ?? 'Outros'
      acc[cat] = (acc[cat] ?? 0) + (Number(g.valor) || 0)
      return acc
    }, {})

    const catMax = Math.max(1, ...Object.values(porCategoria))

    return {
      porCategoria,
      catMax,
      totalGastos: gastos.reduce((s, g) => s + (Number(g.valor) || 0), 0),
      totalOrcado: oss
        .filter((o) => o.tipo === 'ORDEM_SERVICO' && o.status !== 'CANCELADO')
        .reduce((s, o) => s + (Number(o.valor_orcado) || 0), 0),
      lucroBruto: oss
        .filter((o) => o.tipo === 'ORDEM_SERVICO')
        .reduce((s, o) => s + (Number(o.lucro_bruto) || 0), 0),
    }
  }, [data.gastos, data.orcamentos_os])

  // Estado de carregamento
  if (data.loading) {
    return (
      <div>
        <PageHeader
          title="Dashboard"
          subtitle="Visão geral da operação"
          onOpenMenu={onOpenMenu}
          onNavigate={onNavigate}
        />
        <LoadingScreen />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral da operação em tempo real"
        onOpenMenu={onOpenMenu}
        onNavigate={onNavigate}
      />

      <ConfigBanner />

      {/* ----------------------------------------------------------------
        1) Cards de Resumo
      ---------------------------------------------------------------- */}
      <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          iconClass="bg-steel-500"
          label="Funcionários Ativos"
          value={metrics.funcionariosAtivos}
          hint="Quadro ativo da empresa"
          onClick={() => onNavigate('funcionarios')}
        />
        <StatCard
          icon={Wrench}
          iconClass="bg-amber-500"
          label="OS em Andamento"
          value={metrics.osEmAndamento}
          hint="Serviços no campo"
          onClick={() => onNavigate('os')}
        />
        <StatCard
          icon={FileText}
          iconClass="bg-violet-500"
          label="Orçamentos Pendentes"
          value={metrics.orcamentosPendentes}
          hint="Aguardando aprovação"
          onClick={() => onNavigate('os')}
        />
        <StatCard
          icon={ShieldAlert}
          iconClass={metrics.documentosCriticos > 0 ? 'bg-red-500' : 'bg-emerald-500'}
          label="Alertas Críticos de SST"
          value={metrics.documentosCriticos}
          hint="Vencidos ou em análise"
          onClick={() => onNavigate('funcionarios')}
        />
      </section>

      {/* ----------------------------------------------------------------
        2) Tabela de Próximos Vencimentos de SST
      ---------------------------------------------------------------- */}
      <section className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">Próximos Vencimentos de SST</h2>
            <p className="text-xs text-slate-400">Documentos dos funcionários, ordenados por status e validade</p>
          </div>
        </div>

        {sstDocuments.length === 0 ? (
          <EmptyState message="Nenhum documento SST cadastrado." />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-std">
              <thead>
                <tr>
                  <th>Funcionário</th>
                  <th>Documento</th>
                  <th>Vencimento</th>
                  <th>Prazo</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sstDocuments.slice(0, 8).map((doc) => {
                  const days = diffInDays(doc.dataValidade)
                  return (
                    <tr key={doc.id}>
                      <td>
                        <p className="font-medium text-slate-800 dark:text-slate-100">{doc.funcionario_nome}</p>
                        <p className="text-xs text-slate-400">{doc.funcionario_cargo}</p>
                      </td>
                      <td>
                        <span className="inline-flex rounded-lg bg-slate-100 dark:bg-graphite-800 px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-200">
                          {doc.tipoDocumento}
                        </span>
                      </td>
                      <td className="text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {formatDate(doc.dataValidade)}
                      </td>
                      <td className="whitespace-nowrap">
                        {days === null
                          ? '—'
                          : days < 0
                            ? `${Math.abs(days)} dias vencido`
                            : days === 0
                              ? 'Vence hoje'
                              : `Vence em ${days} dias`}
                      </td>
                      <td>
                        <StatusBadge status={doc.status} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ----------------------------------------------------------------
        3) Últimas OS + 4) Fluxo Financeiro
      ---------------------------------------------------------------- */}
      <section className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Últimas Ordens de Serviço */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">Últimas Ordens de Serviço</h2>
              <p className="text-xs text-slate-400">Atividades recém-registradas</p>
            </div>
            <button
              onClick={() => onNavigate('os')}
              className="btn-primary text-xs px-3 py-1.5"
            >
              Ver todas <ArrowUpRight size={14} />
            </button>
          </div>

          {recentOs.length === 0 ? (
            <EmptyState message="Nenhuma OS registrada." />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-graphite-800">
              {recentOs.map((os) => (
                <li key={os.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {os.numero_os}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {os.cliente_nome_cache} · {os.descricao_servico}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap hidden sm:inline">
                      {formatCurrency(os.valor_orcado)}
                    </span>
                    <StatusBadge status={os.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Fluxo Financeiro */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">Fluxo Financeiro</h2>
              <p className="text-xs text-slate-400">Gastos por categoria e totais do mês</p>
            </div>
          </div>

          {/* Barras por categoria */}
          <div className="space-y-3">
            {Object.entries(finance.porCategoria).map(([categoria, valor]) => {
              const pct = (valor / finance.catMax) * 100
              return (
                <div key={categoria}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-600 dark:text-slate-300 capitalize">{categoria}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      {formatCurrency(valor)}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 dark:bg-graphite-900 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-steel-600 to-steel-400 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Totais */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            <FinanceTotal
              icon={TrendingUp}
              label="Valor orçado"
              value={formatCurrency(finance.totalOrcado)}
              positive
            />
            <FinanceTotal
              icon={Wallet}
              label="Gastos"
              value={formatCurrency(finance.totalGastos)}
              negative
            />
            <FinanceTotal
              icon={CircleDollarSign}
              label="Lucro bruto"
              value={formatCurrency(finance.lucroBruto)}
              positive
            />
          </div>

          {/* Semáforo de resultado */}
          <div className="mt-4 flex items-center gap-2 text-sm rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-graphite-900">
            {finance.lucroBruto >= 0 ? (
              <>
                <ArrowUpRight size={16} className="text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  Margem saudável
                </span>
              </>
            ) : (
              <>
                <ArrowDownRight size={16} className="text-red-500" />
                <span className="text-red-600 dark:text-red-400 font-medium">
                  Atenção ao resultado financeiro
                </span>
              </>
            )}
          </div>

          {theme === 'dark' && <div className="h-px bg-graphite-800 mt-4" />}
        </div>
      </section>
    </div>
  )
}

/**
 * Mini-cartão de total financeiro usado no bloco "Fluxo Financeiro".
 */
function FinanceTotal({ icon: Icon, label, value, positive, negative }) {
  const colorClass = positive
    ? 'text-emerald-600 dark:text-emerald-400'
    : negative
      ? 'text-red-500 dark:text-red-400'
      : 'text-slate-700 dark:text-slate-200'
  return (
    <div className="rounded-xl border border-slate-100 dark:border-graphite-800 p-3">
      <Icon size={16} className={`mb-1 ${colorClass}`} />
      <p className={`text-sm font-bold truncate ${colorClass}`}>{value}</p>
      <p className="text-[11px] text-slate-400">{label}</p>
    </div>
  )
}

/** Estado vazio reutilizável dentro de cards. */
function EmptyState({ message }) {
  return (
    <div className="px-5 py-10 text-center text-sm text-slate-400">{message}</div>
  )
}