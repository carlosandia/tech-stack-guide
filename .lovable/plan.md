
# Plano: Notificacoes por E-mail e WhatsApp apos Submissao de Formulario

## Problema Identificado

A Edge Function `processar-submissao-formulario` cria corretamente o contato e a oportunidade, mas **ignora completamente** as configuracoes de notificacao salvas em `config_botoes`:

- `enviar_notifica_email` + `enviar_email_destino` (notificar admin por e-mail)
- `enviar_notifica_whatsapp` + `enviar_whatsapp_destino` (notificar admin por WhatsApp)

Essas flags estao configuradas e visíveis na UI (conforme screenshot), mas o codigo da Edge Function nunca as le nem executa acao alguma com elas.

---

## Solucao

Adicionar dois blocos de logica na Edge Function `processar-submissao-formulario`, executados **apos** a criacao da oportunidade (ou contato):

### 1. Notificacao por E-mail (SMTP)

- Ler `configBotoes.enviar_notifica_email` e `configBotoes.enviar_email_destino`
- Buscar conexao SMTP ativa da organizacao (tabela `conexoes_email`, status `ativo` ou `conectado`)
- Montar email com resumo dos dados da submissao (nome, email, telefone, etc.)
- Enviar via comandos SMTP diretos (reutilizando a mesma logica do `send-email`)
- Como a Edge Function ja roda com `SERVICE_ROLE_KEY`, nao precisa de autenticacao de usuario

### 2. Notificacao por WhatsApp (WAHA)

- Ler `configBotoes.enviar_notifica_whatsapp` e `configBotoes.enviar_whatsapp_destino`
- Buscar configuracao WAHA em `configuracoes_globais` (plataforma = 'waha')
- Buscar sessao WhatsApp conectada (status = 'connected') da organizacao em `sessoes_whatsapp`
- Formatar mensagem com dados do lead
- Enviar via API WAHA (`POST /api/sendText`) usando a sessao conectada

---

## Detalhes Tecnicos

### Arquivo modificado

`supabase/functions/processar-submissao-formulario/index.ts`

### Fluxo apos criacao do contato/oportunidade

```text
+----------------------------+
| Oportunidade criada?       |
+----------------------------+
        |
        v
+----------------------------+     +----------------------------+
| enviar_notifica_email?     |---->| Buscar conexao SMTP        |
| (config_botoes)            |     | Montar email resumo        |
+----------------------------+     | Enviar via SMTP            |
        |                          +----------------------------+
        v
+----------------------------+     +----------------------------+
| enviar_notifica_whatsapp?  |---->| Buscar config WAHA         |
| (config_botoes)            |     | Buscar sessao conectada    |
+----------------------------+     | POST /api/sendText         |
                                   +----------------------------+
```

### Logica de E-mail SMTP (inline na Edge Function)

1. Buscar `conexoes_email` da organizacao com status IN ('ativo', 'conectado')
2. Usar credenciais `smtp_host`, `smtp_port`, `smtp_user`, `smtp_pass_encrypted`
3. Montar mensagem HTML simples:
   - Assunto: "Nova submissao: [Nome do Contato]"
   - Corpo: tabela com os campos mapeados e seus valores
4. Enviar para `enviar_email_destino` usando SMTP direto (mesma tecnica do `send-email`)
5. Extrair hostname real do greeting para TLS (mesmo padrao ja existente)

### Logica de WhatsApp WAHA

1. Buscar `configuracoes_globais` onde `plataforma = 'waha'` para obter `api_url` e `api_key`
2. Buscar `sessoes_whatsapp` da organizacao com `status = 'connected'`
3. Formatar mensagem texto:
   ```
   Nova submissao de formulario:
   Nome: Henrique
   Email: henrique@email.com
   Telefone: (13) 99888-7766
   Pipeline: Locacao 2026
   ```
4. Enviar via `POST {api_url}/api/sendText` com `chatId: "55XXXXXXXXXXX@c.us"` e `session: sessao.session_name`

### Tratamento de erros

- Notificacoes sao **fire-and-forget**: falhas nao devem impedir a resposta de sucesso
- Erros serao logados via `console.error` para depuracao nos logs da Edge Function
- A submissao continua sendo marcada como `processada` independentemente do resultado das notificacoes

### Consideracoes

- O envio SMTP sera implementado inline (funcao auxiliar) para evitar dependencia de outra Edge Function
- O numero de WhatsApp destino sera formatado com `@c.us` automaticamente (ex: `5513988506995@c.us`)
- Ambas as notificacoes rodam em paralelo (`Promise.allSettled`) para nao atrasar a resposta
