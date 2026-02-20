

## Corrigir Criacao de Publico Personalizado no Meta

### Problema

Ao clicar em "Criar Publico", o sistema salva apenas localmente no banco de dados com um `audience_id` temporario (`pending_xxx`). A chamada real para a Meta Graph API nunca acontece, por isso o publico nao aparece no Meta Ads Manager.

### Solucao

Adicionar a action `create` na Edge Function `meta-audiences` para chamar a API do Meta e criar o publico de verdade, e atualizar o frontend para usar essa Edge Function.

### Alteracoes

#### 1. Edge Function `meta-audiences/index.ts` - Adicionar action "create"

Expandir a Edge Function existente para suportar duas actions:

- `action: "list"` (existente, sem mudancas)
- `action: "create"` (nova) - Chama `POST https://graph.facebook.com/v21.0/act_{accountId}/customaudiences` com:
  - `name`: nome do publico
  - `subtype`: `CUSTOM`
  - `customer_file_source`: `USER_PROVIDED_ONLY`
  - `access_token`: token da conexao Meta

Retorna o `audience_id` real criado pelo Meta.

#### 2. Service `configuracoes.api.ts` - Atualizar `criarAudience`

Em vez de inserir diretamente no banco com `pending_`, a funcao vai:

1. Invocar `meta-audiences` com `action: "create"`, passando `audience_name` e `ad_account_id`
2. Receber o `audience_id` real do Meta
3. Inserir no banco com o `audience_id` real retornado pelo Meta
4. Se a chamada ao Meta falhar, nao insere no banco e mostra o erro ao usuario

#### 3. UI `CustomAudiencesPanel.tsx` - Sem mudancas estruturais

O fluxo visual ja esta correto. A unica mudanca comportamental e que agora o publico criado tera um `audience_id` real (ex: `120241651347460787`) em vez de `pending_xxx`, e o botao "Sincronizar Agora" estara habilitado imediatamente.

### Detalhes tecnicos

**Meta Graph API - Criar Custom Audience:**

```text
POST https://graph.facebook.com/v21.0/act_{AD_ACCOUNT_ID}/customaudiences

Parametros:
- name: "Nome do Publico"
- subtype: "CUSTOM"
- customer_file_source: "USER_PROVIDED_ONLY"
- access_token: {token}

Resposta:
{ "id": "120241651347460787" }
```

**Edge Function - Nova logica para action "create":**

```text
Recebe: { action: "create", ad_account_id: "act_xxx", audience_name: "Meu Publico" }

1. Autentica usuario
2. Busca organizacao_id
3. Busca access_token de conexoes_meta
4. POST para Meta API /customaudiences
5. Retorna { audience_id: "120241651347460787", name: "Meu Publico" }
```

**Service - Nova logica de criarAudience:**

```text
1. Invoca supabase.functions.invoke('meta-audiences', { body: { action: 'create', ... } })
2. Se sucesso, insere no banco com audience_id real
3. Se erro, lanca excecao (toast de erro ja existe no componente)
```

### Arquivos afetados

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/meta-audiences/index.ts` | Adicionar action "create" com POST para Meta API |
| `src/modules/configuracoes/services/configuracoes.api.ts` | Atualizar criarAudience para invocar Edge Function primeiro |

