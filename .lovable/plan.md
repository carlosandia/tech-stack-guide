

# Plano: Corrigir "Nova versão disponível" + Recomendação sobre tarefas ao mover pipeline

## Problema 1: Tela "Nova versão disponível"

### Diagnóstico

O fluxo atual funciona assim:
1. `lazyWithRetry` tenta carregar o chunk JS
2. Se falha (chunk antigo apos deploy), faz reload automatico UMA vez (via sessionStorage)
3. Se falha novamente, propaga o erro para o `ErrorBoundary`
4. O `ErrorBoundary` exibe a tela "Nova versao disponivel" e para ali

O problema: o `ErrorBoundary` **nunca tenta auto-reload**. O comentario no codigo diz "lazyWithRetry ja cuida", mas se o erro chegou ao ErrorBoundary, significa que o retry ja falhou. Em vez de exibir uma tela bloqueante, deveria tentar mais uma vez silenciosamente.

### Correção

**Arquivo**: `src/components/ErrorBoundary.tsx`

No metodo `componentDidCatch`, quando detectar erro de chunk:
- Verificar uma flag propria no sessionStorage (`eb-chunk-reload`)
- Se ainda nao tentou, setar a flag, limpar as flags do `lazyWithRetry`, e fazer `window.location.reload()` silenciosamente
- Se ja tentou (flag existe), ai sim exibir o fallback visual

Isso garante que o usuario tem **2 tentativas automaticas** (uma pelo lazyWithRetry, outra pelo ErrorBoundary) antes de ver qualquer tela de erro.

```text
Fluxo corrigido:

Chunk falha
  -> lazyWithRetry tenta reload (1a tentativa)
    -> Falha de novo
      -> ErrorBoundary.componentDidCatch
        -> Auto-reload silencioso (2a tentativa)
          -> Falha de novo
            -> Exibe tela "Nova versao" (so em ultimo caso)
```

### Arquivos alterados

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/ErrorBoundary.tsx` | `componentDidCatch`: auto-reload silencioso para chunk errors antes de exibir fallback |

---

## Problema 2: Tarefas ao mover oportunidade entre pipelines

### Minha recomendacao: **Manter as tarefas existentes + criar novas da pipeline destino**

**Por que manter as tarefas existentes:**
- Tarefas representam **historico de trabalho** realizado ou planejado. Excluir seria perder rastreabilidade
- Para **relatorios e auditoria**, e essencial saber o que foi feito antes da transferencia
- Se uma tarefa esta "em andamento" ou "pendente", o responsavel precisa continuar acompanhando
- CRMs de mercado (Pipedrive, HubSpot) mantêm as tarefas ao mover entre pipelines

**Por que tambem criar as novas tarefas da etapa destino:**
- A nova pipeline pode ter automacoes configuradas (templates de tarefas por etapa)
- O fluxo da nova pipeline deve ser respeitado normalmente

**Sobre mencionar a pipeline de origem nas tarefas:**
- **Nao recomendo**. Seria informacao excessiva no dia a dia. O historico da oportunidade ja registra a movimentacao entre pipelines, entao a rastreabilidade esta garantida sem poluir os cards de tarefa.

### Implementacao (se aprovado)

Nenhuma alteracao necessaria no momento -- o comportamento atual ja **mantem as tarefas** (elas ficam vinculadas a oportunidade, nao a pipeline). A unica pendencia seria garantir que as tarefas automaticas da etapa destino sejam criadas, mas isso depende da trigger de automacao de tarefas por etapa que ja existe no sistema.

---

## Resumo

| Item | Acao |
|------|------|
| "Nova versao disponivel" | Auto-reload silencioso no ErrorBoundary antes de mostrar tela |
| Tarefas ao mover pipeline | Manter existentes + criar novas (comportamento atual ja correto) |

