// ------------------------------------------------------------------
// src/services/mockData.js
// ------------------------------------------------------------------
// Dados de demonstração ("modo demo") utilizados quando o Firebase ainda
// não foi configurado via .env. Garante que `npm run dev` funcione
// imediatamente, exibindo o Dashboard completo com dados fictícios.
//
// IMPORTANTE: ao preencher as variáveis VITE_FIREBASE_* no .env,
// este módulo é automaticamente desativado (vide useDashboardData).
// ------------------------------------------------------------------

/** Retorna uma data deslocada em N dias a partir de hoje. */
function daysFromNow(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

/** Funcionários fictícios (documentos SST em subcoleção). */
const FUNCIONARIOS = [
  {
    id: 'F001',
    nome: 'Carlos Eduardo Souza',
    cpf: '112.334.455-90',
    cargo: 'Soldador 6G',
    email: 'carlos.souza@jpssteel.com.br',
    telefone: '(31) 98765-1201',
    status: 'ATIVO',
    data_admissao: '2021-03-15',
    _criadoEm: null,
    documentos_sst: [
      { id: 'D001', tipoDocumento: 'ASO', dataEmissao: '2026-06-01', dataValidade: daysFromNow(45).toISOString().slice(0, 10), status: 'VIGENTE', resultado: 'Apto', observacao: '', arquivoUrl: '', arquivoNome: '', criadoPor: 'demo' },
      { id: 'D002', tipoDocumento: 'NR-10', dataEmissao: '2025-09-20', dataValidade: daysFromNow(15).toISOString().slice(0, 10), status: 'VIGENTE', observacao: '', arquivoUrl: '', arquivoNome: '', criadoPor: 'demo' },
      { id: 'D003', tipoDocumento: 'NR-35', dataEmissao: '2024-12-02', dataValidade: daysFromNow(-12).toISOString().slice(0, 10), status: 'VENCIDO', observacao: '', arquivoUrl: '', arquivoNome: '', criadoPor: 'demo' },
      { id: 'D004', tipoDocumento: 'NR-33', dataEmissao: '2025-04-10', dataValidade: daysFromNow(190).toISOString().slice(0, 10), status: 'VIGENTE', observacao: '', arquivoUrl: '', arquivoNome: '', criadoPor: 'demo' },
    ],
  },
  {
    id: 'F002',
    nome: 'Mariana Oliveira Lima',
    cpf: '221.445.566-78',
    cargo: 'Técnica de Segurança do Trabalho',
    email: 'mariana.lima@jpssteel.com.br',
    telefone: '(31) 98111-2233',
    status: 'ATIVO',
    data_admissao: '2019-08-01',
    _criadoEm: null,
    documentos_sst: [
      { id: 'D005', tipoDocumento: 'ASO', dataEmissao: '2026-02-10', dataValidade: daysFromNow(170).toISOString().slice(0, 10), status: 'VIGENTE', resultado: 'Apto', observacao: '', arquivoUrl: '', arquivoNome: '', criadoPor: 'demo' },
      { id: 'D006', tipoDocumento: 'NR-10', dataEmissao: '2026-03-05', dataValidade: daysFromNow(-2).toISOString().slice(0, 10), status: 'VENCIDO', observacao: '', arquivoUrl: '', arquivoNome: '', criadoPor: 'demo' },
    ],
  },
  {
    id: 'F003',
    nome: 'João Pedro Martins',
    cpf: '334.556.677-02',
    cargo: 'Montador Industrial',
    email: 'joao.martins@jpssteel.com.br',
    telefone: '(31) 99876-5544',
    status: 'ATIVO',
    data_admissao: '2022-11-20',
    _criadoEm: null,
    documentos_sst: [
      { id: 'D007', tipoDocumento: 'ASO', dataEmissao: '2026-08-01', dataValidade: daysFromNow(300).toISOString().slice(0, 10), status: 'VIGENTE', resultado: 'Apto', observacao: '', arquivoUrl: '', arquivoNome: '', criadoPor: 'demo' },
      { id: 'D008', tipoDocumento: 'NR-35', dataEmissao: '2025-11-11', dataValidade: daysFromNow(25).toISOString().slice(0, 10), status: 'EM_ANALISE', observacao: '', arquivoUrl: '', arquivoNome: '', criadoPor: 'demo' },
    ],
  },
  {
    id: 'F004',
    nome: 'Ana Beatriz Rocha',
    cpf: '445.667.788-11',
    cargo: 'Encarregada de Obras',
    email: 'ana.rocha@jpssteel.com.br',
    telefone: '(31) 98999-8877',
    status: 'INATIVO',
    data_admissao: '2020-05-10',
    _criadoEm: null,
    documentos_sst: [],
  },
]

/** Clientes fictícios. */
const CLIENTES = [
  { id: 'C001', razao_social: 'Mineração Alta Vista S/A', nome_fantasia: 'Alta Vista', cnpj: '12.345.678/0001-90', contato_principal: 'Rafael Andrade', email: 'compras@altavista.com.br', telefone: '(31) 3222-0001', cidade: 'Nova Lima', _criadoEm: null },
  { id: 'C002', razao_social: 'Siderúrgica Vale do Aço Ltda', nome_fantasia: 'Vale do Aço', cnpj: '98.765.432/0001-10', contato_principal: 'Patrícia Nunes', email: 'suprimentos@valedoaco.ind.br', telefone: '(31) 3555-0100', cidade: 'Ipatinga', _criadoEm: null },
  { id: 'C003', razao_social: 'Cimentos Atlântico S/A', nome_fantasia: 'Cimentos Atlântico', cnpj: '11.222.333/0001-44', contato_principal: 'Bruno Tavares', email: 'srv@cimentosatlantico.com', telefone: '(31) 2121-3030', cidade: 'Belo Horizonte', _criadoEm: null },
]

/** Orçamentos e Ordens de Serviço fictícios. */
const ORCAMENTOS_OS = [
  { id: 'OS001', numero_os: 'OS-2026-0014', id_cliente: 'C001', cliente_nome_cache: 'Alta Vista', descricao_servico: 'Montagem de estruturas metálicas — Correia CV-03', tipo: 'ORDEM_SERVICO', status: 'EM_ANDAMENTO', data_emissao: daysFromNow(-6), equipe_alocada: ['F001', 'F003'], equipamentos_alocados: ['EQ004'], valor_orcado: 185000, custo_total_gastos: 64200, lucro_bruto: 120800, _criadoEm: null },
  { id: 'OS002', numero_os: 'OS-2026-0013', id_cliente: 'C002', cliente_nome_cache: 'Vale do Aço', descricao_servico: 'Manutenção preventiva de guindaste de pórtico', tipo: 'ORDEM_SERVICO', status: 'EM_ANDAMENTO', data_emissao: daysFromNow(-9), equipe_alocada: ['F001', 'F002'], equipamentos_alocados: ['EQ001'], valor_orcado: 96000, custo_total_gastos: 31000, lucro_bruto: 65000, _criadoEm: null },
  { id: 'OS003', numero_os: 'OS-2026-0012', id_cliente: 'C003', cliente_nome_cache: 'Cimentos Atlântico', descricao_servico: 'Soldagem de tubulação de clínquer', tipo: 'ORDEM_SERVICO', status: 'CONCLUIDO', data_emissao: daysFromNow(-22), equipe_alocada: ['F003'], equipamentos_alocados: ['EQ003'], valor_orcado: 142000, custo_total_gastos: 118000, lucro_bruto: 24000, _criadoEm: null },
  { id: 'OR1', numero_os: 'OR-2026-0008', id_cliente: 'C002', cliente_nome_cache: 'Vale do Aço', descricao_servico: 'Fabricação e fornecimento de passarela metálica', tipo: 'ORCAMENTO', status: 'PENDENTE', data_emissao: daysFromNow(-2), equipe_alocada: [], equipamentos_alocados: [], valor_orcado: 275000, custo_total_gastos: 0, lucro_bruto: 0, _criadoEm: null },
  { id: 'OR2', numero_os: 'OR-2026-0007', id_cliente: 'C003', cliente_nome_cache: 'Cimentos Atlântico', descricao_servico: 'Troca de revestimento de moinho de bolas', tipo: 'ORCAMENTO', status: 'PENDENTE', data_emissao: daysFromNow(-1), equipe_alocada: [], equipamentos_alocados: [], valor_orcado: 430000, custo_total_gastos: 0, lucro_bruto: 0, _criadoEm: null },
  { id: 'OR3', numero_os: 'OR-2026-0006', id_cliente: 'C001', cliente_nome_cache: 'Alta Vista', descricao_servico: 'Manutenção de travessias de correias transportadoras', tipo: 'ORCAMENTO', status: 'APROVADO', data_emissao: daysFromNow(-12), equipe_alocada: [], equipamentos_alocados: [], valor_orcado: 88000, custo_total_gastos: 0, lucro_bruto: 0, _criadoEm: null },
]

/** Gastos fictícios vinculados às OS. */
const GASTOS = [
  { id: 'G001', id_os: 'OS001', numero_os_cache: 'OS-2026-0014', categoria: 'Material', descricao: 'Eletrodos revestidos e arame', valor: 12500, data: daysFromNow(-5), url_comprovante: '', _criadoEm: null },
  { id: 'G002', id_os: 'OS001', numero_os_cache: 'OS-2026-0014', categoria: 'Combustível', descricao: 'Combustível do grupo gerador', valor: 3400, data: daysFromNow(-3), url_comprovante: '', _criadoEm: null },
  { id: 'G003', id_os: 'OS002', numero_os_cache: 'OS-2026-0013', categoria: 'Material', descricao: 'Peças de reposição de talha', valor: 8700, data: daysFromNow(-4), url_comprovante: '', _criadoEm: null },
  { id: 'G004', id_os: 'OS002', numero_os_cache: 'OS-2026-0013', categoria: 'Alimentação', descricao: 'Refeições da equipe (12 dias)', valor: 2950, data: daysFromNow(-2), url_comprovante: '', _criadoEm: null },
  { id: 'G005', id_os: 'OS001', numero_os_cache: 'OS-2026-0014', categoria: 'Outros', descricao: 'Locações de máquinas de corte', valor: 4800, data: daysFromNow(-1), url_comprovante: '', _criadoEm: null },
  { id: 'G006', id_os: 'OS003', numero_os_cache: 'OS-2026-0012', categoria: 'Material', descricao: 'Tubos e conexões de aço', valor: 21400, data: daysFromNow(-15), url_comprovante: '', _criadoEm: null },
]

/** Equipamentos fictícios. */
const EQUIPAMENTOS = [
  { id: 'EQ001', codigo_patrimonio: 'PAT-0001', nome: 'Guindaste Hidráulico 25t', marca_modelo: 'Tadano GR-250N', status: 'EM_USO', data_proxima_calibracao: daysFromNow(10), status_calibracao: 'PROXIMO_VENCIMENTO', _criadoEm: null },
  { id: 'EQ002', codigo_patrimonio: 'PAT-0002', nome: 'Máquina de Solda MIG 450A', marca_modelo: 'Miller Deltaweld', status: 'DISPONIVEL', data_proxima_calibracao: daysFromNow(120), status_calibracao: 'VALIDO', _criadoEm: null },
  { id: 'EQ003', codigo_patrimonio: 'PAT-0003', nome: 'Plataforma Elevatória 20m', marca_modelo: 'Genie S-65', status: 'EM_USO', data_proxima_calibracao: daysFromNow(-8), status_calibracao: 'VENCIDO', _criadoEm: null },
  { id: 'EQ004', codigo_patrimonio: 'PAT-0004', nome: 'Compressor de Ar 500 L', marca_modelo: 'Schulz MSV 20', status: 'EM_USO', data_proxima_calibracao: daysFromNow(60), status_calibracao: 'VALIDO', _criadoEm: null },
]

/**
 * Retorna o dataset completo de demonstração no mesmo formato
 * produzido pelos "snapshots" do Firestore (useDashboardData).
 */
export async function fetchMockDashboardData() {
  return {
    funcionarios: FUNCIONARIOS,
    clientes: CLIENTES,
    orcamentos_os: ORCAMENTOS_OS,
    gastos: GASTOS,
    equipamentos: EQUIPAMENTOS,
  }
}