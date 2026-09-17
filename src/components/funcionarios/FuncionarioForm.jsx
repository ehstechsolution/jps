// ------------------------------------------------------------------
// src/components/funcionarios/FuncionarioForm.jsx
// ------------------------------------------------------------------
// Formulário de cadastro/edição de funcionário (modal).
//
// Seções:
//   - Foto (upload Cloudinary)
//   - Dados Pessoais  -> nome*, e-mail, foto, nascimento, CPF, RG,
//                        WhatsApp, endereço (com busca de CEP via ViaCEP),
//                        escolaridade* (dropdown da config)
//   - Dados Profissionais -> cargo* (dropdown da config + texto livre),
//                        setor* (Operacional/Administrativo),
//                        dataAdm, nível de acesso (apenas p/ admin),
//                        status* (dropdown da config), PIS
// (* obrigatório; datas exibidas DD/MM/YYYY e salvas em ISO)
// ------------------------------------------------------------------
import { useEffect, useRef, useState } from 'react'
import { Save, Loader2, MapPin, BadgeInfo } from 'lucide-react'
import Modal from '@/components/Modal'
import PhotoUpload from '@/components/funcionarios/PhotoUpload'
import { useConfig } from '@/context/ConfigContext'
import { useAuth } from '@/context/AuthContext'
import { SETORES, NIVEIS_ACESSO } from '@/services/configService'
import { createFuncionario, updateFuncionario } from '@/services/funcionarioService'
import { onlyDigits, maskCPF, maskPhone, maskDate, maskCEP, maskPIS } from '@/utils/masks'
import {
  isRequired,
  isValidEmail,
  isValidCpf,
  isValidBrDate,
  brToIso,
  isoToBr,
} from '@/utils/validators'

/** Constrói o formulário vazio com os defaults da config. */
function buildEmptyForm(configLists) {
  return {
    nome: '',
    email: '',
    foto: '',
    // Dados pessoais
    dataNascimento: '',
    cpf: '',
    rg: '',
    whatsapp: '',
    endereco: { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '' },
    escolaridade: configLists.escolaridade.includes('Ensino médio')
      ? 'Ensino médio'
      : (configLists.escolaridade[0] ?? ''),
    // Dados profissionais
    cargo: '',
    setor: 'Operacional',
    dataAdm: '',
    nivelAcesso: 'Externo',
    status: configLists.status.includes('Ativo')
      ? 'Ativo'
      : (configLists.status[0] ?? 'Ativo'),
    pis: '',
  }
}

/**
 * @param {object} props
 * @param {boolean}  props.open
 * @param {Function} props.onClose
 * @param {object|null} props.funcionario   Registro existente (edição) ou null
 * @param {Function} props.onSaved          Chamado após salvar com sucesso
 */
