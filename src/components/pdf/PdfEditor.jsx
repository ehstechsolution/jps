// ------------------------------------------------------------------
// src/components/pdf/PdfEditor.jsx
// ------------------------------------------------------------------
// Editor de PDF: carimba o documento com campos de texto, data ou
// assinatura desenhada à mão. Renderiza o PDF com pdfjs-dist e exporta
// um novo arquivo PDF (pdf-lib) com os carimbos aplicados.
//
// O arquivo original não é alterado: sempre gera uma cópia assinada.
// ------------------------------------------------------------------
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Type, Calendar, PenLine, Move, Trash2, Loader2, Save } from 'lucide-react'

const ZOOM = 1.5
let uid = 0
const nextId = () => ++uid

const hojeBR = () => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

/**
 * @param {object} props
 * @param {string}   props.src            URL do PDF original
 * @param {string}   [props.arquivoNome]  Nome do arquivo original
 * @param {Function} props.onCancel
 * @param {Function} props.onSave         Recebe o File do PDF gerado
 */
export default function PdfEditor({ src, arquivoNome, onCancel, onSave }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const signRefs = useRef({})
  const dragRef = useRef(null)
  const signCurrent = useRef(null)

  const [pdf, setPdf] = useState(null)
  const [numPages, setNumPages] = useState(0)
  const [pageIndex, setPageIndex] = useState(1)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [fields, setFields] = useState([])
  const [mode, setMode] = useState('texto')
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [error, setError] = useState('')

  // Carrega o PDF (lazy, para não inflar o bundle principal)
  useEffect(() => {
    let cancelled = false
    setCarregando(true)
    setError('')
    ;(async () => {
      try {
        const pdfjs = (await import('pdfjs-dist')).default
        const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
        const bytes = await (await fetch(src)).arrayBuffer()
        const doc = await pdfjs.getDocument({ data: bytes }).promise
        if (cancelled) return
        setPdf(doc)
        setNumPages(doc.numPages)
        setCarregando(false)
      } catch (err) {
        if (!cancelled) {
          setCarregando(false)
          setError('Não foi possível carregar o PDF.')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [src])

  // Renderiza a página atual no canvas
  useEffect(() => {
    if (!pdf || !canvasRef.current) return
    let cancelled = false
    ;(async () => {
      try {
        const page = await pdf.getPage(pageIndex)
        const viewport = page.getViewport({ scale: ZOOM })
        const canvas = canvasRef.current
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')
        await page.render({ canvasContext: ctx, viewport }).promise
        if (!cancelled) setSize({ w: viewport.width, h: viewport.height })
      } catch {
        setError('Não foi possível renderizar a página.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [pdf, pageIndex])

  // ---- utilidades de posição (canvas) ----
  function getPos(e) {
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.min(Math.max(e.clientX - rect.left, 0), size.w)
    const y = Math.min(Math.max(e.clientY - rect.top, 0), size.h)
    return { x, y }
  }

  function fieldAt(p) {
    const pageFields = fields.filter((f) => f.page === pageIndex)
    for (let i = pageFields.length - 1; i >= 0; i--) {
      const f = pageFields[i]
      if (p.x >= f.x && p.x <= f.x + f.w && p.y >= f.y && p.y <= f.y + f.h) return f
    }
    return null
  }

  function clampField(f) {
    return {
      ...f,
      x: Math.min(Math.max(f.x, 0), Math.max(size.w - f.w, 0)),
      y: Math.min(Math.max(f.y, 0), Math.max(size.h - f.h, 0)),
    }
  }

  function addField(type, p) {
    const isTexto = type === 'texto'
    const w = isTexto ? 200 : 200
    const h = isTexto ? 26 : 26
    const f = clampField({
      id: nextId(),
      page: pageIndex,
      type,
      x: p.x,
      y: p.y,
      w,
      h,
      value: isTexto ? 'Texto' : hojeBR(),
      points: [],
    })
    setFields((prev) => [...prev, f])
  }

  // ---- pointer: clicar no container para adicionar/remover/mover ----
  function onCanvasDown(e) {
    if (e.button !== 0) return
    if (mode === 'apagar') {
      const p = getPos(e)
      const f = fieldAt(p)
      if (f) setFields((prev) => prev.filter((x) => x.id !== f.id))
      return
    }
    if (mode === 'mover') {
      const p = getPos(e)
      const f = fieldAt(p)
      if (f) dragRef.current = { id: f.id, dx: p.x - f.x, dy: p.y - f.y }
    } else {
      const p = getPos(e)
      addField(mode, p)
    }
  }

  function onCanvasMove(e) {
    if (dragRef.current) {
      const p = getPos(e)
      setFields((prev) =>
        prev.map((f) =>
          f.id === dragRef.current.id
            ? clampField({ ...f, x: p.x - dragRef.current.dx, y: p.y - dragRef.current.dy })
            : f
        )
      )
    }
  }

  function onCanvasUp() {
    dragRef.current = null
  }

  // ---- assinatura: desenho no canvas do campo ----
  function signDown(f, e) {
    if (mode !== 'assinatura') return
    e.stopPropagation()
    e.preventDefault()
    const canvas = signRefs.current[f.id]
    if (!canvas) return
    canvas.setPointerCapture(e.pointerId)
    signCurrent.current = { ...f, points: [] }
    pushPoint(signCurrent.current, e)
    redrawSign(signCurrent.current)
  }

  function signMove(f, e) {
    if (!signCurrent.current || signCurrent.current.id !== f.id) return
    e.stopPropagation()
    pushPoint(signCurrent.current, e)
    redrawSign(signCurrent.current)
  }

  function signUp(e) {
    if (!signCurrent.current) return
    const f = signCurrent.current
    setFields((prev) => prev.map((x) => (x.id === f.id ? { ...x, points: [...f.points] } : x)))
    signCurrent.current = null
  }

  function pushPoint(f, e) {
    const canvas = signRefs.current[f.id]
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) * canvas.width) / rect.width
    const y = ((e.clientY - rect.top) * canvas.height) / rect.height
    f.points.push([Math.min(Math.max(x, 0), canvas.width), Math.min(Math.max(y, 0), canvas.height)])
  }

  function redrawSign(f) {
    const canvas = signRefs.current[f.id]
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#111827'
    if (f.points.length < 2) return
    ctx.beginPath()
    ctx.moveTo(f.points[0][0], f.points[0][1])
    for (let i = 1; i < f.points.length; i++) ctx.lineTo(f.points[i][0], f.points[i][1])
    ctx.stroke()
  }

  // ---- salvar: aplica os campos num novo PDF ----
  async function handleSave() {
    setSalvando(true)
    setError('')
    try {
      const { PDFDocument, rgb } = await import('pdf-lib')
      const base = await PDFDocument.load(await (await fetch(src)).arrayBuffer())

      for (const f of fields) {
        const page = base.getPage(f.page - 1)
        const xPt = (f.x / size.w) * page.getWidth()
        const yTopPt = (f.y / size.h) * page.getHeight()

        if (f.type === 'texto' || f.type === 'data') {
          page.drawText(String(f.value || ''), {
            x: xPt,
            y: yTopPt - 12,
            size: 15,
            color: rgb(0, 0, 0),
          })
        } else if (f.type === 'assinatura') {
          const canvas = signRefs.current[f.id]
          if (canvas) {
            const png = await base.embedPng(canvas.toDataURL('image/png'))
            const wPt = (f.w / size.w) * page.getWidth()
            const hPt = (f.h / size.h) * page.getHeight()
            page.drawImage(png, { x: xPt, y: yTopPt - hPt, width: wPt, height: hPt })
          }
        }
      }

      const grandBinary = await base.save()
      const blob = new Blob([grandBinary], { type: 'application/pdf' })
      const baseName = (arquivoNome ?? 'documento').replace(/\.pdf$/i, '')
      const file = new File([blob], `${baseName}-assinado.pdf`, { type: 'application/pdf' })
      await onSave(file)
      setSalvo(true)
    } catch {
      setError('Não foi possível gerar o PDF assinado.')
    } finally {
      setSalvando(false)
    }
  }

  const TOOLS = [
    { id: 'texto', label: 'Texto', icon: Type },
    { id: 'data', label: 'Data', icon: Calendar },
    { id: 'assinatura', label: 'Assinatura', icon: PenLine },
    { id: 'mover', label: 'Mover', icon: Move },
    { id: 'apagar', label: 'Apagar', icon: Trash2 },
  ]

  return (
    <div>
      <button onClick={onCancel} disabled={salvando} className="btn text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-graphite-700 mb-4">
        <ArrowLeft size={15} />
        Voltar
      </button>

      <div className="card">
        <div className="p-4 border-b border-slate-200 dark:border-graphite-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {TOOLS.map((tool) => {
              const Icon = tool.icon
              const ativo = mode === tool.id
              return (
                <button
                  key={tool.id}
                  onClick={() => setMode(tool.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    ativo
                      ? 'bg-steel-600 text-white'
                      : 'border border-slate-200 dark:border-graphite-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-graphite-800'
                  }`}
                >
                  <Icon size={14} />
                  {tool.label}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <button onClick={() => setPageIndex((p) => Math.max(1, p - 1))} disabled={pageIndex <= 1} className="btn btn-sm">
                <ChevronLeft size={15} />
              </button>
              <span className="text-xs text-slate-600 dark:text-slate-300 min-w-[58px] text-center">
                {pageIndex} / {numPages}
              </span>
              <button onClick={() => setPageIndex((p) => Math.min(numPages, p + 1))} disabled={pageIndex >= numPages} className="btn btn-sm">
                <ChevronRight size={15} />
              </button>
            </div>
            <button onClick={handleSave} disabled={salvando || salvo || fields.length === 0} className="btn-primary">
              {salvando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {salvando ? 'Gerando...' : salvo ? 'Salvo!' : 'Salvar PDF'}
            </button>
          </div>
        </div>

        <p className="px-4 pt-3 text-xs text-slate-400">
          Clique no documento para adicionar o carimbo selecionado. No modo "Mover", arraste os
          carimbos; em "Apagar", clique sobre um carimbo para removê-lo.
        </p>

        <div className="p-4 overflow-auto max-h-[62vh]">
          {carregando ? (
            <div className="flex items-center gap-2 justify-center py-16 text-sm text-slate-500">
              <Loader2 size={18} className="animate-spin" />
              Carregando PDF...
            </div>
          ) : error && !pdf ? (
            <p className="text-center py-16 text-sm text-red-500">{error}</p>
          ) : (
            <div
              ref={containerRef}
              className="relative mx-auto bg-slate-100 dark:bg-graphite-900 rounded-lg shadow-sm"
              style={{ width: size.w, height: size.h }}
              onPointerDown={onCanvasDown}
              onPointerMove={onCanvasMove}
              onPointerUp={onCanvasUp}
            >
              <canvas ref={canvasRef} className="block" />

              {size.w > 0 &&
                fields
                  .filter((f) => f.page === pageIndex)
                  .map((f) =>
                    f.type === 'assinatura' ? (
                      <div
                        key={f.id}
                        className="absolute border-2 border-steel-500/60 bg-white/95"
                        style={{ left: f.x, top: f.y, width: f.w, height: f.h }}
                      >
                        <canvas
                          ref={(el) => {
                            signRefs.current[f.id] = el
                          }}
                          width={f.w}
                          height={f.h}
                          onPointerDown={(e) => signDown(f, e)}
                          onPointerMove={(e) => signMove(f, e)}
                          onPointerUp={signUp}
                          className="block cursor-crosshair"
                        />
                      </div>
                    ) : (
                      <div
                        key={f.id}
                        className="absolute border border-blue-500/60 bg-blue-500/10"
                        style={{ left: f.x, top: f.y, width: f.w, height: f.h }}
                        onPointerDown={(e) => {
                          if (mode === 'mover') {
                            const p = getPos(e)
                            dragRef.current = { id: f.id, dx: p.x - f.x, dy: p.y - f.y }
                          }
                          e.stopPropagation()
                        }}
                      >
                        <input
                          className="w-full h-full bg-transparent px-1.5 text-xs text-slate-800 dark:text-white"
                          value={f.value}
                          onChange={(e) =>
                            setFields((prev) => prev.map((x) => (x.id === f.id ? { ...x, value: e.target.value } : x)))
                          }
                          onPointerDown={(e) => e.stopPropagation()}
                        />
                      </div>
                    )
                  )}
            </div>
          )}

          {error && pdf && <p className="mt-2 text-center text-xs text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  )
}