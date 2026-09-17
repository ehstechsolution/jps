// ------------------------------------------------------------------
// src/hooks/useCollection.js
// ------------------------------------------------------------------
// Hook genérico de assinatura em tempo real de uma coleção do Firestore.
// Se o Firebase não estiver configurado, retorna vazio e silencioso.
// ------------------------------------------------------------------
import { useEffect, useState } from 'react'
import { subscribeCollection } from '@/services/firestore'

/**
 * @param {string} path  Caminho da coleção (ex.: "funcionarios")
 * @returns {{ data: Array, loading: boolean, error: Error | null }}
 */
export function useCollection(path) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const cancel = subscribeCollection(
      path,
      (docs) => {
        setData(docs)
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      }
    )
    return cancel
  }, [path])

  return { data, loading, error }
}