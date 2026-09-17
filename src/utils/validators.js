// ------------------------------------------------------------------
// src/utils/validators.js
// ------------------------------------------------------------------
// Validações de formulário (CPF com algoritmo real de dígitos
// verificadores, e-mail, datas) + conversores de data BR <-> ISO.
// ------------------------------------------------------------------
import { onlyDigits } from './masks'

/** Expressão de e-mail simples porém prática. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** @param {string} value */
export const isRequired = (value) => String(value ?? '').trim().length > 0

/** @param {string} email */
export function isValidEmail(email) {
  return EMAIL_RE.test(String(email ?? '').trim())
}

/** CPF válido (11 dígitos, não seja sequência e com dígitos verificadores corretos). */
export function isValidCpf(cpf) {
  const c = onlyDigits(cpf)
  if (c.length !== 11) return false
  if (/^(\d)\1+$/.test(c)) return false // 000.000.000-00 etc.

  // Primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(c.charAt(i), 10) * (10 - i)
  let rev = 11 - (sum % 11)
  if (rev >= 10) rev = 0
  if (rev !== parseInt(c.charAt(9), 10)) return false

  // Segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(c.charAt(i), 10) * (11 - i)
  rev = 11 - (sum % 11)
  if (rev >= 10) rev = 0
  return rev === parseInt(c.charAt(10), 10)
}

/**
 * Valida uma data digitada em formato "DD/MM/YYYY".
 * @param {string} value
 * @returns {boolean}
 */
export function isValidBrDate(value) {
  if (!value) return true // campo opcional (validação vazia passa)
  const [d, m, y] = onlyDigitsToParts(value)
  if (d === null) return false
  const date = new Date(y, m - 1, d)
  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  )
}

function onlyDigitsToParts(value) {
  const digits = onlyDigits(value).padEnd(8, '0').slice(0, 8)
  if (digits.length < 8) return [null, null, null]
  const d = parseInt(digits.slice(0, 2), 10)
  const m = parseInt(digits.slice(2, 4), 10)
  const y = parseInt(digits.slice(4, 8), 10)
  if (m < 1 || m > 12 || y < 1900 || y > 2200) return [null, null, null]
  return [d, m, y]
}

/** "DD/MM/YYYY" (ou mascarado) -> "YYYY-MM-DD". Retorna '' se inválido. */
export function brToIso(value) {
  if (!value) return ''
  const [d, m, y] = onlyDigitsToParts(value)
  if (d === null || m === null || y === null) return ''
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/** "YYYY-MM-DD" -> "DD/MM/YYYY". Retorna '' se vazio. */
export function isoToBr(value) {
  if (!value) return ''
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return ''
  return `${match[3]}/${match[2]}/${match[1]}`
}