

# Plano: Corrigir Metricas de Formularios e Visualizacao de Emails

## Problema 1: Metricas de Formularios

**Causa raiz:** A pagina publica (`/f/:slug`) NAO registra nenhum evento de analytics. A tabela `eventos_analytics_formularios` esta completamente vazia. O formulario "Teste E2E Inline" tem `total_submissoes: 8` (incrementado pela Edge Function), mas `total_visualizacoes: 0` e zero eventos de funil/desempenho.

A pagina publica precisa rastrear 3 tipos de eventos:
- **visualizacao** -- quando a pagina carrega
- **inicio** -- quando o usuario interage pela primeira vez com um campo
- **submissao** -- quando envia o formulario

E opcionalmente para desempenho por campo:
- **foco_campo** / **saida_campo** -- ao entrar/sair de campos

## Problema 2: Emails nao abrindo

**Causa raiz:** O iframe usa `sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"` sem `allow-scripts`. Emails com conteudo HTML que depende de JavaScript (como newsletters do WP Mail SMTP) geram multiplos erros "Blocked script execution" no console, podendo travar o ajuste de altura do iframe e bloquear a renderizacao visual.

---

## Solucao

### Parte 1: Tracking de Analytics na Pagina Publica

**Arquivo:** `src/modules/formularios/pages/FormularioPublicoPage.tsx`

Adicionar rastreamento de eventos em 3 pontos:

**a) Visualizacao (ao carregar o formulario):**
Apos o `setFormulario(form)`, inserir na tabela `eventos_analytics_formularios`:
```text
{ formulario_id, tipo_evento: 'visualizacao', organizacao_id }
```
Tambem incrementar `total_visualizacoes` na tabela `formularios` via RPC ou update direto.

**b) Inicio (primeira interacao com campo):**
Usar um ref `jaIniciou` para disparar apenas uma vez, no primeiro `handleChange`:
```text
{ formulario_id, tipo_evento: 'inicio', organizacao_id }
```

**c) Submissao (apos enviar com sucesso):**
Apos a insercao bem-sucedida da submissao:
```text
{ formulario_id, tipo_evento: 'submissao', organizacao_id }
```
Tambem recalcular `taxa_conversao` = `(total_submissoes / total_visualizacoes) * 100`.

**d) Desempenho por campo (opcional, melhora a tab "Desempenho por Campo"):**
Adicionar onFocus/onBlur nos campos para registrar `foco_campo` e `saida_campo` com `dados_evento: { campo_id }` e `tempo_no_campo_segundos`.

### Parte 2: RLS para tabela de eventos

Verificar/criar politica RLS que permita `anon` fazer INSERT na tabela `eventos_analytics_formularios`, ja que os eventos vem da pagina publica.

### Parte 3: Correcao do Email Viewer

**Arquivo:** `src/modules/emails/components/EmailViewer.tsx`

Duas correcoes:

**a) Remover scripts do HTML antes de renderizar:**
No `useMemo` que gera `cleanHtml`, apos o `DOMPurify.sanitize`, adicionar remocao explicita de tags `<script>` e atributos `on*` que possam ter passado. Isso evita os erros no console.

**b) Melhorar o ajuste de altura do iframe:**
Adicionar um `ResizeObserver` ou `setInterval` temporario para recalcular a altura apos o conteudo carregar (imagens carregando assincronamente podem mudar a altura).

**c) Tratar o erro de sandbox graciosamente:**
No DOMPurify config, garantir que `FORBID_TAGS: ['script']` esta removendo scripts ANTES de passar ao srcDoc, eliminando os erros de "Blocked script execution".

---

## Detalhes Tecnicos

### Eventos de Analytics - Estrutura do insert

```text
supabase.from('eventos_analytics_formularios').insert({
  formulario_id: string,
  organizacao_id: string,
  tipo_evento: 'visualizacao' | 'inicio' | 'submissao' | 'foco_campo' | 'saida_campo',
  dados_evento: { campo_id?: string } | null,
  tempo_no_campo_segundos: number | null,
  ip_address: null,
  user_agent: navigator.userAgent,
})
```

### Incremento de contadores

```text
// Ao visualizar:
UPDATE formularios SET total_visualizacoes = total_visualizacoes + 1 WHERE id = X

// Ao submeter (ja existe na Edge Function, mas garantir taxa):
UPDATE formularios SET taxa_conversao = 
  CASE WHEN total_visualizacoes > 0 
    THEN ROUND((total_submissoes::numeric / total_visualizacoes) * 100, 2)
    ELSE 0 END
WHERE id = X
```

### DOMPurify - Config corrigida

```text
DOMPurify.sanitize(html, {
  WHOLE_DOCUMENT: true,
  ADD_TAGS: ['style'],
  ADD_ATTR: ['target'],
  FORBID_TAGS: ['script', 'noscript'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
})
```

O `FORBID_TAGS: ['script']` ja existe, mas pode nao estar funcionando para scripts inline em `<body>`. Garantir a remocao manual pos-sanitizacao.

### Arquivos Modificados

| Arquivo | Alteracao |
|---------|-----------|
| `src/modules/formularios/pages/FormularioPublicoPage.tsx` | Adicionar tracking de visualizacao, inicio e submissao |
| `src/modules/emails/components/EmailViewer.tsx` | Remover scripts residuais + melhorar ajuste de altura |
| Migracao SQL (se necessario) | RLS para `anon` INSERT em `eventos_analytics_formularios` |

