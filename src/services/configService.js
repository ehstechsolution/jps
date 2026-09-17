// ------------------------------------------------------------------
// src/services/configService.js
// ------------------------------------------------------------------
// Leitura/escrita das configurações globais da JPS Steel no Firestore:
//
//   config/funcionarios  -> { escolaridade: [], cargo: [], status: [] }
//   config/empresa       -> { nome, logo, ... }
//
// As listas alimentam os campos de seleção do cadastro de funcionários.
// Quando o documento não existe (ou está vazio), o app usa valores padrão
// definidos aqui (fallback), garantindo que a interface nunca quebre.
// ------------------------------------------------------------------
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '@/config/firebase'
import { COLLECTIONS, CONFIG_DOCS } from '@/services/firestore'

/** Listas padrão usadas quando as configs do Firestore estiverem vazias. */
export const DEFAULT_CONFIG_LISTS = {
  escolaridade: [
    'Ensino fundamental',
    'Ensino médio',
    'Técnico',
    'Superior incompleto',
    'Superior completo',
    'Pós-graduação',
  ],
  cargo: [
    'Auxiliar geral',
    'Soldador',
    'Montador industrial',
    'Rigging / Amarras',
    'Eletricista industrial',
    'Técnico de Segurança',
    'Encarregado',
    'Supervisor',
    'Engenheiro mecânico',
    'Administrativo',
  ],
  status: ['Ativo', 'Afastado', 'Férias', 'Desligado'],
}

/** Níveis de acesso possíveis no cadastro do funcionário. */
export const NIVEIS_ACESSO = ['Operacional', 'Administrativo', 'Externo', 'Total']

/** Setores possíveis. */
export const SETORES = ['Operacional', 'Administrativo']

/**
 * Lê o documento config/funcionarios, retornando as listas com fallback
 * para os valores padrão caso o documento não exista.
 * @returns {Promise<{escolaridade: string[], cargo: string[], status: string[]}>}
 */
export async function getConfigFuncionarios() {
  if (!isFirebaseConfigured || !db) return DEFAULT_CONFIG_LISTS

  try {
    const snap = await getDoc(doc(db, COLLECTIONS.CONFIG, CONFIG_DOCS.FUNCIONARIOS))
    if (!snap.exists()) return DEFAULT_CONFIG_LISTS

    const d = snap.data()
    return {
      escolaridade: d.escolaridade?.length ? d.escolaridade : DEFAULT_CONFIG_LISTS.escolaridade,
      cargo: d.cargo?.length ? d.cargo : DEFAULT_CONFIG_LISTS.cargo,
      status: d.status?.length ? d.status : DEFAULT_CONFIG_LISTS.status,
    }
  } catch (err) {
    console.warn('[config] Não foi possível ler config/funcionarios:', err)
    return DEFAULT_CONFIG_LISTS
  }
}

/**
 * Lê a URL da logo da empresa (config/empresa.logo).
 * Retorna string vazia se não configurada (o app usa o asset local).
 * @returns {Promise<string>}
 */
export async function getEmpresaLogo() {
  const cfg = await getEmpresaConfig()
  return cfg.logo
}

/**
 * Lê o documento config/empresa, retornando as configurações de empresa.
 * @returns {Promise<{logo: string, webhook: string, webhookToken: string}>}
 */
export async function getEmpresaConfig() {
  if (!isFirebaseConfigured || !db) return { logo: '', webhook: '', webhookToken: '' }
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.CONFIG, CONFIG_DOCS.EMPRESA))
    if (!snap.exists()) return { logo: '', webhook: '', webhookToken: '' }
    const d = snap.data()
    return {
      logo: typeof d.logo === 'string' ? d.logo : '',
      webhook: typeof d.webhook === 'string' ? d.webhook : '',
      webhookToken: typeof d.webhookToken === 'string' ? d.webhookToken : '',
    }
  } catch (err) {
    console.warn('[config] Não foi possível ler config/empresa:', err)
    return { logo: '', webhook: '', webhookToken: '' }
  }
}

/**
 * Grava (merge) a URL do webhook de eventos em config/empresa.webhook.
 * @param {string} url  URL do endpoint (vazia para limpar)
 * @returns {Promise<void>}
 */
export async function setEmpresaWebhook(url) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase não configurado.')
  }
  await setDoc(
    doc(db, COLLECTIONS.CONFIG, CONFIG_DOCS.EMPRESA),
    { webhook: (url ?? '').trim() },
    { merge: true }
  )
}

/**
 * Tipos de documento SST padrão (config/documentos.tipos).
 * Entender os usados pela JPS Steel e ajustar onde necessário.
 */
export const DEFAULT_DOCUMENTO_TIPOS = [
  'ASO',
  'NR-10',
  'NR-11',
  'NR-12',
  'NR-18',
  'NR-33',
  'NR-35',
  'CRF / Registro',
  'Outro',
]

/** Status de documento SST padrão (config/documentos.status). */
export const DEFAULT_DOCUMENTO_STATUSES = [
  'VIGENTE',
  'VENCIDO',
  'ARQUIVADO',
  'EM_ANALISE',
]

/**
 * Lê o documento config/documentos, retornando a lista de tipos e
 * status com fallback para os valores padrão caso não exista.
 * @returns {Promise<{tipos: string[], status: string[]}>}
 */
export async function getConfigDocumentos() {
  if (!isFirebaseConfigured || !db) {
    return { tipos: DEFAULT_DOCUMENTO_TIPOS, status: DEFAULT_DOCUMENTO_STATUSES }
  }

  try {
    const snap = await getDoc(doc(db, COLLECTIONS.CONFIG, CONFIG_DOCS.DOCUMENTOS))
    if (!snap.exists()) {
      return { tipos: DEFAULT_DOCUMENTO_TIPOS, status: DEFAULT_DOCUMENTO_STATUSES }
    }

    const d = snap.data()
    return {
      tipos: d.tipos?.length ? d.tipos : DEFAULT_DOCUMENTO_TIPOS,
      status: d.status?.length ? d.status : DEFAULT_DOCUMENTO_STATUSES,
    }
  } catch (err) {
    console.warn('[config] Não foi possível ler config/documentos:', err)
    return { tipos: DEFAULT_DOCUMENTO_TIPOS, status: DEFAULT_DOCUMENTO_STATUSES }
  }
}

/**
 * Grava (merge) as listas padrão em config/funcionarios e config/documentos.
 * Serve como "seed" inicial — pode ser chamado sem risco de
 * sobrescrever dados que já existam (usa merge).
 *
 * O usuário pode editar os valores manualmente no console do Firebase
 * depois; novas leituras respeitam o que estiver salvo.
 * @returns {Promise<void>}
 */
export async function seedDefaultConfig() {
  if (!isFirebaseConfigured || !db) return
  await setDoc(
    doc(db, COLLECTIONS.CONFIG, CONFIG_DOCS.FUNCIONARIOS),
    { ...DEFAULT_CONFIG_LISTS, _atualizadoEm: 'manual-seed' },
    { merge: true }
  )
  await setDoc(
    doc(db, COLLECTIONS.CONFIG, CONFIG_DOCS.DOCUMENTOS),
    { tipos: DEFAULT_DOCUMENTO_TIPOS, status: DEFAULT_DOCUMENTO_STATUSES, _atualizadoEm: 'manual-seed' },
    { merge: true }
  )
}