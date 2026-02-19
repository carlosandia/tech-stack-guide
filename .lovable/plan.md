
# Plano: Criar Endpoints para Callbacks do Meta (Desautorizacao e Exclusao de Dados)

## Problema

Os campos "Desautorizar URL de retorno de chamada" e "Solicitacao de exclusao de dados" no Meta Developers Portal exigem **endpoints de API** que:
- Recebam requisicoes **POST** com um `signed_request`
- Processem o payload (parse + verificacao HMAC-SHA256)
- Retornem resposta **JSON** apropriada

Uma pagina frontend React nao pode cumprir esses requisitos.

## Solucao

Criar duas Edge Functions no Supabase para lidar com esses callbacks.

### 1. Edge Function: `meta-deauthorize`

**Responsabilidade:** Receber notificacao quando um usuario remove o app Meta.

- Recebe POST com `signed_request`
- Valida a assinatura usando o `app_secret`
- Marca a conexao do usuario como desconectada no banco (tabela `conexoes_meta`)
- Retorna status 200

**URL para o Meta:** `https://ybzhlsalbnxwkfszkloa.supabase.co/functions/v1/meta-deauthorize`

### 2. Edge Function: `meta-data-deletion`

**Responsabilidade:** Processar solicitacoes de exclusao de dados do usuario.

- Recebe POST com `signed_request`
- Valida a assinatura HMAC-SHA256
- Remove/marca dados do usuario para exclusao
- Retorna JSON: `{ "url": "<status_url>", "confirmation_code": "<code>" }` (obrigatorio pela documentacao do Meta)

**URL para o Meta:** `https://ybzhlsalbnxwkfszkloa.supabase.co/functions/v1/meta-data-deletion`

### 3. Configuracao no Meta Developers Portal

Apos implementacao, os campos devem ser preenchidos assim:

| Campo | Valor |
|-------|-------|
| **URI de redirecionamento OAuth** | `https://crm.renovedigital.com.br/app/configuracoes/conexoes` |
| **Desautorizar URL de retorno de chamada** | `https://ybzhlsalbnxwkfszkloa.supabase.co/functions/v1/meta-deauthorize` |
| **URL de solicitacao de exclusao de dados** | `https://ybzhlsalbnxwkfszkloa.supabase.co/functions/v1/meta-data-deletion` |

### Detalhes Tecnicos

**Logica de parse do `signed_request`** (compartilhada entre as duas funcoes):

```text
1. Receber signed_request do body (form-urlencoded)
2. Separar em [encoded_sig, payload] pelo "."
3. Decodificar payload (base64url) para obter { user_id, algorithm, ... }
4. Verificar assinatura HMAC-SHA256 usando app_secret da tabela configuracoes_globais
5. Processar a acao correspondente
```

**meta-deauthorize:**
- Busca conexao pelo user_id do Meta
- Atualiza status para "desconectado" na tabela `conexoes_meta`
- Retorna 200 OK

**meta-data-deletion:**
- Gera confirmation_code unico
- Registra solicitacao de exclusao (pode usar tabela auxiliar ou log)
- Remove tokens/dados do usuario da `conexoes_meta`
- Retorna JSON com url de status e confirmation_code

**Ambas funcoes** precisam estar no `supabase/config.toml` como publicas (sem JWT), pois o Meta nao envia token de autenticacao.

### Arquivos a criar/editar

1. `supabase/functions/meta-deauthorize/index.ts` (novo)
2. `supabase/functions/meta-data-deletion/index.ts` (novo)
3. `supabase/config.toml` (adicionar as novas funcoes como publicas)
