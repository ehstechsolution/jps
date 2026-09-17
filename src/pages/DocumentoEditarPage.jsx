// ------------------------------------------------------------------
// src/pages/DocumentoEditarPage.jsx
// ------------------------------------------------------------------
// Página dedicada para carimbar/assinar um PDF existente. Abre o editor,
// e ao salvar envia o novo arquivo ao Cloudinary e atualiza o registro
// do documento (sem alterar o arquivo original).
// ------------------------------------------------------------------
import { useState } from 'react'
import { FileSignature, FileText, CheckCircle2 } from 'lucide-react'
import PdfEditor from '@/components/pdf/PdfEditor'
import { uploadDocument } from '@/services/cloudinary'
import { updateDocumento } from '@/services/documentoService'

/**
 * @param {object} props
 * @param {object} props.doc      Documento em edição (com parentId)
 * @param {Function} props.onBack
 */
export default function DocumentoEditarPage({ doc, onBack }) {
  const [erro, setErro] = useState('')
  const [salvo, setSalvo] = useState(false)

  async function handleSave(file) {
    setErro('')
    try {
      const url = await uploadDocument(file, 'documentos')
      await updateDocumento(doc.parentId ?? doc.id_funcionario ?? '', doc.id, {
        url_arquivo: url,
        arquivo_nome: file.name,
      })
      setSalvo(true)
      setTimeout(() => onBack(), 800)
    } catch (err) {
      setErro(err?.message ?? 'Não foi possível salvar o PDF.')
    }
  }

  if (!doc?.url_arquivo.toLowerCase().match(/\.pdf$/)) {
    return (
      <div className="card p-8 text-center">
        <FileText className="mx-auto mb-2" size={28} />
        <p className="text-slate-600 dark:text-slate-300">Este documento não é um PDF e não pode ser carimbado aqui.</p>
        <button onClick={onBack} className="btn-primary mt-4">Voltar</button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <span className="grid place-items-center h-12 w-12 rounded-2xl bg-steel-500/10 text-steel-600 dark:text-steel-400">
          <FileSignature size={22} />
        </span>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Carimbar / Assinar PDF</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {doc.descricao || doc.tipo} — {doc.arquivo_nome}
          </p>
        </div>
      </div>

      {salvo && (
        <div className="mb-5 flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 px-4 py-3 text-sm text-green-700 dark:text-green-300">
          <CheckCircle2 size={16} />
          PDF salvo com sucesso!
        </div>
      )}

      {erro && (
        <div className="mb-5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {erro}
        </div>
      )}

      <PdfEditor
        src={doc.url_arquivo}
        arquivoNome={doc.arquivo_nome}
        onCancel={onBack}
        onSave={handleSave}
      />
    </div>
  )
}
