

# Correcao Completa: Bloquear Acesso Sem Definir Senha

## Causa Raiz

O AuthProvider busca dados do usuario mas **ignora o campo `status`** da tabela `usuarios`. Quando o invite-admin cria um convite, ele define `status = 'pendente'` no banco. Porem, o AuthProvider nao consulta esse campo, entao trata qualquer sessao valida como usuario 100% autenticado - mesmo que o usuario nunca tenha definido uma senha.

Resultado: apos o `setSession()` na SetPasswordPage, o usuario tem sessao ativa e pode navegar livremente para /dashboard sem criar senha.

## Solucao

Adicionar verificacao de status em 3 pontos criticos:

### 1. AuthProvider - buscar e expor o status do usuario

**Arquivo: `src/providers/AuthProvider.tsx`**

- Adicionar `status` ao tipo `AuthUser` (valores: `'ativo' | 'pendente' | 'inativo'`)
- Alterar a query `fetchUserData` para incluir `status` no SELECT
- Expor `user.status` no contexto para que qualquer componente possa checar

### 2. App.tsx - forcar redirect para /auth/set-password se pendente

**Arquivo: `src/App.tsx`**

- Antes de renderizar qualquer rota protegida, verificar se `user?.status === 'pendente'`
- Se pendente, redirecionar TODAS as rotas (exceto /auth/set-password) para /auth/set-password
- Isso garante que mesmo digitando /dashboard manualmente, o usuario pendente volta pro formulario de senha

### 3. SetPasswordPage - manter a logica existente

A pagina ja atualiza o status para `'ativo'` apos definir senha (linha 248), entao apos criar a senha o bloqueio e removido automaticamente.

## Detalhes Tecnicos

### AuthProvider.tsx

```typescript
// Tipo AuthUser - adicionar status
export interface AuthUser {
  // ...campos existentes...
  status?: 'ativo' | 'pendente' | 'inativo'
}

// Query fetchUserData - adicionar status
const { data: usuario } = await supabase
  .from('usuarios')
  .select('id, nome, sobrenome, email, role, organizacao_id, avatar_url, status')
  .eq('auth_id', supabaseUser.id)
  .single()

// No retorno, incluir status
return {
  ...camposExistentes,
  status: usuario.status as 'ativo' | 'pendente' | 'inativo',
}
```

### App.tsx

```typescript
const { loading, isAuthenticated, role, user } = useAuth()

const isSetPasswordPage = window.location.pathname === '/auth/set-password'

// Se usuario pendente, forcar ir para set-password
const isPendente = user?.status === 'pendente'

// Nas rotas protegidas (CRM e Admin), adicionar verificacao:
// Se autenticado MAS pendente -> redirecionar para /auth/set-password
// Se autenticado E ativo -> renderizar normalmente
```

Na rota do CRM:
```typescript
<Route element={
  isAuthenticated && (role === 'admin' || role === 'member')
    ? isPendente
      ? <Navigate to="/auth/set-password" replace />
      : <AppLayout />
    : <Navigate to="/login" replace />
}>
```

Na rota Admin:
```typescript
<Route element={
  isAuthenticated && role === 'super_admin'
    ? isPendente
      ? <Navigate to="/auth/set-password" replace />
      : <AdminLayout />
    : <Navigate to="/login" replace />
}>
```

Na rota Configuracoes:
```typescript
element={
  isAuthenticated && (role === 'admin' || role === 'member')
    ? isPendente
      ? <Navigate to="/auth/set-password" replace />
      : <ConfiguracoesLayout />
    : <Navigate to="/login" replace />
}
```

Na rota raiz (/):
```typescript
<Route path="/" element={
  isAuthenticated && !isSetPasswordPage
    ? isPendente
      ? <Navigate to="/auth/set-password" replace />
      : role === 'super_admin'
        ? <Navigate to="/admin" replace />
        : <Navigate to="/dashboard" replace />
    : <Navigate to="/login" replace />
} />
```

## Fluxo Corrigido

1. Convite enviado -> usuario criado com status='pendente'
2. Usuario clica no link -> SetPasswordPage processa token -> setSession()
3. AuthProvider carrega dados -> ve status='pendente'
4. App.tsx: usuario autenticado MAS pendente -> qualquer rota protegida redireciona para /auth/set-password
5. Usuario define senha -> SetPasswordPage atualiza status para 'ativo'
6. Apos signOut + login, AuthProvider carrega status='ativo' -> acesso liberado

## Resumo das Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/providers/AuthProvider.tsx` | Adicionar `status` ao AuthUser e a query fetchUserData |
| `src/App.tsx` | Verificar `user.status === 'pendente'` e bloquear acesso a rotas protegidas |

