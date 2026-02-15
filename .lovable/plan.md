
## Refatorar OAuth Google para usar `crm.renovedigital.com.br` como Redirect URI

### Resumo

Atualmente o Google redireciona para a Edge Function do Supabase (`ybzhlsalbnxwkfszkloa.supabase.co/functions/v1/google-auth?action=callback`), que processa os tokens e depois redireciona para o frontend. 

A proposta e redirecionar o Google diretamente para o frontend (`crm.renovedigital.com.br/oauth/google/callback`), onde uma pagina captura o `code` e envia para a Edge Function processar via POST.

### Fluxo Proposto

```text
[Usuario clica "Conectar"]
       |
       v
[Frontend] --> Edge Function (action: auth-url)
       |         redirect_uri = https://crm.renovedigital.com.br/oauth/google/callback
       v
[Google Consent Screen] --> Usuario autoriza
       |
       v
[Google redireciona para] --> crm.renovedigital.com.br/oauth/google/callback?code=XXX&state=YYY
       |
       v
[Pagina OAuthCallback] --> Captura code/state, envia POST para Edge Function (action: exchange-code)
       |
       v
[Edge Function] --> Troca code por tokens, salva em conexoes_google
       |
       v
[Frontend] --> Redireciona para /configuracoes/conexoes?success=google
```

### Alteracoes

#### 1. Nova pagina: `src/pages/OAuthGoogleCallbackPage.tsx`
- Rota publica `/oauth/google/callback`
- Ao montar, captura `code` e `state` da URL
- Envia POST para Edge Function `google-auth` com `action: "exchange-code"`
- Em caso de sucesso, redireciona para `/configuracoes/conexoes?success=google`
- Em caso de erro, redireciona para `/configuracoes/conexoes?error=google_failed`
- Exibe loading spinner durante o processamento

#### 2. Registrar rota em `src/App.tsx`
- Adicionar `<Route path="/oauth/google/callback" element={<OAuthGoogleCallbackPage />} />` como rota publica

#### 3. Atualizar Edge Function `supabase/functions/google-auth/index.ts`
- Na action `auth-url`: usar `redirect_uri` vindo do frontend (que sera `https://crm.renovedigital.com.br/oauth/google/callback`) diretamente como `redirect_uri` do Google OAuth
- Nova action `exchange-code`: recebe `code` e `state` via POST do frontend, troca por tokens, salva na tabela `conexoes_google`. Retorna JSON de sucesso/erro (sem redirect HTTP)
- Remover a action `callback` antiga (que fazia redirect HTTP da Edge Function)

#### 4. Atualizar `GoogleCalendarConexaoModal.tsx`
- Ajustar o `redirect_uri` para `https://crm.renovedigital.com.br/oauth/google/callback`

### Acao Manual no Google Cloud Console

Nas credenciais OAuth (APIs e Servicos > Credenciais):
- **Adicionar** URI de redirecionamento autorizada: `https://crm.renovedigital.com.br/oauth/google/callback`
- **Remover** (se existir): `https://ybzhlsalbnxwkfszkloa.supabase.co/functions/v1/google-auth?action=callback`

### Secao Tecnica

| Arquivo | Tipo | Alteracao |
|---|---|---|
| `src/pages/OAuthGoogleCallbackPage.tsx` | Novo | Pagina que captura code/state e envia para Edge Function |
| `src/App.tsx` | Editar | Adicionar rota `/oauth/google/callback` |
| `supabase/functions/google-auth/index.ts` | Editar | Nova action `exchange-code`, remover `callback` antigo, ajustar `auth-url` |
| `src/modules/configuracoes/components/integracoes/GoogleCalendarConexaoModal.tsx` | Editar | Ajustar redirect_uri |
| **Google Cloud Console** | Manual | Atualizar URI de redirecionamento autorizada |
