
# Templates de Tarefa com Cadencia Comercial (Envio de WhatsApp e E-mail)

## Resumo

Evoluir o sistema de Templates de Tarefas para suportar dois modos: **Tarefa Comum** (comportamento atual) e **Cadencia Comercial** (tarefa com mensagem pre-configurada para envio via WhatsApp ou E-mail). No popover do Kanban, tarefas de cadencia exibem um botao "Enviar" que dispara a mensagem usando a infraestrutura existente (WAHA para WhatsApp, Edge Function `send-email` para E-mail) e marca a tarefa como concluida automaticamente.

---

## Fluxo do Usuario

### Criacao do Template

1. Ao criar um template de tarefa, o usuario escolhe entre **"Tarefa Comum"** ou **"Cadencia Comercial"**
2. Se **Tarefa Comum**: formulario atual sem alteracao
3. Se **Cadencia Comercial**:
   - Tipo restrito a `email` ou `whatsapp`
   - **WhatsApp**: exibe campo "Mensagem" (textarea com formatacao basica)
   - **E-mail**: exibe campo "Assunto" + campo "Corpo do E-mail" (textarea com formatacao basica)
   - A descricao do template funciona como instrucao interna (nao e enviada)

### Execucao no Kanban

1. No popover de tarefas, tarefas de cadencia exibem um botao `Send` (icone) ao lado do checkbox
2. Ao clicar no botao, abre um mini-formulario inline mostrando:
   - Destinatario (telefone ou email do contato, readonly)
   - Mensagem pre-preenchida do template (editavel antes do envio)
   - Se email: assunto pre-preenchido do template (editavel)
3. Ao clicar "Enviar":
   - WhatsApp: chama `waha-proxy` com action `enviar_mensagem`
   - E-mail: chama `send-email` com `to`, `subject`, `body`
4. Apos envio com sucesso, tarefa muda para `concluida` automaticamente

---

## Alteracoes no Banco de Dados (Migration)

Adicionar 3 colunas na tabela `tarefas_templates`:

```sql
ALTER TABLE tarefas_templates
  ADD COLUMN modo VARCHAR(20) DEFAULT 'comum' CHECK (modo IN ('comum', 'cadencia')),
  ADD COLUMN assunto_email VARCHAR(500),
  ADD COLUMN corpo_mensagem TEXT;
```

Tambem adicionar as mesmas colunas na tabela `tarefas` para que a tarefa criada herde os dados do template:

```sql
ALTER TABLE tarefas
  ADD COLUMN modo VARCHAR(20) DEFAULT 'comum',
  ADD COLUMN assunto_email VARCHAR(500),
  ADD COLUMN corpo_mensagem TEXT;
```

---

## Alteracoes no Trigger `aplicar_config_pipeline_oportunidade`

Na parte que cria tarefas automaticas a partir de templates vinculados a etapas, propagar os novos campos `modo`, `assunto_email` e `corpo_mensagem` do template para a tarefa criada.

---

## Alteracoes no Frontend

### 1. Schema -- `tarefas-templates.schema.ts`

- Adicionar campo `modo` (`'comum' | 'cadencia'`)
- Adicionar campo `assunto_email` (string, obrigatorio se modo=cadencia e tipo=email)
- Adicionar campo `corpo_mensagem` (string, obrigatorio se modo=cadencia)
- Validacao condicional via `superRefine`

### 2. Backend Schema -- `backend/src/schemas/tarefas-templates.ts`

- Adicionar os campos `modo`, `assunto_email`, `corpo_mensagem` nos schemas de criar/atualizar

### 3. Modal de Template -- `TarefaTemplateFormModal.tsx`

- Adicionar seletor "Tarefa Comum" / "Cadencia Comercial" (toggle/radio com 2 opcoes)
- Se `cadencia`:
  - Restringir tipo a `email` ou `whatsapp`
  - Exibir campo "Corpo da Mensagem" (textarea)
  - Se tipo = `email`, exibir campo "Assunto do E-mail" (input)
- Manter formulario atual intacto para modo `comum`

### 4. Pagina de Templates -- `TarefasTemplatesPage.tsx`

- Exibir badge "Cadencia" ao lado do titulo quando `modo === 'cadencia'`

### 5. Componente de Envio Inline -- `TarefaEnvioInline.tsx` (novo)

Componente que renderiza dentro do popover para tarefas de cadencia:

- Resolve destinatario: `tarefa.oportunidade_id` -> `oportunidades.contato_id` -> `contatos.email/telefone`
- Para WhatsApp: busca sessao WAHA ativa da organizacao + formata chat_id
- Exibe mensagem pre-preenchida (editavel), assunto se email
- Botao "Enviar" que:
  - WhatsApp: `supabase.functions.invoke('waha-proxy', { body: { action: 'enviar_mensagem', chat_id, text } })`
  - E-mail: `supabase.functions.invoke('send-email', { body: { to, subject, body, body_type: 'text' } })`
  - Apos sucesso: atualiza `tarefas.status = 'concluida'` e `data_conclusao = now()`
  - Invalida queries do kanban

### 6. Popover de Tarefas -- `TarefasPopover.tsx`

- Buscar campos adicionais na query: `modo, assunto_email, corpo_mensagem`
- Para tarefas com `modo === 'cadencia'` e tipo `email` ou `whatsapp`: exibir botao `Send` ao lado do checkbox
- Ao clicar no botao: expandir `TarefaEnvioInline` abaixo da tarefa
- Validacoes: contato sem telefone/email, sessao WhatsApp desconectada, conexao email inativa

---

## Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| Migration SQL | Criar (adicionar colunas modo, assunto_email, corpo_mensagem em tarefas_templates e tarefas) |
| Migration SQL (trigger) | Atualizar trigger `aplicar_config_pipeline_oportunidade` para propagar novos campos |
| `src/modules/configuracoes/schemas/tarefas-templates.schema.ts` | Modificar (adicionar campos modo, assunto_email, corpo_mensagem) |
| `backend/src/schemas/tarefas-templates.ts` | Modificar (adicionar campos nos schemas) |
| `src/modules/configuracoes/components/tarefas/TarefaTemplateFormModal.tsx` | Modificar (adicionar UI para modo cadencia) |
| `src/modules/configuracoes/pages/TarefasTemplatesPage.tsx` | Modificar (badge de cadencia) |
| `src/modules/negocios/components/kanban/TarefaEnvioInline.tsx` | Criar (componente de envio inline) |
| `src/modules/negocios/components/kanban/TarefasPopover.tsx` | Modificar (botao Send + integrar TarefaEnvioInline) |

---

## Validacoes e Edge Cases

- **Contato sem telefone (WhatsApp)**: exibir aviso "Contato sem telefone cadastrado"
- **Contato sem email**: exibir aviso "Contato sem email cadastrado"
- **Sessao WhatsApp desconectada**: exibir aviso "WhatsApp nao conectado"
- **Conexao email inativa**: exibir aviso "Email nao configurado"
- **Mensagem vazia**: impedir envio
- **Assunto vazio (email)**: impedir envio
- **Erro no envio**: toast de erro, tarefa permanece pendente
- **Tarefa sem oportunidade**: botao de envio nao aparece (sem contato para resolver)
