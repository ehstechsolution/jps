// ------------------------------------------------------------------
// src/components/auth/SignupForm.jsx
// ------------------------------------------------------------------
// Ativa uma conta para um convite existente, sem criar um segundo perfil
// de funcionário. O token do convite é validado no serviço Firebase.
// ------------------------------------------------------------------
import { useEffect, useState } from 'react'
import { Mail, LockKeyhole, Eye, EyeOff, Loader2, UserPlus } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import AuthField from './AuthField'
import PasswordStrength from './PasswordStrength'
import { getFuncionarioInvite } from '@/services/funcionarioService'

export default function SignupForm({ inviteToken }) {
  const { register } = useAuth()
  const [invite, setInvite] = useState(null)
  const [inviteError, setInviteError] = useState('')
  const [loadingInvite, setLoadingInvite] = useState(true)
  const [senha, setSenha] = useState('')
  const [confirma, setConfirma] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    setLoadingInvite(true)
    setInviteError('')
    getFuncionarioInvite(inviteToken)
      .then((data) => {
        if (active) setInvite(data)
      })
      .catch((err) => {
        if (active) setInviteError(err?.message ?? 'Convite inválido ou expirado.')
      })
      .finally(() => {
        if (active) setLoadingInvite(false)
      })

    return () => {
      active = false
    }
  }, [inviteToken])

  function validate() {
    if (!senha || senha.length < 8) {
      setError('Use uma senha com pelo menos 8 caracteres.')
      return false
    }
    if (confirma !== senha) {
      setError('As senhas não conferem.')
      return false
    }
    setError('')
    return true
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!invite || !validate()) return
    setSubmitting(true)
    setError('')
    try {
      await register({
        nome: invite.nome,
        email: invite.email,
        password: senha,
        inviteToken,
      })
    } catch (err) {
      setError(err?.message ?? 'Não foi possível ativar o acesso.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingInvite) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
        <Loader2 size={16} className="animate-spin" />
        Validando convite...
      </div>
    )
  }

  if (inviteError || !invite) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
        {inviteError || 'Convite inválido ou expirado. Solicite um novo à administração.'}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {(error || inviteError) && (
        <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error || inviteError}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 dark:border-graphite-700 bg-white/70 dark:bg-graphite-850 px-4 py-3">
        {invite.nome && <p className="font-semibold">{invite.nome}</p>}
        <p className="flex items-center gap-2 mt-1 text-sm text-slate-500 dark:text-slate-400">
          <Mail size={15} />
          {invite.email}
        </p>
      </div>

      <div>
        <AuthField
          label="Senha"
          icon={LockKeyhole}
          type={show ? 'text' : 'password'}
          placeholder="Mínimo de 8 caracteres"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoComplete="new-password"
          error={error && senha.length < 8 ? error : ''}
          required
          trailing={
            <button
              type="button"
              onClick={() => setShow((value) => !value)}
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
        error={error && confirma !== senha ? error : ''}
        required
      />

      <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={submitting}>
        {submitting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
        {submitting ? 'Ativando acesso...' : 'Criar acesso'}
      </button>

      <p className="text-[11px] leading-relaxed text-slate-400">
        Este convite vincula seu acesso ao perfil e aos documentos SST associados ao funcionário acima.
      </p>
    </form>
  )
}
