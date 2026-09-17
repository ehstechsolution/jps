// ------------------------------------------------------------------
// src/components/documentos/DocumentoForm.jsx
// ------------------------------------------------------------------
// Formulário de cadastro/edição de documento SST (modal).
//
// Campos:
//   - Funcionário * (apenas quando criando a partir da página geral —
//     no painel do funcionário o dono já vem travado)
//   - Tipo * (lista configurável em config/documentos + "Outro" livre)
//   - Descrição (ex.: "ASO admissional")
//   - Data de emissão *
//   - Data de validade (opcional; checkbox "Sem validade")
//   - Observações
//   - Arquivo (upload PDF/imagem/DOC via Cloudinary)
// (* obrigatório; datas exibidas DD/MM/YYYY e salvas em ISO)
// ------------------------------------------------------------------
import { useEffect, useRef, useState } from 'react'
import { Save, Loader2, FileStack } from 'lucide-react'
import Modal from '@/components/Modal'
import FileUpload from '@/components/documentos/FileUpload'
import { useConfig } from '@/context/ConfigContext'
import { createDocumento, updateDocumento } from '@/services/documentoService'
import { maskDate } from '@/utils/masks'
import { isRequired, isValidBrDate, brToIso, isoToBr } from '@/utils/validators'

/** Constrói o formulário vazio. */
function buildEmptyForm() {
  return {
    funcionarioId: '',
    tipo: '',
    descricao: '',
    data_emissao: '',
    data_validade: '',
    semValidade: false,
    observacoes: '',
    url_arquivo: '',
    arquivo_nome: '',
  }
}

/**
 * @param {object} props
 * @param {boolean}  props.open
 * @param {boolean}  props.inline        Renderiza sem overlay (página dedicada)
 * @param {boolean}  [props.hideOwnerSelect]  Esconde o seletor de dono (o pai oferece)
 * @param {Function} props.onClose
 * @param {object|null} props.documento      Registro existente (edição)
 * @param {string}   props.funcionarioId     Dono fixo (painel do funcionário)
 * @param {Function} props.onChangeOwner     Altera o dono ao selecionar (página geral)
 * @param {Array}    props.funcionarios      Lista para o seletor de dono
 * @param {Function} props.onSaved           Chamado após salvar com sucesso
 */
