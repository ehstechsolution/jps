// ------------------------------------------------------------------
// src/services/firestore.js
// ------------------------------------------------------------------
// Camada de serviços de acesso ao Firestore da JPS Steel.
//
// ESTRUTURA DAS COLEÇÕES
// ----------------------
// 1) funcionarios
//    { id, nome, cpf, cargo, email, telefone, status: "ATIVO"|"INATIVO",
//      data_admissao }
//    Subcoleção: funcionarios/{id}/documentos_sst
//      { id, tipo: "ASO"|"NR-10"|"NR-35"|"NR-33", data_emissao, data_validade,
//        status_validade: "VALIDO"|"PROXIMO_VENCIMENTO"|"VENCIDO", url_arquivo }
//
// 2) clientes
//    { id, razao_social, nome_fantasia, cnpj, contato_principal, email,
//      telefone, cidade }
//
// 3) orcamentos_e_os
//    { id, numero_os, id_cliente, cliente_nome_cache, descricao_servico,
//      tipo: "ORCAMENTO"|"ORDEM_SERVICO",
//      status: "PENDENTE"|"APROVADO"|"EM_ANDAMENTO"|"CONCLUIDO"|"CANCELADO",
//      data_emissao, equipe_alocada: [id_funcionario],
//      equipamentos_alocados: [id_equipamento], valor_orcado,
//      custo_total_gastos, lucro_bruto }
//
// 4) gastos
//    { id, id_os, numero_os_cache, categoria: "Material"|"Combustível"|
//      "Alimentação"|"Outros", descricao, valor, data, url_comprovante }
//
// 5) equipamentos
//    { id, codigo_patrimonio, nome, marca_modelo,
//      status: "DISPONIVEL"|"EM_USO"|"MANUTENCAO",
//      data_proxima_calibracao, status_calibracao }
// ------------------------------------------------------------------
import {
  collection,
  onSnapshot,
  getDocs,
} from 'firebase/firestore'
import { db, isFirebaseConfigured, toDate } from '@/config/firebase'

/** Nomes canônicos das coleções do sistema. */
export const COLLECTIONS = {
  FUNCIONARIOS: 'funcionarios',
  DOCUMENTOS_SST: 'documentos_sst', // subcoleção de funcionarios
  CLIENTES: 'clientes',
  ORCAMENTOS_OS: 'orcamentos_e_os',
  GASTOS: 'gastos',
  EQUIPAMENTOS: 'equipamentos',
  // Configurações globais (documentos: config/funcionarios, config/empresa)
  CONFIG: 'config',
}

/** Documentos da coleção "config". */
export const CONFIG_DOCS = {
  FUNCIONARIOS: 'funcionarios', // { escolaridade[], cargo[], status[] }
  EMPRESA: 'empresa', // { nome, logo, ... }
  DOCUMENTOS: 'documentos', // { tipos[] }
}

/** Enum de status utilizados pela interface (mantidos em português). */
export const STATUS = {
  // Funcionário
  ATIVO: 'ATIVO',
  INATIVO: 'INATIVO',
  // OS / Orçamento
  PENDENTE: 'PENDENTE',
  APROVADO: 'APROVADO',
  EM_ANDAMENTO: 'EM_ANDAMENTO',
  CONCLUIDO: 'CONCLUIDO',
  CANCELADO: 'CANCELADO',
  // Documento SST
  DOC_VALIDO: 'VALIDO',
  DOC_PROXIMO: 'PROXIMO_VENCIMENTO',
  DOC_VENCIDO: 'VENCIDO',
  // Equipamento
  EQUIP_DISPONIVEL: 'DISPONIVEL',
  EQUIP_EM_USO: 'EM_USO',
  EQUIP_MANUTENCAO: 'MANUTENCAO',
}

/**
 * Abre uma "escuta" em tempo real de uma coleção do Firestore,
 * chamando a função de sucesso a cada mudança de dados.
 *
 * @param {string} path       Caminho da coleção (ex.: "funcionarios")
 * @param {(docs: Array) => void} onSuccess
 * @param {(error: Error) => void} onError
 * @returns {() => void}      Função para cancelar a escuta
 */
export function subscribeCollection(path, onSuccess, onError) {
  // Se o Firebase não está configurado, não há o que escutar;
  // a camada de mock assume o papel.
  if (!isFirebaseConfigured || !db) return () => {}

  const ref = collection(db, path)

  const unsubscribe = onSnapshot(
    ref,
    (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        _criadoEm: doc.data()._criadoEm ?? null,
        ...doc.data(),
      }))
      onSuccess(docs)
    },
    (error) => {
      console.error(`[firestore] Erro ao escutar "${path}":`, error)
      onError?.(error)
    }
  )
  return unsubscribe
}

/**
 * Escuta em tempo real uma subcoleção de um documento pai
 * (ex.: funcionarios/{id}/documentos_sst).
 *
 * @param {string} parentPath  Caminho do documento pai (ex.: "funcionarios/F001")
 * @param {string} subName     Nome da subcoleção
 * @param {(docs: Array) => void} onSuccess
 * @param {(error: Error) => void} [onError]
 * @returns {() => void}       Função para cancelar a escuta
 */
export function subscribeSubcollection(parentPath, subName, onSuccess, onError) {
  if (!isFirebaseConfigured || !db) return () => {}

  const ref = collection(db, parentPath, subName)

  const unsubscribe = onSnapshot(
    ref,
    (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        _criadoEm: doc.data()._criadoEm ?? null,
        ...doc.data(),
      }))
      onSuccess(docs)
    },
    (error) => {
      console.error(`[firestore] Erro ao escutar "${parentPath}/${subName}":`, error)
      onError?.(error)
    }
  )
  return unsubscribe
}

/**
 * Busca uma subcoleção (ex.: documentos_sst de todos os funcionários)
 * em paralelo, retornando cada documento enriquecido com o id do pai.
 *
 * @param {string} parentPath   Caminho da coleção pai
 * @param {string} subName      Nome da subcoleção
 * @returns {Promise<Array>}
 */
export async function fetchSubcollection(parentPath, subName) {
  if (!isFirebaseConfigured || !db) return []

  const parents = await getDocs(collection(db, parentPath))
  const results = await Promise.all(
    parents.docs.map(async (parentDoc) => {
      const sub = await getDocs(collection(db, parentDoc.ref, subName))
      return sub.docs.map((doc) => ({
        id: doc.id,
        parentId: parentDoc.id,
        ...doc.data(),
      }))
    })
  )
  return results.flat()
}

export { toDate }