// ------------------------------------------------------------------
// src/App.jsx
// ------------------------------------------------------------------
// Componente raiz da aplicação JPS Steel.
//  - Provê tema (claro/escuro), configs globais e autenticação;
//  - Sem sessão -> bloqueia todo o app na tela de Login;
//  - Com sessão -> layout shell (Sidebar + área de conteúdo).
// ------------------------------------------------------------------
import { useState, useEffect, useRef } from 'react'
import logoLocal from '@/assets/logo.png'
import { ThemeProvider } from '@/context/ThemeContext'
import { ConfigProvider, useConfig } from '@/context/ConfigContext'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import Sidebar from '@/components/Sidebar'
import LoadingScreen from '@/components/LoadingScreen'
import AuthPage from '@/pages/AuthPage'
import Dashboard from '@/pages/Dashboard'
import FuncionariosPage from '@/pages/FuncionariosPage'
import DocumentosPage from '@/pages/DocumentosPage'
import PlaceholderPage from '@/pages/PlaceholderPage'
import DocumentoFormularioPage from '@/pages/DocumentoFormularioPage'
import { useCollection } from '@/hooks/useCollection'
import MeuPerfilPage from '@/pages/MeuPerfilPage'
import MeusDocumentosPage from '@/pages/MeusDocumentosPage'

/** Páginas disponíveis e seus componentes. */
const PAGES = {
  dashboard: (props) => <Dashboard {...props} />,
  funcionarios: (props) => <FuncionariosPage {...props} />,
  documentos: (props) => <DocumentosPage {...props} />,
  // Módulos futuros (placeholder até serem implementados)
  os: (props) => <PlaceholderPage {...props} page="os" />,
  financeiro: (props) => <PlaceholderPage {...props} page="financeiro" />,
  equipamentos: (props) => <PlaceholderPage {...props} page="equipamentos" />,
}

const SELF_SERVICE_PAGES = {
  'meu-perfil': (props) => <MeuPerfilPage {...props} />,
  'meus-documentos': (props) => <MeusDocumentosPage {...props} />,
}

export default function App() {
  return (
    <ThemeProvider>
      <ConfigProvider>
        <AuthProvider>
          <Root />
        </AuthProvider>
      </ConfigProvider>
    </ThemeProvider>
  )
}

/**
 * Mantém o favicon sempre igual ao logo exibido (asset ou config/empresa).
 */
function FaviconSync() {
  const { empresaLogo } = useConfig()
  useEffect(() => {
    const href = empresaLogo || logoLocal
    document.querySelectorAll('link[rel*="icon"]').forEach((link) => {
      link.href = href
    })
  }, [empresaLogo])
  return null
}

/**
 * Decide a tela exibida com base no estado de autenticação.
 */
function Root() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-graphite-900 grid place-items-center">
        <LoadingScreen />
      </div>
    )
  }

  // Sem sessão -> tela de autenticação (login/cadastro)
  if (!user) {
    return (
      <>
        <FaviconSync />
        <AuthPage />
      </>
    )
  }

  return (
    <>
      <FaviconSync />
      <Shell />
    </>
  )
}

/**
 * Layout principal após o login.
 */
function Shell() {
  const { userProfile, isAdmin, profileError } = useAuth()
  const restricted = !isAdmin
  const availablePages = restricted ? SELF_SERVICE_PAGES : PAGES
  const [activePage, setActivePage] = useState(restricted ? 'meu-perfil' : 'dashboard')
  const previousIsAdmin = useRef(isAdmin)
  const hasNavigated = useRef(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [docView, setDocView] = useState(null)
  const [documentoFiltro, setDocumentoFiltro] = useState(null)
  // A listagem global só é necessária no fluxo administrativo.
  const { data: funcionarios } = useCollection('funcionarios', !restricted)

  // Enquanto roles/{uid} ainda não foi resolvido, a interface parte do modo
  // restrito. Promove para Dashboard uma única vez, somente se o usuário não
  // tiver navegado nesse intervalo.
  useEffect(() => {
    if (!previousIsAdmin.current && isAdmin && !hasNavigated.current) {
      setActivePage('dashboard')
    }
    previousIsAdmin.current = isAdmin
  }, [isAdmin])

  const handleNavigate = (key) => {
    hasNavigated.current = true
    setActivePage(availablePages[key] ? key : restricted ? 'meu-perfil' : 'dashboard')
    setDocView(null) // sai das views dedicadas de documentos ao navegar
    setDocumentoFiltro(null) // limpa o filtro de funcionário ao navegar
    setMenuOpen(false) // fecha o drawer no mobile após navegar
  }

  // Abre a página de Documentos já filtrada pelo funcionário selecionado
  const handleOpenDocumentosFuncionario = (funcionarioId) => {
    if (restricted) return
    hasNavigated.current = true
    setActivePage('documentos')
    setDocView(null)
    setDocumentoFiltro(funcionarioId)
    setMenuOpen(false)
  }

  const PageComponent = availablePages[activePage] ?? (restricted ? SELF_SERVICE_PAGES['meu-perfil'] : PAGES.dashboard)

  /**
   * Views dedicadas de documentos (novo/editar registro) — renderizadas
   * no lugar da página ativa, sem mudar de módulo.
   */
  if (!restricted && (docView?.kind === 'novo' || docView?.kind === 'editar')) {
    return (
      <div className="min-h-screen flex bg-slate-100 dark:bg-graphite-900">
        <Sidebar activePage="documentos" onNavigate={handleNavigate} onClose={() => setMenuOpen(false)} open={menuOpen} />
        <main className="flex-1 min-w-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <DocumentoFormularioPage
              funcionarioId={docView.funcionarioId}
              funcionarios={funcionarios ?? []}
              documento={docView.kind === 'editar' ? docView.doc : null}
              onBack={() => setDocView(null)}
            />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-slate-100 dark:bg-graphite-900">
      {/* Navegação lateral */}
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        onClose={() => setMenuOpen(false)}
        open={menuOpen}
        restricted={restricted}
      />

      {/* Conteúdo principal */}
      <main className="flex-1 min-w-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {profileError && (
            <div role="alert" className="mb-4 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
              {profileError}
            </div>
          )}
          <PageComponent
            page={activePage}
            onOpenMenu={() => setMenuOpen(true)}
            onNavigate={handleNavigate}
            profile={userProfile}
            onOpenDocumentosFuncionario={handleOpenDocumentosFuncionario}
            documentoFiltro={documentoFiltro}
            onOpenDocumentoNovo={(funcionarioId) => setDocView({ kind: 'novo', funcionarioId })}
            onOpenDocumentoEditar={(doc) => setDocView({ kind: 'editar', doc })}
          />
        </div>
      </main>
    </div>
  )
}