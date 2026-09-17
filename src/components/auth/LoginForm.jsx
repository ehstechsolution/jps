// ------------------------------------------------------------------
// src/components/auth/LoginForm.jsx
// ------------------------------------------------------------------
// Formulário de login (e-mail/senha) com:
//   - mostrar/ocultar senha
//   - "Lembrar de mim" (persistência LOCAL vs SESSION)
//   - "Esqueci minha senha" (modo inline de redefinição por e-mail)
// ------------------------------------------------------------------
import { useState } from 'react'
import { Mail, LockKeyhole, Eye, EyeOff, Loader2, LogIn, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import AuthField from './AuthField'

export default function LoginForm() {
  const { login, resetPassword } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'reset'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)
    try {
      if (mode === 'login') {
        await login(email.trim(), password, remember)
        // Sucesso -> o AuthContext troca a tela automaticamente.
      } else {
        await resetPassword(email.trim())
        setSuccess('Enviamos um link de redefinição para o seu e-mail. Verifique sua caixa de entrada.')
      }
    } catch (err) {
      setError(err?.message ?? 'Não foi possível concluir a operação.')
    } finally {
      setSubmitting(false)
    }
  }

  /** Volta o modo de senha esquecida para o login normal. */
  function backToLogin() {
    setMode('login')
    setError('')
    setSuccess('')
  }

  return (
    <div>
      {success && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 size={17} className="shrink-0 mt-0.5" />
          {success}
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {success ? (
        <button onClick={backToLogin} className="btn-primary w-full justify-center py-2.5 mt-2">
          <ArrowLeft size={16} />
          Voltar para o login
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <AuthField
            label="E-mail"
            icon={Mail}
            type="email"
            placeholder="voce@jpssteel.com.br"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          {mode === 'login' ? (
            <>
              <AuthField
                label="Senha"
                icon={LockKeyhole}
                type={show ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
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

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-steel-600 focus:ring-steel-500"
                  />
                  Lembrar de mim
                </label>
                <button
                  type="button"
                  onClick={() => setMode('reset')}
                  className="text-sm font-medium text-steel-600 dark:text-steel-400 hover:underline"
                >
                  Esqueci a senha
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Informe seu e-mail cadastrado. Enviaremos um link seguro para criar uma nova senha.
              </p>
              <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={submitting}>
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                {submitting ? 'Enviando...' : 'Enviar link de redefinição'}
              </button>
              <button
                type="button"
                onClick={backToLogin}
                className="w-full inline-flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <ArrowLeft size={14} />
                Voltar para o login
              </button>
            </>
          )}

          {mode === 'login' && (
            <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={submitting}>
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
              {submitting ? 'Entrando...' : 'Entrar'}
            </button>
          )}
        </form>
      )}
    </div>
  )
}