
# Plano: Corrigir Canal de Origem — CONCLUÍDO ✅

## O que foi feito

### 1. Migration: coluna `origem` em oportunidades
- Coluna `origem VARCHAR(50) DEFAULT 'manual'` adicionada
- Backfill executado: oportunidades existentes herdaram `origem` do contato vinculado
- RPC `fn_breakdown_canal_funil` atualizado para usar `COALESCE(NULLIF(TRIM(utm_source), ''), origem, 'direto')`

### 2. Fluxos de criação atualizados
- **Modal manual** (`negocios.api.ts`): `origem: 'manual'`
- **Pré-oportunidade WhatsApp** (`pre-oportunidades.api.ts`): `origem: 'whatsapp'`
- **Meta Lead Ads** (`meta-leadgen-webhook`): `origem: 'meta_ads'` + `utm_source: 'meta_ads'`
- **Formulário** (`processar-submissao-formulario`): `origem: 'formulario'`

### 3. Trigger de herança automática
- `trg_herdar_origem_contato` (BEFORE INSERT): se a oportunidade não tem origem explícita, herda do contato
- Cobre automações e triggers que criam oportunidades sem setar origem

### Prioridade de canal no gráfico
`utm_source` > `origem` > `'direto'`
