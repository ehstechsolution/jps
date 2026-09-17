// ------------------------------------------------------------------
// src/components/funcionarios/PhotoUpload.jsx
// ------------------------------------------------------------------
// Seletor de foto do funcionário: preview circular + upload direto para
// o Cloudinary (preset unsigned). A URL retornada é salva no campo
// "foto" do cadastro.
// ------------------------------------------------------------------
import { useRef, useState } from 'react'
import { Camera, Loader2, Trash2, User } from 'lucide-react'
import { uploadImage, isCloudinaryConfigured } from '@/services/cloudinary'

/** Tamanho máximo aceito: 5MB. */
const MAX_SIZE = 5 * 1024 * 1024

/**
 * @param {object} props
 * @param {string}   props.value    URL atual da foto
 * @param {Function} props.onChange  Notifica a nova URL ('' para remover)
 */
export default function PhotoUpload({ value, onChange }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(event) {
    const file = event.target.files?.[0]
    event.target.value = '' // permite selecionar o mesmo arquivo de novo
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Selecione um arquivo de imagem (JPG/PNG/WEBP).')
      return
    }
    if (file.size > MAX_SIZE) {
      setError('A imagem deve ter no máximo 5MB.')
      return
    }

    setError('')
    setUploading(true)
    try {
      const url = await uploadImage(file)
      onChange(url)
    } catch (err) {
      setError(err?.message ?? 'Erro ao enviar a imagem.')
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
    <div className="flex items-center gap-4">
      {/* Preview da foto */}
      <div className="relative h-24 w-24 shrink-0 rounded-full overflow-hidden ring-4 ring-slate-100 dark:ring-graphite-800 bg-slate-100 dark:bg-graphite-800 grid place-items-center">
        {value ? (
          <img src={value} alt="Foto do funcionário" className="h-full w-full object-cover" />
        ) : (
          <User size={36} className="text-slate-300 dark:text-slate-600" />
        )}
        {uploading && (
          <div className="absolute inset-0 grid place-items-center bg-white/70 dark:bg-graphite-950/70">
            <Loader2 size={22} className="animate-spin text-steel-600 dark:text-steel-400" />
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="space-y-1.5">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="btn-primary text-xs px-3 py-1.5"
        >
          <Camera size={14} />
          {uploading ? 'Enviando...' : 'Enviar foto'}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="btn text-xs text-red-600 dark:text-red-400 px-3 py-1.5"
          >
            <Trash2 size={14} />
            Remover foto
          </button>
        )}
        {error && <p className="text-xs text-red-500 max-w-[220px]">{error}</p>}
      </div>

      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} />
    </div>
  )
}