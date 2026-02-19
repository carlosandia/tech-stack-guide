
## Correção: Conversions API - Mapeamento de Status e Conexão com Supabase

### Problemas Encontrados

**Problema 1 - Frontend usa Axios (localhost:3001)**

As funções `obterCapiConfig`, `salvarCapiConfig` e `testarCapi` em `configuracoes.api.ts` ainda usam `api.get`/`api.post` que apontam para um backend Node.js local (`localhost:3001`). Como esse backend não existe no ambiente, todas as operacoes CAPI falham com `ERR_CONNECTION_REFUSED`.

**Problema 2 - Trigger classifica Ganho/Perda incorretamente**

A trigger `emitir_evento_automacao` no banco de dados diferencia oportunidade ganha de perdida usando:
```sql
CASE WHEN NEW.motivo_resultado_id IS NULL THEN 'oportunidade_ganha' ELSE 'oportunidade_perdida' END
```
Porem, oportunidades ganhas tambem podem ter `motivo_resultado_id` preenchido (quando `exigir_motivo_resultado = true` no funil). Isso faz a trigger emitir `oportunidade_perdida` incorretamente para oportunidades ganhas que tem motivo.

O correto seria consultar o tipo da etapa destino (campo `tipo` em `etapas_funil`, que sera `ganho` ou `perda`).

### Mapeamento dos Eventos (validacao)

| Evento | Meta Event | Fonte no Supabase | Status |
|--------|-----------|-------------------|--------|
| Lead | `Lead` | Contato tipo `pessoa` criado (tabela `contatos`) | Correto |
| Schedule | `Schedule` | INSERT em `reunioes_oportunidades` (status `agendada`) | Correto |
| MQL | `CompleteRegistration` | `oportunidades.qualificado_mql = true` | Correto |
| Won | `Purchase` | `oportunidades.fechado_em` IS NOT NULL + etapa tipo `ganho` | Precisa correcao na trigger |
| Lost | `Other` | `oportunidades.fechado_em` IS NOT NULL + etapa tipo `perda` | Precisa correcao na trigger |

### Plano de Correcao

**1. Migrar CAPI para Supabase direto (configuracoes.api.ts)**

Substituir as 3 funcoes que usam Axios por chamadas diretas ao Supabase na tabela `config_conversions_api`:

- `obterCapiConfig`: SELECT na tabela `config_conversions_api` filtrando por `organizacao_id`
- `salvarCapiConfig`: UPSERT na tabela `config_conversions_api` com `pixel_id`, `eventos_habilitados`, `config_eventos`
- `testarCapi`: Por enquanto, apenas salvar um registro de teste (o envio real ao Meta depende do access_token que esta no backend)

**2. Corrigir trigger `emitir_evento_automacao` (migration SQL)**

Alterar a logica de fechamento para consultar o tipo da etapa ao inves de depender de `motivo_resultado_id`:

```sql
-- Dentro do bloco de fechamento (OLD.fechado_em IS NULL AND NEW.fechado_em IS NOT NULL)
-- Consultar o tipo da etapa para determinar se e ganho ou perda
SELECT tipo INTO v_tipo_etapa FROM etapas_funil WHERE id = NEW.etapa_id LIMIT 1;

INSERT INTO eventos_automacao (...) VALUES (
  v_organizacao_id,
  CASE WHEN v_tipo_etapa = 'ganho' THEN 'oportunidade_ganha' ELSE 'oportunidade_perdida' END,
  ...
);
```

### Arquivos Afetados

- `src/modules/configuracoes/services/configuracoes.api.ts` - Migrar obterCapiConfig, salvarCapiConfig, testarCapi
- Migration SQL - Corrigir trigger `emitir_evento_automacao`
