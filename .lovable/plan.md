
# Plano: Cortesia com Duracao Temporizada

## Resumo

Adicionar ao sistema de cortesia a opcao de definir **duracao em meses** (ex: 2, 3, 6 meses) ou **Permanente**. Quando o tempo expirar, a organizacao sera bloqueada automaticamente, exigindo que o tenant escolha um plano pago para continuar usando o sistema.

---

## 1. Alteracao no Banco de Dados

Adicionar 3 novas colunas na tabela `assinaturas`:

| Coluna | Tipo | Default | Descricao |
|--------|------|---------|-----------|
| `cortesia_duracao_meses` | `integer` | `NULL` | Quantidade de meses. NULL = permanente |
| `cortesia_inicio` | `timestamptz` | `NULL` | Data de inicio da cortesia |
| `cortesia_fim` | `timestamptz` | `NULL` | Data calculada de expiracao. NULL = permanente |

Criar uma **Database Function** `verificar_cortesias_expiradas()` que:
- Busca assinaturas onde `cortesia = true` AND `cortesia_fim IS NOT NULL` AND `cortesia_fim < NOW()`
- Atualiza o status da assinatura para `bloqueada`
- Atualiza o status da organizacao correspondente para `suspensa`

Criar um **pg_cron job** (ou orientar o Super Admin a configurar) para executar a funcao diariamente.

---

## 2. Alteracao na UI - Step2Expectativas

Quando o checkbox "Conceder como cortesia" estiver marcado, exibir abaixo do motivo:

**Novo campo: "Duracao da cortesia"**
- Select/dropdown com as opcoes:
  - `1 mes`
  - `2 meses`
  - `3 meses`
  - `6 meses`
  - `12 meses`
  - `Permanente` (valor especial = sem fim)
- Default: `Permanente`
- Seguindo Design System: `text-sm`, `rounded-md`, `border-input`, tokens semanticos

Layout visual (dentro do bloco de cortesia existente):

```text
+---------------------------------------------------+
| [x] Conceder como cortesia                        |
|     A organizacao usara o plano sem cobranca       |
|                                                    |
|   [ Motivo da cortesia (obrigatorio)            ]  |
|                                                    |
|   Duracao da cortesia *                            |
|   [ Permanente               v ]                   |
+---------------------------------------------------+
```

---

## 3. Alteracao nos Schemas (Zod)

Adicionar ao `Step2ExpectativasSchema` e `CriarOrganizacaoSchema`:
- `cortesia_duracao_meses`: `z.number().int().positive().nullable().default(null)` -- null = permanente

Adicionar validacao: se cortesia ativa, duracao deve ser selecionada (ou ser permanente).

---

## 4. Alteracao na API de Criacao

No `criarOrganizacao()` em `admin.api.ts`:
- Ao inserir na tabela `assinaturas`, calcular `cortesia_inicio` e `cortesia_fim`:
  - `cortesia_inicio` = data atual
  - `cortesia_fim` = se `duracao_meses` for null (permanente), gravar null; caso contrario, calcular `data atual + N meses`

---

## 5. Fluxo de Expiracao e Bloqueio

O fluxo ja existente de bloqueio (`useBlockedRedirect` + `BlockedPage`) sera reutilizado:

1. O pg_cron executa diariamente `verificar_cortesias_expiradas()`
2. Assinaturas com cortesia expirada recebem status `bloqueada`
3. Organizacao recebe status `suspensa`
4. O hook `useBlockedRedirect` ja detecta `org_status === 'bloqueada'` e redireciona
5. O usuario ve a `BlockedPage` com opcao de escolher plano e cartao de credito

---

## 6. Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/migrations/` | Nova migration: colunas + funcao + cron |
| `src/modules/admin/schemas/organizacao.schema.ts` | Novo campo `cortesia_duracao_meses` nos schemas |
| `src/modules/admin/components/wizard/Step2Expectativas.tsx` | Dropdown de duracao |
| `src/modules/admin/services/admin.api.ts` | Payload e calculo de datas na criacao |
| `src/modules/admin/components/NovaOrganizacaoModal.tsx` | Default value do novo campo |

---

## 7. Detalhes Tecnicos

### Migration SQL

```sql
-- Novas colunas
ALTER TABLE assinaturas 
  ADD COLUMN cortesia_duracao_meses integer,
  ADD COLUMN cortesia_inicio timestamptz,
  ADD COLUMN cortesia_fim timestamptz;

-- Funcao de verificacao
CREATE OR REPLACE FUNCTION verificar_cortesias_expiradas()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Buscar assinaturas com cortesia expirada
  UPDATE assinaturas 
  SET status = 'bloqueada', cortesia = false
  WHERE cortesia = true 
    AND cortesia_fim IS NOT NULL 
    AND cortesia_fim < NOW()
    AND status != 'bloqueada';

  -- Atualizar organizacoes correspondentes
  UPDATE organizacoes_saas 
  SET status = 'suspensa'
  WHERE id IN (
    SELECT organizacao_id FROM assinaturas 
    WHERE cortesia_fim IS NOT NULL 
      AND cortesia_fim < NOW() 
      AND status = 'bloqueada'
  )
  AND status != 'suspensa';
END;
$$;

-- Configurar pg_cron (executar 1x por dia a meia-noite)
SELECT cron.schedule(
  'verificar-cortesias-expiradas',
  '0 0 * * *',
  'SELECT verificar_cortesias_expiradas()'
);
```

### Calculo de data no frontend

```typescript
// cortesia_duracao_meses = null -> permanente
// cortesia_duracao_meses = 3 -> 3 meses a partir de agora
const agora = new Date()
const cortesiaInicio = agora.toISOString()
const cortesiaFim = payload.cortesia_duracao_meses 
  ? new Date(agora.setMonth(agora.getMonth() + payload.cortesia_duracao_meses)).toISOString()
  : null
```

### Nota sobre pg_cron

O `pg_cron` precisa estar habilitado no Supabase (disponivel no plano Pro+). Se nao estiver disponivel, uma alternativa seria criar uma Edge Function agendada via Supabase Cron ou verificar a expiracao no momento do login do usuario.
