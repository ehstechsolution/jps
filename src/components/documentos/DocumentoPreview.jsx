// ------------------------------------------------------------------
// src/components/documentos/DocumentoPreview.jsx
// ------------------------------------------------------------------
// Painel de visualização do documento na tela dedicada de criação/edição:
//   - imagem   -> pré-visualiza em <img>;
//   - PDF      -> pré-visualiza em <iframe> (renderizado pelo navegador);
//   - demais   -> card com ícone do arquivo + atalho de abertura;
//   - sem arquivo -> placeholder "nenhum arquivo anexado".
// Abaixo do arquivo, um resumo dos metadados informados no formulário.
// ------------------------------------------------------------------
import { FileText, ExternalLink, FolderOpen, User, Mail, CalendarDays, StickyNote } from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import { isoToBr } from '@/utils/validators'

const isImage = (fileName) => /\.(jpe?g|png|webp|tiff?)$/i.test(fileName ?? '')
const isPdf = (fileName, url) => /\.pdf$/i.test(fileName ?? '') || /\.pdf(?:\?|$)/i.test(url ?? '')

/** Mostra "DD/MM/AAAA" quando o valor chega em ISO; senão exibe como está. */
const displayDate = (value) => {
  if (!value) return '—'
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return isoToBr(value)
  return value
}

/**
 * @param {object} props
 * @param {object} props.form  Estado do formulário (campos do documento)
 */
export default function DocumentoPreview({ form }) {
  const { arquivoUrl, arquivoNome, nomeFuncionarioTitular, emailTitular, tipoDocumento, descricao, dataEmissao, dataValidade, semValidade, status, resultado, observacao } = form ?? {}

  const isASO = String(tipoDocumento ?? '').toUpperCase().includes('ASO')

  return (
    <div className="card overflow-hidden sticky top-6">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-graphite-800 flex items-center gap-3">
        <span className="grid place-items-center h-10 w-10 rounded-xl bg-steel-500/10 text-steel-600 dark:text-steel-400">
          <FileText size={18} />
        </span>
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900 dark:text-white truncate">{tipoDocumento || 'Documento'}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{descricao || 'Pré-visualização'}</p>
        </div>
      </div>

      {/* Arquivo */}
      <div className="p-5">
        {!arquivoUrl ? (
          <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-graphite-700 grid place-items-center py-12 text-center">
            <FolderOpen size={28} className="text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Nenhum arquivo anexado ainda</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Anexe um PDF, imagem ou documento para visualizar.</p>
          </div>
        ) : isImage(arquivoNome) ? (
          <a href={arquivoUrl} target="_blank" rel="noreferrer" className="block">
            <img
              src={arquivoUrl}
              alt={arquivoNome}
              className="w-full max-h-[55vh] object-contain rounded-xl border border-slate-200 dark:border-graphite-800 bg-slate-50 dark:bg-graphite-900"
            />
          </a>
        ) : isPdf(arquivoNome, arquivoUrl) ? (
          <iframe
            src={arquivoUrl}
            title={arquivoNome}
            className="w-full h-[55vh] rounded-xl border border-slate-200 dark:border-graphite-800 bg-white"
          />
        ) : (
          <a
            href={arquivoUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-graphite-800 px-4 py-4 hover:bg-slate-50 dark:hover:bg-graphite-800 transition-colors"
          >
            <span className="grid place-items-center h-11 w-11 rounded-lg bg-steel-500/10 text-steel-600 dark:text-steel-400 shrink-0">
              <FileText size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{arquivoNome || 'Arquivo anexado'}</p>
              <p className="text-xs text-slate-400">Formato não visualizável no navegador — abra o arquivo.</p>
            </div>
            <ExternalLink size={15} className="text-slate-400 shrink-0" />
          </a>
        )}
      </div>

      {/* Metadados */}
      <div className="px-5 py-4 border-t border-slate-200 dark:border-graphite-800 space-y-3">
        <MetaRow icon={User} label="Titular" value={nomeFuncionarioTitular || '—'} />
        {emailTitular && <MetaRow icon={Mail} label="E-mail" value={emailTitular} />}

        <div className="grid grid-cols-2 gap-3">
          <MetaRow icon={CalendarDays} label="Emissão" value={displayDate(dataEmissao)} />
          <MetaRow icon={CalendarDays} label="Validade" value={semValidade ? 'Sem validade' : displayDate(dataValidade)} />
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400">Status</span>
          <StatusBadge status={status} />
        </div>

        {isASO && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400">Resultado ASO</span>
            <span className={`text-xs font-semibold ${resultado === 'Inapto' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {resultado || '—'}
            </span>
          </div>
        )}

        {observacao && (
          <MetaRow icon={StickyNote} label="Observação" value={observacao} />
        )}
      </div>
    </div>
  )
}

/** Linha de metadado com ícone. */
function MetaRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={14} className="mt-0.5 text-slate-400 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-sm text-slate-700 dark:text-slate-200 break-words">{value}</p>
      </div>
    </div>
  )
}