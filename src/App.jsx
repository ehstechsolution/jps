// ------------------------------------------------------------------
// src/App.jsx
// ------------------------------------------------------------------
// Componente raiz da aplicação JPS Steel.
//  - Provê tema (claro/escuro), configs globais e autenticação;
//  - Sem sessão -> bloqueia todo o app na tela de Login;
//  - Com sessão -> layout shell (Sidebar + área de conteúdo).
// ------------------------------------------------------------------
import { useState } from 'react'
import { ThemeProvider } from '@/context/ThemeContext'
import { ConfigProvider } from '@/context/ConfigContext'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import Sidebar from '@/components/Sidebar'
import LoadingScreen from '@/components/LoadingScreen'
import AuthPage from '@/pages/AuthPage'
import Dashboard from '@/pages/Dashboard'
import FuncionariosPage from '@/pages/FuncionariosPage'
import DocumentosPage from '@/pages/DocumentosPage'
import PlaceholderPage from '@/pages/PlaceholderPage'
import DocumentoNovoPage from '@/pages/DocumentoNovoPage'
import DocumentoEditarPage from '@/pages/DocumentoEditarPage'
import { useCollection } from '@/hooks/useCollection'

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
  if (!user) return <AuthPage />

  return <Shell />
}

/**
 * Layout principal após o login.
 */
function Shell() {
  const [activePage, setActivePage] = useState('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)
  const [docView, setDocView] = useState(null)
  const { data: funcionarios } = useCollection('funcionarios')

  const handleNavigate = (key) => {
    setActivePage(PAGES[key] ? key : 'dashboard')
    setDocView(null) // sai das views dedicadas de documentos ao navegar
    setMenuOpen(false) // fecha o drawer no mobile após navegar
  }

  const PageComponent = PAGES[activePage] ?? PAGES.dashboard

  /**
   * Views dedicadas de documentos (novo / carimbar PDF) — renderizadas no
   * lugar da página ativa, sem mudar de módulo.
   */
  if (docView?.kind === 'novo') {
    return (
      <div className="min-h-screen flex bg-slate-100 dark:bg-graphite-900">
        <Sidebar activePage="documentos" onNavigate={handleNavigate} onClose={() => setMenuOpen(false)} open={menuOpen} />
        <main className="flex-1 min-w-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <DocumentoNovoPage
              funcionarioId={docView.funcionarioId}
              funcionarios={funcionarios ?? []}
              onBack={() => setDocView(null)}
            />
          </div>
        </main>
      </div>
    )
  }

  if (docView?.kind === 'editar-pdf') {
    return (
      <div className="min-h-screen flex bg-slate-100 dark:bg-graphite-900">
        <Sidebar activePage="documentos" onNavigate={handleNavigate} onClose={() => setMenuOpen(false)} open={menuOpen} />
        <main className="flex-1 min-w-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <DocumentoEditarPage doc={docView.doc} onBack={() => setDocView(null)} />
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
      />

      {/* Conteúdo principal */}
      <main className="flex-1 min-w-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <PageComponent
            page={activePage}
            onOpenMenu={() => setMenuOpen(true)}
            onNavigate={handleNavigate}
            onOpenDocumentoNovo={(funcionarioId) => setDocView({ kind: 'novo', funcionarioId })}
            onOpenDocumentoPdf={(doc) => setDocView({ kind: 'editar-pdf', doc })}
          />
        </div>
      </main>
    </div>
  )
}