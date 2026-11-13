// ------------------------------------------------------------------
// src/pages/AuthPage.jsx
// ------------------------------------------------------------------
// Tela de acesso Executivo "Dark Industrial" da JPS Steel.
// - Layout dividido: painel de marca (esquerda, sempre escuro) + painel
//   do formulário (direita, respeita o tema).
// - Login normal ou ativação de convite por token.
// - No mobile o painel de marca vira uma faixa superior compacta.
// ------------------------------------------------------------------
import { LayoutDashboard } from 'lucide-react'
import BrandPanel from '@/components/auth/BrandPanel'
import LoginForm from '@/components/auth/LoginForm'
import SignupForm from '@/components/auth/SignupForm'
import ThemeToggle from '@/components/ThemeToggle'
import logoLocal from '@/assets/logo.png'
import { useConfig } from '@/context/ConfigContext'

export default function AuthPage() {
  const { empresaLogo } = useConfig()
  const logo = empresaLogo || logoLocal
  const inviteToken = (
    new URLSearchParams(window.location.hash.slice(1)).get('convite') ||
    new URLSearchParams(window.location.search).get('convite') ||
    ''
  ).trim()
  const hasInvite = Boolean(inviteToken)

  return (
    <div className="min-h-screen lg:flex bg-slate-50 dark:bg-graphite-900 text-slate-900 dark:text-slate-100">
      {/* Painel de marca (desktop) */}
      <BrandPanel />

      {/* Painel do formulário */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra superior: marca mobile + tema */}
        <div className="flex items-center gap-3 px-5 py-4 sm:px-8">
          <div className="lg:hidden flex items-center gap-3">
            <div className="h-20 w-20 grid place-items-center">
              <img src={logo} alt="JPS Steel" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="display-font font-extrabold leading-tight">JPS Steel</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Montagens Industriais</p>
            </div>
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        {/* Formulário */}
        <div className="flex-1 flex items-center justify-center px-5 sm:px-8 lg:py-8 pb-12">
          <div className="w-full max-w-md animate-fade-up">
            {/* Título conforme o fluxo */}
            <div className="flex items-center gap-2 text-steel-600 dark:text-steel-400">
              <LayoutDashboard size={18} />
              <span className="text-xs font-semibold uppercase tracking-[0.22em]">Painel</span>
            </div>
            <h1 className="display-font mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight">
              {hasInvite ? 'Ative seu acesso' : 'Bem-vindo de volta'}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {hasInvite
                ? 'Crie uma senha para acessar o perfil de funcionário associado a este convite.'
                : 'Entre com suas credenciais para acessar o sistema.'}
            </p>

            <div className="mt-6">
              {hasInvite ? (
                <SignupForm inviteToken={inviteToken} />
              ) : (
                <>
                  <LoginForm />
                  <p className="mt-5 text-center text-xs text-slate-400">
                    O cadastro é feito por convite enviado pela administração.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="pb-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} JPS Steel · Montagens Industriais · Acesso restrito a colaboradores
        </div>
      </div>
    </div>
  )
}