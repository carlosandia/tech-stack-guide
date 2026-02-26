
# Plano: Diferenciar WhatsApp Conversas vs WhatsApp Widget + UTM no Widget

## Problema Atual

1. O widget WhatsApp cria oportunidades **sem `origem`** e **sem `utm_source`**, fazendo com que apareçam como "direto" ou se misturem com as oportunidades vindas de conversas WhatsApp (waha-webhook que usa `origem: 'whatsapp'`).
2. O widget não captura parâmetros UTM da URL do visitante, então não há rastreabilidade de campanha para leads do widget.

## Solucao

### Fase 1: Diferenciar a origem no backend

**Edge Function `widget-whatsapp-config/index.ts`** (no bloco de criacao de oportunidade, ~linha 295):
- Adicionar `origem: 'whatsapp_widget'` ao insert da oportunidade
- Capturar UTM params enviados pelo widget loader e salvar como `utm_source`, `utm_medium`, `utm_campaign` na oportunidade
- Logica de prioridade: se veio UTM do visitante, `utm_source` recebe o valor da UTM. Se nao, a coluna `origem` ja resolve como `whatsapp_widget` no breakdown via `COALESCE(utm_source, origem, 'direto')`

### Fase 2: Capturar UTMs no widget loader (frontend do visitante)

**Edge Function `widget-whatsapp-loader/index.ts`**:
- No script JS injetado, capturar `window.location.search` para extrair `utm_source`, `utm_medium`, `utm_campaign`
- Enviar esses valores no POST body junto com os dados do formulario: `{dados, config, utm: {utm_source, utm_medium, utm_campaign}}`

### Fase 3: Processar UTMs na edge function de config

**Edge Function `widget-whatsapp-config/index.ts`** (handler POST):
- Extrair `utm_source`, `utm_medium`, `utm_campaign` do body
- Ao criar a oportunidade, incluir esses campos se presentes
- A oportunidade fica com `origem: 'whatsapp_widget'` sempre, e `utm_source` so se o visitante veio com UTM na URL

### Fase 4: Atualizar nomenclatura no frontend

**`src/modules/app/components/dashboard/BreakdownCanal.tsx`**:
- Renomear `whatsapp` para `WhatsApp Conversas` no mapa de nomes
- Adicionar `whatsapp_widget` como `WhatsApp Widget` com cor diferenciada (ex: `#128C7E` - verde escuro do WhatsApp Business)

### Fase 5: Backfill (migracao SQL)

- Atualizar oportunidades existentes que vieram do widget: identificar pela ausencia de origem e pelo contato ter sido criado com `origem = 'whatsapp'` mas sem `pre_oportunidade` associada. Porem, essa distincao e imprecisa, entao o backfill sera **opcional** e conservador — aplicar `origem = 'whatsapp_widget'` apenas para oportunidades que possuam contato criado pela edge function do widget (contatos com `origem = 'whatsapp'` e sem correspondencia na tabela `pre_oportunidades`).

---

## Detalhes Tecnicos

### Alteracao 1 — `widget-whatsapp-loader/index.ts`

Adicionar captura de UTM no script JS:

```text
// Antes do fetch POST, capturar UTMs da URL do visitante
var urlParams = new URLSearchParams(window.location.search);
var utmData = {
  utm_source: urlParams.get('utm_source') || '',
  utm_medium: urlParams.get('utm_medium') || '',
  utm_campaign: urlParams.get('utm_campaign') || ''
};

// No fetch POST, enviar junto:
fetch(API, {
  method: 'POST',
  headers: {'Content-Type':'application/json'},
  body: JSON.stringify({dados: dadosObj, config: cfg, utm: utmData})
})
```

### Alteracao 2 — `widget-whatsapp-config/index.ts`

No handler POST (~linha 295), extrair UTMs e inserir na oportunidade:

```text
// Extrair UTMs do body
const utmData = body.utm || {};
const utmSource = utmData.utm_source || null;
const utmMedium = utmData.utm_medium || null;
const utmCampaign = utmData.utm_campaign || null;

// Insert da oportunidade com origem e UTMs
.insert({
  organizacao_id: orgId,
  funil_id: funilId,
  etapa_id: etapaId,
  contato_id: contatoId,
  titulo: tituloAuto,
  valor: 0,
  origem: 'whatsapp_widget',
  utm_source: utmSource,
  utm_medium: utmMedium,
  utm_campaign: utmCampaign,
})
```

### Alteracao 3 — `BreakdownCanal.tsx`

```text
// Mapa de cores
whatsapp: '#22C55E',           // Verde claro - Conversas
whatsapp_widget: '#128C7E',    // Verde escuro - Widget

// Mapa de nomes
whatsapp: 'WhatsApp Conversas',
whatsapp_widget: 'WhatsApp Widget',
```

### Alteracao 4 — Migracao SQL (backfill conservador)

Atualizar oportunidades sem origem que tenham contato com `origem = 'whatsapp'` e que **nao** tenham pre-oportunidade associada (indicando que vieram do widget e nao da conversa direta):

```text
UPDATE oportunidades o
SET origem = 'whatsapp_widget'
WHERE o.origem IS NULL
  AND o.deletado_em IS NULL
  AND EXISTS (
    SELECT 1 FROM contatos c
    WHERE c.id = o.contato_id
    AND c.origem = 'whatsapp'
  )
  AND NOT EXISTS (
    SELECT 1 FROM pre_oportunidades po
    WHERE po.oportunidade_id = o.id
  );
```

## Resumo de Arquivos Alterados

| Arquivo | Tipo |
|---------|------|
| `supabase/functions/widget-whatsapp-loader/index.ts` | Captura UTM da URL do visitante |
| `supabase/functions/widget-whatsapp-config/index.ts` | Salva origem + UTMs na oportunidade |
| `src/modules/app/components/dashboard/BreakdownCanal.tsx` | Nomenclatura e cores |
| `supabase/migrations/xxx.sql` | Backfill conservador |
