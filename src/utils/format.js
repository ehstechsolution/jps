// ------------------------------------------------------------------
// src/utils/format.js
// ------------------------------------------------------------------
// Funções utilitárias de formatação (pt-BR) usadas na interface.
// ------------------------------------------------------------------

/**
 * Formata um número como moeda brasileira (BRL).
 * @param {number|string} value
 * @returns {string}
 */
export function formatCurrency(value) {
  const number = typeof value === 'string' ? parseFloat(value) : value
  if (number === null || number === undefined || isNaN(number)) {
    return 'R$ 0,00'
  }
  return number.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

/**
 * Formata uma data por extenso (ex.: "12/03/2026").
 * Aceita Date, string ISO ou Firestore Timestamp.
 * @param {unknown} value
 * @returns {string}
 */
export function formatDate(value) {
  if (!value) return '—'
  const date = normalizeDate(value)
  if (!date) return '—'
  return date.toLocaleDateString('pt-BR')
}

/**
 * Formata data + hora para listagens que precisam de maior precisão.
 * @param {unknown} value
 */
export function formatDateTime(value) {
  const date = normalizeDate(value)
  if (!date) return '—'
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Converte qualquer entrada aceitável em um objeto Date (ou null).
 * @param {unknown} value
 * @returns {Date|null}
 */
export function normalizeDate(value) {
  if (!value) return null
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    const d = value.toDate()
    return isNaN(d.getTime()) ? null : d
  }
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}