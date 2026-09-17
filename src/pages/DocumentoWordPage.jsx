// ------------------------------------------------------------------
// src/pages/DocumentoWordPage.jsx
// ------------------------------------------------------------------
// Página dedicada para editar documentos do Word (.doc/.docx).
// O editor ainda está em construção; abre com um placeholder até a
// ferramenta de edição ser desenhada.
// ------------------------------------------------------------------
import { FileType2, ArrowLeft, Construction } from 'lucide-react'
import { classificarArquivo } from '@/utils/arquivo'

/**
 * @param {object} props
 * @param {object} props.doc      Documento em questão
 * @param {Function} props.onBack
 */
export default function DocumentoWordPage({ doc, onBack }) {
  if (classificarArquivo(doc?.arquivoUrl ?? doc?.url_arquivo, doc?.arquivoNome) !== 'word') {
    return (
      <div className="card p-8 text-center">
        <FileType2 className="mx-auto mb-2" size={28} />
        <p className="text-slate-600 dark:text-slate-300">Este documento não é um arquivo do Word e não pode ser editado aqui.</p>
        <button onClick={onBack} className="btn-primary mt-4">Voltar</button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <span className="grid place-items-center h-12 w-12 rounded-2xl bg-steel-500/10 text-steel-600 dark:text-steel-400">
          <FileType2 size={22} />
        </span>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Editar no arquivo</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {doc.descricao || doc.tipoDocumento || doc.tipo} — {doc.arquivoNome || doc.arquivo_nome}
          </p>
        </div>
      </div>

      <div className="card p-12 text-center">
        <span className="mx-auto grid place-items-center h-16 w-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-4">
          <Construction size={30} />
        </span>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Editor do Word em construção</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
          Em breve você poderá editar o conteúdo deste documento aqui mesmo, sem sair do sistema.
        </p>
        <button onClick={onBack} className="btn mt-6 text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-graphite-700">
          <ArrowLeft size={15} />
          Voltar para os documentos
        </button>
      </div>
    </div>
  )
}