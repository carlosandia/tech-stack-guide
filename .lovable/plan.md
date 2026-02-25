

## Plano: Corrigir criacao de reunioes (Google Calendar, datas e link)

### Problemas identificados

**Problema 1: Evento NAO e criado no Google Calendar**

No `AbaAgenda.tsx` linha 132, a sincronizacao com Google so e ativada quando o checkbox "Google Meet" esta marcado:

```
sincronizar_google: formData.google_meet && !!conexaoGoogle?.conectado
```

Ou seja, se o usuario nao marcar "Adicionar videoconferencia do Google Meet", o evento NUNCA e criado no Google Calendar -- mesmo que o Google esteja conectado. A sincronizacao deveria ser independente do Meet.

**Problema 2: Horarios salvos incorretamente**

O frontend monta datas como `2025-02-24T23:00:00` (sem timezone). Ao salvar no banco `timestamptz`, o Postgres interpreta como UTC (ou timezone do servidor), causando deslocamento. O correto seria enviar com offset explicito, ex: `2025-02-24T23:00:00-03:00`.

Alem disso, na edge function `google-auth`, o fallback de `data_fim` (linha 628) faz `new Date(body.data_inicio).getTime()` que interpreta a string sem timezone como UTC, e depois `.toISOString()` gera UTC puro -- perdendo a intencao de horario local.

**Problema 3: Link (local) nao salva**

O campo `local` esta sendo enviado corretamente no payload e inserido no banco (`insertData.local = payload.local || null`). Preciso verificar se o problema e na exibicao ou se `data_fim: null` esta causando erro de insert que impede todo o registro. Como `data_fim` e NOT NULL no schema do banco (`data_fim: string` sem `| null`), se `dataFim` for `undefined`, o insert falha silenciosamente -- e nada e salvo, incluindo o link.

### Causa raiz consolidada

O campo `data_fim` e **obrigatorio** no banco (NOT NULL). Quando o usuario nao preenche data/hora fim, o frontend envia `data_fim: undefined`, que vira `null` no insert, causando falha. Isso pode explicar por que dados parecem "nao salvar" ou salvar com valores errados.

### Alteracoes

**Arquivo 1: `src/modules/negocios/components/detalhes/AbaAgenda.tsx`**

1. Corrigir construcao de datas para incluir timezone offset (`-03:00` ou usar `Intl.DateTimeFormat` para detectar):

```typescript
// Antes:
const dataInicio = `${formData.data_inicio}T${formData.hora_inicio}:00`

// Depois:
const tzOffset = getTimezoneOffset() // ex: "-03:00"
const dataInicio = `${formData.data_inicio}T${formData.hora_inicio}:00${tzOffset}`
```

2. Garantir que `data_fim` sempre tenha um valor (fallback para inicio + 1h):

```typescript
const dataFim = formData.data_fim && formData.hora_fim
  ? `${formData.data_fim}T${formData.hora_fim}:00${tzOffset}`
  : addHours(new Date(dataInicio), 1) // sempre preencher
```

3. Separar `sincronizar_google` do checkbox de Meet -- sincronizar sempre que Google estiver conectado:

```typescript
// Antes:
sincronizar_google: formData.google_meet && !!conexaoGoogle?.conectado

// Depois:
sincronizar_google: !!conexaoGoogle?.conectado
google_meet: formData.google_meet
```

4. Adicionar funcao helper para obter offset de timezone do navegador.

**Arquivo 2: `supabase/functions/google-auth/index.ts`**

1. Corrigir fallback de `data_fim` na action `create-event` (linhas 626-628) para nao converter para UTC:

```typescript
// Antes (bugado - converte para UTC):
const endDateTime = body.data_fim && body.data_fim !== body.data_inicio
  ? body.data_fim
  : new Date(new Date(body.data_inicio).getTime() + 60 * 60 * 1000).toISOString()

// Depois (preserva timezone):
let endDateTime = body.data_fim
if (!endDateTime || endDateTime === body.data_inicio) {
  // Adicionar 1h sem converter para UTC
  // Parse a data local e adicionar 1h mantendo o formato original
  const match = body.data_inicio.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(.*)$/)
  if (match) {
    const dt = new Date(body.data_inicio)
    dt.setTime(dt.getTime() + 60 * 60 * 1000)
    // Reconstruir com mesmo offset
    endDateTime = dt.toISOString() // OK porque Google Calendar recebe o timeZone separado
  }
}
```

Na verdade, como o `eventBody` ja envia `timeZone: "America/Sao_Paulo"`, o formato da data precisa ser consistente. Se o frontend enviar com offset, o Google Calendar vai interpretar corretamente.

**Arquivo 3: `src/modules/negocios/components/kanban/AgendaQuickPopover.tsx`**

Aplicar as mesmas correcoes de timezone e sincronizacao do Google para manter consistencia com o popover rapido de agenda do kanban.

### Resumo das correcoes

| Arquivo | Correcao |
|---------|----------|
| `AbaAgenda.tsx` | Adicionar timezone offset nas datas, garantir data_fim obrigatorio, sincronizar Google independente de Meet |
| `google-auth/index.ts` | Corrigir fallback de data_fim para nao perder timezone |
| `AgendaQuickPopover.tsx` | Mesmas correcoes de timezone e sincronizacao |

### Nenhuma migracao de banco necessaria

O schema ja suporta todos os campos necessarios. O problema e puramente de construcao de dados no frontend e edge function.

