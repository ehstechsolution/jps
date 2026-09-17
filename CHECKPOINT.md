# Checkpoint — JPS Steel Backoffice
> Gerado automaticamente em 2026-09-16

## Estado atual do projeto
- **Build**: ✅ OK (vite build, 9.17s, chunks code-split corretamente)
- **Dev server**: rodando em `http://localhost:5173` (reiniciar com `npm run dev`)
- **Banco**: Firebase `jps-2027` (reais) + Cloudinary `drqydkpcv`/`jpsUploads`
- **Autenticação**: login/cadastro funcional, perfil admin básico

---

## Módulos implementados e funcionando

### 1. Login/Cadastro (AuthPage)
- Login com e-mail/senha, criação de conta, redefinição de senha
- Perfil administrativo básico (isAdmin)
- Logo transparente com fundo removido (h-28 desktop, h-20 mobile)
- Copy: "Banco de dados sincronizado no momento em que acontece"

### 2. Dashboard (Dashboard.jsx)
- KPIs: total funcionários, documentos válidos, documentos vencidos, alertas
- Mini-cards com ícones e cores por status
- Gráfico de documentos por vencimento (Recharts)

### 3. Funcionários (FuncionariosPage.jsx)
- CRUD completo (criar, editar, listar, excluir)
- Busca por nome, filtro por setor/status
- Avatar com foto (upload Cloudinary, pasta `funcionarios`)
- Painel de documentos SST (Drawer lateral com tempo real)
- Botão FileText na linha abre o drawer de documentos do funcionário

### 4. Documentos SST (módulo completo)

#### Arquivos principais:
- `src/services/webhookService.js` — POST em criar/atualizar/excluir documento
- `src/services/documentoService.js` — CRUD + notificações webhook
- `src/services/configService.js` — config/empresa.webhook, config/documentos
- `src/services/modelosService.js` — catálogo de modelos DOCX (ASO, Declaração)
- `src/services/cloudinary.js` — uploadImage + uploadDocument
- `src/hooks/useDocumentos.js` — useDocumentos (global) + useDocumentosFuncionario (realtime)
- `src/hooks/useAlertas.js` — documentos vencidos/próximos para o sino
- `src/components/AlertBell.jsx` — sino no PageHeader com badge e dropdown
- `src/components/pdf/PdfEditor.jsx` — editor de PDF com carimbo de texto/data/assinatura
- `src/components/documentos/DocumentoForm.jsx` — formulário modal + inline (prop `inline`/`hideOwnerSelect`)
- `src/components/documentos/FileUpload.jsx` — upload de arquivo (Cloudinary)
- `src/components/documentos/DocumentosDrawer.jsx` — painel lateral por funcionário
- `src/components/modelos/ModeloForm.jsx` — formulário de preenchimento de modelo DOCX
- `src/components/modelos/ModelosGaleria.jsx` — grade de modelos disponíveis
- `src/pages/DocumentosPage.jsx` — tabela global + filtros + webhook admin + ações
- `src/pages/DocumentoNovoPage.jsx` — página dedicada (abas: modelo / upload)
- `src/pages/DocumentoEditarPage.jsx` — carimbar/assinar PDF existente

#### Funcionalidades:
- **Tabela global**: busca, filtros (Válidos/Próximos/Vencidos), mini-cards de resumo
- **Drawer por funcionário**: CRUD, abre arquivo, botão "Carimbar" (PDFs)
- **Novo Documento (página dedicada)**: aba "Preencher modelo" (galeria + geração DOCX) e aba "Enviar arquivo"
- **Carimbar PDF**: campos de Texto, Data e Assinatura desenhada; exporta novo PDF (original intacto)
- **Webhook**: POST em criar/atualizar/excluir; URL configurável em DocumentosPage; payload inclui arquivo em base64
- **Alerta in-app**: sino no PageHeader com badge (count > 99 → 99+), dropdown agrupado, navega para documentos
- **Exclusão**: agora envia documento completo (não só ID) ao webhook
- **Templates DOCX**: ASO e Declaração gerados por `scripts/generate-modelos.js`

#### Dependências novas (code-split via dynamic import):
- `pdf-lib` ^1.17.1 — export PDF com carimbos
- `pdfjs-dist` ^6.3.290 — renderização de PDF
- `docxtemplater` ^3.70.0 — preenchimento de modelos DOCX
- `jszip` ^3.10.2 — manipulação de arquivos DOCX

---

## O que NÃO foi implementado (decisão do usuário)
- **Envio por e-mail/Gmail** via Pipedream — o usuário vai montar por fora
- O webhook externo (alerta externo) é responsabilidade do usuário — o app emite o POST

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

    // Funcionários e subcoleção de documentos
    match /funcionarios/{id} {
      allow read, write: if request.auth != null;

      match /documentos_sst/{d} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

---

## Pendências / próximos passos (quando voltar)
1. **Ativar Firestore** no projeto `jps-2027` e aplicar as regras acima
2. **Testar webhook**: configurar URL em Documentos → Notificações externas; criar/editar/excluir documento e verificar o POST
3. **Testar modelos DOCX**: Documentos → Novo Documento → Preencher modelo → ASO → gerar
4. **Testar carimbo PDF**: Documentos → selecionar PDF existente → ícone "Carimbar" → adicionar texto/data/assinar → Salvar PDF
5. **Ajustes de UX** que o usuário solicitar
6. **Módulos futuros**: OS, Financeiro, Equipamentos (hoje são placeholders)

---

## Comandos úteis
```powershell
# Iniciar dev server
cd C:\Users\softw\SoftwaresEHS\jps
npm run dev

# Build de produção
npm run build

# Regenerar modelos DOCX (após editar script)
node scripts/generate-modelos.js

# Verificar se dev está rodando
Test-NetConnection localhost -Port 5173
```

---

## Convencões do projeto
- Caminhos: `@/` → `src/` (alias Vite)
- Componentes: PascalCase em `src/components/`
- Páginas: PascalCase em `src/pages/` (uma por módulo)
- Serviços: camelCase em `src/services/` (Firestore, Cloudinary, config, webhook)
- Hooks: `src/hooks/` (useDocumentos, useAlertas, useCollection)
- Contexto: `src/context/` (Theme, Config, Auth)
- Estilo: Tailwind CSS com temas claro/escuro; classes utilitárias custom (`card`, `btn-primary`, `input`, `table-std`, `modal-overlay`)
- Formatação de datas: DD/MM/YYYY (PT-BR), ISO no banco
- Navegação: sem react-router; views internas via estado no `Shell` (App.jsx)
- Arquivos binários: Cloudinary (pastas `funcionarios`, `modelos`, `documentos`)
