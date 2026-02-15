
# Correcao do Link de Convite Expirando Imediatamente

## Diagnostico

Analisando os logs de autenticacao e o codigo, identifiquei o problema raiz na `SetPasswordPage`:

**O que acontece:**
1. Junior clica no link do email -> Supabase `/verify` valida o token com sucesso e redireciona para `/auth/set-password#access_token=AT1&refresh_token=RT1&type=invite`
2. O cliente Supabase JS automaticamente detecta o hash fragment e cria uma sessao com AT1/RT1
3. O `useEffect` da SetPasswordPage executa e chama `signOut()` (linha 93) -> isso **revoga o RT1 no servidor**
4. Em seguida, chama `setSession({ access_token: AT1, refresh_token: RT1 })` -> **falha porque RT1 foi revogado**
5. O erro e capturado e a pagina mostra "Token invalido ou expirado"

O `signOut()` foi adicionado para evitar mostrar o email do superadmin caso ele estivesse logado. Porem, na maioria dos casos o convidado esta em seu proprio navegador/dispositivo, e o `signOut()` revoga a sessao recem-criada pelo `/verify`.

## Solucao

Modificar a `SetPasswordPage` para nao revogar a sessao antes de tentar usa-la. Em vez disso:

1. Ler os hash params
2. Se tiver `access_token` + `type=invite/magiclink`, usar `setSession` SEM chamar `signOut` antes
3. Apenas apos confirmar que a sessao esta ativa, verificar se o email corresponde ao convidado
4. Se ja houver uma sessao ativa (ex: superadmin logado), fazer signOut apenas se o email da sessao existente for DIFERENTE do email nos tokens do hash

## Detalhes Tecnicos

### Arquivo: `src/modules/auth/pages/SetPasswordPage.tsx`

Alterar o `useEffect` de verificacao de token:

```typescript
// ANTES (bugado):
if (accessToken && (type === 'invite' || type === 'magiclink')) {
  await supabase.auth.signOut()  // <-- REVOGA o refresh_token do hash!
  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken || '',
  })
  // ...
}

// DEPOIS (corrigido):
if (accessToken && (type === 'invite' || type === 'magiclink')) {
  // NAO chamar signOut antes - o setSession substitui a sessao atual
  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken || '',
  })
  // ...
}
```

Tambem adicionar um fallback: se nao houver hash params, aguardar brevemente o cliente Supabase processar o hash automaticamente (via `onAuthStateChange`) antes de verificar a sessao existente.

### Arquivo: `supabase/functions/invite-admin/index.ts`

Corrigir o `organizacao_nome` que esta chegando como `undefined` nos logs (o wizard nao esta passando esse campo):

### Arquivo: `src/modules/admin/services/admin.api.ts`

Garantir que o `organizacao_nome` seja passado no body da chamada ao `invite-admin` durante a criacao da organizacao.

## Resumo das Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `SetPasswordPage.tsx` | Remover `signOut()` antes do `setSession()` no processamento de tokens de convite |
| `admin.api.ts` | Passar `organizacao_nome` no payload do invite-admin ao criar organizacao |
