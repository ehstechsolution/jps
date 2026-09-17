// ------------------------------------------------------------------
// src/utils/sst.js
// ------------------------------------------------------------------
// Lógica de negócio de Segurança do Trabalho (SST):
// cálculo do status de validade dos documentos e alertas.
// ------------------------------------------------------------------
import { normalizeDate } from './format'

/** Quantidade de dias para considerar um documento como "próximo do vencimento". */
export const ALERTA_DIAS = 30

/**
 * Calcula o status de validade de um documento SST com base na data de
 * validade em relação a hoje.
 *
 * @param {unknown} dataValidade  Data de validade do documento.
 * @param {Date} [hoje]           Data de referência (padrão: hoje).
 * @returns {"VALIDO" | "PROXIMO_VENCIMENTO" | "VENCIDO"}
 */
export function getDocumentStatus(dataValidade, hoje = new Date()) {
  const validade = normalizeDate(dataValidade)
  if (!validade) return 'VALIDO'

  const diffDias = diffInDays(validade, hoje)
  if (diffDias < 0) return 'VENCIDO'
  if (diffDias <= ALERTA_DIAS) return 'PROXIMO_VENCIMENTO'
  return 'VALIDO'
}

/**
 * Retorna a quantidade de dias até o vencimento (negativo se já venceu).
 * @param {unknown} dataValidade
 * @param {Date} [hoje]
 */
export function diffInDays(dataValidade, hoje = new Date()) {
  const validade = normalizeDate(dataValidade)
  if (!validade) return null
  // Normaliza para meia-noite para evitar imprecisões de horário.
  const base = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  const alvo = new Date(validade.getFullYear(), validade.getMonth(), validade.getDate())
  return Math.round((alvo - base) / (1000 * 60 * 60 * 24))
}

/**
 * Indica se o documento está vencer em menos de `ALERTA_DIAS` dias
 * ou já venceu (alerta crítico).
 * @param {unknown} dataValidade
 * @param {Date} [hoje]
 */
export function isCriticalDocument(dataValidade, hoje = new Date()) {
  const status = getDocumentStatus(dataValidade, hoje)
  return status === 'VENCIDO' || status === 'PROXIMO_VENCIMENTO'
}

/**
 * Rótulo legível para exibição do status.
 * @param {string} status
 * @returns {string}
 */
export function statusLabel(status) {
  const labels = {
    // Status de documento SST (novo schema manual)
    VIGENTE: 'Vigente',
    VENCIDO: 'Vencido',
    ARQUIVADO: 'Arquivado',
    EM_ANALISE: 'Em análise',
    // Grupo de validade (legado / cálculo automático)
    VALIDO: 'Válido',
    PROXIMO_VENCIMENTO: 'Próximo vencimento',
    PENDENTE: 'Pendente',
    APROVADO: 'Aprovado',
    EM_ANDAMENTO: 'Em andamento',
    CONCLUIDO: 'Concluído',
    CANCELADO: 'Cancelado',
    ATIVO: 'Ativo',
    INATIVO: 'Inativo',
    // Novos status do cadastro de funcionários
    Ativo: 'Ativo',
    Afastado: 'Afastado',
    Férias: 'Férias',
    Desligado: 'Desligado',
    DISPONIVEL: 'Disponível',
    EM_USO: 'Em uso',
    MANUTENCAO: 'Manutenção',
  }
  return labels[status] ?? status ?? '—'
}