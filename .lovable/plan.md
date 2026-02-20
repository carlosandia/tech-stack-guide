
## Corrigir Card Meta Ads Nao Aparecendo Apos Reconexao

### Causa raiz

Ao desconectar o Meta, o frontend faz um soft delete: `{ deletado_em: "2026-02-20...", status: "desconectado" }`. Quando o usuario reconecta, o meta-callback faz um `upsert` com `onConflict: "organizacao_id"`, atualizando o registro existente. Porem, o upsert **nao limpa o campo `deletado_em`**, que permanece preenchido. A query do frontend filtra `deletado_em=is.null`, entao o registro "conectado" fica invisivel.

### Correcao

No arquivo `supabase/functions/meta-callback/index.ts`, adicionar `deletado_em: null` e `conectado_em: new Date().toISOString()` no objeto do upsert (linha 124). Isso garante que ao reconectar, o soft delete anterior seja revertido.

### Arquivo afetado

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/meta-callback/index.ts` | Adicionar `deletado_em: null` e `conectado_em` no upsert |

### Detalhes tecnicos

Na linha 124-135 do meta-callback, o objeto do upsert passa a incluir:

```typescript
{
  organizacao_id: stateData.organizacao_id,
  access_token_encrypted: accessToken,
  meta_user_id: metaUser.id || null,
  meta_user_name: metaUser.name || null,
  meta_user_email: metaUser.email || null,
  status: "conectado",
  token_expires_at: tokenExpiresAt,
  ultimo_erro: null,
  deletado_em: null,              // NOVO - limpa soft delete anterior
  conectado_em: new Date().toISOString(),  // NOVO - atualiza data de conexao
  atualizado_em: new Date().toISOString(),
}
```

### Correcao imediata do banco

Alem da correcao no codigo, sera necessario corrigir o registro atual no banco que esta com `deletado_em` preenchido mas `status: conectado`, para que o card apareca imediatamente.
