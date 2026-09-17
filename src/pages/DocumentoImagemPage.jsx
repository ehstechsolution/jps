// ------------------------------------------------------------------
// src/pages/DocumentoImagemPage.jsx
// ------------------------------------------------------------------
// Página dedicada para editar um documento de imagem (PNG/JPG/...).
// Abre o editor de imagem e, ao salvar, envia o novo arquivo ao
// Cloudinary e atualiza o registro do documento.
// ------------------------------------------------------------------
import { useState } from 'react'
import { Image, FileText, CheckCircle2 } from 'lucide-react'
import ImageEditor from '@/components/imagem/ImageEditor'
import { uploadDocument } from '@/services/cloudinary'
import { updateDocumento } from '@/services/documentoService'
import { classificarArquivo } from '@/utils/arquivo'

/**
 * @param {object} props
 * @param {object} props.doc      Documento em edição (com idFuncionarioTitular)
 * @param {Function} props.onBack
 */
export default function DocumentoImagemPage({ doc, onBack }) {
  const [erro, setErro] = useState('')
  const [salvo, setSalvo] = useState(false)

  async function handleSave(file) {
    setErro('')
    try {
      const url = await uploadDocument(file, 'documentos')
      const titularId = doc.idFuncionarioTitular ?? doc.id_funcionario ?? ''
      const payload = {
        funcionarioId: titularId,
        nomeFuncionarioTitular: doc.nomeFuncionarioTitular ?? '',
        emailTitular: doc.emailTitular ?? '',
        tipoDocumento: doc.tipoDocumento ?? doc.tipo ?? '',
        descricao: doc.descricao ?? '',
        dataEmissao: doc.dataEmissao ?? doc.data_emissao ?? '',
        dataValidade: doc.dataValidade ?? doc.data_validade ?? '',
        semValidade: !(doc.dataValidade ?? doc.data_validade),
        status: doc.status ?? '',
        resultado: doc.resultado ?? '',
        observacao: doc.observacao ?? doc.observacoes ?? '',
        arquivoUrl: url,
        arquivoNome: file.name,
      }
      await updateDocumento(titularId, doc.id, payload)
      setSalvo(true)
      setTimeout(() => onBack(), 800)
    } catch (err) {
      setErro(err?.message ?? 'Não foi possível salvar a imagem.')
    }
  }

  if (classificarArquivo(doc?.arquivoUrl ?? doc?.url_arquivo, doc?.arquivoNome) !== 'imagem') {
    return (
      <div className="card p-8 text-center">
        <FileText className="mx-auto mb-2" size={28} />
        <p className="text-slate-600 dark:text-slate-300">Este documento não é uma imagem e não pode ser editado aqui.</p>
        <button onClick={onBack} className="btn-primary mt-4">Voltar</button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <span className="grid place-items-center h-12 w-12 rounded-2xl bg-steel-500/10 text-steel-600 dark:text-steel-400">
          <Image size={22} />
        </span>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Editar na imagem</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {doc.descricao || doc.tipoDocumento || doc.tipo} — {doc.arquivoNome || doc.arquivo_nome}
          </p>
        </div>
      </div>

      {salvo && (
        <div className="mb-5 flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 px-4 py-3 text-sm text-green-700 dark:text-green-300">
          <CheckCircle2 size={16} />
          Imagem salva com sucesso!
        </div>
      )}

      {erro && (
        <div className="mb-5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {erro}
        </div>
      )}

      <ImageEditor
        src={doc.arquivoUrl ?? doc.url_arquivo}
        arquivoNome={doc.arquivoNome ?? doc.arquivo_nome}
        onCancel={onBack}
        onSave={handleSave}
      />
    </div>
  )
}