// ------------------------------------------------------------------
// src/hooks/useDashboardData.js
// ------------------------------------------------------------------
// Hook central do Dashboard. Mantém os dados de todas as coleções
// sincronizados em tempo real via Firestore (onSnapshot).
//
// Comportamento:
//  - Firebase configurado  -> usa dados reais do Firestore (real-time);
//  - Firebase não configurado -> cai no "modo demo" com dados fictícios,
//    permitindo desenvolvimento imediato.
//
// Também "achata" os documentos_sst (subcoleção de cada funcionário),
// atribuindo a cada documento o nome do funcionário dono, o que simplifica
// a renderização da tabela de próximos vencimentos.
// ------------------------------------------------------------------
import { useEffect, useMemo, useState } from 'react'
import { isFirebaseConfigured } from '@/config/firebase'
import {
  subscribeCollection,
  fetchSubcollection,
  COLLECTIONS,
} from '@/services/firestore'
import { fetchMockDashboardData } from '@/services/mockData'
import { getDocumentStatus } from '@/utils/sst'
import { normalizeDate } from '@/utils/format'

/**
 * Estado inicial vazio do dashboard.
 */
const EMPTY = {
  funcionarios: [],
  clientes: [],
  orcamentos_os: [],
  gastos: [],
  equipamentos: [],
  documentos_sst: [],
  loading: true,
  error: null,
}

/**
 * @returns {typeof EMPTY}
 */
export function useDashboardData() {
  const [data, setData] = useState(EMPTY)

  useEffect(() => {
    let active = true // evita setState após desmonte

    // ------------------------- MODO DEMO -------------------------
    if (!isFirebaseConfigured) {
      fetchMockDashboardData()
        .then((mock) => {
          if (!active) return
          setData({
            ...mock,
            // Alimentos/funcionários do mock: achatamento dos documentos
            documentos_sst: flattenDocuments(mock.funcionarios),
            loading: false,
            error: null,
          })
        })
        .catch((err) => {
          if (active) setData({ ...EMPTY, loading: false, error: err })
        })
      return () => {
        active = false
      }
    }

    // --------------------- MODO FIREBASE (real) ---------------------
    const state = {
      funcionarios: [],
      clientes: [],
      orcamentos_os: [],
      gastos: [],
      equipamentos: [],
      documentos_sst: [],
    }

    const updateState = (field) => (docs) => {
      state[field] = docs
      publish()
    }

    const unsubscribe = []
    const publish = () => {
      if (!active) return
      setData({
        ...state,
        // Enriquecimento dos documentos SST (join com o funcionário dono)
        documentos_sst: enrichDocumentos(state.documentos_sst, state.funcionarios),
        loading: false,
        error: null,
      })
    }

    // Publica novamente quando os documentos SST terminarem de carregar.
    fetchSubcollection(COLLECTIONS.FUNCIONARIOS, COLLECTIONS.DOCUMENTOS_SST)
      .then((docs) => {
        state.documentos_sst = docs
        publish()
      })
      .catch(() => {})

    unsubscribe.push(subscribeCollection(COLLECTIONS.FUNCIONARIOS, updateState('funcionarios'), () => {}))
    unsubscribe.push(subscribeCollection(COLLECTIONS.CLIENTES, updateState('clientes'), () => {}))
    unsubscribe.push(subscribeCollection(COLLECTIONS.ORCAMENTOS_OS, updateState('orcamentos_os'), () => {}))
    unsubscribe.push(subscribeCollection(COLLECTIONS.GASTOS, updateState('gastos'), () => {}))
    unsubscribe.push(subscribeCollection(COLLECTIONS.EQUIPAMENTOS, updateState('equipamentos'), () => {}))

    return () => {
      active = false
      unsubscribe.forEach((cancel) => cancel && cancel())
    }
  }, [])

  return data
}

/**
 * Achata os documentos_sst de todos os funcionários em uma única lista,
 * enriquecendo cada documento com o nome/cargo do funcionário e com o
 * status de validade recalculado em tempo real.
 *
 * @param {Array} funcionarios
 * @returns {Array}
 */
export function flattenDocuments(funcionarios) {
  const docs = []
  for (const func of funcionarios ?? []) {
    const sub = func.documentos_sst ?? []
    for (const doc of sub) {
      docs.push(enrichDocument([doc], func)[0])
    }
  }
  return docs
}

/**
 * Enriquece um documento SST vindo da subcoleção (modo Firestore real),
 * fazendo o "join" com o funcionário dono via parentId.
 *
 * @param {Array} docs          Documentos brutos da subcoleção
 * @param {Array} funcionarios  Lista de funcionários
 * @returns {Array}
 */
function enrichDocumentos(docs, funcionarios) {
  return (docs ?? []).flatMap((doc) => {
    const owner = (funcionarios ?? []).find((f) => f.id === doc.parentId)
    return enrichDocument([doc], owner)
  })
}

/**
 * Anexa nome/cargo do funcionário e recalcula status/vencimento de cada doc.
 * @param {Array} docs
 * @param {object|null} owner
 */
function enrichDocument(docs, owner) {
  return docs.map((doc) => ({
    ...doc,
    id_funcionario: owner?.id ?? doc.parentId,
    funcionario_nome: owner?.nome ?? '—',
    funcionario_cargo: owner?.cargo ?? '',
    // Recalcula o status a partir da data, mantendo a UI sempre atual
    status_calculado: getDocumentStatus(doc.data_validade),
    data_validade_date: normalizeDate(doc.data_validade),
  }))
}

/**
 * Deriva as métricas agregadas exibidas nos Cards de Resumo.
 * @param {typeof EMPTY} data
 */
export function useDashboardMetrics(data) {
  return useMemo(() => {
    const { funcionarios, orcamentos_os, documentos_sst } = data

    // Funcionários com status ATIVO (aceita "ATIVO" do schema antigo e
    // "Ativo" do novo schema de cadastro)
    const funcionariosAtivos = (funcionarios ?? []).filter(
      (f) => String(f.status ?? '').toUpperCase() === 'ATIVO'
    ).length

    // OS em andamento (tipo ORDENS_SERVICO)
    const osEmAndamento = (orcamentos_os ?? []).filter(
      (os) => os.tipo === 'ORDEM_SERVICO' && os.status === 'EM_ANDAMENTO'
    ).length

    // Orçamentos pendentes de aprovação
    const orcamentosPendentes = (orcamentos_os ?? []).filter(
      (os) => os.tipo === 'ORCAMENTO' && os.status === 'PENDENTE'
    ).length

    // Documentos SST críticos: vencidos ou vencendo em menos de 30 dias
    const documentosCriticos = (documentos_sst ?? []).filter(
      (doc) => doc.status_calculado !== 'VALIDO'
    ).length

    return { funcionariosAtivos, osEmAndamento, orcamentosPendentes, documentosCriticos }
  }, [data])
}