

## Auditoria de Producao — Modulo /conversas

Analise para 500+ usuarios simultaneos, alto volume de mensagens e conversas, conforme diretrizes do Arquiteto de Produto.

---

### 1. Problemas Criticos

#### 1.1 N+1 na listagem de conversas — ULTIMA MENSAGEM PREVIEW

O metodo `listar` em `conversas.api.ts` (linhas 284-347) busca **todas as mensagens** de todas as conversas da pagina para extrair apenas a ultima de cada. Com 20 conversas e 500 mensagens cada, transfere **10.000 registros** para o frontend so para montar o preview.

Alem disso, se a ultima mensagem e uma reacao, faz uma **terceira query** para buscar o tipo da mensagem original.

**Correcao**: Substituir a query de mensagens por uma busca otimizada usando `DISTINCT ON (conversa_id)` em SQL ou, no minimo, adicionar `.limit(1)` por conversa agrupada. Como o Supabase client nao suporta `DISTINCT ON`, a solucao viavel e buscar apenas 1 mensagem por conversa individualmente em paralelo (batch de Promise.all), ou criar uma RPC SQL que retorne as ultimas mensagens pre-agrupadas.

Solucao pratica: buscar UMA mensagem por conversa com `Promise.all` de queries individuais + `.limit(1)` em vez de trazer todas.

#### 1.2 Cache auth duplicado (conversas.api.ts)

Linhas 14-55: Mesma duplicacao `_cachedOrgId/_cachedUserId + onAuthStateChange` ja corrigida nos outros modulos. O `auth-context.ts` compartilhado ja existe mas `conversas.api.ts` ainda usa a copia local.

**Correcao**: Importar de `@/shared/services/auth-context`.

#### 1.3 Contagem de total_mensagens com query pesada (enviarTexto)

Linha 965: ao enviar texto, faz uma query `count` em TODAS as mensagens da conversa so para atualizar `total_mensagens`. Com 10.000 mensagens, isso e desnecessario.

**Correcao**: Usar incremento simples `total_mensagens = total_mensagens + 1` via SQL ou remover (o webhook ja atualiza).

#### 1.4 `getConversaWahaSession` — 2 queries repetidas em toda acao

Cada acao (apagar, limpar, arquivar, fixar, reagir, etc.) chama `getConversaWahaSession` que faz 2 queries (conversa + sessao). Metodos como `enviarTexto`, `enviarMedia`, `enviarContato`, `enviarEnquete` repetem essa mesma logica inline (4 copias identicas).

**Correcao**: Consolidar em `getConversaWahaSession` e reutilizar em todos os metodos de envio, eliminando codigo duplicado.

#### 1.5 Notas sem limit (listarNotas)

Linha 1283: `listarNotas` nao tem limit — carrega TODAS as notas do contato.

**Correcao**: Adicionar `.limit(50)` como default.

---

### 2. Problemas de Performance Media

#### 2.1 Metricas — N+1 massivo (useConversasMetricas)

O hook `fetchMetricas` (linhas 76-335) e o pior gargalo do modulo:

1. Busca TODAS as conversas do periodo (sem limit)
2. Faz batches de 50 para contar mensagens enviadas/recebidas
3. Faz batches de 10 para calcular TMR/TMA (carregando ate 5000 msgs por batch!)
4. Faz batches de 50 para detectar conversas com resposta
5. Faz **1 query individual por conversa aberta** para verificar "sem resposta" (linhas 249-256)

Com 1.000 conversas no periodo, isso gera **centenas de queries** e transfere **megabytes** de dados.

**Correcao**: Mover TODA a logica de metricas para uma function PL/pgSQL que calcule TMR, TMA, contagens e "sem resposta" no banco em uma unica chamada. Por agora, como medida imediata: eliminar a query individual por conversa (item 5) e usar os dados ja obtidos nos batches anteriores.

#### 2.2 Realtime sem debounce (useConversasRealtime)

Mesmo problema do modulo /negocios: cada evento dispara `invalidateQueries` imediatamente. Em ambiente de alta atividade, causa "refetch storms".

**Correcao**: Adicionar debounce de 2 segundos (mesmo padrao ja implementado em `useKanban.ts`).

#### 2.3 Polling de 30s nas conversas (useConversas)

Linha 18 de `useConversas.ts`: `refetchInterval: 30000`. Com Realtime ja ativo, esse polling e redundante e gera carga desnecessaria.

**Correcao**: Remover `refetchInterval` — o Realtime ja invalida o cache quando ha mudancas.

---

### 3. O que ja esta BEM FEITO

- Scroll infinito com `useInfiniteQuery` (conversas e mensagens)
- Paginacao de mensagens com `has_more`
- Soft delete padronizado em todas as operacoes
- Sincronizacao WAHA bidirecional com fallback gracioso
- Fila de midia sequencial (MediaQueue)
- Limites anti-spam para agendamento
- Deduplicacao de mensagens WAHA (text sem body)
- Resolucao de mencoes em grupos
- Labels sincronizadas com Realtime
- Reacoes com persistencia local imediata

