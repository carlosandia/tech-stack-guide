

# Melhorar Tooltip "Por Canal de Origem" — Clareza na Prioridade

## Problema
O tooltip atual é genérico e nao explica de forma clara a hierarquia de prioridade usada para classificar cada oportunidade em um canal. O usuario precisa entender o que esta vendo para tomar decisoes melhores.

## Logica Real (confirmada no banco)
A funcao SQL usa: `COALESCE(NULLIF(TRIM(utm_source), ''), origem, 'direto')`

Ou seja:
1. **UTM (utm_source)** — Se a oportunidade tem parametro UTM, esse valor sempre vence (ex: `meta_ads`, `google_ads`)
2. **Origem do fluxo** — Se nao tem UTM, usa o campo `origem` preenchido automaticamente pelo sistema (ex: `whatsapp`, `formulario`, `webhook`) ou manualmente pelo usuario
3. **Direto** — Se nenhum dos dois existe, aparece como "Direto"

## Solucao
Reescrever o conteudo do `PopoverContent` no componente `BreakdownCanal.tsx` para apresentar a hierarquia de forma visual, simples e objetiva usando uma lista numerada com explicacao curta.

## Alteracoes

### Arquivo: `src/modules/app/components/dashboard/BreakdownCanal.tsx`

Substituir o texto dos dois `PopoverContent` (estado vazio e estado com dados) por algo como:

```
Como o canal e definido?

1. UTM (utm_source) — Sempre prioridade. Se o lead chegou com parametro UTM 
   (ex: campanha Meta Ads, Google Ads), esse valor e usado independente 
   do canal de entrada.

2. Origem do fluxo — Se nao tem UTM, usa a origem automatica: WhatsApp, 
   Formulario, Widget, Webhook, etc.

3. Direto / Manual — Quando nenhuma das anteriores existe. Ex: oportunidade 
   criada manualmente sem origem definida.
```

A apresentacao usara elementos HTML simples (paragrafos e texto bold) mantendo o mesmo padrao visual do Popover existente, sem adicionar complexidade.

## Detalhes tecnicos
- Apenas alteracao de conteudo textual dentro dos dois blocos `PopoverContent` ja existentes
- Nenhuma dependencia nova
- Nenhuma alteracao de logica ou estilo
