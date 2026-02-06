

# Plano: Layout Full-Height com Header Fixo e Scroll Interno na Lista

## Problema Identificado

Atualmente, tanto o Header quanto o Toolbar scrollam junto com o conteudo da pagina porque o scroll acontece no `body` (pagina inteira). A lista de contatos nao ocupa 100% da altura disponivel, desperdicando espaco. Para cenarios com muitos registros (100k+), a estrategia de performance precisa ser validada.

## Solucao

Transformar o layout para que:
- O **Header** (56px) permaneca **fixo** no topo (ja esta, mas o body scrolla)
- O **Toolbar** (48px) permaneca **sticky** abaixo do header (ja esta, mas precisa ficar preso)
- A **area de conteudo** ocupe **100% da altura restante** da viewport
- O **scroll seja interno** somente no corpo da tabela (tbody)
- O **thead** fique fixo no topo da area scrollavel
- A **paginacao** fique fixa no rodape da tabela
- Manter **paginacao server-side** (50 por pagina) como estrategia de performance

## Arquitetura de Layout

```text
+----------------------------------------------------------+
| HEADER (fixed, 56px, z-100)                              |
+----------------------------------------------------------+
| TOOLBAR (sticky, 48px, z-50)                             |
+----------------------------------------------------------+
| FILTROS (condicional, se aberto)                         |
+----------------------------------------------------------+
| THEAD (sticky dentro do container scrollavel)            |
|   [ ] Nome | Email | Empresa | Segm. | Resp. | Status   |
+----------------------------------------------------------+
| TBODY (scroll interno, ocupa todo espaco restante)       |
|   Joao Silva | joao@... | Empresa X | ...               |
|   Maria ...  | maria@.. | Empresa Y | ...               |
|   ...                                                    |
+----------------------------------------------------------+
| PAGINACAO (fixo no rodape)                               |
|   Mostrando 1-50 de 2.340          [< 1 2 3 ... >]      |
+----------------------------------------------------------+
```

## Mudancas Tecnicas

### 1. AppLayout.tsx - Conteudo com altura controlada

**O que muda:** O `<main>` deixa de ter padding vertical e passa a usar flexbox com `h-screen` para que o conteudo preencha todo o espaco disponivel abaixo do header.

- Container principal: `h-screen flex flex-col` (em vez de `min-h-screen`)
- Header: `fixed top-0` (ja esta)
- Toolbar: `sticky top-14` (ja esta)
- Main: `flex-1 overflow-hidden` (sem padding vertical, sem scroll no body)

### 2. ContatosPage.tsx - Container full-height

**O que muda:** A pagina de contatos ocupa 100% da altura disponivel, com a tabela crescendo para preencher o espaco.

- Container raiz: `flex flex-col h-full overflow-hidden`
- Filtros: permanece no topo (condicional)
- Area da tabela: `flex-1 overflow-hidden` com border
- Paginacao: fixa no rodape da tabela

### 3. ContatosList.tsx - Thead sticky + Scroll interno

**O que muda:** O `thead` fica fixo e o `tbody` recebe o scroll.

- Container: `flex flex-col h-full overflow-hidden`
- Wrapper da tabela: `flex-1 overflow-auto` (scroll vertical interno)
- `thead`: `sticky top-0 z-10 bg-background` (fica colado no topo)
- `tbody`: renderiza normalmente, scroll natural

### 4. Performance para volumes grandes (100k+)

**Estrategia mantida: Paginacao server-side** - e a abordagem mais performatica porque:
- Carrega apenas 50 registros por vez do banco (Supabase `.range()`)
- Nao precisa manter todos os dados em memoria
- Renderiza poucos elementos no DOM
- Funciona bem mesmo com milhoes de registros

A unica otimizacao adicional sera garantir que a query usa `count: 'exact'` somente quando necessario e que o cache do React Query evita re-fetches desnecessarios (staleTime de 1 minuto ja configurado).

## Arquivos Impactados

| Arquivo | Tipo de Mudanca |
|---------|-----------------|
| `src/modules/app/layouts/AppLayout.tsx` | Ajustar main para `flex-1 overflow-hidden` |
| `src/modules/contatos/pages/ContatosPage.tsx` | Container full-height, paginacao fixa |
| `src/modules/contatos/components/ContatosList.tsx` | Thead sticky, scroll interno no tbody |

## Sem Impacto

- Nenhuma mudanca no banco de dados
- Nenhuma mudanca nas APIs ou hooks
- Nenhuma dependencia nova necessaria
- Outros modulos (Dashboard, Negocios, etc.) continuam funcionando normalmente pois o `overflow-hidden` no main so afeta quem usar `h-full`

