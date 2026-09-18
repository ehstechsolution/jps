// ------------------------------------------------------------------
// src/pages/DocumentosPage.jsx
// ------------------------------------------------------------------
// Módulo de Documentos SST da JPS Steel: tabela global com os documentos
// de todos os funcionários (tempo real), busca/filtros por status,
// abertura do arquivo, cadastro (tela dedicada), edição e exclusão.
// ------------------------------------------------------------------
import { useMemo, useState } from 'react'
import {
  Search,
  FilePlus,
  RefreshCw,
  FileText,
  Pencil,
  Trash2,
  ExternalLink,
  FileStack,
  ShieldCheck,
  AlertTriangle,
  XCircle,
} from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import LoadingScreen from '@/components/LoadingScreen'
import { FuncionarioAvatar } from '@/pages/FuncionariosPage'
import { useDocumentos } from '@/hooks/useDocumentos'
import { useCollection } from '@/hooks/useCollection'
import { useConfig } from '@/context/ConfigContext'
import { deleteDocumento } from '@/services/documentoService'
import { formatDate } from '@/utils/format'
import { statusLabel } from '@/utils/sst'

/** Ordem de criticidade para ordenação por status manual dos documentos. */
/** Grupo de ordenação: ativos com validade primeiro, vencidos por último. */
const sortBucket = (doc) => {
  const status = String(doc.status ?? '').toUpperCase()
  const temData = Boolean(String(doc.dataValidade ?? '').trim())
  if (status === 'VENCIDO') return 3
  if (status === 'ARQUIVADO') return 2
  return temData ? 0 : 1
}

