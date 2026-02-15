

## Correção: Link de convite com tipo de token incorreto

### Causa Raiz

Na Edge Function `invite-admin`, quando o usuário já existe no Supabase Auth, o sistema gera um **magiclink** em vez de um **invite**. Porém, a URL de verificação na linha 593 sempre usa `type=invite`, causando rejeição do token pelo Supabase Auth com o erro "Email link is invalid or has expired".

### O que muda

**Arquivo**: `supabase/functions/invite-admin/index.ts`

1. Adicionar uma variável para rastrear qual tipo de link foi gerado (`invite` ou `magiclink`)
2. Usar essa variável na construção da `confirmUrl` (linha 593) em vez do valor fixo `invite`

### Detalhes Técnicos

Antes (linha 593):
```
type=invite  (sempre fixo)
```

Depois:
```
type={linkType}  (dinâmico: "invite" para novos usuários, "magiclink" para existentes)
```

Alterações pontuais:
- Criar variável `let linkType = 'invite'` junto com `linkData` e `userId`
- No bloco de fallback para magiclink (linha ~543), atribuir `linkType = 'magiclink'`
- Na linha 593, usar `linkType` em vez de `"invite"` hardcoded

### Sobre o email do superadmin

A correção que limpa a sessão (signOut) antes de exibir erro ja esta no codigo. Ao publicar o projeto pela Lovable, essa correcao ira para producao em `crm.renovedigital.com.br`.

### Resultado esperado

Ao reenviar o convite para `contato@litoralplace.com.br`, o link no email tera o tipo correto e o fluxo de definicao de senha funcionara normalmente.

