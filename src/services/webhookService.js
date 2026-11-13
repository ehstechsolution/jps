// ------------------------------------------------------------------
// src/services/webhookService.js
// ------------------------------------------------------------------
// Notificação de eventos de documento para um endpoint externo via webhook.
//
// A cada documento criado/atualizado/excluído, o app faz um POST para a
// URL configurada em config/empresa.webhook com TODOS os dados do
// documento (incluindo "id" e o arquivo em base64, quando puder ser
// baixado), além do campo "acao" indicando o que foi feito:
//
//   acao: 'create' | 'update' | 'delete'
//
// Payload enviado (JSON, top-level):
//   {
//     ...todasAsPropriedadesDoDocumento,   // inclui id, idDocumento,
//                                          // tipoDocumento, datas, status,
//                                          // arquivoUrl, arquivoNome, ...
//     acao: 'create' | 'update' | 'delete',
//     evento: 'criado' | 'atualizado' | 'excluido',  // legado (mantido)
//     arquivo_base64: 'data:...',
//     enviadoEm: 'ISO...',
//     // aliases legados (compatibilidade com integrações antigas):
//     id_funcionario, funcionario_nome, tipo, url_arquivo, arquivo_nome,
//     observacoes, data_emissao, data_validade
//   }
//
// Campos internos do Firestore (_criadoEm/_atualizadoEm) são removidos
// do payload por serem sentinelas de serverTimestamp. Se
// config/empresa.webhookToken existir, é enviado o header
// "X-Webhook-Token" com esse valor. Se a URL não estiver configurada,
// o app segue funcionando normalmente (notificação é silenciosa).
// ------------------------------------------------------------------
import { doc as firestoreDoc, getDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '@/config/firebase'
import { COLLECTIONS, CONFIG_DOCS } from '@/services/firestore'

const FUNCIONARIO_INVITE_WEBHOOK_URL = 'https://webhook.ehstech.com.br/webhook/convite_sistemajps'

/** Mapeia o evento interno para o valor de "acao" do payload. */
const ACAO = { criado: 'create', atualizado: 'update', excluido: 'delete' }

/**
 * Lê a configuração do webhook (config/empresa).
 * @returns {Promise<{url: string, token: string}>}
 */
export async function getWebhookConfig() {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase não está configurado para ler o webhook.')
  }
  try {
    const snap = await getDoc(firestoreDoc(db, COLLECTIONS.CONFIG, CONFIG_DOCS.EMPRESA))
    if (!snap.exists()) return { url: '', token: '' }
    const d = snap.data()
    return {
      url: typeof d.webhook === 'string' ? d.webhook : '',
      token: typeof d.webhookToken === 'string' ? d.webhookToken : '',
    }
  } catch (err) {
    console.warn('[webhook] Não foi possível ler config/empresa:', err)
    throw new Error('Não foi possível ler a configuração do webhook no Firestore.')
  }
}

/**
 * Envia convite de funcionário ao endpoint dedicado de convites.
 * Falhas de configuração, rede, timeout e respostas HTTP não-2xx são
 * propagadas ao chamador para que ele possa informar o usuário e permitir reenvio.
 *
 * @param {{email: string, nome: string, inviteUrl: string, expiresAt: string}} convite
 * @returns {Promise<void>}
 */
export async function sendFuncionarioInvite({ email, nome, inviteUrl, expiresAt } = {}) {
  const destinatario = typeof email === 'string' ? email.trim() : ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destinatario)) {
    throw new Error('E-mail inválido para envio do convite.')
  }

  const link = typeof inviteUrl === 'string' ? inviteUrl.trim() : ''
  if (!link) {
    throw new Error('O link do convite está vazio.')
  }

  const payload = {
    evento: 'funcionario-convite',
    acao: 'funcionario-convite',
    destinatario,
    nome: typeof nome === 'string' ? nome.trim() : '',
    link,
    validade: expiresAt ?? '',
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)
  let response
  try {
    response = await fetch(FUNCIONARIO_INVITE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error('Tempo limite excedido ao enviar o convite pelo webhook.')
    }
    throw new Error('Falha de rede ao enviar o convite pelo webhook.')
  } finally {
    clearTimeout(timeoutId)
  }

  if (!response.ok) {
    throw new Error(`Webhook de convites recusou a solicitação (HTTP ${response.status}).`)
  }
}

