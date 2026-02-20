

## Correções: Permissão e Remoção de Públicos Meta

### Problema 1: "Permissions error" ao criar público

O escopo `ads_management` já está configurado no fluxo OAuth (linha 112 do `meta-auth/index.ts`). Porém, se a conta Meta foi conectada **antes** de adicionar esse escopo, o token salvo não inclui a permissão. A solução é **reconectar** a conta Meta para gerar um novo token.

**Ação necessária do usuário**: Desconectar e reconectar a conta Meta nas configurações de integração para renovar o token com `ads_management`.

**Melhoria no código**: Melhorar a mensagem de erro na Edge Function para sugerir a reconexão quando o Meta retornar "Permissions error".

### Problema 2: Adicionar botão "Remover" que deleta no Meta

A API Meta suporta deletar Custom Audiences via `DELETE /{audience_id}?access_token=xxx`. Vamos implementar:

### Alterações

#### 1. Edge Function `meta-audiences/index.ts` - Adicionar action "delete"

- Aceitar `action: "delete"` com parametro `audience_id`
- Chamar `DELETE https://graph.facebook.com/v21.0/{audience_id}?access_token=xxx`
- Retornar sucesso ou erro
- Atualizar validacao para aceitar `["list", "create", "delete"]`

#### 2. Service `configuracoes.api.ts` - Adicionar `removerAudience`

Nova funcao que:
1. Busca o audience do banco (para obter `audience_id` e `ad_account_id`)
2. Invoca `meta-audiences` com `action: "delete"` para remover no Meta
3. Faz soft delete no banco (`deletado_em = now()`)
4. Se o audience tiver ID `pending_`, apenas remove localmente sem chamar o Meta

#### 3. UI `CustomAudiencesPanel.tsx` - Adicionar botão "Remover"

- Novo botão vermelho "Remover" ao lado de "Desativar/Ativar"
- Dialogo de confirmacao antes de remover ("Isso removerá o público tanto do CRM quanto do Meta Ads. Deseja continuar?")
- Mutation para chamar `removerAudience`

#### 4. Melhoria na mensagem de erro de permissão

Na Edge Function, quando o Meta retornar "Permissions error", adicionar sugestão:
"Erro de permissão. Tente reconectar sua conta Meta em Configurações > Conexões para renovar as permissões."

### Arquivos afetados

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/meta-audiences/index.ts` | Adicionar action "delete", melhorar msg de erro |
| `src/modules/configuracoes/services/configuracoes.api.ts` | Adicionar `removerAudience` |
| `src/modules/configuracoes/components/integracoes/meta/CustomAudiencesPanel.tsx` | Botão "Remover" com confirmação |

### Detalhes técnicos

**Meta Graph API - Deletar Custom Audience:**

```text
DELETE https://graph.facebook.com/v21.0/{AUDIENCE_ID}?access_token={TOKEN}

Resposta sucesso: { "success": true }
```

**Edge Function - action "delete":**

```text
Recebe: { action: "delete", ad_account_id: "act_xxx", audience_id: "120241651347460787" }

1. Autentica usuario
2. Busca access_token
3. DELETE para Meta API /{audience_id}
4. Retorna { success: true }
```

**Service - removerAudience:**

```text
1. Busca audience do banco por ID interno
2. Se audience_id nao comeca com "pending_", invoca meta-audiences com action "delete"
3. Faz soft delete: update deletado_em = now()
4. Invalida query cache
```

### Sobre reconexão

Apos implementar as mudanças, o usuario deve:
1. Ir em Configurações > Conexões
2. Desconectar a conta Meta
3. Reconectar - o novo token incluirá `ads_management`
4. Testar criação do público novamente

