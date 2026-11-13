import { AlertTriangle, Briefcase, MapPin, UserRound } from 'lucide-react'
import EmployeePageHeader from '@/components/EmployeePageHeader'
import { formatDate } from '@/utils/format'

function Info({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1 break-words text-sm text-slate-800 dark:text-slate-100">{value || '—'}</dd>
    </div>
  )
}

function Section({ title, icon: Icon, children }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white mb-5">
        <Icon size={18} className="text-steel-600 dark:text-steel-400" />
        {title}
      </h2>
      {children}
    </section>
  )
}

export default function MeuPerfilPage({ profile, onOpenMenu }) {
  const endereco = profile?.endereco ?? {}
  const enderecoCompleto = [
    [endereco.logradouro, endereco.numero].filter(Boolean).join(', '),
    endereco.complemento,
    endereco.bairro,
    [endereco.cidade, endereco.uf].filter(Boolean).join(' - '),
    endereco.cep ? `CEP ${endereco.cep}` : '',
  ].filter(Boolean).join(' · ')

  return (
    <div>
      <EmployeePageHeader
        title="Meu Perfil"
        subtitle="Consulte os dados da sua ficha de funcionário."
        onOpenMenu={onOpenMenu}
      />

      {!profile ? (
        <div role="alert" className="card p-6 border-amber-200 dark:border-amber-500/30">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">Ficha não localizada</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Não foi possível associar sua conta a uma ficha. Nenhum dado de outros funcionários foi carregado.
                Entre em contato com a administração para verificar seu acesso.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <section className="card p-5 sm:p-6">
            <div className="flex items-center gap-4">
              {profile.foto ? (
                <img src={profile.foto} alt="" className="h-16 w-16 rounded-full object-cover bg-slate-100 dark:bg-graphite-800" />
              ) : (
                <span className="grid h-16 w-16 place-items-center rounded-full bg-steel-600 text-white" aria-hidden="true">
                  <UserRound size={28} />
                </span>
              )}
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white break-words">{profile.nome || 'Meu perfil'}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {[profile.cargo, profile.setor].filter(Boolean).join(' · ') || 'Dados do funcionário'}
                </p>
              </div>
            </div>
          </section>

          <Section title="Dados pessoais" icon={UserRound}>
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
              <Info label="E-mail" value={profile.email} />
              <Info label="Telefone / WhatsApp" value={profile.whatsapp} />
              <Info label="Data de nascimento" value={formatDate(profile.dataNascimento)} />
              <Info label="CPF" value={profile.cpf} />
              <Info label="RG" value={profile.rg} />
              <Info label="Escolaridade" value={profile.escolaridade} />
              <div className="sm:col-span-2 lg:col-span-3">
                <Info label="Endereço" value={enderecoCompleto} />
              </div>
            </dl>
          </Section>

          <Section title="Dados profissionais" icon={Briefcase}>
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
              <Info label="Cargo" value={profile.cargo} />
              <Info label="Setor" value={profile.setor} />
              <Info label="Data de admissão" value={formatDate(profile.dataAdm)} />
              <Info label="Status" value={profile.status} />
              <Info label="Nível de acesso" value={profile.nivelAcesso} />
            </dl>
          </Section>

          <p className="flex items-center gap-2 px-1 text-xs text-slate-500 dark:text-slate-400">
            <MapPin size={14} />
            Esta é a ficha associada à sua conta. Para corrigir algum dado, contate a administração.
          </p>
        </div>
      )}
    </div>
  )
}