export default function DocumentosPage({ onOpenMenu, onNavigate, onOpenDocumentoNovo, onOpenDocumentoEditar, documentoFiltro }) {
  const { configDocumentosStatuses } = useConfig()
  const { docs, loading, error, refresh } = useDocumentos()
  const { data: funcionarios } = useCollection('funcionarios')
  const isDemo = !funcionarios?.length && docs.length > 0

  // Estado da listagem
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('TODOS')

  // Filtros de status dinâmicos (config/documentos/status)
  const filtrosStatus = useMemo(() => {
    return [{ value: 'TODOS', label: 'Todos' }, ...(configDocumentosStatuses ?? []).map((s) => ({ value: s, label: statusLabel(s) }))]
  }, [configDocumentosStatuses])

  // Documentos apenas do funcionário filtrado (via botão da lista de funcionários)
  const docsDoFiltro = useMemo(() => {
    if (!documentoFiltro) return docs ?? []
    return (docs ?? []).filter((doc) => doc.id_funcionario === documentoFiltro)
  }, [docs, documentoFiltro])

  // Funcionário correspondente ao filtro ativo (para o cabeçalho do aviso)
  const funcionarioFiltro = useMemo(
    () => (documentoFiltro ? (funcionarios ?? []).find((f) => f.id === documentoFiltro) ?? null : null),
    [documentoFiltro, funcionarios]
  )

  /** Lista filtrada e ordenada: quem vence primeiro no topo; vencidos por último. */
  const filtered = useMemo(() => {
    const term = busca.trim().toLowerCase()
    return [...docsDoFiltro]
      .filter((doc) => {
        if (statusFiltro !== 'TODOS' && doc.status !== statusFiltro) return false
        if (!term) return true
        return (
          (doc.funcionario_nome ?? '').toLowerCase().includes(term) ||
          (doc.tipoDocumento ?? '').toLowerCase().includes(term) ||
          (doc.descricao ?? '').toLowerCase().includes(term)
        )
      })
      .sort((a, b) => {
        const ba = sortBucket(a)
        const bb = sortBucket(b)
        if (ba !== bb) return ba - bb
        return String(a.dataValidade ?? '').localeCompare(String(b.dataValidade ?? ''))
      })
  }, [docsDoFiltro, busca, statusFiltro])

  // Contadores para os mini-cards (respeitam o filtro de funcionário)
  const counters = useMemo(() => {
    const total = docsDoFiltro.length
    const vigentes = docsDoFiltro.filter((d) => d.status === 'VIGENTE').length
    const emAnalise = docsDoFiltro.filter((d) => d.status === 'EM_ANALISE').length
    const vencidos = docsDoFiltro.filter((d) => d.status === 'VENCIDO').length
    return { total, vigentes, emAnalise, vencidos }
  }, [docsDoFiltro])

  /** Exclui um documento com confirmação. */
  async function handleDelete(documento) {
    const dono = documento.funcionario_nome ?? 'funcionário'
    if (!window.confirm(`Excluir o documento "${documento.tipoDocumento ?? documento.tipo}" de ${dono}?`)) return
    try {
      await deleteDocumento(documento.id_funcionario, documento)
    } catch (err) {
      window.alert(err?.message ?? 'Não foi possível excluir.')
    }
  }

  return (
    <div>
      <PageHeader
        title="Documentos"
        subtitle="SST e validades dos colaboradores"
        onOpenMenu={onOpenMenu}
        actions={
          <>
            <button onClick={refresh} className="btn text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-graphite-700 bg-white dark:bg-graphite-850">
              <RefreshCw size={15} />
              Atualizar
            </button>
            <button
              onClick={() => onOpenDocumentoNovo?.(documentoFiltro ?? undefined)}
              className="btn-primary"
            >
              <FilePlus size={16} />
              Novo Documento
            </button>
          </>
        }
      />

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error.message}
        </div>
      )}

      {isDemo && (
        <div className="mb-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          Modo demonstração: exibindo documentos fictícios até o Firebase ser configurado.
        </div>
      )}

      {funcionarioFiltro && (
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl bg-steel-50 dark:bg-steel-500/10 border border-steel-200 dark:border-steel-500/30 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="grid place-items-center h-9 w-9 rounded-full bg-steel-600 text-white shrink-0">
              <FileText size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                Documentos de {funcionarioFiltro.nome}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lista filtrada — criação e edição são feitas aqui no módulo de Documentos.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate?.('documentos')}
            className="btn text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-graphite-700 bg-white dark:bg-graphite-850 whitespace-nowrap"
          >
            Mostrar todos
          </button>
        </div>
      )}

      {/* Mini-cards de resumo */}
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <MiniCounter icon={FileStack} label="Documentos" value={counters.total} tone="steel" />
        <MiniCounter icon={ShieldCheck} label="Vigentes" value={counters.vigentes} tone="emerald" />
        <MiniCounter icon={AlertTriangle} label="Em análise" value={counters.emAnalise} tone="amber" />
        <MiniCounter icon={XCircle} label="Vencidos" value={counters.vencidos} tone="red" />
      </section>

      {/* Busca e filtro */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Buscar por funcionário, tipo ou descrição..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <div className="flex gap-2 sm:w-auto">
          {(filtrosStatus ?? []).map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFiltro(f.value)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap ${
                statusFiltro === f.value
                  ? 'bg-steel-600 text-white border-steel-600'
                  : 'bg-white dark:bg-graphite-850 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-graphite-700 hover:text-steel-600 dark:hover:text-steel-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Listagem */}
      {loading ? (
        <LoadingScreen />
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <FileText size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {docsDoFiltro.length === 0
              ? documentoFiltro
                ? 'Nenhum documento cadastrado para este colaborador.'
                : 'Nenhum documento cadastrado ainda. Clique em "Novo Documento" para começar.'
              : 'Nenhum documento encontrado para os filtros aplicados.'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-std">
              <thead>
                <tr>
                  <th>Funcionário</th>
                  <th>Documento</th>
                  <th>Emissão</th>
                  <th>Validade</th>
                  <th>Status</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <FuncionarioAvatar
                          foto={doc.funcionario_foto}
                          nome={doc.funcionario_nome}
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 dark:text-slate-100 truncate">
                            {doc.funcionario_nome}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {doc.funcionario_cargo || '—'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="font-medium text-slate-800 dark:text-slate-100">{doc.tipoDocumento ?? doc.tipo}</p>
                      {doc.descricao && (
                        <p className="text-xs text-slate-400 truncate max-w-[220px]">{doc.descricao}</p>
                      )}
                    </td>
                    <td className="whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {formatDate(doc.dataEmissao ?? doc.data_emissao)}
                    </td>
                    <td className="whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {doc.dataValidade ? formatDate(doc.dataValidade) : <span className="text-slate-400">Sem validade</span>}
                    </td>
                    <td>
                      {doc.status ? (
                        <StatusBadge status={doc.status} />
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        {doc.arquivoUrl && (
                          <a
                            href={doc.arquivoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="grid place-items-center h-8 w-8 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-graphite-800 hover:text-steel-600 dark:hover:text-steel-400"
                            title={`Abrir arquivo ${doc.arquivoNome ?? ''}`}
                          >
                            <ExternalLink size={15} />
                          </a>
                        )}
                        <button
                          onClick={() => onOpenDocumentoEditar?.(doc)}
                          className="grid place-items-center h-8 w-8 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-graphite-800 hover:text-steel-600 dark:hover:text-steel-400"
                          title="Editar documento"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(doc)}
                          className="grid place-items-center h-8 w-8 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                          title="Excluir documento"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

/** Mini-card de contagem usado no topo do módulo. */
function MiniCounter({ icon: Icon, label, value, tone }) {
  const tones = {
    steel: 'bg-steel-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  }
  return (
    <div className="card p-4 flex items-center gap-3">
      <span className={`grid place-items-center h-10 w-10 rounded-xl text-white shrink-0 ${tones[tone] ?? tones.steel}`}>
        <Icon size={18} />
      </span>
      <div>
        <p className="text-xl font-extrabold text-slate-900 dark:text-white leading-none">{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</p>
      </div>
    </div>
  )
}