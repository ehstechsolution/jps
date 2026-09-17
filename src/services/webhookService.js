// ------------------------------------------------------------------
// src/services/webhookService.js
// ------------------------------------------------------------------
// Notificação de eventos de documento para um endpoint externo via webhook.
//
// A cada documento criado/atualizado/excluído, o app faz um POST para a
// URL configurada em config/empresa.webhook com TODOS os dados do
// documento (incluindo o arquivo em base64, quando puder ser baixado).
//
// Payload enviado (JSON):
//   {
//     evento: 'criado' | 'atualizado' | 'excluido',
//     documento: {
//       id, id_funcionario, funcionario_nome, tipo, descricao,
//       data_emissao, data_validade, observacoes, url_arquivo,
//       arquivo_nome, arquivo_base64
//     },
//     enviadoEm: 'ISO...'
//   }
//
// Se config/empresa.webhookToken existir, é enviado o header
// "X-Webhook-Token" com esse valor. Se a URL não estiver configurada,
// o app segue funcionando normalmente (notificação é silenciosa).
// ------------------------------------------------------------------
import { doc, getDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '@/config/firebase'
import { COLLECTIONS, CONFIG_DOCS } from '@/services/firestore'

/**
 * Lê a configuração do webhook (config/empresa).
 * @returns {Promise<{url: string, token: string}>}
 */
export async function getWebhookConfig() {
  if (!isFirebaseConfigured || !db) return { url: '', token: '' }
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.CONFIG, CONFIG_DOCS.EMPRESA))
    if (!snap.exists()) return { url: '', token: '' }
    const d = snap.data()
    return {
      url: typeof d.webhook === 'string' ? d.webhook : '',
      token: typeof d.webhookToken === 'string' ? d.webhookToken : '',
    }
  } catch (err) {
    console.warn('[webhook] Não foi possível ler config/empresa:', err)
    return { url: '', token: '' }
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

  const { url, token } = await getWebhookConfig()
  if (!url || !doc) return

  // Busca o nome do funcionário dono para enriquecer o payload.
  let funcionarioNome = ''
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.FUNCIONARIOS, funcionarioId))
    if (snap.exists()) funcionarioNome = snap.data().nome ?? ''
  } catch {
    /* ignora — payload segue sem o nome */
  }

  // Tenta incluir o arquivo em base64; em falha, envia apenas a URL.
  const arquivo_base64 = doc.url_arquivo ? await fetchAsBase64(doc.url_arquivo) : null

  const payload = {
    evento,
    documento: {
      id: doc.id ?? '',
      id_funcionario: funcionarioId,
      funcionario_nome: funcionarioNome,
      tipo: doc.tipo ?? '',
      descricao: doc.descricao ?? '',
      data_emissao: doc.data_emissao ?? '',
      data_validade: doc.data_validade ?? '',
      observacoes: doc.observacoes ?? '',
      url_arquivo: doc.url_arquivo ?? '',
      arquivo_nome: doc.arquivo_nome ?? '',
      arquivo_base64,
    },
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