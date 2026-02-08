

# Plano de Implementacao: PRD-11 - Caixa de Entrada de Email

## Visao Geral

Implementar o modulo de Caixa de Entrada de Email, permitindo que usuarios (Admin/Member) recebam, leiam e respondam emails diretamente no CRM. O Super Admin **nao** utiliza este modulo, mas ele deve aparecer no painel de modulos e nos planos.

Dado o tamanho do PRD (14 RFs + tabelas + backend + frontend), o plano sera dividido em **3 etapas** para implementacao incremental.

---

## Etapa 1 - Banco de Dados + Modulo no Super Admin + Backend Base

### 1.1 Tabelas no Supabase (SQL via migration)

Criar 5 tabelas conforme definido no PRD-11:

**`emails_recebidos`** - Tabela principal de emails sincronizados/recebidos:
- `id`, `organizacao_id`, `usuario_id`, `conexao_email_id`
- Identificadores externos: `message_id`, `thread_id`, `provider_id`
- Cabecalho: `de_email`, `de_nome`, `para_email`, `cc_email`, `bcc_email`, `assunto`
- Conteudo: `preview`, `corpo_texto`, `corpo_html`, `tem_anexos`, `anexos_info` (jsonb)
- Status: `pasta` (inbox/sent/drafts/archived/trash), `lido`, `favorito`
- Vinculacao CRM: `contato_id`, `oportunidade_id`
- Timestamps: `data_email`, `sincronizado_em`, `criado_em`, `atualizado_em`, `deletado_em`
- Constraint UNIQUE: `(organizacao_id, usuario_id, message_id)`

**`emails_rascunhos`** - Rascunhos de email:
- `id`, `organizacao_id`, `usuario_id`
- `tipo` (novo/resposta/encaminhar), `email_original_id`
- Conteudo: `para_email`, `cc_email`, `bcc_email`, `assunto`, `corpo_html`, `anexos_temp`
- Timestamps

**`emails_tracking`** - Rastreamento de abertura:
- `id`, `organizacao_id`, `email_id`, `message_id`
- `tipo` (enviado/entregue/aberto/clicado), `contador`
- `ip`, `user_agent`, `primeira_vez`, `ultima_vez`

**`emails_assinaturas`** - Assinatura por usuario:
- `id`, `organizacao_id`, `usuario_id`
- `assinatura_html`, `incluir_em_respostas`, `incluir_em_novos`
- UNIQUE: `(organizacao_id, usuario_id)`

**`emails_sync_estado`** - Estado de sincronizacao:
- `id`, `organizacao_id`, `usuario_id`, `conexao_email_id`
- `ultimo_sync`, `ultimo_history_id`, `ultimo_uid_validity`, `ultimo_uid`
- `status` (pendente/sincronizando/ok/erro), `erro_mensagem`, `tentativas_erro`

### 1.2 Indices

- `idx_emails_tenant_user_pasta` em `(organizacao_id, usuario_id, pasta, data_email DESC)`
- `idx_emails_tenant_user_lido` em `(organizacao_id, usuario_id, lido)`
- `idx_emails_contato` em `(contato_id)`
- `idx_emails_message_id` em `(message_id)`
- `idx_emails_busca` GIN para busca full-text em `assunto + corpo_texto`
- `idx_tracking_message` em `(message_id)`

### 1.3 RLS Policies

Todas as tabelas com RLS habilitado. Policies baseadas em `organizacao_id` usando `get_user_tenant_id()`, garantindo isolamento multi-tenant. O `usuario_id` tambem sera verificado para emails (cada usuario so ve seus proprios emails).

### 1.4 Triggers

- `trigger_set_atualizado_em` nas tabelas `emails_recebidos`, `emails_rascunhos`, `emails_assinaturas`, `emails_sync_estado`

### 1.5 Modulo no Super Admin

Inserir novo registro na tabela `modulos`:
- slug: `caixa-entrada-email`
- nome: `Caixa de Entrada`
- descricao: `Receber, ler e responder emails via IMAP/Gmail API`
- icone: `Mail`
- obrigatorio: `false`
- ordem: `9` (apos Automacoes)
- requer: `['conexoes']`

