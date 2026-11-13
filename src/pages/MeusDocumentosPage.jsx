import { AlertTriangle, ExternalLink, FileText, RefreshCw } from 'lucide-react'
import EmployeePageHeader from '@/components/EmployeePageHeader'
import LoadingScreen from '@/components/LoadingScreen'
import StatusBadge from '@/components/StatusBadge'
import { useDocumentosFuncionario } from '@/hooks/useDocumentos'
import { formatDate } from '@/utils/format'

export default function MeusDocumentosPage({ profile, onOpenMenu }) {
  const { docs, loading, error, refresh } = useDocumentosFuncionario(profile?.id, profile)

  return (
    <div>
      <EmployeePageHeader
        title="Meus Documentos"
        subtitle="Documentos de saúde e segurança vinculados à sua ficha."
        onOpenMenu={onOpenMenu}
      />

      {!profile?.id ? (
        <div role="alert" className="card p-6 border-amber-200 dark:border-amber-500/30">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">Não foi possível localizar sua ficha</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Os documentos não foram consultados. Entre em contato com a administração para associar sua conta.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 mb-4 rounded-xl border border-steel-200 dark:border-steel-500/30 bg-steel-50 dark:bg-steel-500/10 px-4 py-3">
            <p className="text-sm text-steel-800 dark:text-steel-200">
              Ficha: <span className="font-semibold">{profile.nome || 'Funcionário'}</span>
            </p>
            <button type="button" onClick={refresh} disabled={loading} className="btn text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-graphite-700 bg-white dark:bg-graphite-850">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              Atualizar
            </button>
          </div>

          {error && (
            <div role="alert" className="mb-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              Não foi possível carregar seus documentos: {error.message || 'erro desconhecido'}.
            </div>
          )}

          {loading ? (
            <LoadingScreen />
          ) : error ? (
            <div className="card p-6 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-300">Tente atualizar a lista. Se o problema continuar, contate a administração.</p>
              <button type="button" onClick={refresh} className="btn-primary mt-4">
                <RefreshCw size={15} />
                Tentar novamente
              </button>
            </div>
          ) : docs.length === 0 ? (
            <div className="card p-10 text-center">
              <FileText size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">Nenhum documento disponível</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Ainda não há documentos SST vinculados à sua ficha.</p>
            </div>
          ) : (
            <section aria-label="Lista dos meus documentos" className="space-y-3">
              {docs.map((doc) => (
                <article key={doc.id} className="card p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-slate-900 dark:text-white">
                          {doc.tipoDocumento || doc.tipo || 'Documento SST'}
                        </h2>
                        {doc.status && <StatusBadge status={doc.status} />}
                      </div>
                      {doc.descricao && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{doc.descricao}</p>}
                      {doc.resultado && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Resultado: {doc.resultado}</p>}
                      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
                        <div><dt className="inline font-semibold">Emissão: </dt><dd className="inline">{formatDate(doc.dataEmissao)}</dd></div>
                        <div><dt className="inline font-semibold">Validade: </dt><dd className="inline">{doc.dataValidade ? formatDate(doc.dataValidade) : 'Sem validade'}</dd></div>
                      </dl>
                    </div>
                    {doc.arquivoUrl && (
                      <a
                        href={doc.arquivoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn self-start text-sm text-steel-700 dark:text-steel-300 border border-slate-200 dark:border-graphite-700 hover:bg-slate-50 dark:hover:bg-graphite-800"
                        aria-label={`Abrir arquivo ${doc.arquivoNome || doc.tipoDocumento || 'do documento'}`}
                      >
                        <ExternalLink size={15} />
                        Abrir arquivo
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  )
}
