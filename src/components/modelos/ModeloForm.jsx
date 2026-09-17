// ------------------------------------------------------------------
// src/components/modelos/ModeloForm.jsx
// ------------------------------------------------------------------
// Formulário de preenchimento de um modelo DOCX: gera o documento com
// os campos preenchidos (docxtemplater), envia ao Cloudinary e cria o
// registro de documento do funcionário.
// ------------------------------------------------------------------
import { useMemo, useState } from 'react'
import { ArrowLeft, Loader2, FileText, Save } from 'lucide-react'
import { getModeloUrl, modeloFileName } from '@/services/modelosService'
import { uploadDocument } from '@/services/cloudinary'
import { createDocumento } from '@/services/documentoService'
import { maskDate } from '@/utils/masks'
import { isoToBr } from '@/utils/validators'

/** Valor padrão para cada campo (prefill + data de hoje). */
function buildValores(modelo, funcionario) {
  const hoje = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const hojeBR = `${pad(hoje.getDate())}/${pad(hoje.getMonth() + 1)}/${hoje.getFullYear()}`
  const valores = {}
  for (const campo of modelo.campos) {
    if (campo.tipo === 'data') {
      valores[campo.chave] = hojeBR
      continue
    }
    if (funcionario && campo.chave === 'nome') valores[campo.chave] = funcionario.nome ?? ''
    else if (funcionario && campo.chave === 'cpf') valores[campo.chave] = funcionario.cpf ?? ''
    else if (funcionario && campo.chave === 'cargo') valores[campo.chave] = funcionario.cargo ?? ''
    else if (funcionario && campo.chave === 'setor') valores[campo.chave] = funcionario.setor ?? ''
    else if (funcionario && campo.chave === 'dataAdm') valores[campo.chave] = isoToBr(funcionario.dataAdm)
    else valores[campo.chave] = ''
  }
  return valores
}

/**
 * @param {object} props
 * @param {object} props.modelo         Modelo selecionado (modelosService.MODELOS)
 * @param {object|null} props.funcionario  Funcionário dono (para prefill e vínculo)
 * @param {Function} props.onBack         Volta para a galeria
 * @param {Function} props.onCreated      Chamado após criar com sucesso
 */
export default function ModeloForm({ modelo, funcionario, onBack, onCreated }) {
  const [valores, setValores] = useState(() => buildValores(modelo, funcionario))
  const [gerando, setGerando] = useState(false)
  const [error, setError] = useState('')

  const funcionarioId = funcionario?.id

  const faltantes = useMemo(
    () => modelo.campos.filter((c) => !String(valores[c.chave] ?? '').trim()),
    [modelo, valores]
  )

  function setValor(chave, tipo, value) {
    if (tipo === 'data') value = maskDate(value)
    setValores((prev) => ({ ...prev, [chave]: value }))
  }

  async function handleSubmit() {
    if (!funcionarioId) {
      setError('Selecione o funcionário antes de gerar o documento.')
      return
    }
    if (faltantes.length > 0) {
      setError('Preencha todos os campos marcados.')
      return
    }
    setGerando(true)
    setError('')
    try {
      const [{ default: JSZip }, { default: Docxtemplater }] = await Promise.all([
        import('jszip'),
        import('docxtemplater'),
      ])

      const res = await fetch(getModeloUrl(modelo.id))
      if (!res.ok) throw new Error('Não foi possível carregar o modelo.')
      const buf = await res.arrayBuffer()

      const zip = new JSZip(buf)
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true })
      doc.render(valores)

      const mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      const blob = doc.getZip().generate({ type: 'blob', mimeType: mime })
      const file = new File([blob], modeloFileName(modelo, funcionario?.nome), { type: mime })

      const url = await uploadDocument(file, 'modelos')

      const hoje = new Date().toISOString().slice(0, 10)
      await createDocumento(funcionarioId, {
        tipo: modelo.tipo,
        descricao: `${modelo.titulo} — gerado por modelo`,
        data_emissao: hoje,
        data_validade: '',
        semValidade: true,
        observacoes: '',
        url_arquivo: url,
        arquivo_nome: file.name,
      })

      onCreated?.(file.name)
    } catch (err) {
      setError(err?.message ?? 'Não foi possível gerar o documento.')
    } finally {
      setGerando(false)
    }
  }

  return (
    <div>
      <button onClick={onBack} className="btn text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-graphite-700 mb-4">
        <ArrowLeft size={15} />
        Voltar à galeria
      </button>

      <div className="card p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="grid place-items-center h-10 w-10 rounded-xl bg-steel-500/10 text-steel-600 dark:text-steel-400">
            <FileText size={18} />
          </span>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">{modelo.titulo}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {funcionario ? `Documento de ${funcionario.nome}` : 'Selecione o funcionário para gerar'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modelo.campos.map((campo) => (
            <div key={campo.chave}>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                {campo.label} *
              </label>
              {campo.tipo === 'data' ? (
                <input
                  className="input"
                  value={valores[campo.chave] ?? ''}
                  onChange={(e) => setValor(campo.chave, 'data', e.target.value)}
                  placeholder="DD/MM/AAAA"
                  inputMode="numeric"
                />
              ) : (
                <input
                  className="input"
                  value={valores[campo.chave] ?? ''}
                  onChange={(e) => setValor(campo.chave, 'texto', e.target.value)}
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-400 max-w-sm">
            O documento é gerado em .docx com os campos preenchidos e enviado ao Cloudinary.
          </p>
          <button onClick={handleSubmit} disabled={gerando} className="btn-primary">
            {gerando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {gerando ? 'Gerando...' : 'Gerar documento'}
          </button>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">
            {error}
            {faltantes.length > 0 && (
              <span className="block text-xs">
                Campos pendentes: {faltantes.map((f) => f.label).join(', ')}.
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  )
}