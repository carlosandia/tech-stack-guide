

## Auditoria de Producao — Modulo /formularios

Analise para 500+ usuarios, alto volume de formularios e submissoes, conforme diretrizes do Arquiteto de Produto.

---

### 1. Problemas Criticos

#### 1.1 Cache auth duplicado (formularios.api.ts)

Linhas 13-34: Mesma duplicacao `_cachedOrgId + onAuthStateChange` ja corrigida nos modulos /negocios, /contatos, /conversas e /emails. O `auth-context.ts` compartilhado ja existe.

**Correcao**: Remover linhas 13-34 e importar `getOrganizacaoId` de `@/shared/services/auth-context`.

**Risco**: Zero. Refactor DRY puro.

---

#### 1.2 `reordenarCampos` — N queries individuais (GARGALO PRINCIPAL)

Linhas 380-393: Faz um `UPDATE` **por campo** em um loop sequencial. Com 30 campos, sao 30 queries sequenciais. No drag-and-drop, isso e chamado a cada reordenamento.

**Correcao**: Agrupar todos os updates em um unico `Promise.all` para execucao paralela, reduzindo o tempo de N*latencia para 1*latencia.

```typescript
async function reordenarCampos(formularioId: string, campos: { id: string; ordem: number }[]): Promise<void> {
  const promises = campos.map(item =>
    supabase.from('campos_formularios')
      .update({ ordem: item.ordem })
      .eq('formulario_id', formularioId)
      .eq('id', item.id)
  )
  const results = await Promise.all(promises)
  const failed = results.find(r => r.error)
  if (failed?.error) throw new Error(`Erro ao reordenar: ${failed.error.message}`)
}
```

---

#### 1.3 `contarPorStatus` — carrega TODOS os formularios para contar

Linhas 250-267: Busca todos os formularios (`.select('status')` sem limit) para contar no frontend. Com 500+ formularios por organizacao, transfere dados desnecessariamente.

**Correcao**: Usar `{ count: 'exact', head: true }` com filtros por status, fazendo 3 queries leves (sem dados) em paralelo ao inves de 1 query pesada.

```typescript
async function contarPorStatus(): Promise<Record<string, number>> {
  const organizacao_id = await getOrganizacaoId()
  const base = supabase.from('formularios').select('id', { count: 'exact', head: true })
    .eq('organizacao_id', organizacao_id).is('deletado_em', null)

  const [todos, rascunho, publicado, arquivado] = await Promise.all([
    base,
    supabase.from('formularios').select('id', { count: 'exact', head: true })
      .eq('organizacao_id', organizacao_id).is('deletado_em', null).eq('status', 'rascunho'),
    supabase.from('formularios').select('id', { count: 'exact', head: true })
      .eq('organizacao_id', organizacao_id).is('deletado_em', null).eq('status', 'publicado'),
    supabase.from('formularios').select('id', { count: 'exact', head: true })
      .eq('organizacao_id', organizacao_id).is('deletado_em', null).eq('status', 'arquivado'),
  ])
  return {
    todos: todos.count || 0,
    rascunho: rascunho.count || 0,
    publicado: publicado.count || 0,
    arquivado: arquivado.count || 0,
  }
}
```

---

#### 1.4 `salvarEstilos` — upsert manual com 2 queries

Linhas 585-614: Faz SELECT para verificar existencia, depois UPDATE ou INSERT. Sao 2 queries quando poderia ser 1 com `.upsert()`.

**Correcao**: Usar `.upsert()` com `onConflict: 'formulario_id'`, reduzindo para 1 query.

---

#### 1.5 `salvarConfigPopup` — upsert manual com 2 queries

Linhas 660-685: Mesmo padrao de SELECT+UPDATE/INSERT.

**Correcao**: Usar `.upsert()` com `onConflict: 'formulario_id'`.

---

#### 1.6 `salvarConfigNewsletter` — upsert manual com 2 queries

Linhas 728-753: Mesmo padrao.

**Correcao**: Usar `.upsert()` com `onConflict: 'formulario_id'`.

---

#### 1.7 Analytics — `obterMetricas` e `obterFunilConversao` buscam TODOS os eventos sem limit

