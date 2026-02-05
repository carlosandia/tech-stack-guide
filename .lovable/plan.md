
# Plano: Otimizar Carregamento de Organizações e Planos

## Problema Identificado

O erro "Tempo limite excedido" não é cache - é uma combinação de:

1. **Timeout de 15 segundos muito curto** para o ambiente de preview Lovable
2. **Problema N+1 na API** - para cada organização, faz-se uma query extra buscando o admin
3. **React Query sem `networkMode: 'always'`** - pode pausar em redes instáveis

## O Que Será Feito

### 1. Aumentar o timeout para 30 segundos

O ambiente de preview às vezes tem latência maior. Vamos aumentar de 15s para 30s.

```
src/lib/supabase.ts
- FETCH_TIMEOUT = 15000
+ FETCH_TIMEOUT = 30000
```

### 2. Eliminar o problema N+1 na listagem de organizações

**Antes**: 1 query para organizações + N queries para buscar admin de cada uma

**Depois**: 1 única query usando join

```
src/modules/admin/services/admin.api.ts

// ANTES (N+1 queries)
const { data } = await supabase.from('organizacoes_saas').select('*')
const organizacoes = await Promise.all(
  data.map(async (org) => {
    const { data: adminData } = await supabase
      .from('usuarios')
      .select(...)
      .eq('organizacao_id', org.id)
    // ...
  })
)

// DEPOIS (1 query apenas)
const { data } = await supabase
  .from('organizacoes_saas')
  .select(`
    *,
    usuarios!organizacao_id(
      id, nome, sobrenome, email, status, ultimo_login
    )
  `)
// Filtrar admin no cliente
```

### 3. Adicionar `networkMode: 'always'` no React Query

Isso força as queries a sempre tentarem, mesmo em redes instáveis.

```
src/providers/QueryProvider.tsx

queries: {
  staleTime: 1000 * 60,
  gcTime: 1000 * 60 * 5,
  retry: 2,  // Aumentar de 1 para 2
  refetchOnWindowFocus: false,
  networkMode: 'always',  // NOVO
},
```

### 4. Adicionar `retryDelay` exponencial

Em vez de falhar imediatamente, aguarda progressivamente mais tempo entre retries.

```
queries: {
  // ...
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
},
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/lib/supabase.ts` | Aumentar timeout para 30s |
| `src/modules/admin/services/admin.api.ts` | Usar join em vez de N+1 queries |
| `src/providers/QueryProvider.tsx` | Adicionar networkMode e retryDelay |

---

## Resultado Esperado

- **Carregamento mais rápido**: 1 query em vez de N+1
- **Menos timeouts**: 30s é mais tolerante a latência
- **Melhor resiliência**: retry automático com backoff exponencial
- **Menos erros de rede**: `networkMode: 'always'` evita pausas desnecessárias

---

## Detalhes Técnicos

### Nova função listarOrganizacoes

```typescript
export async function listarOrganizacoes(params?: {
  page?: number
  limit?: number
  busca?: string
  status?: string
  plano?: string
  segmento?: string
}): Promise<ListaOrganizacoesResponse> {
  const page = params?.page || 1
  const limit = params?.limit || 10
  const offset = (page - 1) * limit

  let query = supabase
    .from('organizacoes_saas')
    .select(`
      *,
      admin:usuarios!organizacao_id(
        id, nome, sobrenome, email, status, ultimo_login, role
      )
    `, { count: 'exact' })
    .is('deletado_em', null)
    .order('criado_em', { ascending: false })

  // Filtros...
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Erro ao listar organizações:', error)
    throw new Error(error.message)
  }

  // Mapear e filtrar admin (role = 'admin') no cliente
  const organizacoes: Organizacao[] = (data || []).map((org) => {
    const adminUser = org.admin?.find((u: any) => u.role === 'admin')
    return {
      id: org.id,
      nome: org.nome,
      segmento: org.segmento,
      email: org.email,
      website: org.website,
      telefone: org.telefone,
      status: org.status as Organizacao['status'],
      plano: org.plano,
      criado_em: org.criado_em,
      admin: adminUser ? {
        id: adminUser.id,
        nome: adminUser.nome,
        sobrenome: adminUser.sobrenome,
        email: adminUser.email,
        status: adminUser.status,
        ultimo_login: adminUser.ultimo_login,
      } : undefined,
    }
  })

  return {
    organizacoes,
    total: count || 0,
    pagina: page,
    limite: limit,
    total_paginas: Math.ceil((count || 0) / limit),
  }
}
```

### Novo QueryProvider

```typescript
export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60, // 1 minuto
            gcTime: 1000 * 60 * 5, // 5 minutos
            retry: 2, // 2 tentativas
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
            refetchOnWindowFocus: false,
            networkMode: 'always', // Sempre tentar, mesmo offline
          },
          mutations: {
            retry: 0,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

---

## Testes Recomendados

1. Acessar `/admin/organizacoes` - deve carregar sem erro
2. Acessar `/admin/planos` - deve listar os 4 planos existentes
3. Abrir DevTools > Network e verificar que há apenas 1 request para organizacoes_saas
4. Simular rede lenta (Slow 3G) - deve mostrar loading mas eventualmente carregar
5. Desconectar internet - deve mostrar erro de rede com botão "Tentar novamente"
