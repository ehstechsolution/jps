// ------------------------------------------------------------------
// src/pages/DocumentosPage.jsx
// ------------------------------------------------------------------
// Módulo de Documentos SST da JPS Steel: tabela global com os documentos
// de todos os funcionários (tempo real), busca/filtros por status,
// abertura do arquivo, cadastro/edição/exclusão.
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
  FileSignature,
  CheckCircle2,
  Webhook,
  Loader2,
} from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import LoadingScreen from '@/components/LoadingScreen'
import DocumentoForm from '@/components/documentos/DocumentoForm'
import { FuncionarioAvatar } from '@/pages/FuncionariosPage'
import { useDocumentos } from '@/hooks/useDocumentos'
import { useCollection } from '@/hooks/useCollection'
import { useConfig } from '@/context/ConfigContext'
import { deleteDocumento } from '@/services/documentoService'
import { setEmpresaWebhook } from '@/services/configService'
import { formatDate } from '@/utils/format'

/** Ordem de criticidade para ordenação dos documentos. */
const STATUS_ORDER = { VENCIDO: 0, PROXIMO_VENCIMENTO: 1, VALIDO: 2 }
const FILTROS_STATUS = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'VALIDO', label: 'Válidos' },
  { value: 'PROXIMO_VENCIMENTO', label: 'Próximos' },
  { value: 'VENCIDO', label: 'Vencidos' },
]

