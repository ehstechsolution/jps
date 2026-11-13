// ------------------------------------------------------------------
// src/components/Sidebar.jsx
// ------------------------------------------------------------------
// Navegação lateral da JPS Steel. Retrátil: em telas pequenas vira um
// drawer deslizante (controlado pelo estado do Layout); em telas grandes
// é fixo. Inclui logo, nome da empresa, menu principal e rodapé com a
// versão/empresa.
// ------------------------------------------------------------------
import {
  LayoutDashboard,
  HardHat,
  FileText,
  ClipboardList,
  Wallet,
  Cog,
  X,
  Building2,
  LogOut,
  UserRound,
} from 'lucide-react'
import logoLocal from '@/assets/logo.png'
import { useConfig } from '@/context/ConfigContext'
import { useAuth } from '@/context/AuthContext'

/** Itens do menu principal (rotas internas do app). */
export const MENU_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', subtitle: 'Visão geral', icon: LayoutDashboard },
  { key: 'funcionarios', label: 'Funcionários', subtitle: 'SST & quadro', icon: HardHat },
  { key: 'documentos', label: 'Documentos', subtitle: 'Validades e arquivos', icon: FileText },
  { key: 'os', label: 'Ordens de Serviço', subtitle: 'Orçamentos e OS', icon: ClipboardList },
  { key: 'financeiro', label: 'Financeiro & Gastos', subtitle: 'Resultados e custos', icon: Wallet },
  { key: 'equipamentos', label: 'Equipamentos', subtitle: 'Frota e patrimônio', icon: Cog },
]

const SELF_SERVICE_ITEMS = [
  { key: 'meu-perfil', label: 'Meu Perfil', subtitle: 'Minha ficha', icon: UserRound },
  { key: 'meus-documentos', label: 'Meus Documentos', subtitle: 'Documentos SST', icon: FileText },
]

/**
 * Sidebar da aplicação.
 * @param {object} props
 * @param {string}   props.activePage  Chave da página ativa (ex.: "dashboard")
 * @param {Function} props.onNavigate  Callback ao clicar em um item
 * @param {Function} props.onClose     Fecha o drawer (mobile)
 * @param {boolean}  props.open        Se o drawer mobile está visível
 */
export default function Sidebar({ activePage, onNavigate, onClose, open, restricted = false }) {
  const { empresaLogo } = useConfig()
  const { userProfile, logout } = useAuth()
  const logo = empresaLogo || logoLocal
  const menuItems = restricted ? SELF_SERVICE_ITEMS : MENU_ITEMS
  return (
    <>
      {/* Overlay para fechar o drawer no mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-graphite-950/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40 w-72
          bg-graphite-900 dark:bg-graphite-950 border-r border-graphite-700/50
          text-slate-200 flex flex-col transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Topo: logo + nome da empresa */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-graphite-700/50">
          <div className="h-14 w-14 grid place-items-center overflow-hidden">
            <img
              src={logo}
              alt="Logo JPS Steel"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-100 leading-tight truncate">JPS Steel</p>
            <p className="text-[11px] text-slate-400 truncate">Montagens Industriais</p>
          </div>
          <button
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={onClose}
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Menu principal */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Menu principal">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activePage === item.key
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`
                  w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left
                  transition-colors group
                  ${isActive
                    ? 'bg-steel-600 text-white shadow-md shadow-steel-900/40'
                    : 'text-slate-300 hover:bg-graphite-800 hover:text-white'
                  }
                `}
              >
                <span className={`
                  grid place-items-center h-9 w-9 rounded-lg shrink-0
                  ${isActive
                    ? 'bg-white/15'
                    : 'bg-graphite-800 group-hover:bg-graphite-700'
                  }
                `}>
                  <Icon size={19} />
                </span>
                <span className="min-w-0">
                  <span className="block font-medium text-sm leading-tight">{item.label}</span>
                  <span className={`block text-[11px] ${isActive ? 'text-steel-100' : 'text-slate-500'}`}>
                    {item.subtitle}
                  </span>
                </span>
              </button>
            )
          })}
        </nav>

        {/* Rodapé: versão + usuário logado */}
        <div className="px-5 py-4 border-t border-graphite-700/50 space-y-3">
          {userProfile && (
            <div className="flex items-center gap-3">
              {userProfile.foto ? (
                <img
                  src={userProfile.foto}
                  alt="Perfil"
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <span className="grid place-items-center h-9 w-9 rounded-full bg-steel-600 text-white text-sm font-bold">
                  {(userProfile.nome ?? '?').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-200 truncate">{userProfile.nome}</p>
                <p className="text-[11px] text-slate-500 truncate">
                  {userProfile.cargo} · {userProfile.setor}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white"
            title="Sair"
          >
            <LogOut size={15} />
            Sair
          </button>
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <Building2 size={14} />
            JPS Steel · v0.1.0
          </p>
        </div>
      </aside>
    </>
  )
}