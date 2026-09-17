// ------------------------------------------------------------------
// src/services/firestore.js
// ------------------------------------------------------------------
// Camada de serviços de acesso ao Firestore da JPS Steel.
//
// ESTRUTURA DAS COLEÇÕES
// ----------------------
// 1) funcionarios
//    { id, nome, cpf, cargo, email, telefone, status: "ATIVO"|"INATIVO",
//      data_admissao }
//
// 2) documentos
//    { id, idDocumento: <id>, idFuncionarioTitular: <id_funcionario>,
//      nomeFuncionarioTitular, emailTitular, tipoDocumento, descricao,
//      dataEmissao: "YYYY-MM-DD",
//      dataValidade: "YYYY-MM-DD" | "" (sem validade),
//      status, resultado, observacao, arquivoUrl, arquivoNome, criadoPor }
//    Coleção plana: cada documento aponta para o funcionário titular
//    através do campo idFuncionarioTitular.
//
// 3) clientes
//    { id, razao_social, nome_fantasia, cnpj, contato_principal, email,
//      telefone, cidade }
//
// 4) orcamentos_e_os
//    { id, numero_os, id_cliente, cliente_nome_cache, descricao_servico,
//      tipo: "ORCAMENTO"|"ORDEM_SERVICO",
//      status: "PENDENTE"|"APROVADO"|"EM_ANDAMENTO"|"CONCLUIDO"|"CANCELADO",
//      data_emissao, equipe_alocada: [id_funcionario],
//      equipamentos_alocados: [id_equipamento], valor_orcado,
//      custo_total_gastos, lucro_bruto }
//
// 5) gastos
//    { id, id_os, numero_os_cache, categoria: "Material"|"Combustível"|
//      "Alimentação"|"Outros", descricao, valor, data, url_comprovante }
//
// 6) equipamentos
//    { id, codigo_patrimonio, nome, marca_modelo,
//      status: "DISPONIVEL"|"EM_USO"|"MANUTENCAO",
//      data_proxima_calibracao, status_calibracao }
// ------------------------------------------------------------------
import {
  collection,
  onSnapshot,
} from 'firebase/firestore'
import { db, isFirebaseConfigured, toDate } from '@/config/firebase'

/** Nomes canônicos das coleções do sistema. */
export const COLLECTIONS = {
  FUNCIONARIOS: 'funcionarios',
  DOCUMENTOS: 'documentos', // coleção plana; vincula o titular via idFuncionarioTitular
  CLIENTES: 'clientes',
  ORCAMENTOS_OS: 'orcamentos_e_os',
  GASTOS: 'gastos',
  EQUIPAMENTOS: 'equipamentos',
  // Configurações globais (documentos: config/funcionarios, config/empresa)
  CONFIG: 'config',
}

/** Documentos da coleção "config". */
export const CONFIG_DOCS = {
  FUNCIONARIOS: 'funcionarios', // { escolaridade[], cargo[], status[] }
  EMPRESA: 'empresa', // { nome, logo, ... }
  DOCUMENTOS: 'documentos', // { tipos[], status[] }
}

/** Enum de status utilizados pela interface (mantidos em português). */
export const STATUS = {
  // Funcionário
  ATIVO: 'ATIVO',
  INATIVO: 'INATIVO',
  // OS / Orçamento
  PENDENTE: 'PENDENTE',
  APROVADO: 'APROVADO',
  EM_ANDAMENTO: 'EM_ANDAMENTO',
  CONCLUIDO: 'CONCLUIDO',
  CANCELADO: 'CANCELADO',
  // Documento SST
  DOC_VALIDO: 'VALIDO',
  DOC_PROXIMO: 'PROXIMO_VENCIMENTO',
  DOC_VENCIDO: 'VENCIDO',
  // Equipamento
  EQUIP_DISPONIVEL: 'DISPONIVEL',
  EQUIP_EM_USO: 'EM_USO',
  EQUIP_MANUTENCAO: 'MANUTENCAO',
}

/**
 * Abre uma "escuta" em tempo real de uma coleção do Firestore,
 * chamando a função de sucesso a cada mudança de dados.
 *
 * @param {string} path       Caminho da coleção (ex.: "funcionarios")
 * @param {(docs: Array) => void} onSuccess
 * @param {(error: Error) => void} onError
 * @returns {() => void}      Função para cancelar a escuta
 */
export function subscribeCollection(path, onSuccess, onError) {
  // Se o Firebase não está configurado, não há o que escutar;
  // a camada de mock assume o papel.
  if (!isFirebaseConfigured || !db) return () => {}

  const ref = collection(db, path)

  const unsubscribe = onSnapshot(
    ref,
    (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        _criadoEm: doc.data()._criadoEm ?? null,
        ...doc.data(),
      }))
      onSuccess(docs)
    },
    (error) => {
      console.error(`[firestore] Erro ao escutar "${path}":`, error)
      onError?.(error)
    }
  )
  return unsubscribe
}

export { toDate }