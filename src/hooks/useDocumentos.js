// ------------------------------------------------------------------
// src/hooks/useDocumentos.js
// ------------------------------------------------------------------
// Hooks de documentos SST:
//   - useDocumentos()            Lista global (coleção plana "documentos"),
//                                com join do titular montado em memória.
//
// Comportamento igual ao restante do app:
//  - Firebase configurado -> dados reais (real-time);
//  - Firebase não configurado -> dados fictícios (modo demo).
// ------------------------------------------------------------------
import { useEffect, useState, useCallback } from 'react'
import { isFirebaseConfigured } from '@/config/firebase'
import { subscribeCollection, COLLECTIONS } from '@/services/firestore'
import { fetchMockDashboardData } from '@/services/mockData'
import { normalizeDate } from '@/utils/format'

/**
 * Enriquece um documento SST bruto com o titular (funcionário) e mantém
 * a data de validade em Date para ordenação na UI.
 * @param {object} doc    Documento bruto (com idFuncionarioTitular)
 * @param {object|null} owner  Funcionário titular
 */
function enrichDoc(doc, owner) {
  const idFuncionario = owner?.id ?? doc.idFuncionarioTitular ?? doc.idRelacionado ?? doc.parentId
  return {
    ...doc,
    id_funcionario: idFuncionario,
    funcionario_nome: owner?.nome ?? doc.nomeFuncionarioTitular ?? '—',
    funcionario_cargo: owner?.cargo ?? '',
    funcionario_foto: owner?.foto ?? '',
    data_validade_date: normalizeDate(doc.dataValidade),
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
      docs.push(enrichDoc({ ...doc, idFuncionarioTitular: func.id }, func))
    }
  }
  return docs
}

/**
 * Lista global de documentos (coleção "documentos" — todos os funcionários).
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
        const owner = local.funcs.find((f) => f.id === (doc.idFuncionarioTitular ?? doc.idRelacionado ?? doc.parentId))
        return [enrichDoc(doc, owner)]
      })
      setState({ docs, loading: false, error: null })
    }

    const unDocs = subscribeCollection(COLLECTIONS.DOCUMENTOS, (docs) => {
      local.docs = docs
      publish()
    }, (err) => {
      if (active) setState((prev) => ({ ...prev, error: err, loading: false }))
    })

    const unFunc = subscribeCollection(COLLECTIONS.FUNCIONARIOS, (funcs) => {
      local.funcs = funcs
      publish()
    }, () => {})

    return () => {
      active = false
      unDocs?.()
      unFunc?.()
    }
  }, [reloadKey])

  const refresh = useCallback(() => setReloadKey((k) => k + 1), [])

  return { docs: state.docs, loading: state.loading, error: state.error, refresh }
}