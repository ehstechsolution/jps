// ------------------------------------------------------------------
// src/components/documentos/DocumentoForm.jsx
// ------------------------------------------------------------------
// Formulário de cadastro/edição de documento SST.
//
// Campos:
//   - Funcionário titular * (seletor oculto quando o pai já oferece)
//   - Tipo do documento * (lista configurável em config/documentos)
//   - Descrição (ex.: "ASO admissional")
//   - Data de emissão * (padrão: hoje)
//   - Data de validade (padrão: hoje + 1 ano; checkbox "sem validade")
//   - Status * (lista configurável em config/documentos/status)
//   - Resultado (somente quando o tipo contém "ASO"; Apto/Inapto)
//   - Observações
//   - Arquivo (upload PDF/imagem/DOC via Cloudinary)
// (* obrigatório; datas exibidas DD/MM/AAAA e salvas em ISO)
// ------------------------------------------------------------------
import { useEffect, useRef, useState } from 'react'
import { Save, Loader2, FileStack } from 'lucide-react'
import Modal from '@/components/Modal'
import FileUpload from '@/components/documentos/FileUpload'
import { useConfig } from '@/context/ConfigContext'
import { useAuth } from '@/context/AuthContext'
import { createDocumento, updateDocumento } from '@/services/documentoService'
import { maskDate } from '@/utils/masks'
import { isRequired, isValidBrDate, brToIso, isoToBr } from '@/utils/validators'

/** "YYYY-MM-DD" de hoje ou de hoje + 1 ano, no formato "DD/MM/AAAA". */
function defaultBrDate(daysOffset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + daysOffset)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

/** Constrói o formulário vazio (com datas padrão). */
function buildEmptyForm() {
  return {
    funcionarioId: '',
    nomeFuncionarioTitular: '',
    emailTitular: '',
    tipoDocumento: '',
    descricao: '',
    dataEmissao: defaultBrDate(),
    dataValidade: defaultBrDate(365),
    semValidade: false,
    status: 'VIGENTE',
    resultado: '',
    observacao: '',
    arquivoUrl: '',
    arquivoNome: '',
    criadoPor: '',
  }
}