export default function FuncionarioForm({ open, onClose, funcionario, onSaved }) {
  const { configLists } = useConfig()
  const { user, isAdmin } = useAuth()

  // Usa sempre as listas de config vigentes no momento em que o modal abre
  const listsRef = useRef(configLists)
  useEffect(() => {
    listsRef.current = configLists
  }, [configLists])

  const [form, setForm] = useState(() => buildEmptyForm(configLists))
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)

  // Ao abrir: carrega dados do registro existente ou zera o formulário
  useEffect(() => {
    if (!open) return
    const lists = listsRef.current
    if (funcionario) {
      const end = funcionario.endereco ?? {}
      setForm({
        nome: funcionario.nome ?? '',
        email: funcionario.email ?? '',
        foto: funcionario.foto ?? '',
        dataNascimento: isoToBr(funcionario.dataNascimento),
        cpf: funcionario.cpf ?? '',
        rg: funcionario.rg ?? '',
        whatsapp: funcionario.whatsapp ?? '',
        endereco: {
          cep: end.cep ?? '',
          logradouro: end.logradouro ?? '',
          numero: end.numero ?? '',
          complemento: end.complemento ?? '',
          bairro: end.bairro ?? '',
          cidade: end.cidade ?? '',
          uf: end.uf ?? '',
        },
        escolaridade: funcionario.escolaridade || 'Ensino médio',
        cargo: funcionario.cargo ?? '',
        setor: funcionario.setor ?? 'Operacional',
        dataAdm: isoToBr(funcionario.dataAdm),
        nivelAcesso: funcionario.nivelAcesso ?? 'Externo',
        status: funcionario.status ?? 'Ativo',
        pis: funcionario.pis ?? '',
      })
    } else {
      setForm(buildEmptyForm(lists))
    }
    setErrors({})
    setFormError('')
  }, [open, funcionario])

  /** Atualiza um campo raiz do formulário. */
  const setField = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  /** Atualiza um campo do objeto endereco. */
  const setEndereco = (field) => (e) =>
    setForm((prev) => ({ ...prev, endereco: { ...prev.endereco, [field]: e.target.value } }))

  /** Busca o endereço no ViaCEP ao sair do campo de CEP. */
  async function handleCepBlur() {
    const cep = onlyDigits(form.endereco.cep)
    if (cep.length !== 8 || buscandoCep) return
    setBuscandoCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setForm((prev) => ({
          ...prev,
          endereco: {
            ...prev.endereco,
            logradouro: data.logradouro ?? '',
            bairro: data.bairro ?? '',
            cidade: data.localidade ?? '',
            uf: data.uf ?? '',
          },
        }))
      }
    } catch {
      /* rede indisponível — o usuário pode digitar manualmente */
    } finally {
      setBuscandoCep(false)
    }
  }

  /** Valida o formulário e retorna true se estiver OK. */
  function validate() {
    const errs = {}
    if (!isRequired(form.nome)) errs.nome = 'Informe o nome completo.'
    if (form.email && !isValidEmail(form.email)) errs.email = 'E-mail inválido.'
    if (form.cpf && !isValidCpf(form.cpf)) errs.cpf = 'CPF inválido.'
    if (form.dataNascimento && !isValidBrDate(form.dataNascimento)) errs.dataNascimento = 'Data inválida.'
    if (form.dataAdm && !isValidBrDate(form.dataAdm)) errs.dataAdm = 'Data inválida.'
    if (!isRequired(form.escolaridade)) errs.escolaridade = 'Selecione a escolaridade.'
    if (!isRequired(form.cargo)) errs.cargo = 'Informe o cargo.'
    if (!isRequired(form.setor)) errs.setor = 'Selecione o setor.'
    if (!isRequired(form.status)) errs.status = 'Selecione o status.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  /** Salva (cria ou atualiza) o funcionário. */
  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setFormError('')
    try {
      const payload = {
        ...form,
        dataNascimento: brToIso(form.dataNascimento),
        dataAdm: brToIso(form.dataAdm),
      }
      if (funcionario) {
        await updateFuncionario(funcionario.id, payload)
      } else {
        await createFuncionario(payload, user?.uid)
      }
      onSaved?.()
      onClose()
    } catch (err) {
      setFormError(err?.message ?? 'Não foi possível salvar.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={funcionario ? 'Editar Funcionário' : 'Novo Funcionário'}
      subtitle={funcionario ? `Atualizando ${funcionario.nome}` : 'Cadastro completo do colaborador'}
      footer={
        <>
          <button type="button" className="btn text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-graphite-700" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="funcionario-form" className="btn-primary" disabled={submitting}>
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {submitting ? 'Salvando...' : 'Salvar'}
          </button>
        </>
      }
    >
      <form id="funcionario-form" onSubmit={handleSubmit} className="p-5 space-y-6" noValidate>
        {formError && (
          <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {formError}
          </div>
        )}

        {/* ---------------- Foto ---------------- */}
        <section>
          <SectionTitle>Foto do Funcionário</SectionTitle>
          <PhotoUpload value={form.foto} onChange={(foto) => setForm((prev) => ({ ...prev, foto }))} />
        </section>

        {/* ---------------- Dados Pessoais ---------------- */}
        <section>
          <SectionTitle icon={<BadgeInfo size={15} />}>Dados Pessoais</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            <Field label="Nome completo *" error={errors.nome}>
              <input className="input" value={form.nome} onChange={setField('nome')} placeholder="Ex.: João da Silva" />
            </Field>
            <Field label="E-mail" error={errors.email}>
              <input type="email" className="input" value={form.email} onChange={setField('email')} placeholder="exemplo@jpssteel.com.br" />
            </Field>
            <Field label="Data de nascimento" error={errors.dataNascimento}>
              <input className="input" value={form.dataNascimento} onChange={(e) => setForm((prev) => ({ ...prev, dataNascimento: maskDate(e.target.value) }))} placeholder="DD/MM/AAAA" inputMode="numeric" />
            </Field>
            <Field label="CPF" error={errors.cpf}>
              <input className="input" value={form.cpf} onChange={(e) => setForm((prev) => ({ ...prev, cpf: maskCPF(e.target.value) }))} placeholder="000.000.000-00" inputMode="numeric" />
            </Field>
            <Field label="RG">
              <input className="input" value={form.rg} onChange={setField('rg')} placeholder="Ex.: MG-12.345.678" />
            </Field>
            <Field label="WhatsApp">
              <input className="input" value={form.whatsapp} onChange={(e) => setForm((prev) => ({ ...prev, whatsapp: maskPhone(e.target.value) }))} placeholder="(31) 99999-9999" inputMode="numeric" />
            </Field>
          </div>
        </section>

        {/* ---------------- Endereço ---------------- */}
        <section>
          <SectionTitle icon={<MapPin size={15} />}>Endereço</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
            <Field label="CEP">
              <div className="relative">
                <input className="input pr-8" value={form.endereco.cep} onChange={(e) => setForm((prev) => ({ ...prev, endereco: { ...prev.endereco, cep: maskCEP(e.target.value) } }))} onBlur={handleCepBlur} placeholder="00000-000" inputMode="numeric" />
                {buscandoCep && <Loader2 size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-steel-500" />}
              </div>
            </Field>
            <Field label="Logradouro" className="col-span-2 sm:col-span-3">
              <input className="input" value={form.endereco.logradouro} onChange={setEndereco('logradouro')} placeholder="Rua, avenida..." />
            </Field>
            <Field label="Número">
              <input className="input" value={form.endereco.numero} onChange={setEndereco('numero')} placeholder="123" />
            </Field>
            <Field label="Complemento">
              <input className="input" value={form.endereco.complemento} onChange={setEndereco('complemento')} placeholder="Apto / Bl. C" />
            </Field>
            <Field label="Bairro">
              <input className="input" value={form.endereco.bairro} onChange={setEndereco('bairro')} placeholder="Bairro" />
            </Field>
            <Field label="Cidade">
              <input className="input" value={form.endereco.cidade} onChange={setEndereco('cidade')} placeholder="Cidade" />
            </Field>
            <Field label="UF">
              <input className="input" value={form.endereco.uf} onChange={setEndereco('uf')} placeholder="MG" maxLength={2} />
            </Field>
          </div>
        </section>

        {/* ---------------- Dados Profissionais ---------------- */}
        <section>
          <SectionTitle>Dados Profissionais</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            <Field label="Cargo *" error={errors.cargo} hint="Você pode escolher da lista ou digitar um novo">
              <input className="input" list="lista-cargos" value={form.cargo} onChange={setField('cargo')} placeholder="Ex.: Soldador" />
              <datalist id="lista-cargos">
                {configLists.cargo.map((opcao, i) => (
                  <option key={`${opcao}-${i}`} value={opcao} />
                ))}
              </datalist>
            </Field>
            <Field label="Setor *" error={errors.setor}>
              <select className="input" value={form.setor} onChange={setField('setor')}>
                {SETORES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Escolaridade *" error={errors.escolaridade}>
              <select className="input" value={form.escolaridade} onChange={setField('escolaridade')}>
                {configLists.escolaridade.map((op, i) => (
                  <option key={`${op}-${i}`} value={op}>{op}</option>
                ))}
              </select>
            </Field>
            <Field label="Data de admissão" error={errors.dataAdm}>
              <input className="input" value={form.dataAdm} onChange={(e) => setForm((prev) => ({ ...prev, dataAdm: maskDate(e.target.value) }))} placeholder="DD/MM/AAAA" inputMode="numeric" />
            </Field>

            {/* Nível de acesso: apenas para usuários administrativos */}
            {isAdmin && (
              <Field label="Nível de acesso" hint="Visível apenas para administradores">
                <select className="input" value={form.nivelAcesso} onChange={setField('nivelAcesso')}>
                  {NIVEIS_ACESSO.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </Field>
            )}

            <Field label="Status *" error={errors.status}>
              <select className="input" value={form.status} onChange={setField('status')}>
                {configLists.status.map((op, i) => (
                  <option key={`${op}-${i}`} value={op}>{op}</option>
                ))}
              </select>
            </Field>
            <Field label="PIS/PASEP">
              <input className="input" value={form.pis} onChange={(e) => setForm((prev) => ({ ...prev, pis: maskPIS(e.target.value) }))} placeholder="000.00000.00-0" inputMode="numeric" />
            </Field>
          </div>
        </section>

        <p className="text-xs text-slate-400">
          * Campos obrigatórios. Datas são exibidas no formato DD/MM/AAAA.
        </p>
      </form>
    </Modal>
  )
}

/** Título de seção do formulário. */
function SectionTitle({ children, icon }) {
  return (
    <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-steel-700 dark:text-steel-300">
      {icon}
      {children}
    </h4>
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