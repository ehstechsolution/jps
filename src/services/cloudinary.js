// ------------------------------------------------------------------
// src/services/cloudinary.js
// ------------------------------------------------------------------
// Upload de arquivos (fotos de funcionários e documentos SST) direto para
// o Cloudinary, usando um "upload preset" unsigned — não é preciso enviar
// secrets.
//
// Requer no .env:
//   VITE_CLOUDINARY_CLOUD_NAME
//   VITE_CLOUDINARY_UPLOAD_PRESET  (ex.: jpsUploads)
// ------------------------------------------------------------------

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export const isCloudinaryConfigured = Boolean(CLOUD_NAME && UPLOAD_PRESET)

/**
 * Realiza o upload de um arquivo para o Cloudinary.
 *
 * @param {File}   file   Arquivo (imagem, PDF, DOC, etc.)
 * @param {string} url    Endpoint: "image/upload" ou "auto/upload"
 * @param {string} folder Pasta do Cloudinary (ex.: "funcionarios", "documentos")
 * @returns {Promise<string>} URL segura (https) do upload (secure_url).
 */
async function upload(file, url, folder) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', folder)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${url}`,
    { method: 'POST', body: formData }
  )

  if (!response.ok) {
    let detail = ''
    try {
      detail = (await response.json())?.error?.message ?? ''
    } catch {
      /* ignora falha de parse da mensagem */
    }
    throw new Error(`Falha no upload. ${detail}`.trim())
  }

  const json = await response.json()
  return json.secure_url
}

/**
 * Faz o upload de uma imagem (foto de funcionário).
 *
 * @param {File} file  Arquivo de imagem (jpg/png/webp).
 * @returns {Promise<string>} URL segura (https) do upload (secure_url).
 */
export async function uploadImage(file) {
  if (!isCloudinaryConfigured) {
    throw new Error('Cloudinary não configurado. Verifique o .env.')
  }
  return upload(file, 'image/upload', 'funcionarios')
}

/**
 * Faz o upload de um documento SST (PDF, imagem ou arquivo Office), usando
 * o endpoint "auto" do Cloudinary, que detecta o tipo automaticamente.
 *
 * @param {File}   file             Arquivo do documento.
 * @param {string} [folder]         Pasta de destino (padrão: "documentos").
 * @returns {Promise<string>} URL segura (https) do upload (secure_url).
 */
export async function uploadDocument(file, folder = 'documentos') {
  if (!isCloudinaryConfigured) {
    throw new Error('Cloudinary não configurado. Verifique o .env.')
  }
  return upload(file, 'auto/upload', folder)
}