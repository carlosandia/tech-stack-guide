
# Correção: Reconhecer conexão Gmail OAuth em todo o sistema

## Problema raiz

O fluxo Google OAuth (Edge Function `google-auth`) salva registros na tabela `conexoes_email` com `status: 'conectado'`, mas **todos os pontos do sistema** filtram por `status = 'ativo'`:

| Local | Arquivo | Linha |
|-------|---------|-------|
| Verificação de conexão (Negócios) | `src/modules/negocios/services/detalhes.api.ts` | ~452 |
| Listagem de conexões (Emails) | `src/modules/emails/services/emails.api.ts` | ~448 |
| Envio de email (Edge Function) | `supabase/functions/send-email/index.ts` | ~398 |
| Sincronização (Edge Function) | `supabase/functions/sync-emails/index.ts` | ~772 |

Como `'conectado' != 'ativo'`, a conexão Gmail **nunca é encontrada** por nenhum desses módulos.

## Solução

Atualizar o filtro de status em todos os 4 pontos para aceitar ambos os valores: `'ativo'` e `'conectado'`.

### 1. Frontend: `src/modules/negocios/services/detalhes.api.ts`

Substituir `.eq('status', 'ativo')` por `.in('status', ['ativo', 'conectado'])` na função `verificarConexaoEmail`.

### 2. Frontend: `src/modules/emails/services/emails.api.ts`

Substituir `.eq('status', 'ativo')` por `.in('status', ['ativo', 'conectado'])` na função `listarConexoes`.

### 3. Edge Function: `supabase/functions/send-email/index.ts`

- Substituir `.eq("status", "ativo")` por `.in("status", ["ativo", "conectado"])`.
- Tornar a validação de `smtp_host/smtp_user/smtp_pass_encrypted` condicional: exigir apenas quando `tipo != 'gmail'`. Para conexões Gmail que possuam dados SMTP (como o caso atual que tem SMTP herdado), o envio continuará funcionando normalmente via SMTP.

### 4. Edge Function: `supabase/functions/sync-emails/index.ts`

Substituir `.eq("status", "ativo")` por `.in("status", ["ativo", "conectado"])`.

## Resultado esperado

1. A aba E-mail em `/negocios` mostrará "Remetente: carloshenrique.hsa@gmail.com" e habilitará o botão "Enviar"
2. O módulo `/emails` reconhecerá a conexão Gmail para composição e sincronização
3. O envio e a sincronização de emails funcionarão normalmente com conexões Gmail OAuth
