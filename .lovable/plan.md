
# Automacao: Etiqueta WhatsApp movimenta Oportunidade no CRM

## Resumo

Quando o usuario alterar uma etiqueta no WhatsApp, o CRM identifica a etapa correspondente (por nome, case-insensitive) e:
- Se ja existe oportunidade aberta para aquele contato: **move** para a etapa correspondente
- Se nao existe oportunidade (ou so existem fechadas, conforme preferencia): **cria** uma nova e posiciona na etapa
- Sempre considera o **ultimo evento** de webhook como verdade

A configuracao fica na area de **Conexoes** (WhatsApp), dando ao usuario controle total para habilitar/desabilitar e definir preferencias.

---

## Arquitetura

O fluxo e acionado pelo webhook `label.chat.added` que ja existe no `waha-webhook`. A logica nova sera adicionada **apos** o upsert em `conversas_labels`, aproveitando o contexto ja resolvido (conversa, label, organizacao).

```text
Dispositivo WhatsApp
    |
    v
WAHA (label.chat.added webhook)
    |
    v
waha-webhook Edge Function
    |
    +-- 1. Upsert em conversas_labels (ja existe)
    |
    +-- 2. [NOVO] Buscar mapeamento etiqueta -> etapa (por nome, case-insensitive)
    |
    +-- 3. [NOVO] Buscar contato da conversa
    |
    +-- 4. [NOVO] Buscar oportunidade existente do contato no funil
    |       |
    |       +-- Existe aberta? -> Mover para etapa
    |       +-- Nao existe? -> Criar oportunidade + posicionar na etapa
    |       +-- Existe fechada? -> Conforme config do usuario
    |
    v
  Retorno OK
```

---

## Etapa 1: Banco de Dados

### 1.1 Nova coluna em `etapas_funil`

Adicionar `etiqueta_whatsapp` (varchar, nullable) na tabela `etapas_funil`. Armazena o nome da etiqueta que corresponde a essa etapa. A comparacao sera sempre case-insensitive (LOWER).

```sql
ALTER TABLE etapas_funil
ADD COLUMN etiqueta_whatsapp varchar(255) DEFAULT NULL;
```

### 1.2 Novas colunas em `sessoes_whatsapp`

Adicionar configuracoes do recurso de etiquetas na sessao:

```sql
ALTER TABLE sessoes_whatsapp
ADD COLUMN etiqueta_move_oportunidade boolean DEFAULT false,
ADD COLUMN etiqueta_comportamento_fechada varchar(20) DEFAULT 'criar_nova'
  CHECK (etiqueta_comportamento_fechada IN ('criar_nova', 'ignorar', 'criar_se_fechada'));
```

- `etiqueta_move_oportunidade`: habilita/desabilita o recurso
- `etiqueta_comportamento_fechada`: define o que fazer quando ja existe oportunidade fechada
  - `criar_nova`: sempre cria nova oportunidade
  - `ignorar`: nao faz nada se existe qualquer oportunidade (aberta ou fechada)
  - `criar_se_fechada`: cria nova apenas se todas estao fechadas, move se tem aberta

---

## Etapa 2: Frontend - Configuracao nas Conexoes

### 2.1 Configuracao na tela de Conexoes (WhatsAppConfigModal)

Adicionar uma nova secao **"Automacao de Etiquetas"** dentro do modal de configuracao do WhatsApp (acessado pelo botao "Configurar" na tela de Conexoes):

- **Toggle**: "Movimentar oportunidades por etiqueta" (habilita/desabilita)
- **Select**: "Quando oportunidade ja fechada" com 3 opcoes:
  - Criar nova oportunidade (padrao)
  - Ignorar
  - Criar nova apenas se fechada

### 2.2 Mapeamento etiqueta na configuracao de Etapas do Funil

Na pagina de configuracao de cada pipeline (etapas do funil), adicionar um campo de texto opcional **"Etiqueta WhatsApp"** em cada etapa editavel. O campo aceita o nome da etiqueta (comparacao case-insensitive).

Quando o usuario digitar "NOVO PEDIDO", qualquer etiqueta chamada "novo pedido", "Novo Pedido" ou "NOVO PEDIDO" sera reconhecida.

---

## Etapa 3: Backend - Logica no waha-webhook

### 3.1 No handler de `label.chat.added`

Apos o upsert em `conversas_labels` (que ja existe), adicionar:

1. **Verificar se o recurso esta habilitado**: consultar `sessoes_whatsapp.etiqueta_move_oportunidade`
2. **Buscar nome da label**: consultar `whatsapp_labels.nome` pelo `label.id`
3. **Buscar etapa correspondente**: consultar `etapas_funil` onde `LOWER(etiqueta_whatsapp) = LOWER(nome_da_label)` e pertence ao funil configurado em `sessoes_whatsapp.funil_destino_id`
4. **Buscar contato da conversa**: consultar `conversas.contato_id`
5. **Buscar oportunidade existente**:
   - Consultar `oportunidades` pelo `contato_id` + `funil_id` + `deletado_em IS NULL`
   - Se tem aberta (`fechado_em IS NULL`): mover `etapa_id` para a nova etapa
   - Se so tem fechada: aplicar regra de `etiqueta_comportamento_fechada`
   - Se nao tem nenhuma: criar nova oportunidade
6. **Criar oportunidade** (quando necessario):
   - Titulo: nome do contato + " - #sequencia"
   - Funil: `sessoes_whatsapp.funil_destino_id`
   - Etapa: a correspondente a etiqueta
   - Contato: o da conversa
   - Origem: 'whatsapp'
7. **Log**: registrar em audit_log a movimentacao/criacao

### 3.2 Eventos multiplos (5 etiquetas)

Quando multiplas etiquetas sao adicionadas/removidas rapidamente, cada webhook `label.chat.added` executa independentemente. O **ultimo a executar** prevalece, pois cada um move a oportunidade para sua etapa correspondente. Isso atende naturalmente o requisito de "ultimo evento vence".

---

## Etapa 4: Arquivos Modificados

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/waha-webhook/index.ts` | Logica de movimentacao/criacao de oportunidade no handler `label.chat.added` |
| `src/modules/configuracoes/components/integracoes/WhatsAppConfigModal.tsx` | Secao de configuracao de etiquetas |
| UI de configuracao de etapas do funil | Campo "Etiqueta WhatsApp" por etapa |
| Migration SQL | Colunas `etiqueta_whatsapp`, `etiqueta_move_oportunidade`, `etiqueta_comportamento_fechada` |

---

## Riscos e Mitigacoes

| Risco | Mitigacao |
|-------|-----------|
| Webhook chega antes do contato existir | O handler ja cria contato automaticamente no fluxo de mensagens. Se o label.chat.added chegar sem contato, pula a automacao (a proxima mensagem criara o contato e o proximo label sync cobrira). |
| Etiquetas com nomes duplicados em etapas diferentes | Busca considera apenas etapas do funil configurado (`funil_destino_id`). Se houver duplicata no mesmo funil, usa a primeira encontrada (ordem menor). |
| Race condition entre webhooks simultaneos | Cada webhook opera atomicamente no banco. O ultimo a executar UPDATE prevalece, que e o comportamento desejado. |
| Recurso desabilitado por padrao | `etiqueta_move_oportunidade` default `false`. Nenhum comportamento muda ate o usuario habilitar explicitamente. |
