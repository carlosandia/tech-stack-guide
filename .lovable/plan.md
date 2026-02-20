

## Diagnosticar e Corrigir "Permissions error" ao Criar Publico Meta

### Causa raiz identificada

O callback salvou o token com sucesso (log de 00:59:44), mas ao criar audience (01:00:10) o Meta retorna "Permissions error". Isso significa que o token salvo **nao possui a permissao `ads_management` efetivamente concedida**, mesmo que ela esteja listada nos escopos do OAuth.

Possiveis causas:
- O app Meta nao tem `ads_management` habilitado nas "Permissoes e Recursos" do Developer Portal
- O usuario nao aceitou a permissao na tela do OAuth (pode ter desmarcado)
- O app esta em modo de desenvolvimento e o usuario nao tem role no app

### Solucao

Adicionar **verificacao de permissoes do token** na Edge Function `meta-audiences` antes de tentar criar o audience. Isso vai:
1. Chamar `GET /me/permissions` para verificar quais permissoes o token realmente tem
2. Se `ads_management` nao estiver concedida, retornar mensagem clara orientando o usuario
3. Logar o erro completo do Meta (code, type, fbtrace_id) para debugging futuro

### Arquivo afetado

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/meta-audiences/index.ts` | Adicionar verificacao de permissoes antes do create, logar erro completo |

### Detalhes tecnicos

**1. Verificacao de permissoes (antes do create):**

```text
// Antes de criar, verificar se o token tem ads_management
const permUrl = `https://graph.facebook.com/v21.0/me/permissions?access_token=${accessToken}`;
const permRes = await fetch(permUrl);
const permData = await permRes.json();
const perms = permData.data || [];
const adsManagement = perms.find(p => p.permission === 'ads_management');

if (!adsManagement || adsManagement.status !== 'granted') {
  // Listar permissoes concedidas para debug
  const granted = perms.filter(p => p.status === 'granted').map(p => p.permission);
  console.error(`[meta-audiences] Token nao tem ads_management. Permissoes: ${granted.join(', ')}`);
  return Response com erro:
    "Seu token Meta nao possui a permissao 'ads_management'. 
     Verifique se a permissao esta habilitada no Meta Developer Portal 
     (App > Permissoes e Recursos) e reconecte a conta."
}
```

**2. Log completo do erro Meta:**

```text
// Ao logar erro, incluir code, type e fbtrace_id
console.error(`[meta-audiences] Erro ao criar:`, JSON.stringify(createData.error));
```

Isso vai revelar exatamente quais permissoes o token tem, permitindo diagnosticar se o problema esta no app Meta ou na autorizacao do usuario.

### Apos a correcao

Se o log mostrar que `ads_management` nao esta nas permissoes:
1. Acessar Meta Developer Portal > App > Permissoes e Recursos
2. Garantir que `ads_management` esta habilitado
3. Desconectar e reconectar a conta Meta no CRM
4. Verificar que a tela do Facebook mostra e solicita `ads_management`

