
# Correcao: Link de Convite Expira Apos Primeiro Clique

## Causa Raiz

O link de convite usa o endpoint `/auth/v1/verify?token=...` do Supabase, que **consome o token na primeira verificacao** (comportamento padrao do Supabase - tokens de verificacao sao single-use). Quando o usuario clica no link pela segunda vez, o Supabase retorna `error=access_denied&error_description=...expired` no hash de redirecionamento.

O problema esta no `SetPasswordPage.tsx` nas linhas 100-111: quando detecta erro no hash, o codigo **retorna imediatamente mostrando "Link Invalido"** sem verificar se a sessao do primeiro clique ainda esta ativa no navegador.

O fluxo que falha:
1. Usuario clica no link pela primeira vez -> Supabase consome o token, redireciona com access_token -> setSession() funciona -> sessao fica no localStorage
2. Usuario fecha a aba sem definir a senha
3. Usuario clica no link de novo -> Supabase detecta token ja consumido -> redireciona com error=access_denied
4. SetPasswordPage ve o erro e mostra "Link Invalido" sem checar se a sessao do passo 1 ainda existe

## Solucao

Alterar a logica de tratamento de erro no `SetPasswordPage.tsx` para, antes de exibir "Link Invalido", verificar se ja existe uma sessao valida no navegador para um usuario com status `pendente`. Se existir, mostrar o formulario de senha normalmente.

## Detalhes Tecnicos

### Arquivo: `src/modules/auth/pages/SetPasswordPage.tsx`

Alterar o bloco de erro (linhas 100-111) para adicionar verificacao de sessao existente:

```typescript
if (errorParam || errorCode) {
  console.error('[SetPassword] Erro no token:', errorParam || errorCode, errorDescription)
  
  // ANTES de mostrar erro, verificar se ja existe sessao valida
  // (pode acontecer quando o usuario clica no link pela segunda vez - 
  // o token ja foi consumido no primeiro clique mas a sessao ainda esta ativa)
  const { data: { session: existingSession } } = await supabase.auth.getSession()
  
  if (existingSession?.user) {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('status')
      .eq('auth_id', existingSession.user.id)
      .single()
    
    if (usuario?.status === 'pendente') {
      console.log('[SetPassword] Token ja consumido, mas sessao pendente encontrada:', existingSession.user.email)
      setUserEmail(existingSession.user.email || null)
      setTokenValid(true)
      window.history.replaceState(null, '', window.location.pathname)
      setLoading(false)
      return
    }
  }
  
  // Sem sessao valida - mostrar erro normalmente
  const isExpired = errorParam === 'access_denied' || errorDescription?.includes('expired')
  if (isExpired) {
    setError('O link de convite expirou. Solicite ao administrador que reenvie o convite.')
  } else {
    setError(decodeURIComponent(errorDescription || 'Token invalido ou expirado.'))
  }
  setLoading(false)
  return
}
```

## Fluxo Corrigido

1. Primeiro clique: token consumido pelo Supabase -> sessao criada -> formulario de senha exibido
2. Segundo clique: Supabase retorna erro (token ja consumido) -> SetPasswordPage verifica sessao existente -> encontra usuario pendente -> exibe formulario normalmente
3. Token realmente expirado (apos 24h): Supabase retorna erro -> nenhuma sessao valida -> mostra "Link Invalido" corretamente

## Resumo

| Arquivo | Alteracao |
|---------|-----------|
| `src/modules/auth/pages/SetPasswordPage.tsx` | Verificar sessao existente antes de exibir erro de token consumido |
