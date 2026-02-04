
# Plano de Implementação - PRD-03 (Autenticação) - Integração Frontend-Backend

## Diagnóstico do Problema

Ao analisar o código, identifiquei uma **inconsistência crítica** na arquitetura de autenticação:

| Componente | O que faz atualmente | Problema |
|------------|---------------------|----------|
| `LoginPage.tsx` | Chama `authApi.login()` → Backend Express | Backend retorna JWT customizado |
| `AuthProvider.tsx` | Usa `supabase.auth.getUser()` | Supabase Auth não conhece o JWT do backend |

**Resultado:** Login no backend funciona, mas o `AuthProvider` não reconhece o usuário porque está consultando o Supabase Auth diretamente.

## Análise das Rotas do Backend (PRD-03)

O backend Express já implementa todas as rotas de autenticação conforme PRD-03:

| Endpoint | Método | Função | Status |
|----------|--------|--------|--------|
| `/api/v1/auth/login` | POST | Login com email/senha | Implementado |
| `/api/v1/auth/refresh` | POST | Renovar access token | Implementado |
| `/api/v1/auth/logout` | POST | Encerrar sessão | Implementado |
| `/api/v1/auth/forgot-password` | POST | Solicitar reset de senha | Implementado |
| `/api/v1/auth/reset-password` | POST | Redefinir senha com token | Implementado |
| `/api/v1/auth/perfil` | GET | Obter perfil do usuário | Implementado |
| `/api/v1/auth/perfil` | PATCH | Atualizar perfil | Implementado |
| `/api/v1/auth/perfil/senha` | POST | Alterar senha | Implementado |

## Solução Proposta

Refatorar o `AuthProvider` para usar o **Backend Express** como fonte de autenticação em vez do Supabase Auth direto.

---

## ETAPA 1: Refatorar AuthProvider.tsx

**Arquivo:** `src/providers/AuthProvider.tsx`

### Mudanças Necessárias

1. Remover dependência direta do `supabase.auth`
2. Usar tokens JWT armazenados no localStorage
3. Buscar perfil do usuário via `authApi.getPerfil()` quando há token válido
4. Implementar logout via `authApi.logout()`

### Novo Fluxo de Autenticação

```text
1. App inicia
2. AuthProvider verifica se existe access_token no localStorage
3. Se existe, chama GET /api/v1/auth/perfil para validar e obter dados
4. Se válido, define user/role/tenantId no estado
5. Se inválido (401), tenta refresh token
6. Se refresh falha, redireciona para /login
```

---

## ETAPA 2: Atualizar auth.api.ts

**Arquivo:** `src/modules/auth/services/auth.api.ts`

### Ajustes Necessários

O arquivo já está bem implementado, mas precisa garantir que:
- `getPerfil()` retorna os dados corretos para o AuthProvider
- A interface `PerfilResponse` está alinhada com o backend

---

## ETAPA 3: Sincronizar LoginPage.tsx

**Arquivo:** `src/modules/auth/pages/LoginPage.tsx`

### Mudanças

Atualmente o login já funciona corretamente:
1. Chama `authApi.login()`
2. Salva tokens via `setAccessToken()` e `setRefreshToken()`
3. Redireciona para `/admin` ou `/app`

**Problema:** Após redirect, o `AuthProvider` não reconhece o usuário.

**Solução:** Após login, disparar evento para que AuthProvider recarregue o perfil.

---

## ETAPA 4: Atualizar ForgotPasswordPage.tsx

**Arquivo:** `src/modules/auth/pages/ForgotPasswordPage.tsx`

### Status Atual

A página já chama `authApi.forgotPassword()`. Verificar se está funcionando corretamente.

---

## ETAPA 5: Atualizar ResetPasswordPage.tsx

**Arquivo:** `src/modules/auth/pages/ResetPasswordPage.tsx`

### Status Atual

A página já chama `authApi.resetPassword()`. Verificar se está funcionando corretamente.

---

## Seção Técnica

### Arquitetura de Autenticação Corrigida

```text
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  LoginPage.tsx ────────> authApi.login() ────────> Backend       │
│       │                                              │           │
│       └─── Salva tokens no localStorage <────────────┘           │
│                                                                  │
│  AuthProvider.tsx                                                │
│       │                                                          │
│       ├─── Ao iniciar: verifica localStorage                     │
│       │                                                          │
│       ├─── Se tem token: authApi.getPerfil()                     │
│       │         │                                                │
│       │         └─── Define user, role, tenantId                 │
│       │                                                          │
│       └─── Se 401: tenta refresh ou redireciona                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  POST /auth/login ────────> Valida no Supabase Auth              │
│       │                          │                               │
│       └─── Gera JWT customizado <┘                               │
│                                                                  │
│  GET /auth/perfil ────────> Valida JWT                           │
│       │                          │                               │
│       └─── Retorna dados do user <                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Interface do Usuário no AuthProvider

```typescript
interface AuthUser {
  id: string
  email: string
  nome: string
  sobrenome?: string
  role: 'super_admin' | 'admin' | 'member'
  organizacao_id: string | null
  avatar_url?: string
}
```

### Novo AuthProvider (Estrutura)

```typescript
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verifica se há token e busca perfil
    const accessToken = getAccessToken()
    if (accessToken) {
      authApi.getPerfil()
        .then(response => {
          setUser({
            id: response.data.id,
            email: response.data.email,
            nome: response.data.nome,
            sobrenome: response.data.sobrenome,
            role: response.data.role,
            organizacao_id: response.data.organizacao?.id || null,
            avatar_url: response.data.foto_url,
          })
        })
        .catch(() => {
          clearTokens()
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  // ...resto da implementação
}
```

---

## Critérios de Aceitação

- [ ] Login com email/senha funciona e redireciona corretamente
- [ ] Super Admin é redirecionado para `/admin`
- [ ] Admin/Member é redirecionado para `/app`
- [ ] Refresh de página mantém sessão ativa
- [ ] Logout limpa tokens e redireciona para `/login`
- [ ] Recuperação de senha envia email
- [ ] Reset de senha funciona com token válido
- [ ] Erro 401 tenta refresh antes de redirecionar

---

## Ordem de Implementação

| Prioridade | Tarefa | Arquivo |
|------------|--------|---------|
| 1 | Refatorar AuthProvider para usar JWT do backend | `AuthProvider.tsx` |
| 2 | Ajustar LoginPage para notificar AuthProvider | `LoginPage.tsx` |
| 3 | Testar fluxo completo de login | - |
| 4 | Verificar ForgotPasswordPage | `ForgotPasswordPage.tsx` |
| 5 | Verificar ResetPasswordPage | `ResetPasswordPage.tsx` |

---

## Impacto no Design System

Nenhum impacto visual. Todas as alterações são lógicas/funcionais.

As telas já estão alinhadas com o Design System (Fase 0 concluída).
