// ------------------------------------------------------------------
// src/services/documentoService.js
// ------------------------------------------------------------------
// CRUD de documentos SST (coleção plana "documentos").
//
// SCHEMA DO DOCUMENTO (formato salvo no banco):
//   { id, idDocumento: <id>, idFuncionarioTitular*,
//     nomeFuncionarioTitular, emailTitular,
//     tipoDocumento*, descricao, arquivoUrl, arquivoNome,
//     dataEmissao: "YYYY-MM-DD",
//     dataValidade: "YYYY-MM-DD" | "" (sem validade),
//     observacao, status*, resultado (opcional, docs de ASO),
//     criadoPor, _criadoEm, _atualizadoEm }
//   (* obrigatórios)
// ------------------------------------------------------------------
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '@/config/firebase'
import { COLLECTIONS } from '@/services/firestore'
import { notifyDocumentEvent } from '@/services/webhookService'

/**
 * Serializa o formulário para o payload do Firestore,
 * garantindo campos consistentes e datas em ISO.
 * @param {object} form  Estado do formulário (DocumentoForm / tela dedicada)
 * @returns {object}
 */
export function serializeDocumento(form) {
  return {
    idFuncionarioTitular: form.funcionarioId ?? '',
    nomeFuncionarioTitular: (form.nomeFuncionarioTitular ?? '').trim(),
    emailTitular: (form.emailTitular ?? '').trim(),
    tipoDocumento: (form.tipoDocumento ?? '').trim(),
    descricao: (form.descricao ?? '').trim(),
    arquivoUrl: form.arquivoUrl ?? '',
    arquivoNome: (form.arquivoNome ?? '').trim(),
    // Datas já chegam em ISO (YYYY-MM-DD) ou vazias (sem validade)
    dataEmissao: form.dataEmissao || '',
    dataValidade: form.semValidade ? '' : (form.dataValidade || ''),
    observacao: (form.observacao ?? '').trim(),
    status: (form.status ?? '').trim(),
    resultado: (form.resultado ?? '').trim(),
  }
}

/**
 * Cria um novo documento na coleção plana "documentos".
 * O idDocumento é gerado pelo Firestore e gravado na própria escrita,
 * ficando igual ao id do registro.
 * @param {string} funcionarioId  Id do funcionário titular
 * @param {object} data           Payload (formato de formulário)
 * @returns {Promise<string>} id do documento criado
 */
export async function createDocumento(funcionarioId, data) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase não configurado.')
  }
  if (!funcionarioId) {
    throw new Error('Selecione o funcionário.')
  }
  const refDoc = doc(collection(db, COLLECTIONS.DOCUMENTOS))
  const payload = {
    ...serializeDocumento(data),
    idDocumento: refDoc.id,
    criadoPor: (data.criadoPor ?? '').trim() || null,
    _criadoEm: serverTimestamp(),
    _atualizadoEm: serverTimestamp(),
  }
  await setDoc(refDoc, payload)
  // Notifica o webhook externo (fire-and-forget)
  notifyDocumentEvent('criado', funcionarioId, { id: refDoc.id, ...payload })
  return refDoc.id
}

/**
 * Atualiza um documento existente na coleção plana "documentos".
 * @param {string} funcionarioId  Titular (mantém o vínculo em dia)
 * @param {string} docId
 * @param {object} data  Payload (formato de formulário)
 * @returns {Promise<void>}
 */
export async function updateDocumento(funcionarioId, docId, data) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase não configurado.')
  }
  const refDoc = doc(db, COLLECTIONS.DOCUMENTOS, docId)
  // Registro atual completo, para o webhook enviar todos os dados.
  let registroAtual = {}
  try {
    const snap = await getDoc(refDoc)
    if (snap.exists()) registroAtual = snap.data() ?? {}
  } catch {
    /* segue com os dados do formulário caso a leitura falhe */
  }
  const payload = {
    ...serializeDocumento(data),
    _atualizadoEm: serverTimestamp(),
  }
  await updateDoc(refDoc, payload)
  // Notifica o webhook externo (fire-and-forget) com o registro completo
  notifyDocumentEvent('atualizado', funcionarioId, { id: docId, ...registroAtual, ...serializeDocumento(data) })
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
  await deleteDoc(doc(db, COLLECTIONS.DOCUMENTOS, docId))
  // Notifica o webhook externo (fire-and-forget)
  notifyDocumentEvent('excluido', funcionarioId, documento)
}