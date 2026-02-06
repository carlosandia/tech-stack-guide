

# Implementacao Completa do Modulo Conexoes (PRD-08)

## Contexto

O modulo de Conexoes atual possui apenas uma estrutura basica (pagina com cards de status e stubs no service layer). O PRD-08 define 5 conexoes completas com modais especificos, fluxos OAuth, e integracao com o backend. Este plano cobre a implementacao **frontend completa** de cada conexao conforme documentado.

## O que ja existe

- `ConexoesPage.tsx` - Pagina com grid de cards (funcional, exibe status)
- `ConexaoCard.tsx` - Card por plataforma com status/acoes
- `integracoesApi` em `configuracoes.api.ts` - Stubs que fazem queries basicas
- `useIntegracoes.ts` - Hooks React Query para listar/desconectar/sincronizar
- Backend: Rotas e services para WhatsApp, Google, Email, Meta, Instagram ja implementados

## O que falta (escopo deste plano)

### 1. Modal WhatsApp QR Code
Conforme PRD-08 secao 1.3, ao clicar "Conectar WhatsApp":
- Modal com instrucoes passo-a-passo
- QR Code renderizado (imagem base64 do backend)
- Timer de expiracao do QR (polling a cada 5s)
- Deteccao automatica de conexao bem-sucedida
- Estado conectado com numero, nome, ultimo envio

**Arquivos novos:**
- `src/modules/configuracoes/components/integracoes/WhatsAppQrCodeModal.tsx`

### 2. Modal Email (Gmail OAuth + SMTP Manual)
Conforme PRD-08 secao 6.4, ao clicar "Conectar Email SMTP":
- Modal com 2 tabs: "Gmail OAuth" e "SMTP Manual"
- Tab Gmail OAuth: botao "Conectar com Google", lista de vantagens
- Tab SMTP Manual: campos email + senha, botao "Testar Conexao"
- Auto-deteccao de provedor SMTP baseado no dominio

**Arquivos novos:**
- `src/modules/configuracoes/components/integracoes/EmailConexaoModal.tsx`

### 3. Modal Instagram Direct
Conforme PRD-08 secao 7.4, ao clicar "Conectar Instagram Direct":
- Modal com instrucoes e requisitos (conta Business/Creator)
- Botao "Conectar Instagram" que redireciona para OAuth Meta
- Estado conectado com username, avatar, token expira em X dias

**Arquivos novos:**
- `src/modules/configuracoes/components/integracoes/InstagramConexaoModal.tsx`

### 4. Modal Meta Ads
Conforme PRD-08 secao 2.3, ao clicar "Conectar Meta Ads":
- Modal com explicacao do fluxo OAuth
- Botao que redireciona para Facebook OAuth
- Detalhes da conexao apos conectado

**Arquivos novos:**
- `src/modules/configuracoes/components/integracoes/MetaAdsConexaoModal.tsx`

### 5. Modal Google Calendar
Conforme PRD-08 secao 5.2.3, ao clicar "Conectar Google Calendar":
- Modal com lista de beneficios (criar eventos, agendar reunioes, etc)
- Botao "Conectar Google Calendar" que redireciona para OAuth
- Apos conectado: seletor de calendario

**Arquivos novos:**
- `src/modules/configuracoes/components/integracoes/GoogleCalendarConexaoModal.tsx`

### 6. Atualizar ConexoesPage.tsx
- Integrar os 5 modais (state para modal aberto, por plataforma)
- Handling de callback OAuth (ler `code` e `state` da URL)

### 7. Atualizar configuracoes.api.ts
- Enriquecer `integracoesApi` com chamadas reais ao backend
- Adicionar endpoints: WhatsApp QR, SMTP testar/detectar
- Mapear corretamente os dados retornados por cada tabela

### 8. Atualizar tipo `Integracao`
- Adicionar campos faltantes ao tipo: `tipo` (gmail_oauth/smtp_manual), `conectado_em`, `email`, `phone_number`, `phone_name`, `instagram_username`, etc.

### 9. Atualizar ConexaoCard.tsx
- Mostrar informacoes especificas por plataforma quando conectado
- WhatsApp: numero + nome
- Email: email + tipo (Gmail OAuth / SMTP)
- Google: email + calendario selecionado
- Instagram: @username
- Meta: nome da conta

---

## Detalhamento Tecnico

### Estrutura de arquivos novos

```
src/modules/configuracoes/components/integracoes/
  ConexaoCard.tsx              (existente - atualizar)
  WhatsAppQrCodeModal.tsx      (novo)
  EmailConexaoModal.tsx        (novo)
  InstagramConexaoModal.tsx    (novo)
  MetaAdsConexaoModal.tsx      (novo)
  GoogleCalendarConexaoModal.tsx (novo)
```

### WhatsAppQrCodeModal - Detalhes