Vincular aos planos Pro e Enterprise na tabela `planos_modulos`.

### 1.6 Backend - Routes e Service

**Novos arquivos:**

- `backend/src/routes/emails.ts` - Rotas conforme PRD-11:
  - `GET /api/v1/emails` - Listar emails (com filtros, paginacao, pasta)
  - `GET /api/v1/emails/:id` - Detalhe de um email
  - `PATCH /api/v1/emails/:id` - Atualizar (lido, favorito, pasta)
  - `DELETE /api/v1/emails/:id` - Mover para lixeira
  - `POST /api/v1/emails/lote` - Acoes em lote
  - `POST /api/v1/emails/enviar` - Enviar novo email
  - `POST /api/v1/emails/:id/responder` - Responder
  - `POST /api/v1/emails/:id/encaminhar` - Encaminhar
  - `GET /api/v1/emails/rascunhos` - Listar rascunhos
  - `POST /api/v1/emails/rascunhos` - Criar/atualizar rascunho
  - `DELETE /api/v1/emails/rascunhos/:id` - Deletar rascunho
  - `POST /api/v1/emails/sync` - Forcar sincronizacao
  - `GET /api/v1/emails/sync/status` - Status do sync
  - `GET /api/v1/emails/assinatura` - Obter assinatura
  - `PUT /api/v1/emails/assinatura` - Salvar assinatura
  - `GET /api/v1/emails/:id/anexos/:anexoId` - Download de anexo

- `backend/src/services/caixa-entrada.service.ts` - Service principal:
  - Sincronizacao Gmail API (usando googleapis ja instalado)
  - Sincronizacao IMAP (necessario instalar `imapflow`)
  - Vinculacao automatica com contatos (busca por email em `contatos`)
  - Envio usando `email.service.ts` existente do PRD-08
  - Gerenciamento de rascunhos
  - Assinatura

- `backend/src/schemas/emails.ts` - Schemas Zod para validacao

**Registro em `backend/src/index.ts`:**
- `app.use('/api/v1/emails', authMiddleware, requireTenant, emailsRoutes)`

**Nova dependencia no backend:**
- `imapflow` - Biblioteca moderna para IMAP (substitui node-imap, melhor API async)

---

## Etapa 2 - Frontend: Pagina Principal `/emails`

### 2.1 Estrutura do Modulo

```text
src/modules/emails/
  index.ts              -- Barrel export
  pages/
    EmailsPage.tsx      -- Pagina principal split-view
  components/
    EmailsList.tsx       -- Lista de emails (esquerda)
    EmailItem.tsx        -- Item individual na lista
    EmailViewer.tsx      -- Painel de leitura (direita)
    EmailComposer.tsx    -- Modal de composicao/resposta
    EmailToolbar.tsx     -- Toolbar com pastas e acoes
    EmailFilters.tsx     -- Busca e filtros rapidos
    EmailBatchBar.tsx    -- Barra de acoes em lote
    ContatoCard.tsx      -- Card do contato vinculado
    EmailEmpty.tsx       -- Estado vazio
    AssinaturaConfig.tsx -- Config de assinatura (modal)
  hooks/
    useEmails.ts         -- React Query hooks
    useEmailSync.ts      -- Hook de sincronizacao
  services/
    emails.api.ts        -- Chamadas API via axios
```

### 2.2 Layout da Pagina (Desktop)

Split-view conforme PRD-11:
- **Esquerda (380px):** Toolbar (pastas: Inbox/Enviados/Rascunhos/Arquivados/Lixeira) + Lista de emails com scroll infinito
- **Direita (flex):** Painel de leitura com cabecalho, corpo HTML sanitizado, anexos, acoes (Responder/Encaminhar/Arquivar/Deletar), e card do contato vinculado

### 2.3 Mobile

- Lista e leitura em telas separadas (estado controlado)
- Toolbar como dropdown de pastas
- Navegacao por swipe ou back button

### 2.4 Rota no App

Adicionar em `src/App.tsx`:
```
<Route path="emails" element={<EmailsPage />} />
```

