// ------------------------------------------------------------------
// src/utils/masks.js
// ------------------------------------------------------------------
// Máscaras de entrada de dados (CPF, telefone, datas, CEP, PIS).
// ------------------------------------------------------------------

/** Remove tudo que não for dígito. */
export function onlyDigits(value = '') {
  return String(value).replace(/\D/g, '')
}

/** CPF -> "xxx.xxx.xxx-xx" (progride enquanto digita). */
export function maskCPF(value = '') {
  const d = onlyDigits(value).slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

/** Telefone/WhatsApp -> "(xx) xxxxx-xxxx" ou "(xx) xxxx-xxxx". */
export function maskPhone(value = '') {
  const d = onlyDigits(value).slice(0, 11)
  if (d.length === 0) return ''
  let out = `(${d.slice(0, 2)}`
  if (d.length >= 2) out += ') '
  if (d.length <= 6) {
    out += d.slice(2)
  } else if (d.length <= 10) {
    out += `${d.slice(2, 6)}-${d.slice(6)}`
  } else {
    out += `${d.slice(2, 7)}-${d.slice(7)}`
  }
  return out.trim()
}

/** Data de entrada -> "DD/MM/YYYY" (progride enquanto digita). */
export function maskDate(value = '') {
  const d = onlyDigits(value).slice(0, 8)
  let out = d
  if (d.length > 4) out = `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
  else if (d.length > 2) out = `${d.slice(0, 2)}/${d.slice(2)}`
  return out
}

/** CEP -> "xxxxx-xxx". */
export function maskCEP(value = '') {
  const d = onlyDigits(value).slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

/** PIS/PASEP -> "xxx.xxxxx.xx-x". */
export function maskPIS(value = '') {
  const d = onlyDigits(value).slice(0, 11)
  let out = d
  if (d.length > 3) out = `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length > 8) out = `${d.slice(0, 3)}.${d.slice(3, 8)}.${d.slice(8)}`
  if (d.length > 10) out = `${d.slice(0, 3)}.${d.slice(3, 8)}.${d.slice(8, 10)}-${d.slice(10)}`
  return out
}