export default function DocumentosPage({ onOpenMenu, onOpenDocumentoNovo, onOpenDocumentoPdf }) {
  const { configDocumentos, empresaWebhook, reloadConfig } = useConfig()
  const { docs, loading, error, refresh } = useDocumentos()
  const { data: funcionarios } = useCollection('funcionarios')
  const isDemo = !funcionarios?.length && docs.length > 0

  // Estado do webhook (Config em tempo real)
  const [webhook, setWebhook] = useState(empresaWebhook ?? '')
  const [webhookMsg, setWebhookMsg] = useState('')
  const [salvandoWebhook, setSalvandoWebhook] = useState(false)

  // Estado da listagem
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('TODOS')

  // Estado do formulário (novo / edição); documento nulo = novo
  const [formState, setFormState] = useState({ open: false, documento: null, ownerId: '' })

  /** Lista filtrada e ordenada por criticidade/data de validade. */
  const filtered = useMemo(() => {
    const term = busca.trim().toLowerCase()
    return [...(docs ?? [])]
      .filter((doc) => {
        if (statusFiltro !== 'TODOS' && !doc.data_validade) return false
        if (statusFiltro !== 'TODOS' && doc.status_calculado !== statusFiltro) return false
        if (!term) return true
        return (
          (doc.funcionario_nome ?? '').toLowerCase().includes(term) ||
          (doc.tipo ?? '').toLowerCase().includes(term) ||
          (doc.descricao ?? '').toLowerCase().includes(term)
        )
      })
      .sort((a, b) => {
        const semValidadeA = !a.data_validade
        const semValidadeB = !b.data_validade
        if (semValidadeA !== semValidadeB) return semValidadeA ? 1 : -1
        const critA = STATUS_ORDER[a.status_calculado] ?? 3
        const critB = STATUS_ORDER[b.status_calculado] ?? 3
        if (critA !== critB) return critA - critB
        return String(a.data_validade ?? '').localeCompare(String(b.data_validade ?? ''))
      })
  }, [docs, busca, statusFiltro])

  // Contadores para os mini-cards
  const counters = useMemo(() => {
    const total = docs?.length ?? 0
    const validos = (docs ?? []).filter((d) => d.data_validade && d.status_calculado === 'VALIDO').length
    const alerta = (docs ?? []).filter((d) => d.status_calculado === 'PROXIMO_VENCIMENTO').length
    const vencidos = (docs ?? []).filter((d) => d.status_calculado === 'VENCIDO').length
    return { total, validos, alerta, vencidos }
  }, [docs])

  /** Exclui um documento com confirmação. */
  async function handleDelete(documento) {
    const dono = documento.funcionario_nome ?? 'funcionário'
    if (!window.confirm(`Excluir o documento "${documento.tipo}" de ${dono}?`)) return
    try {
      await deleteDocumento(documento.id_funcionario, documento)
    } catch (err) {
      window.alert(err?.message ?? 'Não foi possível excluir.')
    }
  }

  /** Salva a URL do webhook de eventos de documentos. */
  async function handleSaveWebhook() {
    setSalvandoWebhook(true)
    setWebhookMsg('')
    try {
      await setEmpresaWebhook(webhook.trim())
      await reloadConfig()
      setWebhookMsg('Webhook atualizado!')
      setTimeout(() => setWebhookMsg(''), 2500)
    } catch (err) {
      setWebhookMsg(err?.message ?? 'Não foi possível salvar.')
    } finally {
      setSalvandoWebhook(false)
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
              onClick={() => onOpenDocumentoNovo?.()}
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

      {/* Integração: webhook de eventos de documentos */}
      <div className="card p-4 mb-5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
          <Webhook size={15} className="text-steel-600 dark:text-steel-400" />
          Notificações externas (webhook)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          A cada documento criado, alterado ou excluído, o app dispara um POST em JSON com os dados
          (incluindo o arquivo em base64). Deixe em branco para desativar. Você monta o alerta externo do seu lado.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            className="input flex-1"
            placeholder="https://seu-destino.com/webhook/documentos"
            value={webhook}
            onChange={(e) => setWebhook(e.target.value)}
          />
          <button onClick={handleSaveWebhook} disabled={salvandoWebhook} className="btn-primary whitespace-nowrap">
            {salvandoWebhook ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            {salvandoWebhook ? 'Salvando...' : 'Salvar URL'}
          </button>
        </div>
        {webhookMsg && (
          <p className={`mt-2 text-xs ${webhookMsg.includes('atualizado') ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
            {webhookMsg}
          </p>
        )}
      </div>

      {/* Mini-cards de resumo */}
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <MiniCounter icon={FileStack} label="Documentos" value={counters.total} tone="steel" />
        <MiniCounter icon={ShieldCheck} label="Válidos" value={counters.validos} tone="emerald" />
        <MiniCounter icon={AlertTriangle} label="Em alerta" value={counters.alerta} tone="amber" />
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
          {FILTROS_STATUS.map((f) => (
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
            {docs?.length === 0
              ? 'Nenhum documento cadastrado ainda. Clique em "Novo Documento" para começar.'
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
                      <p className="font-medium text-slate-800 dark:text-slate-100">{doc.tipo}</p>
                      {doc.descricao && (
                        <p className="text-xs text-slate-400 truncate max-w-[220px]">{doc.descricao}</p>
                      )}
                    </td>
                    <td className="whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {formatDate(doc.data_emissao)}
                    </td>
                    <td className="whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {doc.data_validade ? (
                        <span className={doc.status_calculado === 'VENCIDO' ? 'text-red-500 font-medium' : doc.status_calculado === 'PROXIMO_VENCIMENTO' ? 'text-amber-600 dark:text-amber-400 font-medium' : ''}>
                          {formatDate(doc.data_validade)}
                        </span>
                      ) : (
                        <span className="text-slate-400">Sem validade</span>
                      )}
                    </td>
                    <td>
                      {doc.data_validade ? (
                        <StatusBadge status={doc.status_calculado} />
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset bg-slate-100 text-slate-600 dark:bg-slate-700/30 dark:text-slate-300 ring-slate-600/20">
                          Sem validade
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        {doc.url_arquivo && (
                          <a
                            href={doc.url_arquivo}
                            target="_blank"
                            rel="noreferrer"
                            className="grid place-items-center h-8 w-8 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-graphite-800 hover:text-steel-600 dark:hover:text-steel-400"
                            title={`Abrir arquivo ${doc.arquivo_nome ?? ''}`}
                          >
                            <ExternalLink size={15} />
                          </a>
                        )}
                        {doc.url_arquivo?.toLowerCase().match(/\.pdf$/) && (
                          <button
                            onClick={() => onOpenDocumentoPdf?.(doc)}
                            className="grid place-items-center h-8 w-8 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-graphite-800 hover:text-steel-600 dark:hover:text-steel-400"
                            title="Carimbar / assinar PDF"
                          >
                            <FileSignature size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => setFormState({ open: true, documento: doc, ownerId: doc.id_funcionario })}
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

      {/* Modal de cadastro/edição */}
      <DocumentoForm
        open={formState.open}
        documento={formState.documento}
        funcionarioId={formState.ownerId}
        funcionarios={funcionarios ?? []}
        onChangeOwner={(ownerId) => setFormState((prev) => ({ ...prev, ownerId }))}
        onClose={() => setFormState({ open: false, documento: null, ownerId: '' })}
        onSaved={() => {
          // A lista global busca no Firestore; força nova consulta para refletir já
          refresh()
        }}
      />
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
