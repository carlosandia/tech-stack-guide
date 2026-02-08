
# Plano: Pré-Oportunidades Automáticas via WhatsApp

## Resumo

Implementar o fluxo completo para que, ao receber uma nova mensagem no WhatsApp, o sistema crie automaticamente uma pré-oportunidade (solicitação) na coluna "Solicitações" do Kanban. O usuário poderá escolher qual pipeline receberá as solicitações, e decidir aceitar ou recusar cada uma.

## Situação Atual

O sistema já possui:
- Tabela `pre_oportunidades` no banco (com todos os campos necessários)
- Tabela `sessoes_whatsapp` (porém sem campo de pipeline destino)
- Coluna "Solicitações" no Kanban (`SolicitacoesColumn`) e seus cards
- Modais de Aceitar e Rejeitar pré-oportunidades
- Service API completa (`pre-oportunidades.api.ts`) com lógica de aceitar/rejeitar
- Edge Function `waha-proxy` para gerenciar sessões WAHA

O que falta:
- Campo `funil_destino_id` na tabela `sessoes_whatsapp`
- UI para o usuário escolher qual pipeline receberá as solicitações
- Edge Function de webhook para receber mensagens do WAHA e criar pré-oportunidades
- Configuração do webhook na sessão WAHA ao iniciar/conectar
- Toggle para ativar/desativar criação automática de pré-oportunidades

## Etapas de Implementação

### Etapa 1 -- Migração do Banco de Dados

Adicionar colunas à tabela `sessoes_whatsapp`:
- `funil_destino_id` (uuid, nullable, FK para `funis`)
- `auto_criar_pre_oportunidade` (boolean, default false)

Isso permite que cada sessão WhatsApp tenha uma pipeline de destino configurada e um toggle para ativar/desativar a criação automática.

### Etapa 2 -- Edge Function: `waha-webhook` (receptor de mensagens)

Criar nova Edge Function pública (`verify_jwt = false`) que:

1. Recebe eventos do WAHA (mensagens recebidas, status de sessão)
2. Para cada mensagem recebida de um número novo (não existente em `pre_oportunidades` com status `pendente`):
   - Busca a `sessao_whatsapp` pelo `session_name` para obter `organizacao_id` e `funil_destino_id`
   - Verifica se `auto_criar_pre_oportunidade` está ativo
   - Cria um registro em `pre_oportunidades` com status `pendente`
3. Para mensagens de números já existentes com pré-oportunidade pendente:
   - Atualiza `ultima_mensagem`, `ultima_mensagem_em` e incrementa `total_mensagens`

Validações de segurança:
- Verificar API key do WAHA no header
- Ignorar mensagens enviadas (apenas recebidas)

### Etapa 3 -- Atualizar `waha-proxy` (configurar webhook na sessão)

Ao iniciar ou restartar uma sessão WAHA, configurar o webhook apontando para a Edge Function `waha-webhook`:

- Substituir `webhooks: []` por uma configuração real com a URL da Edge Function
- Eventos: `message` (para receber mensagens)
- A URL será: `https://{SUPABASE_URL}/functions/v1/waha-webhook`

### Etapa 4 -- UI: Seleção de Pipeline na Conexão WhatsApp

Adicionar na página de Conexões (`ConexoesPage`) ou no modal de WhatsApp:

1. **Após conectar com sucesso**, exibir seção de configuração:
   - Toggle: "Criar solicitações automaticamente ao receber mensagens"
   - Select: "Pipeline de destino" (lista de pipelines ativas da organização)
2. **No card de conexão WhatsApp** (quando conectado), exibir a pipeline selecionada
3. Salvar configuração na tabela `sessoes_whatsapp` (campos `funil_destino_id` e `auto_criar_pre_oportunidade`)

### Etapa 5 -- Ajustar fluxo de "Aceitar" pré-oportunidade

Garantir que ao aceitar:
- A oportunidade é criada na etapa de tipo `entrada` ("Novos Negócios") da pipeline
- O contato é criado neste momento (e não antes)
- A pré-oportunidade não pode voltar para "Solicitações" após aceita
- O card some da coluna "Solicitações" e aparece na coluna "Novos Negócios"

O código atual em `pre-oportunidades.api.ts` já faz isso corretamente (busca etapa de entrada, cria contato e oportunidade). Apenas validar que não há bugs.

## Detalhes Técnicos

### Migração SQL

```sql
ALTER TABLE sessoes_whatsapp 
  ADD COLUMN funil_destino_id uuid REFERENCES funis(id),
  ADD COLUMN auto_criar_pre_oportunidade boolean DEFAULT false;
```

### Arquitetura do Webhook

```text
WAHA Server
    |
    | HTTP POST (evento: message)
    v
Edge Function: waha-webhook (pública)
    |
    | 1. Valida evento
    | 2. Busca sessao_whatsapp pelo session_name
    | 3. Verifica auto_criar_pre_oportunidade = true
    | 4. Cria/atualiza pre_oportunidade
    v
Tabela: pre_oportunidades (status: pendente)
    |
    | Supabase Query (frontend poll)
    v
Kanban > Coluna "Solicitações" > Card
    |
    | Usuário clica Aceitar
    v
Cria Contato + Oportunidade na etapa "Entrada"
```

### Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `supabase/functions/waha-webhook/index.ts` | Receptor de webhooks do WAHA |

### Arquivos a Editar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/waha-proxy/index.ts` | Configurar webhook URL ao iniciar sessão |
| `supabase/config.toml` | Adicionar `waha-webhook` com `verify_jwt = false` |
| `src/modules/configuracoes/components/integracoes/ConexaoCard.tsx` | Exibir pipeline selecionada no card WhatsApp |
| `src/modules/configuracoes/pages/ConexoesPage.tsx` | Adicionar configuração de pipeline pós-conexão |
| `src/modules/configuracoes/services/configuracoes.api.ts` | Funções para salvar/buscar config da sessão WhatsApp |

### Observações Importantes

- A coluna "Solicitações" já existe e funciona -- ela apenas não recebe dados porque não há webhook
- O fluxo Aceitar/Rejeitar já está implementado e funcional
- Não serão criados contatos automaticamente ao receber mensagem -- apenas quando o usuário aceitar
- Pré-oportunidades rejeitadas ou aceitas não voltam para a coluna "Solicitações"
