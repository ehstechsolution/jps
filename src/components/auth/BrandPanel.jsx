// ------------------------------------------------------------------
// src/components/auth/BrandPanel.jsx
// ------------------------------------------------------------------
// Painel de marca da tela de acesso (desktop) — visual "Dark Industrial":
// logo, identidade da JPS Steel, argumentos de produto e fundo em CSS
// (padrão tipo planta/blueprint + orbes de gradiente + scanline sutil).
//
// O painel é sempre escuro (não segue o tema) para reforçar a identidade
// executiva. Aceita opcionalmente uma `backgroundImage` (foto real da
// planta) substituindo o fundo CSS.
// ------------------------------------------------------------------
import { Activity, ShieldCheck, BarChart3 } from 'lucide-react'
import logoLocal from '@/assets/logo.png'
import { useConfig } from '@/context/ConfigContext'

const FEATURES = [
  { icon: Activity, title: 'Tempo real', desc: 'Banco de dados sincronizado no momento em que acontece.' },
  { icon: ShieldCheck, title: 'SST integrada', desc: 'Validade de ASO e Normas Regulamentadoras sob alerta.' },
  { icon: BarChart3, title: 'Visão financeira', desc: 'OS, orçamentos e custos em um só lugar.' },
]

/**
 * @param {object} props
 * @param {string} [props.backgroundImage] URL de foto industrial (opcional)
 */
export default function BrandPanel({ backgroundImage }) {
  const { empresaLogo } = useConfig()
  const logo = empresaLogo || logoLocal

  return (
    <aside className="relative hidden lg:flex w-[44%] xl:w-[42%] shrink-0 flex-col justify-between overflow-hidden text-slate-100 px-10 py-12 min-h-screen">
      {/* Fundo: foto opcional OU CSS blueprint */}
      {backgroundImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      ) : (
        <div className="absolute inset-0 auth-blueprint" />
      )}
      {/* Sombra de legibilidade */}
      <div className="absolute inset-0 bg-gradient-to-t from-graphite-950/90 via-graphite-950/40 to-graphite-950/20" />

      {/* Orbes de gradiente */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-steel-500 auth-orb" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-amber-500 auth-orb" />

      {/* Scanline industrial */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 h-24 bg-gradient-to-b from-white/[0.04] to-transparent animate-scanline" />
      </div>

      <div className="relative">
        {/* Logo + identidade (transparente, tamanho dobrado) */}
        <div className="flex items-center gap-5">
          <div className="h-28 w-28 grid place-items-center">
            <img src={logo} alt="JPS Steel" className="h-full w-full object-contain drop-shadow-lg" />
          </div>
          <div>
            <p className="display-font text-3xl font-extrabold tracking-tight">JPS Steel</p>
            <p className="text-sm text-slate-300/80 mt-0.5">Montagens Industriais</p>
          </div>
        </div>
      </div>

      {/* Mensagem central */}
      <div className="relative max-w-md">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-400">
          Painel executivo
        </p>
        <h1 className="display-font mt-4 text-4xl xl:text-5xl font-extrabold leading-[1.1] text-white">
          A operação industrial{' '}
          <span className="text-steel-300">sob controle</span> em tempo real.
        </h1>
        <p className="mt-5 text-sm leading-relaxed text-slate-300">
          Gestão operacional, financeira e de Segurança do Trabalho integradas
          para a equipe da JPS Steel.
        </p>

        <ul className="mt-9 space-y-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <li key={title} className="flex items-start gap-3">
              <span className="grid place-items-center h-9 w-9 rounded-xl bg-white/10 border border-white/15 text-steel-200 shrink-0">
                <Icon size={16} />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Rodapé */}
      <div className="relative flex items-center justify-between text-xs text-slate-400">
        <p>© {new Date().getFullYear()} JPS Steel · Montagens Industriais</p>
        <span className="rounded-full border border-white/15 px-3 py-1">v0.2.0</span>
      </div>
    </aside>
  )
}