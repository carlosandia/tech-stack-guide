
# Validacao Real da Conexao Meta (Facebook/Instagram)

## Problema Atual

O botao "Testar Conexao" para Meta apenas verifica se os campos `app_id` e `app_secret` estao preenchidos. Ele **NAO** faz nenhuma chamada real a API do Meta para confirmar que as credenciais sao validas. Isso significa que o usuario pode ter digitado credenciais erradas e receber um falso positivo.

## Solucao

Criar uma Edge Function `test-meta` que faz uma chamada real a API do Meta usando o App ID e App Secret para gerar um App Access Token e validar que as credenciais funcionam.

### Como funciona a validacao real

O Meta permite gerar um **App Access Token** fazendo um GET para:

```text
https://graph.facebook.com/oauth/access_token?client_id={APP_ID}&client_secret={APP_SECRET}&grant_type=client_credentials
```

Se o App ID e App Secret estiverem corretos, retorna um token. Se estiverem errados, retorna erro. Esse e o teste mais simples e direto possivel.

---

## Alteracoes

### 1. Nova Edge Function: `supabase/functions/test-meta/index.ts`

- Recebe a requisicao autenticada (JWT do super_admin)
- Busca as configuracoes do Meta na tabela `configuracoes_globais`
- Descriptografa o `app_secret` (ou usa valor direto se nao estiver criptografado)
- Faz chamada real ao endpoint `graph.facebook.com/oauth/access_token`
- Retorna `{ sucesso: true/false, mensagem: "..." }`

### 2. Alterar: `src/modules/admin/services/admin.api.ts`

Na funcao `testarConfigGlobal`, adicionar um bloco para `plataforma === 'meta'` (similar ao que ja existe para `email`) que chama a edge function `test-meta` em vez de apenas validar campos.

**De:**
```
// Para outras plataformas, re-avaliar campos obrigatórios...
```

**Para:**
```
if (plataforma === 'meta') {
  // Chamada real a edge function test-meta
  const response = await fetch(.../functions/v1/test-meta, ...)
  return result
}
```

### Resultado

- O botao "Testar Conexao" para Meta passara a fazer uma chamada real a API do Facebook
- Se o App ID ou App Secret estiverem errados, o usuario vera uma mensagem de erro clara
- Se estiverem corretos, vera confirmacao de que as credenciais sao validas
