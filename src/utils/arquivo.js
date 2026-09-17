// ------------------------------------------------------------------
// src/utils/arquivo.js
// ------------------------------------------------------------------
// Classificação de arquivos de documento por extensão.
// ------------------------------------------------------------------

const EXT_PDF = /\.pdf$/i
const EXT_IMAGEM = /\.(png|jpe?g|webp|gif|bmp|tiff?)$/i
const EXT_WORD = /\.(docx?|docm)$/i

/**
 * Identifica o tipo do arquivo de um documento a partir da URL e/ou nome.
 * @param {string} [url]     URL do arquivo (ex.: arquivoUrl)
 * @param {string} [nome]    Nome do arquivo (ex.: arquivoNome)
 * @returns {'pdf'|'imagem'|'word'|'outro'}
 */
export function classificarArquivo(url, nome) {
  const alvo = `${url ?? ''} ${nome ?? ''}`
  if (EXT_PDF.test(alvo)) return 'pdf'
  if (EXT_IMAGEM.test(alvo)) return 'imagem'
  if (EXT_WORD.test(alvo)) return 'word'
  return 'outro'
}