Dentro do bloco `/app` (Admin/Member).

### 2.5 Menu de Navegacao

Adicionar item no `AppLayout.tsx`:
```
{ label: 'Emails', path: '/app/emails', icon: Mail }
```

Com badge de contador de nao-lidos.

### 2.6 Estilizacao

Seguir fielmente o `docs/designsystem.md`:
- Cores: tokens semanticos (primary, muted-foreground, border, etc.)
- Tipografia: text-sm (14px) para lista, text-base para leitura
- Espacamento: p-3, p-4 conforme hierarquia
- Border radius: rounded-md (6px), rounded-lg (8px)
- Glass effect no header conforme padrao existente
- Z-index conforme design system

---

## Etapa 3 - Funcionalidades Complementares

### 3.1 Composicao de Email

- Modal `EmailComposer` com editor TipTap (ja instalado no projeto)
- Autocomplete de destinatarios buscando contatos do CRM
- Campos Cc/Bcc ocultos por padrao
- Upload de anexos (max 25MB)
- Assinatura automatica
- Auto-save de rascunho a cada 30s

### 3.2 Vinculacao com Contatos

- Busca automatica em `contatos` pelo email do remetente
- Card do contato com oportunidades vinculadas
- Botao "Criar Contato" se nao existir
- Botao "Criar Tarefa" a partir do email

### 3.3 Busca e Filtros

- Campo de busca com debounce 300ms
- Filtros: nao lidos, com anexos, favoritos, de contatos CRM, periodo
- Filtros combinaveis (AND logico)

### 3.4 Acoes em Lote

- Checkbox para selecao multipla
- Barra flutuante com acoes: marcar lido, arquivar, deletar, favoritar
- Confirmacao para acoes destrutivas

### 3.5 Notificacoes

- Badge com contador de nao-lidos no menu (icone Mail)
- Toast ao receber novo email via polling (60s)

### 3.6 Assinatura de Email

- Editor rich text (TipTap) para criar assinatura
- Opcoes: incluir em novos emails, incluir em respostas

### 3.7 Rastreamento (Could-have)

- Pixel 1x1 transparente inserido no HTML
- Rota publica `GET /t/:trackingId.gif`
- Indicadores: Enviado, Entregue, Lido

---

## Detalhes Tecnicos

### Sincronizacao

- **Gmail API:** Usa `googleapis` (ja instalado). Scopes `gmail.readonly` e `gmail.modify` ja definidos no `EmailService`. Sync inicial: ultimos 100 emails. Sync incremental: via `history.list()` a cada 60s ou sob demanda.
- **IMAP:** Usa `imapflow` (a instalar). Conecta ao servidor IMAP do provedor. Sync inicial: FETCH ultimos 100 emails da INBOX. Sync incremental: polling a cada 60s com SEARCH SINCE.
- **Deduplicacao:** Por `Message-ID` (RFC 5322), constraint UNIQUE na tabela.

### Seguranca

- HTML de emails sanitizado com DOMPurify (a instalar no frontend)
- Credenciais IMAP criptografadas com `encrypt()` existente (AES via crypto-js)
- Tokens OAuth ja criptografados pelo PRD-08
- Conteudo de emails armazenado no banco (nao em cache)

### Dependencias a Instalar

**Backend:**
- `imapflow` - Cliente IMAP moderno com async/await

**Frontend:**
- `dompurify` + `@types/dompurify` - Sanitizacao de HTML de emails

### Arquivos Existentes Impactados

| Arquivo | Mudanca |
|---------|---------|
| `backend/src/index.ts` | Registrar rotas `/api/v1/emails` |
| `src/App.tsx` | Adicionar rota `/app/emails` |
| `src/modules/app/layouts/AppLayout.tsx` | Adicionar item "Emails" no menu com badge |
| `src/modules/app/index.ts` | Exportar nova pagina |
| Tabela `modulos` (SQL) | INSERT do modulo "Caixa de Entrada" |
| Tabela `planos_modulos` (SQL) | INSERT vinculos com planos Pro/Enterprise |

