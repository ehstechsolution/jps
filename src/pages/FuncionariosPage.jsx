// ------------------------------------------------------------------
// src/pages/FuncionariosPage.jsx
// ------------------------------------------------------------------
// Módulo de Funcionários da JPS Steel: listagem em tempo real com busca,
// filtro por setor, cadastro/edição (modal) e alteração rápida de status.
// ------------------------------------------------------------------
import { useMemo, useState } from 'react'
import {
  Search,
  UserPlus,
  Pencil,
  FileText,
  Power,
  RefreshCw,
  Mail,
  Users,
  HardHat,
  Briefcase,
} from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import LoadingScreen from '@/components/LoadingScreen'
import FuncionarioForm from '@/components/funcionarios/FuncionarioForm'
import { useCollection } from '@/hooks/useCollection'
import { useConfig } from '@/context/ConfigContext'
import { useAuth } from '@/context/AuthContext'
import { formatDate } from '@/utils/format'
import { renewFuncionarioInvite, setFuncionarioStatus } from '@/services/funcionarioService'
import { sendFuncionarioInvite } from '@/services/webhookService'

export default function FuncionariosPage({ onOpenMenu, onNavigate, onOpenDocumentosFuncionario }) {
  const { data: funcionarios, loading, error } = useCollection('funcionarios')
  const { seedConfig, configLoading } = useConfig()
  const { isAdmin } = useAuth()

  // Estado da listagem
  const [busca, setBusca] = useState('')
  const [setorFiltro, setSetorFiltro] = useState('TODOS')

  // Estado do formulário (novo / edição)
  const [formState, setFormState] = useState({ open: false, funcionario: null })
  const [seedFeedback, setSeedFeedback] = useState('')
  const [inviteFeedback, setInviteFeedback] = useState('')
  const [inviteBusy, setInviteBusy] = useState({})
  const [pendingInvites, setPendingInvites] = useState({})

  /** Lista filtrada e ordenada por nome. */
  const filtered = useMemo(() => {
    const term = busca.trim().toLowerCase()
    return [...(funcionarios ?? [])]
      .filter((f) => {
        if (setorFiltro !== 'TODOS' && (f.setor ?? '') !== setorFiltro) return false
        if (!term) return true
        return (
          (f.nome ?? '').toLowerCase().includes(term) ||
          (f.cargo ?? '').toLowerCase().includes(term) ||
          (f.cpf ?? '').includes(term)
        )
      })
      .sort((a, b) => (a.nome ?? '').localeCompare(b.nome ?? '', 'pt-BR'))
  }, [funcionarios, busca, setorFiltro])

  // Contadores para os mini-cards
  const counters = useMemo(() => {
    const total = funcionarios?.length ?? 0
    const ativos = (funcionarios ?? []).filter((f) => String(f.status ?? '').toUpperCase() === 'ATIVO').length
    const operacional = (funcionarios ?? []).filter((f) => f.setor === 'Operacional').length
    const administrativo = (funcionarios ?? []).filter((f) => f.setor === 'Administrativo').length
    return { total, ativos, operacional, administrativo }
  }, [funcionarios])

  /** Alterna status Ativo <-> Desligado (ação rápida). */
  async function handleToggleStatus(funcionario) {
    const ativo = String(funcionario.status ?? '').toUpperCase() === 'ATIVO'
    const novoStatus = ativo ? 'Desligado' : 'Ativo'
    if (!window.confirm(`Confirmar status "${novoStatus}" para ${funcionario.nome}?`)) return
    try {
      await setFuncionarioStatus(funcionario.id, novoStatus)
    } catch (err) {
      window.alert(err?.message ?? 'Não foi possível alterar o status.')
    }
  }

  /** Envia ou renova o convite sem criar outro registro de funcionário. */
  async function handleSendInvite(funcionario) {
    const pending = pendingInvites[funcionario.id]
    if (!pending && funcionario.inviteId && !window.confirm(
      `Gerar um novo convite para ${funcionario.nome}? O link anterior deixará de funcionar.`
    )) return

    setInviteFeedback('')
    setInviteBusy((current) => ({ ...current, [funcionario.id]: true }))
    try {
      let request = pending
      if (!request) {
        const invitation = await renewFuncionarioInvite(funcionario.id)
        const inviteUrl = new URL('/', window.location.origin)
        inviteUrl.hash = new URLSearchParams({ convite: invitation.inviteToken }).toString()
        request = {
          email: invitation.email,
          nome: invitation.nome,
          inviteUrl: inviteUrl.toString(),
          expiresAt: invitation.expiresAt,
        }
        setPendingInvites((current) => ({ ...current, [funcionario.id]: request }))
      }

      await sendFuncionarioInvite(request)
      setInviteFeedback(`Convite enviado ao webhook para ${request.email}.`)
      setPendingInvites((current) => {
        const next = { ...current }
        delete next[funcionario.id]
        return next
      })
    } catch (err) {
      setInviteFeedback(`Não foi possível enviar o convite de ${funcionario.nome}: ${err?.message ?? 'erro desconhecido'}`)
    } finally {
      setInviteBusy((current) => ({ ...current, [funcionario.id]: false }))
    }
  }

  /** Seed das listas padrão (config/funcionarios) — ação de admin. */
  async function handleSeed() {
    setSeedFeedback('')
    try {
      await seedConfig()
      setSeedFeedback('Listas padrão sincronizadas com sucesso.')
      setTimeout(() => setSeedFeedback(''), 4000)
    } catch (err) {
      setSeedFeedback(`Erro: ${err?.message ?? 'não foi possível sincronizar'}`)
    }
  }

  return (
    <div>
      <PageHeader
        title="Funcionários"
        subtitle="Quadro de colaboradores e gestão de documentos (SST)"
        onOpenMenu={onOpenMenu}
        onNavigate={onNavigate}
        actions={
          <>
            {isAdmin && (
              <button
                onClick={handleSeed}
                disabled={configLoading}
                className="btn text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-graphite-700 bg-white dark:bg-graphite-850"
                title="Grava as listas padrão de escolaridade, cargo e status em config/funcionarios"
              >
                <RefreshCw size={15} className={configLoading ? 'animate-spin' : ''} />
                Listas padrão
              </button>
            )}
            {isAdmin && (
              <button onClick={() => setFormState({ open: true, funcionario: null })} className="btn-primary">
                <UserPlus size={16} />
                Novo Funcionário
              </button>
            )}
          </>
        }
      />

      {seedFeedback && (
        <div className="mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          {seedFeedback}
        </div>
      )}

      {inviteFeedback && (
        <div role="status" className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
          inviteFeedback.startsWith('Convite enviado')
            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
            : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300'
        }`}>
          {inviteFeedback}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error.message}
        </div>
      )}

      {/* Mini-cards de resumo */}
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <MiniCounter icon={Users} label="Total" value={counters.total} tone="steel" />
        <MiniCounter icon={Briefcase} label="Ativos" value={counters.ativos} tone="emerald" />
        <MiniCounter icon={HardHat} label="Operacional" value={counters.operacional} tone="amber" />
        <MiniCounter icon={Briefcase} label="Administrativo" value={counters.administrativo} tone="violet" />
      </section>

      {/* Busca e filtro */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Buscar por nome, cargo ou CPF..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <select
          className="input sm:w-56"
          value={setorFiltro}
          onChange={(e) => setSetorFiltro(e.target.value)}
        >
          <option value="TODOS">Todos os setores</option>
          <option value="Operacional">Operacional</option>
          <option value="Administrativo">Administrativo</option>
        </select>
      </div>

      {/* Listagem */}
      {loading ? (
        <LoadingScreen />
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <Users size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {funcionarios?.length === 0
              ? 'Nenhum funcionário cadastrado ainda. Clique em "Novo Funcionário" para começar.'
              : 'Nenhum registro encontrado para os filtros aplicados.'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-std">
              <thead>
                <tr>
                  <th>Funcionário</th>
                  <th>Cargo</th>
                  <th>Setor</th>
                  <th>Admissão</th>
                  <th>Status</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <FuncionarioAvatar foto={f.foto} nome={f.nome} />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 dark:text-slate-100 truncate">{f.nome}</p>
                          <p className="text-xs text-slate-400 truncate">{f.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-slate-600 dark:text-slate-300">{f.cargo || '—'}</td>
                    <td>
                      <span className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-graphite-800 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {f.setor ?? '—'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {formatDate(f.dataAdm)}
                    </td>
                    <td>
                      <StatusBadge status={f.status ?? '—'} />
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onOpenDocumentosFuncionario?.(f.id)}
                          className="grid place-items-center h-8 w-8 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-graphite-800 hover:text-steel-600 dark:hover:text-steel-400"
                          title={`Ver documentos SST de ${f.nome}`}
                        >
                          <FileText size={15} />
                        </button>
                        {isAdmin && (
                          <>
                            {!f.uid && (
                              <button
                                onClick={() => handleSendInvite(f)}
                                disabled={Boolean(inviteBusy[f.id])}
                                className="grid place-items-center h-8 w-8 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-graphite-800 hover:text-steel-600 dark:hover:text-steel-400 disabled:opacity-50"
                                title={pendingInvites[f.id] ? 'Tentar enviar o convite novamente' : 'Enviar ou renovar convite de acesso'}
                                aria-label={`${pendingInvites[f.id] ? 'Tentar novamente' : 'Enviar convite'} para ${f.nome}`}
                              >
                                {inviteBusy[f.id]
                                  ? <RefreshCw size={15} className="animate-spin" />
                                  : <Mail size={15} />}
                              </button>
                            )}
                            <button
                              onClick={() => setFormState({ open: true, funcionario: f })}
                              className="grid place-items-center h-8 w-8 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-graphite-800 hover:text-steel-600 dark:hover:text-steel-400"
                              title="Editar funcionário"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(f)}
                              className={`grid place-items-center h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-graphite-800 ${
                                String(f.status ?? '').toUpperCase() === 'ATIVO'
                                  ? 'text-red-500 hover:text-red-600'
                                  : 'text-emerald-500 hover:text-emerald-600'
                              }`}
                              title={String(f.status ?? '').toUpperCase() === 'ATIVO' ? 'Marcar como Desligado' : 'Reativar'}
                            >
                              <Power size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de cadastro/edição */}
      <FuncionarioForm
        open={formState.open}
        funcionario={formState.funcionario}
        onClose={() => setFormState({ open: false, funcionario: null })}
        onSaved={() => {
          // Nada além do fechamento é necessário: a listagem é real-time
        }}
      />

      {/* Nota quando o e-mail logado não tem perfil */}
      {!isAdmin && (
        <p className="text-xs text-slate-400 mt-4">
          Apenas usuários administrativos podem cadastrar, editar ou alterar o status dos funcionários.
        </p>
      )}
    </div>
  )
}

/** Mini-card de contagem usado no topo do módulo. */
function MiniCounter({ icon: Icon, label, value, tone }) {
  const tones = {
    steel: 'bg-steel-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    violet: 'bg-violet-500',
  }
  return (
    <div className="card p-4 flex items-center gap-3">
      <span className={`grid place-items-center h-10 w-10 rounded-xl text-white shrink-0 ${tones[tone] ?? tones.steel}`}>
        <Icon size={18} />
      </span>
      <div>
        <p className="text-xl font-extrabold text-slate-900 dark:text-white leading-none">{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</p>
      </div>
    </div>
  )
}

/** Avatar do funcionário: foto ou iniciais. */
export function FuncionarioAvatar({ foto, nome }) {
  if (foto) {
    return (
      <img
        src={foto}
        alt={nome ?? 'Foto'}
        className="h-10 w-10 shrink-0 rounded-full object-cover bg-slate-100 dark:bg-graphite-800"
      />
    )
  }
  const iniciais = String(nome ?? '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
  return (
    <div className="grid place-items-center h-10 w-10 shrink-0 rounded-full bg-steel-600 text-white text-sm font-bold">
      {iniciais}
    </div>
  )
}