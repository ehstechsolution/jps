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
  getDoc,
  updateDoc,
  getDocs,
  query,
  where,
  runTransaction,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '@/config/firebase'
import { COLLECTIONS } from '@/services/firestore'

const INVITES_COLLECTION = 'funcionario_invites'
const INVITE_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000

function requireFirestore() {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase não configurado.')
}

function normalizeEmail(value) {
  return String(value ?? '').trim().toLowerCase()
}

function secureCrypto() {
  if (!globalThis.crypto?.getRandomValues || !globalThis.crypto?.subtle) {
    throw new Error('Este navegador não oferece geração criptográfica segura para convites.')
  }
  return globalThis.crypto
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function bytesToBase64Url(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function hashInviteToken(token) {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    throw new Error('Convite inválido ou expirado.')
  }
  const cryptoApi = secureCrypto()
  const digest = await cryptoApi.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return bytesToHex(new Uint8Array(digest))
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

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
 * O argumento uid legado é deliberadamente ignorado: funcionários recém-
 * cadastrados não podem herdar o UID do administrador que os cadastrou.
 * @param {string} [_legacyUid]
 * @returns {Promise<string>} id do documento criado
 */
export async function createFuncionario(data, _legacyUid) {
  requireFirestore()
  const payload = serializeFuncionario(data)
  const ref = await addDoc(collection(db, COLLECTIONS.FUNCIONARIOS), {
    ...payload,
    _criadoEm: serverTimestamp(),
    _atualizadoEm: serverTimestamp(),
  })
  return ref.id
}

/**
 * Cria em uma única transação o registro sem UID e seu convite de uso único.
 * O identificador do convite é SHA-256(token); o token bruto nunca é gravado.
 * @param {object} data dados do funcionário
 * @returns {Promise<{funcionarioId:string,email:string,nome:string,inviteToken:string,expiresAt:string}>}
 */
export async function createFuncionarioInvite(data) {
  requireFirestore()
  const payload = serializeFuncionario(data)
  const email = normalizeEmail(payload.email)
  const nome = payload.nome.trim()
  if (!nome) throw new Error('Informe o nome do funcionário.')
  if (!validEmail(email)) throw new Error('Informe um e-mail válido para o convite.')

  const cryptoApi = secureCrypto()
  const randomBytes = new Uint8Array(32)
  cryptoApi.getRandomValues(randomBytes)
  const inviteToken = bytesToBase64Url(randomBytes)
  const inviteId = await hashInviteToken(inviteToken)
  const funcionarioRef = doc(collection(db, COLLECTIONS.FUNCIONARIOS))
  const inviteRef = doc(db, INVITES_COLLECTION, inviteId)
  const expiresAtDate = new Date(Date.now() + INVITE_LIFETIME_MS)

  await runTransaction(db, async (transaction) => {
    transaction.set(funcionarioRef, {
      ...payload,
      email,
      inviteId,
      _criadoEm: serverTimestamp(),
      _atualizadoEm: serverTimestamp(),
    })
    transaction.set(inviteRef, {
      email,
      funcionarioId: funcionarioRef.id,
      expiresAt: Timestamp.fromDate(expiresAtDate),
      status: 'pending',
    })
  })

  return {
    funcionarioId: funcionarioRef.id,
    email,
    nome,
    inviteToken,
    expiresAt: expiresAtDate.toISOString(),
  }
}

/**
 * Gera um novo token para funcionário ainda não associado e revoga o convite
 * pendente atualmente referenciado, sem criar outro registro de funcionário.
 * @param {string} funcionarioId
 * @returns {Promise<{funcionarioId:string,email:string,nome:string,inviteToken:string,expiresAt:string}>}
 */
export async function renewFuncionarioInvite(funcionarioId) {
  requireFirestore()
  if (!funcionarioId) throw new Error('Funcionário inválido.')

  const cryptoApi = secureCrypto()
  const randomBytes = new Uint8Array(32)
  cryptoApi.getRandomValues(randomBytes)
  const inviteToken = bytesToBase64Url(randomBytes)
  const inviteId = await hashInviteToken(inviteToken)
  const funcionarioRef = doc(db, COLLECTIONS.FUNCIONARIOS, funcionarioId)
  const inviteRef = doc(db, INVITES_COLLECTION, inviteId)
  const expiresAtDate = new Date(Date.now() + INVITE_LIFETIME_MS)

  const result = await runTransaction(db, async (transaction) => {
    const funcionarioSnapshot = await transaction.get(funcionarioRef)
    if (!funcionarioSnapshot.exists()) throw new Error('Funcionário não encontrado.')
    const funcionario = funcionarioSnapshot.data()
    if (funcionario.uid) {
      throw new Error('Este funcionário já possui uma conta associada.')
    }

    const email = normalizeEmail(funcionario.email)
    const nome = String(funcionario.nome ?? '').trim()
    if (!validEmail(email)) throw new Error('O funcionário não possui um e-mail válido.')
    if (!nome) throw new Error('O funcionário não possui um nome válido.')

    const oldInviteId = funcionario.inviteId
    let oldInviteSnapshot = null
    if (oldInviteId) {
      oldInviteSnapshot = await transaction.get(
        doc(db, INVITES_COLLECTION, oldInviteId)
      )
    }
    const collisionSnapshot = await transaction.get(inviteRef)
    if (collisionSnapshot.exists()) {
      throw new Error('Não foi possível gerar um token exclusivo. Tente novamente.')
    }

    if (oldInviteSnapshot?.exists()) {
      const oldInvite = oldInviteSnapshot.data()
      if (oldInvite.funcionarioId !== funcionarioId || oldInvite.email !== email) {
        throw new Error('O convite existente não corresponde a este funcionário.')
      }
      if (oldInvite.status === 'consumed') {
        throw new Error('Este convite já foi consumido; não é possível renová-lo.')
      }
      if (oldInvite.status === 'pending') {
        transaction.update(oldInviteSnapshot.ref, { status: 'revoked' })
      }
    }

    transaction.update(funcionarioRef, {
      inviteId,
      _atualizadoEm: serverTimestamp(),
    })
    transaction.set(inviteRef, {
      email,
      funcionarioId,
      expiresAt: Timestamp.fromDate(expiresAtDate),
      status: 'pending',
    })
    return { funcionarioId, email, nome }
  })

  return { ...result, inviteToken, expiresAt: expiresAtDate.toISOString() }
}

/**
 * Obtém somente os dados mínimos para confirmar o convite no fluxo de cadastro.
 * A leitura do documento exige o ID (hash) derivado do token; a regra nega listagem.
 * @param {string} token token bruto vindo do link
 * @returns {Promise<{email:string,expiresAt:string,valid:true}>}
 */
export async function getFuncionarioInvite(token) {
  requireFirestore()
  const inviteId = await hashInviteToken(token)
  const snapshot = await getDoc(doc(db, INVITES_COLLECTION, inviteId))
  if (!snapshot.exists()) throw new Error('Convite inválido ou expirado.')

  const invite = snapshot.data()
  const expiresAt = invite.expiresAt?.toDate?.()
  if (
    invite.status !== 'pending' ||
    !expiresAt ||
    expiresAt.getTime() <= Date.now() ||
    !validEmail(invite.email)
  ) {
    throw new Error('Convite inválido ou expirado.')
  }
  return { email: invite.email, expiresAt: expiresAt.toISOString(), valid: true }
}

/**
 * Confirma validade e correspondência de e-mail do convite.
 * @param {string} token
 * @param {string} email
 * @returns {Promise<{email:string,expiresAt:string,valid:true}>}
 */
export async function validateFuncionarioInvite(token, email) {
  const invite = await getFuncionarioInvite(token)
  if (invite.email !== normalizeEmail(email)) {
    throw new Error('O e-mail informado não corresponde ao convite.')
  }
  return invite
}

/**
 * Consome o convite e associa o UID ao funcionário existente atomicamente.
 * Rejeita replay, expiração, e-mail divergente ou registro já associado.
 * @param {string} token
 * @param {{uid:string,email:string}} authUser usuário retornado pelo Firebase Auth
 * @returns {Promise<{funcionarioId:string,email:string}>}
 */
export async function claimFuncionarioInvite(token, authUser) {
  requireFirestore()
  if (!authUser?.uid || !authUser?.email) throw new Error('Usuário autenticado inválido.')

  const inviteId = await hashInviteToken(token)
  const authEmail = normalizeEmail(authUser.email)
  const inviteRef = doc(db, INVITES_COLLECTION, inviteId)

  return runTransaction(db, async (transaction) => {
    const inviteSnapshot = await transaction.get(inviteRef)
    if (!inviteSnapshot.exists()) throw new Error('Convite inválido ou expirado.')
    const invite = inviteSnapshot.data()
    const expiresAt = invite.expiresAt?.toDate?.()
    if (
      invite.status !== 'pending' ||
      !expiresAt ||
      expiresAt.getTime() <= Date.now() ||
      invite.email !== authEmail
    ) {
      throw new Error('Convite inválido, expirado ou associado a outro e-mail.')
    }

    const funcionarioRef = doc(db, COLLECTIONS.FUNCIONARIOS, invite.funcionarioId)
    const funcionarioSnapshot = await transaction.get(funcionarioRef)
    if (!funcionarioSnapshot.exists()) throw new Error('O registro do funcionário do convite não existe.')
    const funcionario = funcionarioSnapshot.data()
    if (
      funcionario.uid ||
      funcionario.email !== authEmail ||
      funcionario.inviteId !== inviteId
    ) {
      throw new Error('Este convite já foi utilizado ou não corresponde ao e-mail autenticado.')
    }

    transaction.update(funcionarioRef, { uid: authUser.uid })
    transaction.update(inviteRef, { status: 'consumed' })
    return { funcionarioId: invite.funcionarioId, email: invite.email }
  })
}

/**
 * Atualiza um funcionário existente.
 * @param {string} id
 * @param {object} data  Payload (formato de formulário)
 * @returns {Promise<void>}
 */
export async function updateFuncionario(id, data) {
  requireFirestore()
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
  requireFirestore()
  await updateDoc(doc(db, COLLECTIONS.FUNCIONARIOS, id), {
    status: novoStatus,
    _atualizadoEm: serverTimestamp(),
  })
}

/**
 * Busca o funcionário associado ao UID autenticado; compatível com regras
 * que negam consultas/listagens públicas por e-mail. Não escolhe um registro
 * arbitrário: UIDs duplicados legados exigem revisão e desvinculação manual.
 * @param {string} uid
 * @returns {Promise<object|null>} documento do funcionário ou null
 */
export async function getFuncionarioByUid(uid) {
  if (!isFirebaseConfigured || !db || !uid) return null
  const q = query(
    collection(db, COLLECTIONS.FUNCIONARIOS),
    where('uid', '==', uid)
  )
  const snap = await getDocs(q)
  if (snap.docs.length > 1) {
    const error = new Error(
      'Perfil ambíguo: há mais de um funcionário associado a este UID. Solicite revisão e desvinculação manual dos registros legados.'
    )
    error.code = 'profile/ambiguous'
    throw error
  }
  const first = snap.docs[0]
  return first ? { id: first.id, ...first.data() } : null
}

/** Lê o papel seedado externamente em roles/{uid}; clientes não podem gravá-lo. */
export async function getUserRole(uid) {
  if (!isFirebaseConfigured || !db || !uid) return null
  const snapshot = await getDoc(doc(db, 'roles', uid))
  return snapshot.exists() ? snapshot.data() : null
}