/**
 * Baixa uma URL e a converte em data-URL base64 (ou null em falha).
 * @param {string} url
 * @returns {Promise<string|null>}
 */
export async function fetchAsBase64(url) {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result ?? null)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch (err) {
    console.warn('[webhook] Não foi possível baixar o arquivo:', err)
    return null
  }
}

/**
 * Notifica o endpoint externo sobre um evento de documento.
 * Fire-and-forget: falhas são apenas registradas no console.
 *
 * @param {"criado"|"atualizado"|"excluido"} evento
 * @param {string} funcionarioId
 * @param {object} doc  Documento (deve conter id, tipo, datas, url_arquivo...)
 * @returns {Promise<void>}
 */
export async function notifyDocumentEvent(evento, funcionarioId, doc) {
  if (!isFirebaseConfigured || !db) return

  let url
  let token
  try {
    ({ url, token } = await getWebhookConfig())
  } catch (err) {
    console.warn('[webhook] Notificação de documento não enviada:', err)
    return
  }
  if (!url || !doc) return

  // Busca o nome do funcionário dono para enriquecer o payload.
  let funcionarioNome = ''
  try {
    const snap = await getDoc(firestoreDoc(db, COLLECTIONS.FUNCIONARIOS, funcionarioId))
    if (snap.exists()) funcionarioNome = snap.data().nome ?? ''
  } catch {
    /* ignora — payload segue sem o nome */
  }

  // Tenta incluir o arquivo em base64; em falha, envia apenas a URL.
  const arquivo_base64 = (doc.arquivoUrl ?? doc.url_arquivo) ? await fetchAsBase64(doc.arquivoUrl ?? doc.url_arquivo) : null

  // Todos os dados do documento. Campos internos (sentinelas de
  // serverTimestamp) são removidos por não serializarem como data real.
  const { _criadoEm, _atualizadoEm, ...dados } = { ...doc }

  const payload = {
    ...dados,
    // Identificação
    id: doc.id ?? (doc.idDocumento ?? ''),
    idDocumento: doc.idDocumento ?? doc.id ?? '',
    idFuncionarioTitular: funcionarioId ?? '',
    nomeFuncionarioTitular: doc.nomeFuncionarioTitular ?? funcionarioNome,
    emailTitular: doc.emailTitular ?? '',
    // Dados do documento
    tipoDocumento: doc.tipoDocumento ?? '',
    descricao: doc.descricao ?? '',
    dataEmissao: doc.dataEmissao ?? '',
    dataValidade: doc.dataValidade ?? '',
    status: doc.status ?? '',
    resultado: doc.resultado ?? '',
    observacao: doc.observacao ?? '',
    arquivoUrl: doc.arquivoUrl ?? '',
    arquivoNome: doc.arquivoNome ?? '',
    criadoPor: doc.criadoPor ?? '',
    // Evento
    acao: ACAO[evento] ?? 'update',
    evento,
    arquivo_base64,
    // Aliases legados (compatibilidade com integrações antigas)
    id_funcionario: funcionarioId,
    funcionario_nome: funcionarioNome,
    tipo: doc.tipoDocumento ?? '',
    url_arquivo: doc.arquivoUrl ?? '',
    arquivo_nome: doc.arquivoNome ?? '',
    observacoes: doc.observacao ?? '',
    data_emissao: doc.dataEmissao ?? '',
    data_validade: doc.dataValidade ?? '',
    enviadoEm: new Date().toISOString(),
  }

  try {
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['X-Webhook-Token'] = token
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      console.warn(`[webhook] Endpoint respondeu ${res.status} para "${evento}".`)
    }
  } catch (err) {
    console.warn(`[webhook] Falha ao notificar "${evento}":`, err)
  }
}