/**
 * @param {object} props
 * @param {boolean}  props.open
 * @param {boolean}  props.inline        Renderiza sem overlay (página dedicada)
 * @param {boolean}  [props.hideOwnerSelect]  Esconde o seletor de titular (o pai oferece)
 * @param {Function} props.onClose
 * @param {object|null} props.documento      Registro existente (edição)
 * @param {string}   props.funcionarioId     Titular fixo (painel do funcionário)
 * @param {Function} props.onChangeOwner     Altera o titular ao selecionar (página geral)
 * @param {Array}    props.funcionarios      Lista para o seletor de titular
 * @param {Function} props.onSaved           Chamado após salvar com sucesso
 * @param {Function} [props.onFormChange]    Chamado a cada mudança do formulário
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
  onFormChange,
}) {
  const { configDocumentos, configDocumentosStatuses } = useConfig()
  const { user } = useAuth()

  // Usa sempre a lista de tipos/status vigente no momento em que abre
  const tiposRef = useRef(configDocumentos)
  const statusesRef = useRef(configDocumentosStatuses)
  useEffect(() => {
    tiposRef.current = configDocumentos
    statusesRef.current = configDocumentosStatuses
  }, [configDocumentos, configDocumentosStatuses])

  const [form, setForm] = useState(buildEmptyForm)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Preenche nome/e-mail do titular automaticamente ao selecionar
  const applyTitular = (ownerId) => {
    const owner = (funcionarios ?? []).find((f) => f.id === ownerId)
    setForm((prev) => ({
      ...prev,
      funcionarioId: ownerId,
      nomeFuncionarioTitular: owner?.nome ?? '',
      emailTitular: owner?.email ?? '',
    }))
  }

  // Ao abrir: carrega dados do registro existente ou zera o formulário
  useEffect(() => {
    if (!open) return
    if (documento) {
      const ownerId = documento.idFuncionarioTitular ?? documento.idRelacionado ?? documento.parentId ?? funcionarioId ?? ''
      const owner = (funcionarios ?? []).find((f) => f.id === ownerId)
      setForm({
        funcionarioId: ownerId,
        nomeFuncionarioTitular: documento.nomeFuncionarioTitular ?? owner?.nome ?? '',
        emailTitular: documento.emailTitular ?? owner?.email ?? '',
        tipoDocumento: documento.tipoDocumento ?? documento.tipo ?? '',
        descricao: documento.descricao ?? '',
        dataEmissao: isoToBr(documento.dataEmissao ?? documento.data_emissao),
        dataValidade: isoToBr(documento.dataValidade ?? documento.data_validade),
        semValidade: !(documento.dataValidade ?? documento.data_validade),
        status: documento.status ?? 'VIGENTE',
        resultado: documento.resultado ?? '',
        observacao: documento.observacao ?? documento.observacoes ?? '',
        arquivoUrl: documento.arquivoUrl ?? documento.url_arquivo ?? '',
        arquivoNome: documento.arquivoNome ?? documento.arquivo_nome ?? '',
        criadoPor: documento.criadoPor ?? '',
      })
    } else {
      const owner = (funcionarios ?? []).find((f) => f.id === funcionarioId)
      setForm({
        ...buildEmptyForm(),
        funcionarioId: funcionarioId ?? '',
        nomeFuncionarioTitular: owner?.nome ?? '',
        emailTitular: owner?.email ?? '',
      })
    }
    setErrors({})
    setFormError('')
  }, [open, documento, funcionarioId])

  /** Atualiza um campo raiz do formulário. */
  const setField = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  // Notifica o pai (ex.: preview reativo) a cada mudança do formulário
  useEffect(() => {
    if (open && typeof onFormChange === 'function') onFormChange(form)
  }, [form, open, onFormChange])

  /** Valida o formulário e retorna true se estiver OK. */
  function validate() {
    const errs = {}
    const ownerId = funcionarioId || form.funcionarioId
    if (!ownerId) {
      errs.funcionarioId = 'Selecione o funcionário.'
      if (hideOwnerSelect) setFormError('Selecione o funcionário antes de salvar.')
    }
    if (!isRequired(form.tipoDocumento)) errs.tipoDocumento = 'Selecione o tipo do documento.'
    if (!isRequired(form.dataEmissao)) errs.dataEmissao = 'Informe a data de emissão.'
    else if (!isValidBrDate(form.dataEmissao)) errs.dataEmissao = 'Data inválida.'
    if (!form.semValidade) {
      if (!isRequired(form.dataValidade)) errs.dataValidade = 'Informe a validade ou marque "sem validade".'
      else if (!isValidBrDate(form.dataValidade)) errs.dataValidade = 'Data inválida.'
    }
    if (!isRequired(form.status)) errs.status = 'Selecione o status do documento.'
    const isASO = String(form.tipoDocumento ?? '').toUpperCase().includes('ASO')
    if (isASO && !isRequired(form.resultado)) errs.resultado = 'Informe o resultado do ASO.'
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
        dataEmissao: brToIso(form.dataEmissao),
        dataValidade: form.semValidade ? '' : brToIso(form.dataValidade),
        criadoPor: form.criadoPor || user?.uid || '',
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
  const isASO = String(form.tipoDocumento ?? '').toUpperCase().includes('ASO')

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
          {/* Titular: fixo no painel do funcionário, selecionável na página geral */}
          {!ownerLocked && !hideOwnerSelect ? (
            <Field label="Funcionário titular *" error={errors.funcionarioId} className="sm:col-span-2">
              <select
                className="input"
                value={form.funcionarioId}
                onChange={(e) => {
                  applyTitular(e.target.value)
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

          <Field label="Tipo do documento *" error={errors.tipoDocumento}>
            <div>
              <input className="input" list="lista-tipos-doc" value={form.tipoDocumento} onChange={setField('tipoDocumento')} placeholder={tiposRef.current[0] ?? 'Ex.: ASO'} />
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
              value={form.dataEmissao}
              onChange={(e) => setForm((prev) => ({ ...prev, dataEmissao: maskDate(e.target.value) }))}
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
              value={form.dataValidade}
              onChange={(e) => setForm((prev) => ({ ...prev, dataValidade: maskDate(e.target.value) }))}
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

          <Field label="Status do documento *" error={errors.status}>
            <select className="input" value={form.status} onChange={setField('status')}>
              <option value="">Selecione...</option>
              {statusesRef.current.map((op, i) => (
                <option key={`${op}-${i}`} value={op}>{op}</option>
              ))}
            </select>
          </Field>

          {isASO && (
            <Field label="Resultado do ASO *" error={errors.resultado}>
              <select className="input" value={form.resultado} onChange={setField('resultado')}>
                <option value="">Selecione...</option>
                <option value="Apto">Apto</option>
                <option value="Inapto">Inapto</option>
              </select>
            </Field>
          )}

          <Field label="Observações" className="sm:col-span-2">
            <textarea
              className="input min-h-[72px]"
              value={form.observacao}
              onChange={setField('observacao')}
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
            value={form.arquivoUrl}
            fileName={form.arquivoNome}
            onChange={(url) => setForm((prev) => ({ ...prev, arquivoUrl: url }))}
            onNameChange={(name) => setForm((prev) => ({ ...prev, arquivoNome: name }))}
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
              {form.nomeFuncionarioTitular
                ? `Documento de ${form.nomeFuncionarioTitular}`
                : funcionarioId
                  ? 'Documento SST do colaborador'
                  : 'Documento SST vinculado a um colaborador'}
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
      subtitle={form.nomeFuncionarioTitular ? `Documento de ${form.nomeFuncionarioTitular}` : 'Documento SST vinculado a um colaborador'}
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