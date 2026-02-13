
# Rejeitar Lead: Motivo Opcional + Bloqueio de Contato

## Resumo

Tres mudancas principais:
1. Motivo de rejeicao passa a ser **opcional** (nao obrigatorio)
2. Novo checkbox **"Nao criar mais cards dessa pessoa"** no modal de rejeicao
3. Gerenciamento de contatos bloqueados em **Configuracoes > Conexoes** (ou secao dedicada)

---

## Detalhes Tecnicos

### 1. Migracao SQL - Tabela `contatos_bloqueados_pre_op`

Nova tabela para armazenar telefones bloqueados por organizacao:

```sql
CREATE TABLE contatos_bloqueados_pre_op (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id UUID NOT NULL REFERENCES organizacoes(id),
  phone_number VARCHAR NOT NULL,
  phone_name VARCHAR,
  motivo TEXT,
  bloqueado_por UUID REFERENCES usuarios(id),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_bloqueados_pre_op_org_phone 
  ON contatos_bloqueados_pre_op(organizacao_id, phone_number);
```

Com RLS habilitado para isolamento por organizacao.

### 2. Modal `RejeitarPreOportunidadeModal.tsx`

- Remover asterisco obrigatorio do label "Motivo da rejeicao"
- Remover validacao `if (!motivo.trim())` - permitir motivo vazio
- Remover `disabled={!motivo.trim()}` do botao
- Adicionar checkbox com Switch: **"Nao criar mais cards dessa pessoa"** (default: false)
- Passar `bloquear: boolean` junto ao payload de rejeicao

### 3. API `pre-oportunidades.api.ts`

- Metodo `rejeitar`: aceitar `motivo` como opcional (`string | null`) e novo param `bloquear: boolean`
- Se `bloquear === true`, inserir registro na tabela `contatos_bloqueados_pre_op`
- Metodo novo `listarBloqueados()`: listar contatos bloqueados da organizacao
- Metodo novo `desbloquearContato(id)`: remover registro da tabela

### 4. Hook `usePreOportunidades.ts`

- Atualizar `useRejeitarPreOportunidade` para aceitar `motivo?: string` e `bloquear: boolean`
- Novos hooks: `useBloqueadosPreOp()` e `useDesbloquearPreOp()`

### 5. Webhook `waha-webhook/index.ts` (STEP 4)

Antes de criar/atualizar pre_oportunidade, verificar se o telefone esta bloqueado:

```typescript
// Checar bloqueio antes de criar pre-oportunidade
const { data: bloqueado } = await supabaseAdmin
  .from("contatos_bloqueados_pre_op")
  .select("id")
  .eq("organizacao_id", sessao.organizacao_id)
  .eq("phone_number", phoneNumber)
  .maybeSingle();

if (bloqueado) {
  console.log(`[waha-webhook] Phone ${phoneNumber} blocked, skipping pre-op`);
  // Nao criar pre-oportunidade, mas continua salvando a mensagem na conversa
}
```

### 6. UI de Gerenciamento - Configuracoes > Conexoes

Adicionar uma secao/aba "Contatos Bloqueados" na pagina de Conexoes (ou como sub-item no sidebar de Configuracoes), contendo:

- Lista de contatos bloqueados com: telefone, nome, motivo (se houver), data do bloqueio
- Botao "Desbloquear" em cada item para remover o bloqueio
- Estado vazio: "Nenhum contato bloqueado"

---

## Arquivos Modificados

1. **Nova migracao SQL** - criar tabela `contatos_bloqueados_pre_op`
2. **`src/modules/negocios/components/modals/RejeitarPreOportunidadeModal.tsx`** - motivo opcional + checkbox bloquear
3. **`src/modules/negocios/services/pre-oportunidades.api.ts`** - rejeitar com bloqueio + CRUD bloqueados
4. **`src/modules/negocios/hooks/usePreOportunidades.ts`** - novos hooks
5. **`supabase/functions/waha-webhook/index.ts`** - checar bloqueio no STEP 4
6. **`src/modules/configuracoes/pages/ConexoesPage.tsx`** - secao de contatos bloqueados (ou nova pagina dedicada)
