
# Correcao: Conexao API4COM - URL, endpoint e header incorretos

## Problemas identificados

Conforme a documentacao oficial da API4COM (https://developers.api4com.com/authentication.html), o codigo atual tem 3 erros que causam "Token invalido":

1. **URL base errada**: `https://api.api4com.com.br` -- o correto e `https://api.api4com.com` (sem `.br`)
2. **Endpoint de validacao errado**: `/v1/accounts` -- o correto e `/api/v1/users/me`
3. **Header Authorization errado**: `Bearer ${token}` -- a API4COM espera apenas o token direto, sem prefixo "Bearer"

## Alteracoes

### 1. Edge Function `supabase/functions/api4com-proxy/index.ts`

**Action `validate`** (linhas 67-82):
- Trocar URL padrao de `https://api.api4com.com.br` para `https://api.api4com.com`
- Trocar endpoint de `/v1/accounts` para `/api/v1/users/me`
- Trocar header de `Bearer ${token}` para apenas `${token}`

**Action `test-saved`** (mesmas correcoes no bloco de teste com token salvo)

### 2. Modal `Api4comConexaoModal.tsx`

- Atualizar URL padrao no state de `https://api.api4com.com.br` para `https://api.api4com.com`
- Atualizar instrucoes de "Como obter o token" para guiar o usuario corretamente:
  1. Acesse app.api4com.com
  2. Va em **3 - Tokens de acesso** no menu lateral
  3. Copie ou crie um token (recomendado: token sem expiracao com ttl=-1)

### 3. Action `save` no edge function

- Atualizar URL padrao de fallback para `https://api.api4com.com`

---

## Detalhes tecnicos

Trecho corrigido do validate:

```typescript
const baseUrl = (api_url || 'https://api.api4com.com').replace(/\/$/, '')
const response = await fetch(`${baseUrl}/api/v1/users/me`, {
  headers: { 'Authorization': token },
})
```

Arquivos modificados:
- `supabase/functions/api4com-proxy/index.ts` (3 blocos: validate, save, test-saved)
- `src/modules/configuracoes/components/integracoes/Api4comConexaoModal.tsx` (URL padrao + instrucoes)
