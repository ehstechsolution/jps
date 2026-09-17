// ------------------------------------------------------------------
// src/pages/DocumentoFormularioPage.jsx
// ------------------------------------------------------------------
// Tela dedicada de adição/edição de documento SST: formulário à
// esquerda e o documento renderizado à direita (pré-visualização
// reativa aos campos do formulário).
// ------------------------------------------------------------------
import { useState } from 'react'
import { ArrowLeft, FilePlus2, Pencil, CheckCircle2 } from 'lucide-react'
import DocumentoForm from '@/components/documentos/DocumentoForm'
import DocumentoPreview from '@/components/documentos/DocumentoPreview'

/**
 * @param {object} props
 * @param {string}  [props.funcionarioId]  Titular já selecionado (via atalho)
 * @param {Array}   props.funcionarios      Lista para o seletor de titular
 * @param {object|null} props.documento     Registro existente (null = novo)
 * @param {Function} props.onBack
 */
export default function DocumentoFormularioPage({ funcionarioId, funcionarios = [], documento = null, onBack }) {
  const [sucesso, setSucesso] = useState('')
  const [previewForm, setPreviewForm] = useState(null)

  function handleSaved(msg) {
    setSucesso(msg ? `Documento "${msg}" salvo!` : 'Documento salvo com sucesso!')
    setTimeout(() => onBack(), 900)
  }

  return (
    <div>
      <button onClick={onBack} className="btn text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-graphite-700 mb-4">
        <ArrowLeft size={15} />
        Voltar aos documentos
      </button>

      <div className="flex items-center gap-3 mb-5">
        <span className="grid place-items-center h-12 w-12 rounded-2xl bg-steel-500/10 text-steel-600 dark:text-steel-400">
          {documento ? <Pencil size={22} /> : <FilePlus2 size={22} />}
        </span>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {documento ? 'Editar Documento' : 'Novo Documento'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Preencha as informações — o documento é renderizado ao lado.
          </p>
        </div>
      </div>

      {sucesso && (
        <div className="mb-5 flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 px-4 py-3 text-sm text-green-700 dark:text-green-300">
          <CheckCircle2 size={16} />
          {sucesso}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-3 min-w-0">
          <DocumentoForm
            inline
            open
            onClose={onBack}
            documento={documento}
            funcionarioId={funcionarioId ?? (documento?.idFuncionarioTitular ?? '')}
            hideOwnerSelect={!funcionarioId && Boolean(documento?.idFuncionarioTitular)}
            onChangeOwner={() => {}}
            funcionarios={funcionarios}
            onSaved={handleSaved}
            onFormChange={setPreviewForm}
          />
        </div>

        <div className="lg:col-span-2 min-w-0">
          <DocumentoPreview form={previewForm ?? documento} />
        </div>
      </div>
    </div>
  )
}