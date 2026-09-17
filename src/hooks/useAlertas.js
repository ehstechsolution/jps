// ------------------------------------------------------------------
// src/hooks/useAlertas.js
// ------------------------------------------------------------------
// Deriva os documentos críticos (vencidos ou próximos do vencimento)
// a partir da lista global de documentos, em tempo real.
// ------------------------------------------------------------------
import { useMemo } from 'react'
import { useDocumentos } from '@/hooks/useDocumentos'
import { diffInDays, ALERTA_DIAS } from '@/utils/sst'

/**
 * @returns {{ lista: Array, count: number, vencidos: Array, proximos: Array, loading: boolean }}
 */
export function useAlertas() {
  const { docs, loading } = useDocumentos()

  const { lista, vencidos, proximos, count } = useMemo(() => {
    const all = (docs ?? [])
      .filter((d) => d.data_validade && d.status_calculado !== 'VALIDO')
      .map((d) => ({
        ...d,
        dias: diffInDays(d.data_validade),
        critico: d.status_calculado === 'VENCIDO',
      }))
      .sort((a, b) => (a.dias ?? 0) - (b.dias ?? 0))

    const vencidos = all.filter((a) => a.critico)
    const proximos = all.filter((a) => !a.critico)
    return { lista: all, vencidos, proximos, count: all.length }
  }, [docs])

  return { lista, vencidos, proximos, count, loading, limiteDias: ALERTA_DIAS }
}