// ------------------------------------------------------------------
// src/components/documentos/FileUpload.jsx
// ------------------------------------------------------------------
// Upload de arquivo de documento (PDF, imagem, DOC) direto para o
// Cloudinary (endpoint "auto"). Mostra o nome do arquivo, permite abrir
// o arquivo enviado em nova aba e remover.
// ------------------------------------------------------------------
import { useRef, useState } from 'react'
import { FileUp, FileText, Loader2, Trash2, ExternalLink } from 'lucide-react'
import { uploadDocument, isCloudinaryConfigured } from '@/services/cloudinary'

/** Tamanho máximo aceito: 15MB. */
const MAX_SIZE = 15 * 1024 * 1024

/** Extensões aceitas para documentos SST. */
const ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,.tif,.tiff,.doc,.docx'

/** Verifica a extensão do arquivo (robusto a MIME incorretos). */
function isAccepted(filename = '') {
  const nome = filename.toLowerCase()
  return ACCEPT.split(',').some((ext) => nome.endsWith(ext.toLowerCase()))
}

/**
 * @param {object} props
 * @param {string}   props.value      URL atual do arquivo ('' se nenhum)
 * @param {string}   props.fileName   Nome original do arquivo
 * @param {Function} props.onChange   Notifica a nova URL ('' para remover)
 * @param {Function} props.onNameChange  Notifica o nome original do arquivo
 */
export default function FileUpload({ value, fileName, onChange, onNameChange }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const isImage = /\.(jpe?g|png|webp|tiff?)$/i.test(fileName ?? '')

  async function handleFile(event) {
    const file = event.target.files?.[0]
    event.target.value = '' // permite selecionar o mesmo arquivo de novo
    if (!file) return

    if (!isAccepted(file.name)) {
      setError('Tipo de arquivo não suportado. Use PDF, imagem ou DOC.')
      return
    }
    if (file.size > MAX_SIZE) {
      setError('O arquivo deve ter no máximo 15MB.')
      return
    }

    setError('')
    setUploading(true)
    try {
      const url = await uploadDocument(file, 'documentos')
      onChange(url)
      onNameChange?.(file.name)
    } catch (err) {
      setError(err?.message ?? 'Erro ao enviar o arquivo.')
    } finally {
      setUploading(false)
    }
  }

  if (!isCloudinaryConfigured) {
    return (
      <p className="text-xs text-amber-600 dark:text-amber-400">
        Cloudinary não configurado no .env — envie com a chave + upload preset informados.
      </p>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        {/* Preview / ícone */}
        <div className="relative h-14 w-14 shrink-0 rounded-xl border border-slate-200 dark:border-graphite-700 bg-slate-50 dark:bg-graphite-850 grid place-items-center overflow-hidden">
          {value && isImage ? (
            <img src={value} alt="Pré-visualização" className="h-full w-full object-cover" />
          ) : (
            <FileText size={22} className="text-steel-600 dark:text-steel-400" />
          )}
          {uploading && (
            <div className="absolute inset-0 grid place-items-center bg-white/70 dark:bg-graphite-950/70">
              <Loader2 size={18} className="animate-spin text-steel-600 dark:text-steel-400" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {value ? (
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
              {fileName || 'Arquivo enviado'}
            </p>
          ) : (
            <p className="text-sm text-slate-400">Nenhum arquivo anexado.</p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="btn-primary text-xs px-3 py-1.5"
            >
              <FileUp size={14} />
              {uploading ? 'Enviando...' : 'Enviar arquivo'}
            </button>
            {value && (
              <>
                <a
                  href={value}
                  target="_blank"
                  rel="noreferrer"
                  className="btn text-xs text-steel-600 dark:text-steel-400 px-3 py-1.5"
                >
                  <ExternalLink size={14} />
                  Abrir
                </a>
                <button
                  type="button"
                  onClick={() => {
                    onChange('')
                    onNameChange?.('')
                  }}
                  className="btn text-xs text-red-600 dark:text-red-400 px-3 py-1.5"
                >
                  <Trash2 size={14} />
                  Remover
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        hidden
        onChange={handleFile}
      />
    </div>
  )
}