// ------------------------------------------------------------------
// src/components/documentos/DocumentosDrawer.jsx
// ------------------------------------------------------------------
// Painel lateral (drawer) com os documentos SST de um funcionário,
// atualizado em tempo real. Permite abrir o arquivo, cadastrar, editar
// e excluir documentos.
// ------------------------------------------------------------------
import { useState } from 'react'
import {
  X,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  FileText,
  FileSignature,
  Loader2,
} from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import DocumentoForm from '@/components/documentos/DocumentoForm'
import { useDocumentosFuncionario } from '@/hooks/useDocumentos'
import { deleteDocumento } from '@/services/documentoService'
import { useAuth } from '@/context/AuthContext'
import { formatDate } from '@/utils/format'

/**
 * @param {object} props
 * @param {object|null} props.funcionario  Funcionário selecionado (null = fechado)
 * @param {Function} props.onClose
 * @param {Function} props.onOpenDocumentoNovo  Abre a página dedicada (recebe o id do funcionário)
 * @param {Function} props.onOpenDocumentoPdf   Abre a página de carimbar PDF (recebe o doc)
 * @param {Function} props.onUpdated  Chamado após qualquer operação (opcional)
 */
export default function DocumentosDrawer({ funcionario, onClose, onOpenDocumentoNovo, onOpenDocumentoPdf, onUpdated }) {
  const { userProfile } = useAuth()
  const { docs, loading, error } = useDocumentosFuncionario(funcionario?.id)

  const [formState, setFormState] = useState({ open: false, documento: null })
  const open = Boolean(funcionario)

  /** Exclui um documento com confirmação. */
  async function handleDelete(documento) {
    if (!funcionario) return
    if (!window.confirm(`Excluir o documento "${documento.tipo}"?`)) return
    try {
      await deleteDocumento(funcionario.id, documento)
      onUpdated?.()
    } catch (err) {
      window.alert(err?.message ?? 'Não foi possível excluir.')
    }
  }

  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-graphite-950/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Painel */}
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-graphite-900 border-l border-slate-200 dark:border-graphite-700 shadow-2xl flex flex-col">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-graphite-800">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
              Documentos de {funcionario?.nome}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {funcionario?.cargo || ''} {funcionario?.cargo && '· '}SST
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid place-items-center h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-graphite-800"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              Não foi possível carregar os documentos.
            </div>
          )}

          {loading ? (
            <div className="grid place-items-center py-12 text-slate-400">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : docs.length === 0 ? (
            <div className="card p-8 text-center">
              <FileText size={28} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Nenhum documento cadastrado para este colaborador.
              </p>
            </div>
          ) : (
            docs.map((doc) => (
              <div key={doc.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{doc.tipo}</p>
                    {doc.descricao && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{doc.descricao}</p>
                    )}
                  </div>
                  {doc.data_validade ? (
                    <StatusBadge status={doc.status_calculado} dot={false} />
                  ) : (
                    <span className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset bg-slate-100 text-slate-600 dark:bg-slate-700/30 dark:text-slate-300 ring-slate-600/20">
                      Sem validade
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>Emissão: {formatDate(doc.data_emissao)}</span>
                  <span>Validade: {doc.data_validade ? formatDate(doc.data_validade) : '—'}</span>
                </div>

                {doc.observacoes && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-graphite-850 rounded-lg px-3 py-2">
                    {doc.observacoes}
                  </p>
                )}

                <div className="flex items-center gap-1 mt-3">
                  {doc.url_arquivo && (
                    <a
                      href={doc.url_arquivo}
                      target="_blank"
                      rel="noreferrer"
                      className="btn text-xs text-steel-600 dark:text-steel-400 border border-slate-200 dark:border-graphite-700 px-3 py-1.5"
                    >
                      <ExternalLink size={14} />
                      {doc.arquivo_nome ? doc.arquivo_nome : 'Abrir arquivo'}
                    </a>
                  )}
                  {doc.url_arquivo?.toLowerCase().match(/\.pdf$/) && (
                    <button
                      onClick={() => {
                        onClose()
                        onOpenDocumentoPdf?.(doc)
                      }}
                      className="btn text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-graphite-700 px-3 py-1.5"
                      title="Carimbar / assinar PDF"
                    >
                      <FileSignature size={14} />
                      Carimbar
                    </button>
                  )}
                  <button
                    onClick={() => setFormState({ open: true, documento: doc })}
                    className="btn text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-graphite-700 px-3 py-1.5 ml-auto"
                  >
                    <Pencil size={14} />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(doc)}
                    className="btn text-xs text-red-600 dark:text-red-400 border border-slate-200 dark:border-graphite-700 px-3 py-1.5"
                  >
                    <Trash2 size={14} />
                    Excluir
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Rodapé */}
        <div className="px-4 py-4 border-t border-slate-100 dark:border-graphite-800 flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400">
            {userProfile && `${userProfile.nome} · `}
            atualização em tempo real
          </p>
          <button
            onClick={() => {
              onClose()
              onOpenDocumentoNovo?.(funcionario?.id)
            }}
            className="btn-primary text-sm"
          >
            <Plus size={16} />
            Novo Documento
          </button>
        </div>
      </aside>

      {/* Modal de cadastro/edição */}
      <DocumentoForm
        open={formState.open}
        documento={formState.documento}
        funcionarioId={funcionario?.id}
        onClose={() => setFormState({ open: false, documento: null })}
        onSaved={onUpdated}
      />
    </>
  )
}