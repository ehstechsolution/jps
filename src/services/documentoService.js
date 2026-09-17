// ------------------------------------------------------------------
// src/services/documentoService.js
// ------------------------------------------------------------------
// CRUD de documentos SST (subcoleção "funcionarios/{id}/documentos_sst").
//
// SCHEMA DO DOCUMENTO (formato salvo no banco):
//   { id, tipo*, descricao, data_emissao: "YYYY-MM-DD",
//     data_validade: "YYYY-MM-DD" | "" (sem validade),
//     observacoes, url_arquivo, arquivo_nome,
//     _criadoEm, _atualizadoEm }
//   (* obrigatório; o status de validade é sempre calculado na tela,
//     nunca gravado — evita dados desatualizados)
// ------------------------------------------------------------------
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '@/config/firebase'
import { COLLECTIONS } from '@/services/firestore'
import { notifyDocumentEvent } from '@/services/webhookService'

/**
 * Serializa o formulário para o payload do Firestore,
 * garantindo campos consistentes e datas em ISO.
 * @param {object} form  Estado do formulário do DocumentoForm
 * @returns {object}
 */
export function serializeDocumento(form) {
  return {
    tipo: (form.tipo ?? '').trim(),
    descricao: (form.descricao ?? '').trim(),
    // Datas já chegam em ISO (YYYY-MM-DD) ou vazias (sem validade)
    data_emissao: form.data_emissao || '',
    data_validade: form.semValidade ? '' : (form.data_validade || ''),
    observacoes: (form.observacoes ?? '').trim(),
    url_arquivo: form.url_arquivo ?? '',
    arquivo_nome: (form.arquivo_nome ?? '').trim(),
  }
}

/**
 * Cria um novo documento na subcoleção do funcionário.
 * @param {string} funcionarioId
 * @param {object} data  Payload (formato de formulário)
 * @returns {Promise<string>} id do documento criado
 */
export async function createDocumento(funcionarioId, data) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase não configurado.')
  }
  const ref = await addDoc(
    collection(db, COLLECTIONS.FUNCIONARIOS, funcionarioId, COLLECTIONS.DOCUMENTOS_SST),
    {
      ...serializeDocumento(data),
      _criadoEm: serverTimestamp(),
      _atualizadoEm: serverTimestamp(),
    }
  )
  // Notifica o webhook externo (fire-and-forget)
  notifyDocumentEvent('criado', funcionarioId, { id: ref.id, ...serializeDocumento(data) })
  return ref.id
}

/**
 * Atualiza um documento existente.
 * @param {string} funcionarioId
 * @param {string} docId
 * @param {object} data  Payload (formato de formulário)
 * @returns {Promise<void>}
 */
export async function updateDocumento(funcionarioId, docId, data) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase não configurado.')
  }
  await updateDoc(
    doc(db, COLLECTIONS.FUNCIONARIOS, funcionarioId, COLLECTIONS.DOCUMENTOS_SST, docId),
    {
      ...serializeDocumento(data),
      _atualizadoEm: serverTimestamp(),
    }
  )
  // Notifica o webhook externo (fire-and-forget)
  notifyDocumentEvent('atualizado', funcionarioId, { id: docId, ...serializeDocumento(data) })
}

/**
 * Exclui um documento existente.
 * @param {string} funcionarioId
 * @param {object} documento  Registro completo (id e dados) para o webhook
 * @returns {Promise<void>}
 */
export async function deleteDocumento(funcionarioId, documento) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase não configurado.')
  }
  const docId = documento?.id
  if (!docId) throw new Error('Documento inválido.')
  await deleteDoc(doc(db, COLLECTIONS.FUNCIONARIOS, funcionarioId, COLLECTIONS.DOCUMENTOS_SST, docId))
  // Notifica o webhook externo (fire-and-forget)
  notifyDocumentEvent('excluido', funcionarioId, documento)
}