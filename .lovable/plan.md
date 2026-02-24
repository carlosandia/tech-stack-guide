

# Plano: Rate Limiting de Exportacao — Padrao SaaS Escalavel

## Contexto Atual

O backend ja possui um rate limiter basico: **5 exportacoes por hora por usuario** (via `express-rate-limit`). Porem, nao ha controle diario ou mensal, e o frontend nao tem nenhuma protecao ou feedback sobre limites restantes.

## Recomendacao de Mercado para SaaS em Fase Inicial

Baseado em praticas de plataformas como HubSpot, Pipedrive e Salesforce:

| Janela    | Free/Starter | Pro/Scale |
|-----------|-------------|-----------|
| Por hora  | 3           | 10        |
| Por dia   | 10          | 50        |
| Por mes   | 50          | 500       |

Para um SaaS iniciando, a recomendacao e aplicar **limites por usuario** (nao por org) e escalar conforme o plano. Como o sistema atual nao tem planos diferenciados, usaremos limites unicos generosos o suficiente para uso real, mas protetivos contra abuso:

- **5 por hora** (ja existe)
- **15 por dia** (novo)
- **100 por mes** (novo)

## Alteracoes Planejadas

### 1. Backend — `backend/src/routes/contatos.ts`

Adicionar dois rate limiters adicionais e encadea-los antes da rota `/exportar`:

```text
exportRateLimiterHourly  -> 5 req / 1h   (ja existe)
exportRateLimiterDaily   -> 15 req / 24h  (novo)
exportRateLimiterMonthly -> 100 req / 30d (novo)
```

A rota aplicara os tres middlewares em sequencia:
```
router.get('/exportar', exportRateLimiterHourly, exportRateLimiterDaily, exportRateLimiterMonthly, async ...)
```

Cada limiter retornara headers padrao (`RateLimit-*`) para o frontend poder exibir feedback.

A mensagem de erro incluira qual limite foi atingido (hora/dia/mes) e o `retry_after` em segundos.

### 2. Frontend — `src/modules/contatos/components/ExportarContatosModal.tsx`

Tratar o erro 429 (Too Many Requests) retornado pelo rate limiter:

- No `catch` do `handleExportar`, verificar se o status e 429
- Exibir um toast com a mensagem do backend (ex: "Limite diario de exportacoes atingido. Tente novamente amanha.")
- Desabilitar o botao temporariamente apos um 429

### 3. Frontend — `src/modules/contatos/services/contatos.api.ts`

Na funcao `exportarComColunas`, garantir que erros HTTP 429 sejam propagados com a mensagem correta do backend em vez de uma mensagem generica.

## Resumo de Arquivos

| Arquivo | Acao |
|---------|------|
| `backend/src/routes/contatos.ts` | Adicionar 2 rate limiters (diario + mensal) |
| `src/modules/contatos/components/ExportarContatosModal.tsx` | Tratar erro 429 com feedback visual |
| `src/modules/contatos/services/contatos.api.ts` | Propagar mensagem de erro 429 |

## Observacoes

- Os limites sao **por usuario** (usando `user.id` como chave), nao por IP — isso e mais justo e seguro
- `express-rate-limit` usa store em memoria por padrao — em producao com multiplas instancias, seria recomendado migrar para `rate-limit-redis`, mas para a fase atual e suficiente
- Os headers `RateLimit-Remaining` e `RateLimit-Reset` serao enviados automaticamente pelo `standardHeaders: true`, permitindo que no futuro o frontend mostre "X exportacoes restantes"

