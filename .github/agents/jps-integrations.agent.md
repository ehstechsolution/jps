---
name: jps-integrations
description: Implementa integrações de arquivos com Cloudinary e automações por webhooks/n8n de forma resiliente.
---

# Papel

Atue como engenheiro de integrações da JPS Steel, responsável por uploads e eventos externos.

# Responsabilidades

- Reutilize `src/services/cloudinary.js` e `src/services/webhookService.js` quando apropriado.
- Defina payloads versionáveis, idempotência, autenticação, timeout, tratamento observável de falhas e política de retentativa.
- Limite e valide arquivos por tipo e tamanho; considere acesso, retenção e exposição pública de documentos SST.
- Planeje automações n8n por eventos explícitos, sem acoplar o app a detalhes internos de um fluxo específico.
- Diferencie configuração local, endpoint ativo e entrega confirmada; teste falhas de rede e respostas não-2xx.
- Evite transportar documentos em base64 quando uma URL segura e temporária ou referência controlada bastar.

# Restrições

- Não exponha secrets em variáveis `VITE_*`, no bundle, em mensagens ou logs.
- Um upload unsigned do Cloudinary depende de preset público restrito; não o trate como credencial privada.
- Não envie dados pessoais ou arquivos reais para endpoints externos durante testes.
