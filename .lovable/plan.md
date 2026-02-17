

# Agendamento de Mensagens no Chat

## Contexto

A infraestrutura de backend para mensagens agendadas ja existe completa:
- Tabela `mensagens_agendadas` no Supabase (com campos: tipo, conteudo, agendado_para, status, etc.)
- Rotas REST no backend (`GET/POST/DELETE /api/v1/mensagens-agendadas`)
- Service com logica de criacao, cancelamento e processamento via cron

O trabalho e 100% frontend: criar a UI de agendamento integrada ao ChatInput e uma API layer no Supabase direto (mesmo padrao do modulo conversas).

---

## Limites Anti-Spam (WAHA Plus / WhatsApp nao oficial)

Para proteger o usuario de banimento, os seguintes limites serao aplicados:

| Regra | Valor | Justificativa |
|-------|-------|---------------|
| Max agendadas ativas por conversa | 3 | Evita flood em um unico contato |
| Max agendadas ativas total (usuario) | 15 | Limita volume geral por sessao WAHA |
| Intervalo minimo entre agendamentos na mesma conversa | 5 minutos | Evita burst sequencial |
| Agendamento minimo no futuro | 5 minutos | Tempo minimo pratico |
| Agendamento maximo no futuro | 30 dias | Evita lixo esquecido |

Esses limites serao validados no frontend antes de inserir no banco.

---

## Implementacao

### 1. Service Layer - `conversas.api.ts`

Adicionar metodos ao service existente usando Supabase direto (mesmo padrao RLS):

- `agendarMensagem(conversaId, { tipo, conteudo, agendado_para })` - INSERT na tabela
- `listarAgendadas(conversaId)` - SELECT com filtro status='agendada'
- `cancelarAgendada(id)` - UPDATE status para 'cancelada'
- `contarAgendadasAtivas(conversaId?)` - COUNT para validacao de limites

### 2. Hook TanStack Query - `useMensagensAgendadas.ts`

Novo hook com:
- `useAgendadas(conversaId)` - lista agendadas ativas da conversa
- `useContarAgendadas()` - conta total do usuario (para limite global)
- `useAgendarMensagem()` - mutation de criacao com validacao de limites
- `useCancelarAgendada()` - mutation de cancelamento

### 3. Componente - `AgendarMensagemPopover.tsx`

Popover que abre ao clicar no icone de relogio (ao lado do microfone dentro da caixa de input):

- **Campo de texto** - reutiliza o texto ja digitado no ChatInput (se houver)
- **Tipo** - Toggle entre "Texto" e "Audio" (audio usa gravacao inline)
- **Date/Time picker** - selecao de data e hora com date-fns
- **Indicador de limites** - mostra "X/3 nesta conversa" e "X/15 total"
- **Botao Agendar** - valida limites, insere e fecha popover
- **Lista de agendadas** - mostra agendamentos pendentes da conversa com opcao de cancelar

Visual: Popover sobe a partir do icone, seguindo o padrao do design system (rounded-lg, shadow-md, p-4).

### 4. Integracao no `ChatInput.tsx`

- Adicionar icone `Clock` (lucide) ao lado do `Mic` dentro da caixa de input
- O icone aparece sempre (com ou sem texto)
- Se o usuario ja digitou texto, ao clicar no relogio o popover pre-preenche o conteudo
- Badge numerico no icone se houver agendamentos pendentes na conversa

### 5. Integracao no `ChatWindow.tsx`

- Passar `conversaId` para o novo componente
- Adicionar prop `onSchedule` no ChatInput que abre o popover

---

## Detalhes Tecnicos

### Validacao de limites (frontend)

```text
Antes de inserir:
1. SELECT count(*) FROM mensagens_agendadas 
   WHERE conversa_id = X AND status = 'agendada' --> max 3
2. SELECT count(*) FROM mensagens_agendadas 
   WHERE usuario_id = Y AND status = 'agendada' --> max 15
3. Verificar intervalo minimo de 5min entre agendamentos na mesma conversa
4. Data deve ser entre 5min e 30 dias no futuro
```

### Arquivos a criar
- `src/modules/conversas/components/AgendarMensagemPopover.tsx`
- `src/modules/conversas/hooks/useMensagensAgendadas.ts`

### Arquivos a modificar
- `src/modules/conversas/services/conversas.api.ts` - adicionar metodos de agendamento
- `src/modules/conversas/components/ChatInput.tsx` - adicionar icone Clock e integracao
- `src/modules/conversas/components/ChatWindow.tsx` - passar props necessarias

### Fluxo do usuario

```text
1. Usuario digita texto na caixa de mensagem
2. Clica no icone de relogio (ao lado do mic)
3. Popover abre com texto pre-preenchido
4. Seleciona data e hora
5. Clica "Agendar"
6. Toast de confirmacao + badge atualizado no icone
7. Pode ver/cancelar agendamentos no mesmo popover
```