- Usa `ModalBase` existente com `size="md"`
- Ao abrir: chama `POST /api/v1/conexoes/whatsapp/iniciar` para criar sessao
- Exibe QR code via `GET /api/v1/conexoes/whatsapp/qr-code` (imagem base64)
- Polling a cada 5s em `GET /api/v1/conexoes/whatsapp/status` para detectar conexao
- Countdown timer (60s) para expiracao do QR
- Botao "Gerar Novo QR Code" quando expira
- Ao detectar `status: "connected"` fecha modal e atualiza lista
- Instrucoes em 4 passos conforme PRD

### EmailConexaoModal - Detalhes

- Usa `ModalBase` com `size="md"`
- Estado de tab: `gmail_oauth` | `smtp_manual`
- Tab Gmail OAuth:
  - Banner informativo azul com vantagens
  - Botao primario "Conectar com Google" que chama auth-url do backend
- Tab SMTP Manual:
  - Campo email (input type email, obrigatorio)
  - Campo senha (input type password com toggle visibility, obrigatorio)
  - Botao "Testar Conexao" que chama endpoint de teste SMTP
  - Feedback de teste: loading, sucesso, erro
  - Botao "Salvar" apos teste bem-sucedido
  - Auto-deteccao do provedor mostrada em texto informativo

### InstagramConexaoModal - Detalhes

- Usa `ModalBase` com `size="sm"`
- Lista de requisitos (conta Business/Creator)
- Botao "Conectar Instagram" que redireciona para OAuth via Meta

### MetaAdsConexaoModal - Detalhes

- Usa `ModalBase` com `size="sm"`
- Explicacao do que sera conectado (Lead Ads, CAPI, Audiences)
- Botao "Conectar Meta Ads" que redireciona para Facebook OAuth

### GoogleCalendarConexaoModal - Detalhes

- Usa `ModalBase` com `size="sm"`
- Lista de recursos (criar eventos, agendar reunioes, Google Meet, notificacoes)
- Botao "Conectar Google Calendar" que redireciona para OAuth

### integracoesApi - Atualizacoes

```typescript
// Novos metodos:
whatsapp: {
  iniciarSessao: () => api.post('/conexoes/whatsapp/iniciar')
  obterQrCode: () => api.get('/conexoes/whatsapp/qr-code')
  obterStatus: () => api.get('/conexoes/whatsapp/status')
  desconectar: () => api.post('/conexoes/whatsapp/desconectar')
}

email: {
  salvarSmtp: (payload) => api.post('/conexoes/email/smtp', payload)
  testarSmtp: (payload) => api.post('/conexoes/email/smtp/testar', payload)
  detectarSmtp: (email) => api.post('/conexoes/email/smtp/detectar', { email })
  obterAuthUrl: () => api.get('/conexoes/email/google/auth-url')
  desconectar: () => api.delete('/conexoes/email')
}
```

### ConexoesPage - Atualizacoes

- State `modalAberto: PlataformaIntegracao | null`
- Switch no `handleConectar` para abrir o modal correto por plataforma
- `useEffect` para processar callback OAuth (detectar `code` na URL)
- Renderizar os 5 modais condicionalmente

### ConexaoCard - Atualizacoes

- Props adicionais para dados especificos da plataforma
- Renderizar info contextual quando conectado (numero, email, username, etc)
- Botao de "Abrir" externo (Abrir Calendar, Abrir Instagram, etc)

### useIntegracoes.ts - Novos hooks

```typescript
useWhatsAppSessao()     // Iniciar sessao
useWhatsAppQrCode()     // Polling QR code
useWhatsAppStatus()     // Polling status
useEmailSmtpTestar()    // Testar conexao SMTP
useEmailSmtpSalvar()    // Salvar config SMTP
```

---

## Sequencia de Implementacao

1. Atualizar tipos e `integracoesApi` (service layer)
2. Criar novos hooks em `useIntegracoes.ts`
3. Criar `WhatsAppQrCodeModal.tsx`
4. Criar `EmailConexaoModal.tsx`
5. Criar `InstagramConexaoModal.tsx`
6. Criar `MetaAdsConexaoModal.tsx`
7. Criar `GoogleCalendarConexaoModal.tsx`
8. Atualizar `ConexaoCard.tsx` com informacoes detalhadas
9. Atualizar `ConexoesPage.tsx` para integrar modais e callback OAuth

---

## Estilo e UX (conforme Design System)

- Modais usam `ModalBase` existente (rounded-lg, shadow-lg, animacoes)
- Inputs: `rounded-md`, `text-sm`, focus ring `ring-primary`
- Botoes: primario `bg-primary`, secundario `bg-secondary`, destructive `bg-destructive`
- Badges de status: verde/vermelho/amarelo conforme cores semanticas do DS
- Espacamento: `space-y-4` entre campos, `p-6` no content
- Tipografia: titulos `text-lg font-semibold`, descricoes `text-sm text-muted-foreground`
- Tabs: `text-sm font-medium` com border-bottom ativo
- Responsividade: modais `w-[calc(100%-32px)]` mobile, max-w no desktop

