// ------------------------------------------------------------------
// scripts/generate-modelos.js
// ------------------------------------------------------------------
// Gera os arquivos .docx de exemplo usados pela galeria de modelos
// (src/assets/modelos/*.docx). Os campos preenchíveis são marcados com
// {nome}, {cargo}, etc. — o app os lê/gera com docxtemplater.
//
// Uso:  node scripts/generate-modelos.js
// Reexecutar aqui gera novamente os arquivos do repositório.
// ------------------------------------------------------------------
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import JSZip from 'jszip'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, '..', 'src', 'assets', 'modelos')

/**
 * Monta um parágrafo <w:p> dividindo texto e {placeholders} em runs
 * separados — formato amigável para o docxtemplater.
 */
function paragraph(text, opts = {}) {
  const { bold = false, underline = false, align = 'left', spacing = '150' } = opts
  const parts = String(text).split(/(\{[^}]+\})/g)
  const runs = parts
    .filter((p) => p !== '')
    .map((p) => {
      const isPlaceholder = /^\{[^}]+\}$/.test(p)
      return (
        `<w:r>` +
        `<w:rPr>` +
        (bold ? `<w:b/>` : '') +
        (underline ? `<w:u w:val="single"/>` : '') +
        `<w:sz w:val="24"/><w:szCs w:val="24"/>` +
        `</w:rPr>` +
        `<w:t xml:space="preserve">${escapeXml(p)}</w:t>` +
        `</w:r>`
      )
    })
    .filter(Boolean)
  const jc = { left: 'left', center: 'center', right: 'right', justify: 'both' }[align] || 'left'
  return (
    `<w:p>` +
    `<w:pPr><w:jc w:val="${jc}"/><w:spacing w:after="${spacing}"/><w:rPr><w:sz w:val="24"/></w:rPr></w:pPr>` +
    runs.join('') +
    `</w:p>`
  )
}

function escapeXml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function buildDocx(bodyParagraphs) {
  const docXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">` +
    `<w:body>` +
    bodyParagraphs.join('') +
    `<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr>` +
    `</w:body></w:document>`

  const contentTypes =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>` +
    `</Types>`

  const rels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>` +
    `</Relationships>`

  const zip = new JSZip()
  zip.file('[Content_Types].xml', contentTypes)
  zip.folder('_rels').file('.rels', rels)
  zip.folder('word').file('document.xml', docXml)
  return zip.generateAsync({ type: 'nodebuffer' })
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true })

  // ------------------------- Modelo ASO -------------------------
  const aso = [
    paragraph('ATESTADO DE SAÚDE OCUPACIONAL — ASO', { bold: true, align: 'center', spacing: '300' }),
    paragraph('Empresa: JPS Steel — Montagens Industriais', { spacing: '120' }),
    paragraph('', { spacing: '60' }),
    paragraph('Nome do empregado: {nome}', { spacing: '180' }),
    paragraph('CPF: {cpf}          Cargo: {cargo}', { spacing: '180' }),
    paragraph('Setor: {setor}          Admissão: {dataAdm}', { spacing: '180' }),
    paragraph('', { spacing: '60' }),
    paragraph('Tipo de exame: {tipoExame}', { spacing: '180' }),
    paragraph('Data do exame: {dataExame}', { spacing: '180' }),
    paragraph('', { spacing: '60' }),
    paragraph('Resultado do exame clínico ocupacional: {apto}', { spacing: '180' }),
    paragraph('Observações: {observacoes}', { spacing: '180' }),
    paragraph('', { spacing: '120' }),
    paragraph('_________________________________________', { align: 'center', spacing: '60' }),
    paragraph('Médico do Trabalho: {medico} — CRM {crm}', { align: 'center' }),
  ]
  fs.writeFileSync(path.join(OUT, 'aso.docx'), await buildDocx(aso))

  // ---------------------- Modelo Declaração ----------------------
  const decl = [
    paragraph('DECLARAÇÃO', { bold: true, align: 'center', spacing: '300' }),
    paragraph('A empresa JPS Steel — Montagens Industriais, com sede em {cidade}/{uf},', { align: 'justify', spacing: '180' }),
    paragraph('declara para os devidos fins que {nome}, portador(a) do CPF {cpf},', { align: 'justify', spacing: '180' }),
    paragraph('atuando no cargo de {cargo}, está {motivo}.', { align: 'justify', spacing: '240' }),
    paragraph('', { spacing: '60' }),
    paragraph('Esta declaração é válida para fins de comprovação junto a terceiros.', { align: 'justify', spacing: '240' }),
    paragraph('', { spacing: '120' }),
    paragraph('{cidade}/{uf}, {data}.', { spacing: '300' }),
    paragraph('_________________________________________', { align: 'center', spacing: '60' }),
    paragraph('Assinatura do responsável: {assinatura}', { align: 'center' }),
  ]
  fs.writeFileSync(path.join(OUT, 'declaracao.docx'), await buildDocx(decl))

  console.log('Modelos .docx gerados em:', OUT)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})