// ------------------------------------------------------------------
// src/hooks/useDocumentos.js
// ------------------------------------------------------------------
// Hooks de documentos SST:
//   - useDocumentos()            Lista global (todos os funcionários),
//                                com join do dono e status recalculado.
//   - useDocumentosFuncionario() Documentos de um único funcionário em
//                                tempo real (subcoleção).
//
// Comportamento igual ao restante do app:
//  - Firebase configurado -> dados reais (real-time);
//  - Firebase não configurado -> dados fictícios (modo demo).
// ------------------------------------------------------------------
import { useEffect, useState, useCallback } from 'react'
import { isFirebaseConfigured } from '@/config/firebase'
import {
  subscribeCollection,
  subscribeSubcollection,
  fetchSubcollection,
  COLLECTIONS,
} from '@/services/firestore'
import { fetchMockDashboardData } from '@/services/mockData'
import { getDocumentStatus } from '@/utils/sst'
import { normalizeDate } from '@/utils/format'

/**
 * Enriquece um documento SST bruto com o dono (funcionário) e recalcula
 * status/vencimento em tempo real.
 * @param {object} doc    Documento bruto
 * @param {object|null} owner  Funcionário dono
 */
function enrichDoc(doc, owner) {
  return {
    ...doc,
    id_funcionario: owner?.id ?? doc.parentId,
    funcionario_nome: owner?.nome ?? '—',
    funcionario_cargo: owner?.cargo ?? '',
    funcionario_foto: owner?.foto ?? '',
    status_calculado: getDocumentStatus(doc.data_validade),
    data_validade_date: normalizeDate(doc.data_validade),
  }
}

/**
 * Achata os documentos_sst de uma lista de funcionários (modo demo),
 * enriquecendo cada documento com o nome/cargo do dono.
 * @param {Array} funcionarios
 */
function flattenFuncionariosDocs(funcionarios) {
  const docs = []
  for (const func of funcionarios ?? []) {
    for (const doc of func.documentos_sst ?? []) {
      docs.push(enrichDoc(doc, func))
    }
  }
  return docs
}

/**
 * Lista global de documentos (todos os funcionários).
 * @returns {{ docs: Array, loading: boolean, error: Error|null, refresh: Function }}
 */
export function useDocumentos() {
  const [state, setState] = useState({ docs: [], loading: true, error: null })
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true

    // ------------------------- MODO DEMO -------------------------
    if (!isFirebaseConfigured) {
      fetchMockDashboardData()
        .then((mock) => {
          if (!active) return
          setState({ docs: flattenFuncionariosDocs(mock.funcionarios), loading: false, error: null })
        })
        .catch((err) => {
          if (active) setState({ docs: [], loading: false, error: err })
        })
      return () => {
        active = false
      }
    }

    // --------------------- MODO FIREBASE (real) ---------------------
    const local = { funcs: [], docs: [] }
    const publish = () => {
      if (!active) return
      const docs = local.docs.flatMap((doc) => {
        const owner = local.funcs.find((f) => f.id === doc.parentId)
        return [enrichDoc(doc, owner)]
      })
      setState({ docs, loading: false, error: null })
    }

    fetchSubcollection(COLLECTIONS.FUNCIONARIOS, COLLECTIONS.DOCUMENTOS_SST)
      .then((docs) => {
        local.docs = docs
        publish()
      })
      .catch(() => publish())

    const unFunc = subscribeCollection(COLLECTIONS.FUNCIONARIOS, (funcs) => {
      local.funcs = funcs
      publish()
    }, () => {})

    return () => {
      active = false
      unFunc?.()
    }
  }, [reloadKey])

  const refresh = useCallback(() => setReloadKey((k) => k + 1), [])

  return { docs: state.docs, loading: state.loading, error: state.error, refresh }
}

/**
 * Documentos de um único funcionário com escuta em tempo real.
 * @param {string} funcionarioId
 * @returns {{ docs: Array, loading: boolean, error: Error|null }}
 */
export function useDocumentosFuncionario(funcionarioId) {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isFirebaseConfigured) {
      if (!funcionarioId) {
        setDocs([])
        setLoading(false)
        return undefined
      }
      setLoading(true)
      const cancel = subscribeSubcollection(
        `funcionarios/${funcionarioId}`,
        COLLECTIONS.DOCUMENTOS_SST,
        (rows) => {
          setDocs(rows.map((doc) => enrichDoc(doc, null)))
          setLoading(false)
        },
        (err) => {
          setError(err)
          setLoading(false)
        }
      )
      return cancel
    }
    // Modo demo: a lista real de funcionários é vazia, nada a mostrar.
    setDocs([])
    setLoading(false)
    return undefined
  }, [funcionarioId])

  return { docs, loading, error }
}