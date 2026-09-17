// ------------------------------------------------------------------
// src/pages/PlaceholderPage.jsx
// ------------------------------------------------------------------
// Página provisória para os módulos que ainda serão construídos
// (SST, OS, Financeiro, Equipamentos). Mantém a navegação 100% funcional
// enquanto o Dashboard é a tela principal já implementada.
// ------------------------------------------------------------------
import { Hammer } from 'lucide-react'
import PageHeader from '@/components/PageHeader'

const PAGE_INFO = {
  sst: {
    title: 'SST & Funcionários',
    subtitle: 'Gestão de funcionários, documentos (ASO, NR-10, NR-35, NR-33) e validades.',
  },
  os: {
    title: 'Ordens de Serviço',
    subtitle: 'Orçamentos, ordens de serviço, equipe alocada e acompanhamento do andamento.',
  },
  financeiro: {
    title: 'Financeiro & Gastos',
    subtitle: 'Receitas, gastos por categoria, comprovantes e lucro bruto por OS.',
  },
  equipamentos: {
    title: 'Equipamentos',
    subtitle: 'Patrimônio, disponibilidade, manutenção e calendário de calibração.',
  },
}

export default function PlaceholderPage({ page, onOpenMenu, onNavigate }) {
  const info = PAGE_INFO[page] ?? PAGE_INFO.os

  return (
    <div>
      <PageHeader title={info.title} subtitle={info.subtitle} onOpenMenu={onOpenMenu} onNavigate={onNavigate} />

      <div className="card p-10 grid place-items-center text-center">
        <div className="grid place-items-center h-16 w-16 rounded-2xl bg-steel-50 dark:bg-steel-950 text-steel-500 mb-4">
          <Hammer size={28} />
        </div>
        <h2 className="font-bold text-slate-900 dark:text-white text-lg">Módulo em construção</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-2">
          O módulo <strong>{info.title}</strong> será implementado aqui em breve.
          A estrutura de navegação, o tema claro/escuro e o Dashboard já estão
          funcionando em tempo real.
        </p>
      </div>
    </div>
  )
}