---

### 4. Plano de Acao Priorizado

#### Fase 1 — Critico (antes de 500 usuarios)

| # | Acao | Impacto |
|---|------|---------|
| 1 | Importar auth-context compartilhado | Elimina duplicacao, DRY |
| 2 | Otimizar preview ultima mensagem (1 query por conversa em paralelo) | Reduz transferencia massiva de dados |
| 3 | Substituir count total_mensagens por incremento | Elimina query pesada a cada envio |
| 4 | Consolidar logica de sessao WAHA (DRY) | Elimina 4 copias de codigo |
| 5 | Adicionar limit em listarNotas | Previne carregamento excessivo |
| 6 | Remover refetchInterval redundante | Elimina polling desnecessario |
| 7 | Adicionar debounce no Realtime | Reduz re-fetches em picos |

#### Fase 2 — Performance

| # | Acao | Impacto |
|---|------|---------|
| 8 | Eliminar query individual de "sem resposta" nas metricas | Reduz N queries para 0 |

---

### 5. Detalhes Tecnicos

**5.1 Auth-context**

Remover linhas 14-55 de `conversas.api.ts`. Importar `getOrganizacaoId` e `getUsuarioId` de `@/shared/services/auth-context`.

**5.2 Preview ultima mensagem otimizado**

Substituir a query unica que traz TODAS as mensagens de todas as conversas por:

```typescript
const ultimasPromises = conversaIds.map(id =>
  supabase.from('mensagens')
    .select('id, conversa_id, tipo, body, from_me, criado_em, reaction_emoji, reaction_message_id')
    .eq('conversa_id', id)
    .is('deletado_em', null)
    .neq('tipo', 'reaction')
    .order('criado_em', { ascending: false })
    .limit(1)
    .maybeSingle()
)
const results = await Promise.all(ultimasPromises)
```

Isso transfere no maximo 20 registros (1 por conversa) em vez de potencialmente milhares. A query de reacoes so e feita se necessario.

**NOTA**: A query original tambem filtra mensagens de texto sem body (duplicatas WAHA). Precisamos manter esse filtro adicionando `.not('body', 'is', null)` ou `or` combinando com `tipo != text`.

**5.3 Incremento total_mensagens**

Substituir linha 965:
```typescript
// ANTES: query count pesada
total_mensagens: (await supabase.from('mensagens').select('id', { count: 'exact', head: true }).eq('conversa_id', conversaId).is('deletado_em', null)).count || 0

// DEPOIS: incremento via RPC ou query simples
// Opção 1: Pegar valor atual e incrementar
const { data: conv } = await supabase.from('conversas').select('total_mensagens').eq('id', conversaId).single()
await supabase.from('conversas').update({
  ultima_mensagem_em: new Date().toISOString(),
  total_mensagens: (conv?.total_mensagens || 0) + 1,
}).eq('id', conversaId)
```

**5.4 Consolidar sessao WAHA (DRY)**

Os metodos `enviarTexto`, `enviarMedia`, `enviarContato`, `enviarEnquete` repetem 15-20 linhas identicas para buscar conversa + sessao + session_name. Substituir por chamada a `getConversaWahaSession` ja existente.

**5.5 Limit em notas**

Adicionar `.limit(50)` na query de `listarNotas`.

**5.6 Remover refetchInterval**

Em `useConversas.ts` linha 18, remover `refetchInterval: 30000`. O `useConversasRealtime` ja cuida de invalidar o cache.

**5.7 Debounce no Realtime**

Mesmo padrao do `useKanban.ts`: usar `useRef` com `setTimeout` de 2s no callback do canal Supabase em `useConversasRealtime.ts`.

**5.8 Metricas — eliminar query individual de "sem resposta"**

Linhas 244-263 de `useConversasMetricas.ts`: o loop que faz 1 query por conversa aberta para verificar se a ultima mensagem e do cliente pode ser eliminado. Os dados de mensagens ja foram buscados nos batches anteriores (secao 3 — TMR/TMA). Reutilizar esses dados para determinar "sem resposta" sem queries adicionais.

---

### 6. Arquivos impactados

| Arquivo | Tipo de mudanca |
|---------|----------------|
| `src/modules/conversas/services/conversas.api.ts` | Auth-context, preview otimizado, incremento total, DRY sessao WAHA, limit notas |
| `src/modules/conversas/hooks/useConversas.ts` | Remover refetchInterval |
| `src/modules/conversas/hooks/useConversasRealtime.ts` | Adicionar debounce 2s |
| `src/modules/conversas/hooks/useConversasMetricas.ts` | Eliminar query individual de "sem resposta" |

### 7. Garantias de seguranca

- Nenhum componente visual alterado
- Nenhuma prop removida ou renomeada
- Hooks mantem mesma assinatura e comportamento
- Scroll infinito continua funcionando
- Sincronizacao WAHA preservada
- Realtime continua funcionando (apenas com debounce)
- Fila de midia inalterada
- Agendamento inalterado

