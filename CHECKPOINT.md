# Checkpoint — JPS Steel Backoffice
> Atualizado em 2026-09-18

## Estado atual do projeto
- **Build**: ✅ OK (vite build, chunks code-split corretamente)
- **Dev server**: rodando em `http://localhost:5173` (reiniciar com `npm run dev`)
- **Banco**: Firebase `jps-2027` (reais) + Cloudinary `drqdkypcv`/`jpsUploads`
- **Autenticação**: login/cadastro funcional, perfil admin básico
- **Alterações pendentes (working tree)**: remoção completa dos editores
  (ver seção "Sessão atual" — ainda não commitadas)

---

## Sessão atual (2026-09-18) — remoção dos editores de arquivo

### Webhook de documentos
- `src/services/webhookService.js` `notifyDocumentEvent()` dispara POST para
  `config/empresa.webhook` em criar/atualizar/excluir. Payload top-level com
  TODOS os dados do doc (inclui `id`) + campo `acao` (`create`/`update`/`delete`)
  + `evento` (legado) + aliases. Remove sentinelas `_criadoEm`/`_atualizadoEm`;
  opcionalmente baixa o arquivo em `arquivo_base64`; header `X-Webhook-Token`.
- `src/services/documentoService.js` `updateDocumento()` lê o registro atual
  (`getDoc`) e notifica com o registro completo no payload.
- URL do webhook é **somente leitura no app** (definida em `config/empresa.webhook`
  no Firebase). O card de configuração da tela de Documentos foi removido;
  `setEmpresaWebhook()` (`configService`) permanece disponível para uma futura
  tela de configurações.

### Favicon
- `index.html` usa `public/favicon.png` (cópia de `src/assets/logo.png`).
- `src/App.jsx` `FaviconSync` mantém o favicon em `empresaLogo || logoLocal`.

### Alertas por dias de antecedência (`config/empresa.diasalerta`)
- `src/services/configService.js` `getEmpresaConfig()` lê `diasalerta` de
  `config/empresa` (inteiro >= 0; ausente → `null`).
- `src/context/ConfigContext.jsx` expõe `diasAlerta` com fallback `ALERTA_DIAS` (30).
- `src/hooks/useAlertas.js` (sino) agora filtra: só entra no alerta documento com
  `dias != null && dias <= diasAlerta`. VENCIDO sempre passa; ativos sem data ficam
  de fora. `limiteDias` retorna o valor real.
- Leitura única no load do app (não real-time); edição é manual no Firebase.

### O que foi removido
- **Botões por linha** em `src/pages/DocumentosPage.jsx`: os de edição de arquivo
  ("Editar no arquivo"/word, "Editar no PDF", "Editar na imagem") foram removidos.
  Restam apenas: **Abrir** (ExternalLink → nova aba), **Editar documento** (Pencil,
  edita o registro via `DocumentoFormularioPage`) e **Excluir** (Trash2).
- **Páginas de edição** deletadas: `DocumentoWordPage`, `DocumentoPdfEditorPage`,
  `DocumentoImagemPage` (e as já removidas `DocumentoEditarPage`, `PdfEditor`).
- **Componentes de editor** deletados: `components/word/DocumentEditor.jsx`,
  `components/word/FormatToolbar.jsx`, `components/pdf/PdfTextEditor.jsx`,
  `components/imagem/ImageEditor.jsx`.
- **Utils de editor** deletados: `utils/docxWriter.js`, `utils/pdfToHtml.js`,
  `utils/pdfWriter.js`, `utils/printHtml.js`, `utils/arquivo.js`
  (`classificarArquivo` ficou órfão após a remoção).
- **App.jsx**: removidas as rotas `editar-pdf`/`editar-imagem`/`editar-word` e as
  props `onOpenDocumentoPdf`/`...Imagem`/`...Word`. `docView` mantém só
  `novo`/`editar` (registro).
- **CSS**: bloco `.jps-doc-editor` removido de `index.css`.
- **Dependências**: `npm uninstall mammoth jspdf pdfjs-dist`. Mantidos
  `jszip` + `docxtemplater` (usados por `scripts/generate-modelos.js`) e
  `lucide-react` (ícones dos botões restantes).

### O que permanece
- Fluxo de **novo/editar/excluir documento** (registro + upload do arquivo):
  `DocumentoFormularioPage`, `DocumentoForm`, `FileUpload`, `DocumentoPreview`
  (preview/abrir em nova aba), serviços `documentoService`/`cloudinary`/`webhook`.
- Abrir arquivo em nova aba = URL crua no Cloudinary (abre no visualizador do
  navegador / extensões do Google, fora do app).

---

## Modelo de dados (Firestore)

### Coleção plana `documentos` (SST)
Cada documento é um registro autônomo; o vínculo com o funcionário é feito pelo
campo `idFuncionarioTitular`. Schema gravado por `serializeDocumento`
(`src/services/documentoService.js`):

| Campo | Tipo | Observação |
|---|---|---|
| `id` | string | id do documento no Firestore |
| `idDocumento` | string | igual ao `id` (gravado na criação) |
| `idFuncionarioTitular` | string | **obrigatório** — id do funcionário |
| `nomeFuncionarioTitular` | string | denormalizado (nome do titular) |
| `emailTitular` | string | denormalizado |
| `tipoDocumento` | string | **obrigatório** (ex.: ASO, NR-35) |
| `descricao` | string | descrição livre |
| `arquivoUrl` | string | URL do arquivo no Cloudinary (pasta `documentos`) |
| `arquivoNome` | string | nome do arquivo exibido |
| `dataEmissao` | string | ISO `YYYY-MM-DD` |
| `dataValidade` | string | ISO `YYYY-MM-DD` ou `''` (sem validade) |
| `observacao` | string | observações |
| `status` | string | **obrigatório** (ex.: Válido/Vencido/Próximo) |
| `resultado` | string | opcional (docs de ASO: Apto/Inapto etc.) |
| `criadoPor` | string \| null | autor da criação |
| `_criadoEm` | timestamp | `serverTimestamp()` |
| `_atualizadoEm` | timestamp | `serverTimestamp()` |

