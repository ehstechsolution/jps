// ------------------------------------------------------------------
// src/components/auth/SignupForm.jsx
// ------------------------------------------------------------------
// Formulário de auto-cadastro: nome*, e-mail*, WhatsApp (opcional),
// senha + confirmação* com medidor de força e nota de consentimento.
//
// Ao concluir, o AuthContext cria a conta no Firebase Auth, grava o
// registro em `funcionarios` (Operacional/Ativo/Externo) e faz login
// automático.
// ------------------------------------------------------------------
import { useState } from 'react'
import { User, Mail, Phone, LockKeyhole, Eye, EyeOff, Loader2, UserPlus } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import AuthField from './AuthField'
import PasswordStrength from './PasswordStrength'
import { maskPhone } from '@/utils/masks'
import { isRequired, isValidEmail } from '@/utils/validators'

export default function SignupForm() {
  const { register } = useAuth()

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [senha, setSenha] = useState('')
  const [confirma, setConfirma] = useState('')
  const [show, setShow] = useState(false)

  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  function validate() {
    const errs = {}
    if (!isRequired(nome)) errs.nome = 'Informe seu nome completo.'
    if (!isRequired(email)) errs.email = 'Informe um e-mail.'
    else if (!isValidEmail(email)) errs.email = 'E-mail inválido.'
    if (!isRequired(senha)) errs.senha = 'Crie uma senha.'
    else if (senha.length < 8) errs.senha = 'Use pelo menos 8 caracteres.'
    if (confirma !== senha) errs.confirma = 'As senhas não conferem.'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setError('')
    setSubmitting(true)
    try {
      await register({ nome: nome.trim(), email: email.trim(), password: senha, whatsapp })
      // Sucesso -> o AuthContext troca para o app automaticamente.
    } catch (err) {
      setError(err?.message ?? 'Não foi possível criar a conta.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <AuthField
        label="Nome completo"
        icon={User}
        type="text"
        placeholder="Ex.: João da Silva"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        autoComplete="name"
        error={fieldErrors.nome}
        required
      />

      <AuthField
        label="E-mail"
        icon={Mail}
        type="email"
        placeholder="voce@jpssteel.com.br"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        error={fieldErrors.email}
        required
      />

      <AuthField
        label="WhatsApp (opcional)"
        icon={Phone}
        type="tel"
        placeholder="(31) 99999-9999"
        value={whatsapp}
        onChange={(e) => setWhatsapp(maskPhone(e.target.value))}
        autoComplete="tel"
        inputMode="numeric"
      />

      <div>
        <AuthField
          label="Senha"
          icon={LockKeyhole}
          type={show ? 'text' : 'password'}
          placeholder="Mínimo de 8 caracteres"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoComplete="new-password"
          error={fieldErrors.senha}
          required
          trailing={
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="grid place-items-center h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />
        <PasswordStrength password={senha} />
      </div>

      <AuthField
        label="Confirmar senha"
        icon={LockKeyhole}
        type={show ? 'text' : 'password'}
        placeholder="Repita a senha"
        value={confirma}
        onChange={(e) => setConfirma(e.target.value)}
        autoComplete="new-password"
        error={fieldErrors.confirma}
        required
      />

      <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={submitting}>
        {submitting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
        {submitting ? 'Criando sua conta...' : 'Criar minha conta'}
      </button>

      <p className="text-[11px] leading-relaxed text-slate-400">
        Seu acesso será criado como <strong>Operacional</strong> com permissão inicial{' '}
        <strong>Externo</strong>. A administração da JPS Steel pode complementar seus dados
        profissionais e ajustar o nível de acesso.
      </p>
    </form>
  )
}