# PRD-16: Pendencias de Infraestrutura - CRM Renove

| Campo | Valor |
|-------|-------|
| **Autor** | Arquiteto de Produto |
| **Data de criacao** | 2026-02-04 |
| **Ultima atualizacao** | 2026-02-04 |
| **Versao** | v1.0 |
| **Status** | Pendente |
| **Dependencia** | PRD-08 (Conexoes) |

---

## 1. Objetivo

Este documento lista as configuracoes de infraestrutura e credenciais externas necessarias para que o modulo de Conexoes (PRD-08) funcione em producao.

O codigo do backend foi implementado, mas depende de:
- Contas/Apps em plataformas externas (Meta, Google)
- Instalacao de servicos (WAHA)
- Configuracao de SSL e webhooks
- Variaveis de ambiente com credenciais

---

## 2. Checklist de Infraestrutura

### 2.1 WAHA Plus (WhatsApp)

| Item | Status | Descricao |
|------|--------|-----------|
| Instalacao WAHA | Pendente | Instalar WAHA Plus no servidor |
| Configurar URL | Pendente | Definir `WAHA_URL` no .env |
| API Key | Pendente | Definir `WAHA_API_KEY` no .env |
| SSL Webhook | Pendente | Endpoint publico HTTPS para webhooks |

**Documentacao oficial:** https://waha.devlike.pro/

**Instalacao recomendada:**
```bash
docker run -d \
  --name waha \
  -p 3000:3000 \
  -e WHATSAPP_HOOK_URL=https://seu-dominio.com/webhooks/waha \
  -e WHATSAPP_HOOK_EVENTS=message \
  devlikeapro/whatsapp-http-api-plus
```

**Variaveis de ambiente:**
```env
WAHA_URL=http://localhost:3000
WAHA_API_KEY=your_waha_api_key
```

---

### 2.2 Meta App (Facebook/Instagram)

| Item | Status | Descricao |
|------|--------|-----------|
| Criar Meta App | Pendente | https://developers.facebook.com |
| Business Verification | Pendente | Verificar empresa no Meta Business |
| Lead Ads Webhook | Pendente | Configurar webhook para Lead Ads |
| App Review | Pendente | Submeter para revisao (leads_retrieval, etc) |
| Configurar SSL | Pendente | Dominio com HTTPS para OAuth callback |

**Permissoes necessarias (App Review):**
- `pages_show_list` - Listar paginas
- `pages_read_engagement` - Ler engajamento
- `pages_manage_metadata` - Gerenciar metadata
- `leads_retrieval` - **Requer App Review** - Obter leads
- `ads_management` - Gerenciar anuncios
- `ads_read` - Ler dados de anuncios
- `business_management` - Gerenciar negocios
- `instagram_basic` - Acesso basico Instagram
- `instagram_manage_messages` - **Requer App Review** - DM Instagram

**Variaveis de ambiente:**
```env
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_REDIRECT_URI=https://seu-dominio.com/api/v1/conexoes/meta/callback
META_WEBHOOK_VERIFY_TOKEN=crm_renove_webhook
```

**Configuracao de Webhook no Meta:**
1. Ir em Meta App > Products > Webhooks
2. Adicionar subscription para "Page"
3. Campos: `leadgen` (Lead Ads)
4. Callback URL: `https://seu-dominio.com/webhooks/meta-leads`
5. Verify Token: usar valor de `META_WEBHOOK_VERIFY_TOKEN`

---

### 2.3 Google Cloud (Calendar + Gmail)

| Item | Status | Descricao |
|------|--------|-----------|
| Criar Projeto | Pendente | https://console.cloud.google.com |
| Ativar APIs | Pendente | Calendar API, Gmail API |
| OAuth Consent Screen | Pendente | Configurar tela de consentimento |
| Criar Credenciais | Pendente | OAuth 2.0 Client ID |
| Dominio Verificado | Pendente | Verificar dominio no Google |

**APIs para ativar:**
- Google Calendar API
- Gmail API

**OAuth Scopes necessarios:**
- `https://www.googleapis.com/auth/calendar` - Acesso completo ao Calendar
- `https://www.googleapis.com/auth/calendar.events` - Gerenciar eventos
- `https://www.googleapis.com/auth/gmail.send` - Enviar emails

**Variaveis de ambiente:**
```env
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://seu-dominio.com/api/v1/conexoes/google/callback
```

---

### 2.4 Criptografia de Tokens