**Regras:**
- `semValidade` existe apenas no formulário; no banco vira `dataValidade: ''`.
- Datas formatadas como `DD/MM/YYYY` na UI, ISO no banco (`src/utils/format.js`).
- Operações em `src/services/documentoService.js`:
  `createDocumento`, `updateDocumento`, `deleteDocumento`.
- Ao criar/atualizar/excluir, dispara **webhook** (`notifyDocumentEvent`,
  `src/services/webhookService.js`) com eventos `criado` / `atualizado` / `excluido`
  (payload inclui o arquivo em base64).
- Arquivos binários ficam no **Cloudinary** (pastas `funcionarios`, `documentos`);
  upload via `uploadImage` / `uploadDocument` (`src/services/cloudinary.js`).

### Enriquecimento na leitura
`useDocumentos` (`src/hooks/useDocumentos.js`) faz join em memória com o titular e
adiciona: `id_funcionario`, `funcionario_nome`, `funcionario_cargo`,
`funcionario_foto`, `data_validade_date`.

---

## Fluxos do módulo Documentos (estado atual)

1. **Listar**: `DocumentosPage` — tabela global, busca, filtros por status,
   mini-cards de resumo, webhook de notificações.
2. **Novo/Editar (registro)**: botão `Novo Documento` ou lápis por linha →
   `docView { kind: 'novo' | 'editar' }` → `DocumentoFormularioPage`
   (`DocumentoForm` + `FileUpload`, upload Cloudinary + `updateDocumento`).
3. **Abrir arquivo**: link `ExternalLink` → URL crua do Cloudinary em nova aba.
4. **Excluir**: `Trash2` com `window.confirm` → `deleteDocumento` (webhook).
5. **Sem editores in-app** (Word/PDF/imagem): a edição de conteúdo dos arquivos
   foi descontinuada; documentos são abertos no visualizador do navegador.

---

## Arquivos principais do módulo Documentos

### Serviços / dados
- `src/services/documentoService.js` — CRUD + schema + webhook
- `src/services/webhookService.js` — POST em criar/atualizar/excluir
- `src/services/cloudinary.js` — `uploadImage` + `uploadDocument`
- `src/services/configService.js` — config/empresa.webhook, config/documentos
- `src/hooks/useDocumentos.js` — lista global + join do titular
- `src/hooks/useAlertas.js` — vencidos/próximos para o sino

### Componentes
- `src/components/documentos/DocumentoForm.jsx` — formulário (inline/modal)
- `src/components/documentos/FileUpload.jsx` — upload Cloudinary e abrir arquivo
- `src/components/documentos/DocumentoPreview.jsx` — iframe de preview da URL
- `src/components/AlertBell.jsx` — sino com badge/dropdown

### Páginas
- `src/pages/DocumentosPage.jsx` — tabela global + filtros + ações
- `src/pages/DocumentoFormularioPage.jsx` — novo/editar registro

### Navegação
- `src/App.jsx` — `Shell` com `activePage` + `docView` (sem react-router)

---

## Pendências / próximos passos

1. **Commitar a remoção dos editores** (mammoth/jspdf/pdfjs-dist desinstalados,
   arquivos deletados, rotas e botões limpos) após validar em dev.
2. **Testar** a linha de documento: só os 3 botões (abrir / editar registro / excluir).
3. **Módulos futuros**: OS, Financeiro, Equipamentos (hoje placeholders).

---

## Firestore Rules (pendente — aplicar quando ativar o Firebase)

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Config global (empresa, tipos, etc.)
    match /config/{doc} {
      allow read, write: if request.auth != null;
    }

    // Funcionários
    match /funcionarios/{id} {
      allow read, write: if request.auth != null;
    }

    // Documentos (coleção plana)
    match /documentos/{id} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Comandos úteis
```powershell
# Iniciar dev server
cd C:\Users\softw\SoftwaresEHS\jps
npm run dev

# Build de produção
npm run build

# Verificar se dev está rodando
Test-NetConnection localhost -Port 5173

# Ver o que está alterado e ainda não commitado
git status --short
git diff
```

---

## Convenções do projeto
- Caminhos: `@/` → `src/` (alias Vite)
- Componentes: PascalCase em `src/components/`
- Páginas: PascalCase em `src/pages/` (uma por módulo)
- Serviços: camelCase em `src/services/` (Firestore, Cloudinary, config, webhook)
- Hooks: `src/hooks/` (useDocumentos, useAlertas, useCollection)
- Contexto: `src/context/` (Theme, Config, Auth)
- Estilo: Tailwind CSS com temas claro/escuro; classes utilitárias custom
  (`card`, `btn-primary`, `btn`, `btn-sm`, `input`, `table-std`, `modal-overlay`)
- Formatação de datas: DD/MM/YYYY (PT-BR), ISO no banco
- Navegação: sem react-router; views internas via estado no `Shell` (App.jsx)
- Arquivos binários: Cloudinary (pastas `funcionarios`, `documentos`)
- Geração de modelos de documentos: `scripts/generate-modelos.js`
  (docxtemplater + jszip, apenas no servidor)