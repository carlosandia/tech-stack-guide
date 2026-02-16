

# Correcao: Respostas (Quotes) em Grupos Nao Aparecendo

## Diagnostico

**Causa raiz**: O codigo de extracao de `reply_to_message_id` (stanzaID da resposta citada) foi implantado no webhook APOS muitas mensagens ja terem sido recebidas. Mensagens recebidas antes do deploy nao tiveram o campo preenchido.

**Evidencias**:
- **2.107 mensagens** possuem dados de resposta no `raw_data` (campo `replyTo.id` ou `contextInfo.stanzaID`) mas `reply_to_message_id` esta NULL
- Mensagens recentes (apos 22:49 de hoje) JA possuem `reply_to_message_id` preenchido corretamente
- O codigo atual do webhook esta correto e funciona para novas mensagens

**Problema secundario**: Existem **41 mensagens duplicadas** (mesmo `message_id` inserido 2x) por falta de constraint UNIQUE

## Solucao

### 1. Backfill: Preencher reply_to_message_id a partir do raw_data

Migracaco SQL que extrai o stanzaID de `raw_data->'replyTo'->>'id'` para todas mensagens que possuem resposta mas estao com o campo NULL:

```sql
UPDATE mensagens
SET reply_to_message_id = raw_data->'replyTo'->>'id'
WHERE reply_to_message_id IS NULL
  AND deletado_em IS NULL
  AND raw_data->'replyTo'->>'id' IS NOT NULL;
```

Isso corrige as ~2.107 mensagens existentes sem necessidade de reprocessar via webhook.

### 2. Remover mensagens duplicadas

Manter apenas o registro mais antigo de cada `message_id` duplicado:

```sql
DELETE FROM mensagens
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY message_id ORDER BY criado_em ASC) as rn
    FROM mensagens
    WHERE deletado_em IS NULL
  ) sub
  WHERE rn > 1
);
```

### 3. Adicionar constraint UNIQUE para prevenir futuras duplicatas

Adicionar um indice UNIQUE parcial em `message_id` (excluindo deletados) para que o webhook nao insira a mesma mensagem duas vezes:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_mensagens_message_id_unique 
ON mensagens (message_id) 
WHERE deletado_em IS NULL;
```

Apos isso, ajustar o INSERT no webhook para usar UPSERT (`ON CONFLICT DO NOTHING` ou `DO UPDATE`) para lidar graciosamente com duplicatas.

### 4. Ajustar INSERT no webhook para ON CONFLICT

**Arquivo**: `supabase/functions/waha-webhook/index.ts`

Mudar o `.insert(messageInsert)` para `.upsert(messageInsert, { onConflict: 'message_id', ignoreDuplicates: true })` ou usar uma abordagem de verificacao previa.

## Arquivos a Modificar

1. **Migracao SQL** -- Backfill de reply_to_message_id, remocao de duplicatas, constraint UNIQUE
2. **`supabase/functions/waha-webhook/index.ts`** -- UPSERT ao inves de INSERT para evitar duplicatas futuras

## Resultado Esperado

- Todas as respostas (quotes) de grupo aparecerao corretamente no CRM com a bolha de citacao
- Novas mensagens continuarao sendo detectadas corretamente (o codigo ja funciona)
- Duplicatas eliminadas e prevenidas no futuro