| Item | Status | Descricao |
|------|--------|-----------|
| Gerar ENCRYPTION_KEY | Pendente | Chave AES-256 (32 bytes) |
| Salvar em .env | Pendente | Nao versionar! |

**Como gerar uma chave segura:**
```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# OpenSSL
openssl rand -hex 32
```

**Variavel de ambiente:**
```env
ENCRYPTION_KEY=your_64_character_hex_key_here
```

---

### 2.5 SSL e Dominio

| Item | Status | Descricao |
|------|--------|-----------|
| Dominio | Pendente | Registrar dominio de producao |
| SSL Certificate | Pendente | Certbot/Let's Encrypt |
| Nginx Config | Pendente | Proxy reverso para backend |

**Endpoints que requerem HTTPS publico:**
- `/api/v1/conexoes/meta/callback` - OAuth callback Meta
- `/api/v1/conexoes/google/callback` - OAuth callback Google
- `/webhooks/waha/:organizacao_id` - Webhook WAHA
- `/webhooks/meta-leads` - Webhook Lead Ads
- `/webhooks/instagram` - Webhook Instagram DM

---

## 3. Variaveis de Ambiente Completas

```env
# ===========================================
# PRD-08 - Conexoes: Variaveis Obrigatorias
# ===========================================

# URLs base
API_URL=https://api.seu-dominio.com
FRONTEND_URL=https://app.seu-dominio.com

# WAHA (WhatsApp)
WAHA_URL=http://localhost:3000
WAHA_API_KEY=your_waha_api_key

# Meta (Facebook/Instagram)
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_REDIRECT_URI=https://api.seu-dominio.com/api/v1/conexoes/meta/callback
META_WEBHOOK_VERIFY_TOKEN=crm_renove_webhook

# Google (Calendar + Gmail)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://api.seu-dominio.com/api/v1/conexoes/google/callback

# Criptografia de tokens OAuth
ENCRYPTION_KEY=your_64_character_hex_key_here
```

---

## 4. Ordem de Configuracao Recomendada

### Passo 1: Infraestrutura Base
1. Registrar dominio de producao
2. Configurar servidor com Nginx
3. Instalar certificado SSL (Certbot)
4. Gerar ENCRYPTION_KEY

### Passo 2: Google Cloud
1. Criar projeto no Google Cloud Console
2. Ativar Calendar API e Gmail API
3. Configurar OAuth Consent Screen
4. Criar credenciais OAuth 2.0
5. Adicionar redirect URI

### Passo 3: Meta Developer
1. Criar Meta App no developers.facebook.com
2. Adicionar produtos: Facebook Login, Webhooks
3. Configurar OAuth redirect URIs
4. Configurar webhooks (Lead Ads, Instagram)
5. Submeter para App Review (permissoes avancadas)

### Passo 4: WAHA
1. Instalar WAHA Plus via Docker
2. Configurar webhook URL
3. Testar conexao de sessao

### Passo 5: Testes
1. Testar OAuth Google (Calendar)
2. Testar OAuth Meta (Facebook Login)
3. Testar webhook Lead Ads
4. Testar conexao WhatsApp
5. Testar envio de email (SMTP)

---

## 5. Notas Importantes

### Seguranca
- **NUNCA** versionar arquivos `.env` com credenciais
- Usar `.env.example` apenas com placeholders
- Rotacionar ENCRYPTION_KEY periodicamente
- Tokens OAuth sao criptografados com AES-256 antes de salvar

### App Review do Meta
O processo de App Review pode levar de 1 a 4 semanas. Permissoes avancadas como `leads_retrieval` e `instagram_manage_messages` requerem:
- Politica de privacidade publicada
- Termos de uso publicados
- Demonstracao em video do uso
- Verificacao de negocio

### Limites de API
- **Meta Graph API:** 200 chamadas por usuario/hora
- **Google Calendar API:** 1.000.000 requisicoes/dia
- **Gmail API:** 250 cotas/usuario/dia (envio)
- **WAHA:** Depende da licenca

---

## 6. Contatos e Suporte

| Plataforma | Link |
|------------|------|
| Meta Developer Support | https://developers.facebook.com/support |
| Google Cloud Support | https://cloud.google.com/support |
| WAHA Discord | https://discord.gg/waha |

---

## Historico de Alteracoes

| Data | Versao | Alteracao |
|------|--------|-----------|
| 2026-02-04 | v1.0 | Criacao do documento |
