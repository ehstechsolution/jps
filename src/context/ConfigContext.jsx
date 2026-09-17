// ------------------------------------------------------------------
// src/context/ConfigContext.jsx
// ------------------------------------------------------------------
// Carrega as configurações globais da JPS Steel uma única vez e
// disponibiliza para toda a aplicação:
//   - configLists                -> escolaridade / cargo / status (com fallback)
//   - configDocumentos           -> tipos de documento SST (com fallback)
//   - configDocumentosStatuses   -> status de documento SST (com fallback)
//   - empresaLogo                -> URL da logo em config/empresa (fallback: asset local)
//   - empresaWebhook             -> URL do webhook configurada
//   - seedConfig()               -> grava as listas padrão (seed inicial)
//   - reloadConfig()             -> recarrega todas as configs do Firestore
// ------------------------------------------------------------------
import { createContext, useContext, useEffect, useCallback, useState } from 'react'
import {
  getConfigFuncionarios,
  getConfigDocumentos,
  getEmpresaConfig,
  seedDefaultConfig,
  DEFAULT_CONFIG_LISTS,
  DEFAULT_DOCUMENTO_TIPOS,
  DEFAULT_DOCUMENTO_STATUSES,
} from '@/services/configService'

const ConfigContext = createContext({
  configLists: DEFAULT_CONFIG_LISTS,
  configDocumentos: DEFAULT_DOCUMENTO_TIPOS,
  configDocumentosStatuses: DEFAULT_DOCUMENTO_STATUSES,
  empresaLogo: '',
  empresaWebhook: '',
  configLoading: true,
  seeded: false,
  seedConfig: async () => {},
  reloadConfig: async () => {},
})

export function ConfigProvider({ children }) {
  const [configLists, setConfigLists] = useState(DEFAULT_CONFIG_LISTS)
  const [configDocumentos, setConfigDocumentos] = useState(DEFAULT_DOCUMENTO_TIPOS)
  const [configDocumentosStatuses, setConfigDocumentosStatuses] = useState(DEFAULT_DOCUMENTO_STATUSES)
  const [empresaLogo, setEmpresaLogo] = useState('')
  const [empresaWebhook, setEmpresaWebhook] = useState('')
  const [configLoading, setConfigLoading] = useState(true)
  const [seeded, setSeeded] = useState(false)

  const load = useCallback(async () => {
    setConfigLoading(true)
    const [lists, docCfg, empresa] = await Promise.all([
      getConfigFuncionarios(),
      getConfigDocumentos(),
      getEmpresaConfig(),
    ])
    setConfigLists(lists)
    setConfigDocumentos(docCfg.tipos)
    setConfigDocumentosStatuses(docCfg.status)
    setEmpresaLogo(empresa.logo)
    setEmpresaWebhook(empresa.webhook)
    setSeeded(true)
    setConfigLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  /** Grava as listas padrão no Firestore e recarrega em seguida. */
  const seedConfig = useCallback(async () => {
    await seedDefaultConfig()
    await load()
  }, [load])

  return (
    <ConfigContext.Provider
      value={{ configLists, configDocumentos, configDocumentosStatuses, empresaLogo, empresaWebhook, configLoading, seeded, seedConfig, reloadConfig: load }}
    >
      {children}
    </ConfigContext.Provider>
  )
}

/** Hook de acesso às configurações globais. */
export function useConfig() {
  return useContext(ConfigContext)
}