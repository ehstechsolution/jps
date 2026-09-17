// ------------------------------------------------------------------
// src/hooks/useAlertas.js
// ------------------------------------------------------------------
// Deriva os documentos que demandam atenção (status diferente de
// vigente/arquivado) a partir da lista global de documentos.
// ------------------------------------------------------------------
import { useMemo } from 'react'
import { useDocumentos } from '@/hooks/useDocumentos'
import { diffInDays, ALERTA_DIAS } from '@/utils/sst'

/** Status que não geram alerta. */
const STATUS_OK = ['VIGENTE', 'ARQUIVADO']

/**
 * @returns {{ lista: Array, count: number, vencidos: Array, proximos: Array, loading: boolean }}
 */
export function useAlertas() {
  const { docs, loading } = useDocumentos()

  const { lista, vencidos, proximos, count } = useMemo(() => {
    const all = (docs ?? [])
      .filter((d) => d.status && !STATUS_OK.includes(d.status))
      .map((d) => ({
        ...d,
        dias: diffInDays(d.dataValidade),
        critico: d.status === 'VENCIDO',
      }))
      .sort((a, b) => (a.dias ?? 0) - (b.dias ?? 0))

    const vencidos = all.filter((a) => a.critico)
    const proximos = all.filter((a) => !a.critico)
    return { lista: all, vencidos, proximos, count: all.length }
  }, [docs])

  return { lista, vencidos, proximos, count, loading, limiteDias: ALERTA_DIAS }
}