// ------------------------------------------------------------------
// src/hooks/useAlertas.js
// ------------------------------------------------------------------
// Deriva os documentos que demandam atenção a partir da lista global.
// Só entram nos alertas os que já venceram ou cujos dias restantes até
// o vencimento sejam <= config/empresa.diasalerta (badge e dropdown do
// sino). Documentos ativos sem data de validade ficam de fora.
// ------------------------------------------------------------------
import { useMemo } from 'react'
import { useDocumentos } from '@/hooks/useDocumentos'
import { useConfig } from '@/context/ConfigContext'
import { diffInDays } from '@/utils/sst'

/** Status que não geram alerta. */
const STATUS_OK = ['VIGENTE', 'ARQUIVADO']

/**
 * @returns {{ lista: Array, count: number, vencidos: Array, proximos: Array, loading: boolean, limiteDias: number }}
 */
export function useAlertas() {
  const { docs, loading } = useDocumentos()
  const { diasAlerta } = useConfig()

  const { lista, vencidos, proximos, count } = useMemo(() => {
    const all = (docs ?? [])
      .filter((d) => d.status && !STATUS_OK.includes(d.status))
      .map((d) => ({
        ...d,
        dias: diffInDays(d.dataValidade),
        critico: d.status === 'VENCIDO',
      }))
      .filter((a) => a.dias != null && a.dias <= diasAlerta)
      .sort((a, b) => (a.dias ?? 0) - (b.dias ?? 0))

    const vencidos = all.filter((a) => a.critico)
    const proximos = all.filter((a) => !a.critico)
    return { lista: all, vencidos, proximos, count: all.length }
  }, [docs, diasAlerta])

  return { lista, vencidos, proximos, count, loading, limiteDias: diasAlerta }
}