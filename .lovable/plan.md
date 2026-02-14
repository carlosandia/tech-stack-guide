

# Correcao: Links de convite e recuperacao de senha apontando para localhost/preview

## Problema

As edge functions `invite-admin` e `send-password-reset` usam `req.headers.get("origin")` para construir os links enviados por email. O fallback quando o header nao esta presente aponta para a URL de preview do Lovable (`https://id-preview--1f239c79-...lovable.app`) ao inves do dominio de producao.

Isso causa o erro `otp_expired` porque o link redireciona para um ambiente incorreto.

## Correcoes

### Arquivo 1: `supabase/functions/invite-admin/index.ts` (linha 507-509)

Alterar o fallback de:
```
"https://id-preview--1f239c79-4597-4aa1-ba11-8321b3203abb.lovable.app"
```
Para:
```
"https://crm.renovedigital.com.br"
```

### Arquivo 2: `supabase/functions/send-password-reset/index.ts` (linha 328)

Alterar o fallback de:
```
"https://id-preview--1f239c79-4597-4aa1-ba11-8321b3203abb.lovable.app"
```
Para:
```
"https://crm.renovedigital.com.br"
```

## Resultado

- Convites de admin enviarao links com `https://crm.renovedigital.com.br/auth/set-password`
- Recuperacao de senha enviara links com `https://crm.renovedigital.com.br/redefinir-senha`
- Em ambiente de desenvolvimento, o header `origin` da requisicao ainda sera usado corretamente