Linhas 986-1027: Ambos metodos buscam `.select('tipo_evento')` sem qualquer limit. Com formularios populares (10.000+ eventos), transfere megabytes so para contar tipos.

**Correcao**: Manter a query (nao ha alternativa simples sem RPC), mas adicionar `.limit(10000)` como trava de seguranca para evitar downloads absurdos.

---

#### 1.8 Analytics — `obterDesempenhoCampos` busca eventos sem limit

Linhas 1030-1055: Mesmo problema — busca todos os eventos de campo sem limit.

**Correcao**: Adicionar `.limit(10000)` como trava de seguranca.

---

### 2. O que ja esta BEM FEITO

- Paginacao na listagem principal com `.range()` e `{ count: 'exact' }`
- Paginacao nas submissoes
- Soft delete padronizado
- Optimistic updates no `useCriarCampo` e `useReordenarCampos` (UX instantanea)
- Slug unico com timestamp
- Tipos bem definidos para todos os sub-modulos
- Webhooks com logs limitados (`.limit(limite)`)
- Hooks React Query bem estruturados com queryKeys consistentes
- Separacao clara de concerns (campos, estilos, config, regras, analytics, AB, webhooks)

---

### 3. Plano de Acao

| # | Acao | Arquivo | Impacto |
|---|------|---------|---------|
| 1 | Importar auth-context compartilhado | `formularios.api.ts` | Elimina duplicacao DRY |
| 2 | Paralelizar `reordenarCampos` com `Promise.all` | `formularios.api.ts` | Reduz latencia de N*RTT para 1*RTT |
| 3 | Otimizar `contarPorStatus` com `head: true` | `formularios.api.ts` | Elimina transferencia de dados para contagem |
| 4 | Converter `salvarEstilos` para upsert | `formularios.api.ts` | Reduz 2 queries para 1 |
| 5 | Converter `salvarConfigPopup` para upsert | `formularios.api.ts` | Reduz 2 queries para 1 |
| 6 | Converter `salvarConfigNewsletter` para upsert | `formularios.api.ts` | Reduz 2 queries para 1 |
| 7 | Adicionar `.limit(10000)` nas queries de analytics | `formularios.api.ts` | Previne downloads massivos |

---

### 4. Detalhes Tecnicos

**4.1 Auth-context**

Remover linhas 13-34 de `formularios.api.ts`. Adicionar:
```typescript
import { getOrganizacaoId } from '@/shared/services/auth-context'
```

**4.2 `reordenarCampos` paralelizado**

Substituir o loop `for...of` por `Promise.all` de todas as queries em paralelo.

**4.3 `contarPorStatus` otimizado**

Substituir a query que busca todos os registros por 4 queries `head: true` em paralelo (sem transferencia de dados, apenas contagem).

**4.4 Upsert para estilos, popup e newsletter**

Para `salvarEstilos`:
```typescript
const { data, error } = await supabase
  .from('estilos_formularios')
  .upsert({ formulario_id: formularioId, ...payload }, { onConflict: 'formulario_id' })
  .select()
  .single()
```

Mesmo padrao para `salvarConfigPopup` e `salvarConfigNewsletter`.

**NOTA**: O upsert requer constraint UNIQUE em `formulario_id` nas tabelas `estilos_formularios`, `config_popup_formularios` e `config_newsletter_formularios`. Se nao existirem, manter o padrao SELECT+UPDATE/INSERT atual.

**4.5 Limits em analytics**

Adicionar `.limit(10000)` em:
- `obterMetricas` (linha 989)
- `obterFunilConversao` (linha 1012)
- `obterDesempenhoCampos` (linha 1034)

---

### 5. Arquivos impactados

| Arquivo | Tipo de mudanca |
|---------|----------------|
| `src/modules/formularios/services/formularios.api.ts` | Todas as correcoes acima |

Nenhum hook muda de assinatura. Nenhum componente visual alterado.

### 6. Garantias de seguranca

- Nenhum componente visual alterado
- Nenhuma prop removida ou renomeada
- Hooks mantem mesma assinatura e comportamento
- Optimistic updates preservados
- Editor WYSIWYG inalterado
- Widget embed inalterado
- Pagina publica inalterada
- Submissoes via Edge Function inalteradas
- RLS continua como unica linha de defesa

