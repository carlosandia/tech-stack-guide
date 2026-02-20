
## Corrigir "Permissions error" ao Criar Publico no Meta

### Causa raiz

A URL de autorizacao OAuth do Meta (`meta-auth/index.ts`) nao inclui o parametro `auth_type=rerequest`. Sem ele, quando o usuario reconecta a conta Meta, o Facebook **reutiliza as permissoes ja autorizadas anteriormente** e nao solicita as novas (como `ads_management`). O token gerado continua sem a permissao necessaria para criar Custom Audiences.

### Correcao

Adicionar `&auth_type=rerequest` na URL OAuth em `supabase/functions/meta-auth/index.ts` (linha 127). Isso forca o Meta a exibir novamente a tela de permissoes, garantindo que todos os escopos listados sejam solicitados ao usuario.

### Arquivo afetado

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/meta-auth/index.ts` | Adicionar `&auth_type=rerequest` na URL OAuth |

### Detalhes tecnicos

**Antes (linha 122-127):**

```text
const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?` +
  `client_id=...` +
  `&redirect_uri=...` +
  `&state=...` +
  `&scope=...` +
  `&response_type=code`;
```

**Depois:**

```text
const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?` +
  `client_id=...` +
  `&redirect_uri=...` +
  `&state=...` +
  `&scope=...` +
  `&response_type=code` +
  `&auth_type=rerequest`;
```

O parametro `auth_type=rerequest` e documentado pela Meta para forcar a re-solicitacao de permissoes mesmo que o usuario ja tenha autorizado o app antes.

### Apos a correcao

O usuario deve:
1. Desconectar a conta Meta no CRM
2. Reconectar — desta vez a tela do Facebook mostrara as permissoes de `ads_management`
3. Aceitar as permissoes
4. Testar a criacao de publico novamente
