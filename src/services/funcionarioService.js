// ------------------------------------------------------------------
// src/services/funcionarioService.js
// ------------------------------------------------------------------
// CRUD de funcionários (coleção "funcionarios") no Firestore.
//
// SCHEMA DO DOCUMENTO (formato salvo no banco):
//   { id, uid?, nome*, email, foto,
//     // Dados pessoais
//     dataNascimento: "YYYY-MM-DD", cpf, rg, whatsapp,
//     endereco: { cep, logradouro, numero, complemento, bairro, cidade, uf },
//     escolaridade*,
//     // Dados profissionais
//     cargo*, setor*, dataAdm: "YYYY-MM-DD", nivelAcesso, status*, pis,
//     _criadoEm, _atualizadoEm }
//   (* obrigatório; datas salvas em ISO, exibidas DD/MM/YYYY)
// ------------------------------------------------------------------
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '@/config/firebase'
import { COLLECTIONS } from '@/services/firestore'

/**
 * Serializa o formulário (formato de tela) para o payload do Firestore,
 * garantindo campos consistentes e datas em ISO.
 * @param {object} form  Estado do formulário do FuncionarioForm
 * @returns {object}
 */
export function serializeFuncionario(form) {
  return {
    nome: (form.nome ?? '').trim(),
    email: (form.email ?? '').trim().toLowerCase(),
    foto: form.foto ?? '',
    // Dados pessoais
    dataNascimento: form.dataNascimento || '', // já ISO (YYYY-MM-DD)
    cpf: form.cpf ?? '',
    rg: (form.rg ?? '').trim(),
    whatsapp: form.whatsapp ?? '',
    endereco: {
      cep: form.endereco?.cep ?? '',
      logradouro: form.endereco?.logradouro ?? '',
      numero: form.endereco?.numero ?? '',
      complemento: form.endereco?.complemento ?? '',
      bairro: form.endereco?.bairro ?? '',
      cidade: form.endereco?.cidade ?? '',
      uf: form.endereco?.uf ?? '',
    },
    escolaridade: form.escolaridade ?? '',
    // Dados profissionais
    cargo: (form.cargo ?? '').trim(),
    setor: form.setor ?? 'Operacional',
    dataAdm: form.dataAdm || '',
    nivelAcesso: form.nivelAcesso ?? 'Externo',
    status: form.status ?? 'Ativo',
    pis: (form.pis ?? '').trim(),
  }
}

/**
 * Cria um novo funcionário.
 * @param {object} data  Payload (formato de formulário)
 * @param {string} [uid] UID do usuário logado (quando existir conta de Auth)
 * @returns {Promise<string>} id do documento criado
 */
export async function createFuncionario(data, uid) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase não configurado.')
  }
  const payload = serializeFuncionario(data)
  const ref = await addDoc(collection(db, COLLECTIONS.FUNCIONARIOS), {
    ...payload,
    ...(uid ? { uid } : {}),
    _criadoEm: serverTimestamp(),
    _atualizadoEm: serverTimestamp(),
  })
  return ref.id
}

/**
 * Atualiza um funcionário existente.
 * @param {string} id
 * @param {object} data  Payload (formato de formulário)
 * @returns {Promise<void>}
 */
export async function updateFuncionario(id, data) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase não configurado.')
  }
  const payload = serializeFuncionario(data)
  await updateDoc(doc(db, COLLECTIONS.FUNCIONARIOS, id), {
    ...payload,
    _atualizadoEm: serverTimestamp(),
  })
}

/**
 * Alterna apenas o status de um funcionário (ex.: reativar / desligar)
 * sem precisar abrir o formulário completo.
 * @param {string} id
 * @param {string} novoStatus
 * @returns {Promise<void>}
 */
export async function setFuncionarioStatus(id, novoStatus) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase não configurado.')
  }
  await updateDoc(doc(db, COLLECTIONS.FUNCIONARIOS, id), {
    status: novoStatus,
    _atualizadoEm: serverTimestamp(),
  })
}

/**
 * Busca o funcionário vinculado a um e-mail (usado no login para
 * descobrir setor/nível de acesso).
 * @param {string} email
 * @returns {Promise<object|null>} documento do funcionário ou null
 */
export async function getFuncionarioByEmail(email) {
  if (!isFirebaseConfigured || !db) return null
  const q = query(
    collection(db, COLLECTIONS.FUNCIONARIOS),
    where('email', '==', (email ?? '').trim().toLowerCase())
  )
  const snap = await getDocs(q)
  const first = snap.docs[0]
  return first ? { id: first.id, ...first.data() } : null
}