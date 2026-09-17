// ------------------------------------------------------------------
// src/services/modelosService.js
// ------------------------------------------------------------------
// Catálogo de modelos de documento (DOCX preenchíveis via docxtemplater).
//
// Os arquivos .docx ficam em src/assets/modelos/*.docx (gerados pelo
// script scripts/generate-modelos.js). Cada modelo declara os campos a
// preencher ({nome}, {cargo}, ...) — o app gera o documento preenchido.
//
// Para adicionar um modelo: coloque o .docx em src/assets/modelos/ e
// cadastre-o abaixo com a lista de campos.
// ------------------------------------------------------------------

const urls = import.meta.glob('/src/assets/modelos/*.docx', {
  query: 'url',
  import: 'default',
  eager: true,
})

/** Catálogo de modelos disponíveis para geração. */
export const MODELOS = [
  {
    id: 'aso',
    titulo: 'Atestado de Saúde Ocupacional',
    descricao: 'ASO admissional, periódico ou de retorno ao trabalho.',
    tipo: 'ASO',
    campos: [
      { chave: 'nome', label: 'Nome completo', tipo: 'texto' },
      { chave: 'cpf', label: 'CPF', tipo: 'texto' },
      { chave: 'cargo', label: 'Cargo', tipo: 'texto' },
      { chave: 'setor', label: 'Setor', tipo: 'texto' },
      { chave: 'dataAdm', label: 'Data de admissão', tipo: 'data' },
      { chave: 'tipoExame', label: 'Tipo de exame', tipo: 'texto' },
      { chave: 'dataExame', label: 'Data do exame', tipo: 'data' },
      { chave: 'apto', label: 'Resultado (Apto/Inapto)', tipo: 'texto' },
      { chave: 'observacoes', label: 'Observações', tipo: 'texto' },
      { chave: 'medico', label: 'Médico do trabalho', tipo: 'texto' },
      { chave: 'crm', label: 'CRM', tipo: 'texto' },
    ],
  },
  {
    id: 'declaracao',
    titulo: 'Declaração',
    descricao: 'Declaração simples para fins diversos.',
    tipo: 'Outro',
    campos: [
      { chave: 'nome', label: 'Nome completo', tipo: 'texto' },
      { chave: 'cpf', label: 'CPF', tipo: 'texto' },
      { chave: 'cargo', label: 'Cargo', tipo: 'texto' },
      { chave: 'motivo', label: 'Motivo / finalidade', tipo: 'texto' },
      { chave: 'cidade', label: 'Cidade', tipo: 'texto' },
      { chave: 'uf', label: 'UF', tipo: 'texto' },
      { chave: 'data', label: 'Data', tipo: 'data' },
      { chave: 'assinatura', label: 'Assinatura do responsável', tipo: 'texto' },
    ],
  },
]

/** URL do arquivo .docx de um modelo pelo id. */
export function getModeloUrl(id) {
  const entry = urls[`/src/assets/modelos/${id}.docx`] ?? ''
  return entry
}

/** Nome de arquivo sugerido para um modelo preenchido. */
export function modeloFileName(modelo, nome = '') {
  const limpo = String(nome ?? '').trim().toLowerCase().replace(/\s+/g, '-')
  return `${modelo.id}${limpo ? `-${limpo}` : ''}.docx`
}