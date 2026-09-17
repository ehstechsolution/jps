// ------------------------------------------------------------------
// src/components/imagem/ImageEditor.jsx
// ------------------------------------------------------------------
// Editor de imagem: carimba a foto/documento com textos, data e
// desenho à mão livre. Renderiza a imagem num canvas e exporta um
// novo PNG com os carimbos aplicados.
//
// O arquivo original não é alterado: sempre gera uma cópia editada.
// ------------------------------------------------------------------
import { useEffect, useRef, useState } from 'react'
import { Type, Calendar, PenLine, Move, Trash2, Loader2, Save } from 'lucide-react'

let uid = 0
const nextId = () => ++uid

const hojeBR = () => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

/**
 * @param {object} props
 * @param {string}   props.src            URL da imagem original
 * @param {string}   [props.arquivoNome]  Nome do arquivo original
 * @param {Function} props.onCancel
 * @param {Function} props.onSave         Recebe o File do PNG gerado
 */
export default function ImageEditor({ src, arquivoNome, onCancel, onSave }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const imgRef = useRef(null)
  const signRefs = useRef({})
  const dragRef = useRef(null)
  const signCurrent = useRef(null)

  const [nat, setNat] = useState({ w: 0, h: 0 })
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [fields, setFields] = useState([])
  const [mode, setMode] = useState('texto')
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [error, setError] = useState('')

  // Carrega a imagem (com CORS para permitir exportar o canvas)
  useEffect(() => {
    let cancelled = false
    setCarregando(true)
    setError('')
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      if (cancelled) return
      imgRef.current = img
      setNat({ w: img.naturalWidth, h: img.naturalHeight })
      setCarregando(false)
    }
    img.onerror = () => {
      if (!cancelled) {
        setCarregando(false)
        setError('Não foi possível carregar a imagem.')
      }
    }
    img.src = src
    return () => {
      cancelled = true
    }
  }, [src])

  // Desenha a imagem redimensionada no canvas de edição
  useEffect(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return
    const maxW = 720
    const maxH = 560
    const scale = Math.min(1, maxW / img.naturalWidth, maxH / img.naturalHeight)
    const w = Math.round(img.naturalWidth * scale)
    const h = Math.round(img.naturalHeight * scale)
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, w, h)
    setSize({ w, h })
  }, [nat])

  // ---- utilidades de posição (canvas) ----
  function getPos(e) {
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.min(Math.max(e.clientX - rect.left, 0), size.w)
    const y = Math.min(Math.max(e.clientY - rect.top, 0), size.h)
    return { x, y }
  }

  function fieldAt(p) {
    for (let i = fields.length - 1; i >= 0; i--) {
      const f = fields[i]
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
    const isAssinatura = type === 'assinatura'
    const w = isAssinatura ? 180 : 220
    const h = isAssinatura ? 90 : 26
    const f = clampField({
      id: nextId(),
      type,
      x: p.x,
      y: p.y,
      w,
      h,
      value: type === 'texto' ? 'Texto' : type === 'data' ? hojeBR() : '',
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
    if (!dragRef.current) return
    const p = getPos(e)
    setFields((prev) =>
      prev.map((f) =>
        f.id === dragRef.current.id
          ? clampField({ ...f, x: p.x - dragRef.current.dx, y: p.y - dragRef.current.dy })
          : f
      )
    )
  }

  function onCanvasUp() {
    dragRef.current = null
  }

  // ---- assinatura/caneta: desenho no canvas do campo ----
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

  function signUp() {
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

  // ---- salvar: aplica os carimbos num PNG novo (em resolução natural) ----
  async function handleSave() {
    setSalvando(true)
    setError('')
    try {
      const canvas = document.createElement('canvas')
      canvas.width = nat.w
      canvas.height = nat.h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(imgRef.current, 0, 0)
      const sx = nat.w / size.w
      const sy = nat.h / size.h

      for (const f of fields) {
        const x = f.x * sx
        const y = f.y * sy
        const w = f.w * sx
        const h = f.h * sy

        if (f.type === 'texto' || f.type === 'data') {
          ctx.font = `${Math.round(15 * sx)}px sans-serif`
          ctx.fillStyle = '#111827'
          ctx.fillText(String(f.value || ''), x, y + Math.round(12 * sx))
        } else if (f.type === 'assinatura') {
          const signCanvas = signRefs.current[f.id]
          if (signCanvas) ctx.drawImage(signCanvas, x, y, w, h)
        }
      }

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
      const baseName = (arquivoNome ?? 'imagem').replace(/\.[^.]+$/, '')
      const file = new File([blob], `${baseName}-editada.png`, { type: 'image/png' })
      await onSave(file)
      setSalvo(true)
    } catch {
      setError('Não foi possível gerar a imagem editada.')
    } finally {
      setSalvando(false)
    }
  }

  const TOOLS = [
    { id: 'texto', label: 'Texto', icon: Type },
    { id: 'data', label: 'Data', icon: Calendar },
    { id: 'assinatura', label: 'Caneta', icon: PenLine },
    { id: 'mover', label: 'Mover', icon: Move },
    { id: 'apagar', label: 'Apagar', icon: Trash2 },
  ]

  return (
    <div>
      <button onClick={onCancel} disabled={salvando} className="btn text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-graphite-700 mb-4">
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

          <button onClick={handleSave} disabled={salvando || salvo || fields.length === 0} className="btn-primary">
            {salvando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {salvando ? 'Gerando...' : salvo ? 'Salvo!' : 'Salvar imagem'}
          </button>
        </div>

        <p className="px-4 pt-3 text-xs text-slate-400">
          Clique na imagem para adicionar o carimbo selecionado. No modo "Mover", arraste os carimbos;
          em "Apagar", clique sobre um carimbo para removê-lo.
        </p>

        <div className="p-4 overflow-auto max-h-[62vh]">
          {carregando ? (
            <div className="flex items-center gap-2 justify-center py-16 text-sm text-slate-500">
              <Loader2 size={18} className="animate-spin" />
              Carregando imagem...
            </div>
          ) : error && !nat.w ? (
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
                fields.map((f) =>
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

          {error && nat.w > 0 && <p className="mt-2 text-center text-xs text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  )
}