export default function DocumentoForm({
  open,
  inline,
  hideOwnerSelect,
  onClose,
  documento,
  funcionarioId,
  onChangeOwner,
  funcionarios = [],
  onSaved,
}) {
  const { configDocumentos } = useConfig()

  // Usa sempre a lista de tipos vigente no momento em que o modal abre
  const tiposRef = useRef(configDocumentos)
  useEffect(() => {
    tiposRef.current = configDocumentos
  }, [configDocumentos])

  const [form, setForm] = useState(buildEmptyForm)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Ao abrir: carrega dados do registro existente ou zera o formulário
  useEffect(() => {
    if (!open) return
    if (documento) {
      const ownerId = documento.parentId ?? funcionarioId ?? ''
      setForm({
        funcionarioId: ownerId,
        tipo: documento.tipo ?? '',
        descricao: documento.descricao ?? '',
        data_emissao: isoToBr(documento.data_emissao),
        data_validade: isoToBr(documento.data_validade),
        semValidade: !documento.data_validade,
        observacoes: documento.observacoes ?? '',
        url_arquivo: documento.url_arquivo ?? '',
        arquivo_nome: documento.arquivo_nome ?? '',
      })
    } else {
      setForm({
        ...buildEmptyForm(),
        funcionarioId: funcionarioId ?? '',
      })
    }
    setErrors({})
    setFormError('')
  }, [open, documento, funcionarioId])

  /** Atualiza um campo raiz do formulário. */
  const setField = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  /** Valida o formulário e retorna true se estiver OK. */
  function validate() {
    const errs = {}
    if (!form.funcionarioId && !funcionarioId) {
      errs.funcionarioId = 'Selecione o funcionário.'
    }
    if (!isRequired(form.tipo)) errs.tipo = 'Selecione o tipo do documento.'
    if (!isRequired(form.data_emissao)) errs.dataEmissao = 'Informe a data de emissão.'
    else if (!isValidBrDate(form.data_emissao)) errs.dataEmissao = 'Data inválida.'
    if (!form.semValidade) {
      if (!isRequired(form.data_validade)) errs.dataValidade = 'Informe a validade ou marque "sem validade".'
      else if (!isValidBrDate(form.data_validade)) errs.dataValidade = 'Data inválida.'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  /** Salva (cria ou atualiza) o documento. */
  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setFormError('')
    try {
      const payload = {
        ...form,
        data_emissao: brToIso(form.data_emissao),
        data_validade: form.semValidade ? '' : brToIso(form.data_validade),
      }
      const ownerId = funcionarioId || form.funcionarioId
      if (documento) {
        await updateDocumento(ownerId, documento.id, payload)
      } else {
        await createDocumento(ownerId, payload)
      }
      onSaved?.()
      onClose()
    } catch (err) {
      setFormError(err?.message ?? 'Não foi possível salvar.')
    } finally {
      setSubmitting(false)
    }
  }

  const ownerLocked = Boolean(funcionarioId)

  const formElement = (
    <form id={inline ? 'documento-form-inline' : 'documento-form'} onSubmit={handleSubmit} className="p-5 space-y-5" noValidate>
      {formError && (
        <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {formError}
        </div>
      )}

      <div>
        <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-steel-700 dark:text-steel-300">
          <FileStack size={15} />
          Informações
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
          {/* Dono: fixo no painel do funcionário, selecionável na página geral */}
          {!ownerLocked && !hideOwnerSelect ? (
            <Field label="Funcionário *" error={errors.funcionarioId} className="sm:col-span-2">
              <select
                className="input"
                value={form.funcionarioId}
                onChange={(e) => {
                  setField('funcionarioId')(e)
                  onChangeOwner?.(e.target.value)
                }}
              >
                <option value="">Selecione...</option>
                {funcionarios.map((f) => (
                  <option key={f.id} value={f.id}>{f.nome}</option>
                ))}
              </select>
            </Field>
          ) : null}

          <Field label="Tipo do documento *" error={errors.tipo}>
            <div>
              <input className="input" list="lista-tipos-doc" value={form.tipo} onChange={setField('tipo')} placeholder={tiposRef.current[0] ?? 'Ex.: ASO'} />
              <datalist id="lista-tipos-doc">
                {tiposRef.current.map((op, i) => (
                  <option key={`${op}-${i}`} value={op} />
                ))}
              </datalist>
            </div>
          </Field>

          <Field label="Descrição">
            <input className="input" value={form.descricao} onChange={setField('descricao')} placeholder="Ex.: ASO admissional / Curso atualizado" />
          </Field>

          <Field label="Data de emissão *" error={errors.dataEmissao}>
            <input
              className="input"
              value={form.data_emissao}
              onChange={(e) => setForm((prev) => ({ ...prev, data_emissao: maskDate(e.target.value) }))}
              placeholder="DD/MM/AAAA"
              inputMode="numeric"
            />
          </Field>

          <Field
            label={form.semValidade ? 'Data de validade' : 'Data de validade *'}
            error={errors.dataValidade}
          >
            <input
              className={`input ${form.semValidade ? 'opacity-50' : ''}`}
              value={form.data_validade}
              onChange={(e) => setForm((prev) => ({ ...prev, data_validade: maskDate(e.target.value) }))}
              placeholder="DD/MM/AAAA"
              inputMode="numeric"
              disabled={form.semValidade}
            />
          </Field>

          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.semValidade}
                onChange={(e) => setForm((prev) => ({ ...prev, semValidade: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-steel-600 focus:ring-steel-500 dark:border-graphite-700 dark:bg-graphite-900"
              />
              Documento sem validade (ex.: carteira sindical)
            </label>
          </div>

          <Field label="Observações" className="sm:col-span-2">
            <textarea
              className="input min-h-[72px]"
              value={form.observacoes}
              onChange={setField('observacoes')}
              placeholder="Anotações adicionais, número do documento, emissor..."
            />
          </Field>
        </div>
      </div>

      <div>
        <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-steel-700 dark:text-steel-300">
          Arquivo
        </h4>
        <div className="mt-3">
          <FileUpload
            value={form.url_arquivo}
            fileName={form.arquivo_nome}
            onChange={(url) => setForm((prev) => ({ ...prev, url_arquivo: url }))}
            onNameChange={(name) => setForm((prev) => ({ ...prev, arquivo_nome: name }))}
          />
        </div>
      </div>

      <p className="text-xs text-slate-400">
        * Campos obrigatórios. Datas são exibidas no formato DD/MM/AAAA.
      </p>
    </form>
  )

  const footerElement = (
    <>
      <button type="button" className="btn text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-graphite-700" onClick={onClose}>
        Cancelar
      </button>
      <button type="submit" form={inline ? 'documento-form-inline' : 'documento-form'} className="btn-primary" disabled={submitting}>
        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {submitting ? 'Salvando...' : 'Salvar'}
      </button>
    </>
  )

  if (inline) {
    return (
      <div className="card">
        <div className="flex items-center justify-between gap-3 px-5 pt-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">
              {documento ? 'Editar Documento' : 'Novo Documento'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {funcionarioId ? 'Documento SST do colaborador' : 'Documento SST vinculado a um colaborador'}
            </p>
          </div>
        </div>
        <div className="max-h-[65vh] overflow-y-auto">{formElement}</div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-200 dark:border-graphite-800">
          {footerElement}
        </div>
      </div>
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={documento ? 'Editar Documento' : 'Novo Documento'}
      subtitle={funcionarioId ? 'Documento SST do colaborador' : 'Documento SST vinculado a um colaborador'}
      footer={footerElement}
    >
      {formElement}
    </Modal>
  )
}

/** Campo de formulário com label e mensagem de erro. */
function Field({ label, error, hint, className = '', children }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {!error && hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}