// ------------------------------------------------------------------
// src/pages/DocumentoNovoPage.jsx
// ------------------------------------------------------------------
// Página dedicada para registrar um novo documento:
//   - Aba "Preencher modelo": galeria de modelos DOCX + formulário
//   - Aba "Enviar arquivo": formulário padrão com upload
// ------------------------------------------------------------------
import { useState } from 'react'
import { ArrowLeft, FilePlus2, LayoutTemplate, UploadCloud, CheckCircle2 } from 'lucide-react'
import DocumentoForm from '@/components/documentos/DocumentoForm'
import ModelosGaleria from '@/components/modelos/ModelosGaleria'
import ModeloForm from '@/components/modelos/ModeloForm'

/**
 * @param {object} props
 * @param {string}  [props.funcionarioId]   Dono já selecionado (via drawer/atalho)
 * @param {Array}   props.funcionarios       Lista para o seletor de dono
 * @param {Function} props.onBack
 */
export default function DocumentoNovoPage({ funcionarioId, funcionarios = [], onBack }) {
  const [aba, setAba] = useState('modelo')
  const [ownerId, setOwnerId] = useState(funcionarioId ?? '')
  const [modelo, setModelo] = useState(null)
  const [sucesso, setSucesso] = useState('')

  const funcionario = funcionarios.find((f) => f.id === ownerId) ?? null
  const ownerLocked = Boolean(funcionarioId)

  function handleCreated(msg) {
    setSucesso(msg ? `Documento "${msg}" criado!` : 'Documento criado com sucesso!')
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
          <FilePlus2 size={22} />
        </span>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Novo Documento</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Registre um documento SST do colaborador — por modelo ou upload.
          </p>
        </div>
      </div>

      {!ownerLocked && (
        <div className="card p-4 mb-5">
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
            Funcionário *
          </label>
          <select className="input" value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
            <option value="">Selecione o colaborador...</option>
            {funcionarios.map((f) => (
              <option key={f.id} value={f.id}>{f.nome}</option>
            ))}
          </select>
        </div>
      )}

      {/* Abas */}
      <div className="flex gap-2 mb-5">
        {[
          { id: 'modelo', label: 'Preencher modelo', icon: LayoutTemplate },
          { id: 'upload', label: 'Enviar arquivo', icon: UploadCloud },
        ].map((tab) => {
          const Icon = tab.icon
          const ativo = aba === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setAba(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                ativo
                  ? 'bg-steel-600 text-white'
                  : 'border border-slate-200 dark:border-graphite-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-graphite-800'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {sucesso && (
        <div className="mb-5 flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 px-4 py-3 text-sm text-green-700 dark:text-green-300">
          <CheckCircle2 size={16} />
          {sucesso}
        </div>
      )}

      {aba === 'modelo' ? (
        modelo ? (
          <ModeloForm modelo={modelo} funcionario={funcionario} onBack={() => setModelo(null)} onCreated={handleCreated} />
        ) : (
          <ModelosGaleria onSelect={setModelo} />
        )
      ) : (
        <DocumentoForm
          inline
          open
          onClose={onBack}
          funcionarioId={ownerId}
          hideOwnerSelect={!ownerLocked}
          onChangeOwner={setOwnerId}
          funcionarios={funcionarios}
          onSaved={() => {
            setSucesso('Documento criado com sucesso!')
            setTimeout(() => onBack(), 900)
          }}
        />
      )}
    </div>
  )
}