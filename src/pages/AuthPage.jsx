// ------------------------------------------------------------------
// src/pages/AuthPage.jsx
// ------------------------------------------------------------------
// Tela de acesso Executivo "Dark Industrial" da JPS Steel.
// - Layout dividido: painel de marca (esquerda, sempre escuro) + painel
//   do formulário (direita, respeita o tema).
// - Alternador de abas animado: Login | Cadastro.
// - No mobile o painel de marca vira uma faixa superior compacta.
// ------------------------------------------------------------------
import { useState } from 'react'
import { LayoutDashboard, LogIn, UserPlus } from 'lucide-react'
import BrandPanel from '@/components/auth/BrandPanel'
import LoginForm from '@/components/auth/LoginForm'
import SignupForm from '@/components/auth/SignupForm'
import ThemeToggle from '@/components/ThemeToggle'
import logoLocal from '@/assets/logo.png'
import { useConfig } from '@/context/ConfigContext'

const TABS = [
  { key: 'login', label: 'Entrar', icon: LogIn },
  { key: 'signup', label: 'Cadastrar', icon: UserPlus },
]

export default function AuthPage() {
  const { empresaLogo } = useConfig()
  const logo = empresaLogo || logoLocal
  const [tab, setTab] = useState('login')

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
            {/* Título conforme a aba */}
            <div className="flex items-center gap-2 text-steel-600 dark:text-steel-400">
              <LayoutDashboard size={18} />
              <span className="text-xs font-semibold uppercase tracking-[0.22em]">Painel</span>
            </div>
            <h1 className="display-font mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight">
              {tab === 'login' ? 'Bem-vindo de volta' : 'Crie seu acesso'}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {tab === 'login'
                ? 'Entre com suas credenciais para acessar o sistema.'
                : 'Preencha seus dados para começar a usar o sistema.'}
            </p>

            {/* Alternador de abas */}
            <div className="mt-6 grid grid-cols-2 gap-1 rounded-2xl bg-slate-200/80 dark:bg-graphite-850 p-1">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all
                    ${tab === key
                      ? 'bg-white dark:bg-graphite-800 text-steel-700 dark:text-steel-300 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>

            {/* Formulário ativo */}
            <div className="mt-6" key={tab}>
              {tab === 'login' ? <LoginForm /> : <SignupForm />}
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