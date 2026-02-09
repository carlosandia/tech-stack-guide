

## Plano de Melhorias no Modulo de Conversas

Sao 4 ajustes independentes a implementar:

---

### 1. Nova Conversa -- Campo de telefone com bandeira e codigo de pais

**Problema atual**: O campo de telefone e um input de texto simples onde o usuario precisa digitar o codigo de pais completo (+5511999999999).

**Solucao**: Transformar em um campo com seletor de bandeira/pais (padrao Brasil +55), onde o usuario digita apenas DDD + numero. O codigo do pais sera concatenado automaticamente ao submeter.

**Arquivo**: `src/modules/conversas/components/NovaConversaModal.tsx`

**Detalhes tecnicos**:
- Criar estado `codigoPais` (default `+55`) e uma lista compacta de paises mais comuns (BR, US, AR, PT, etc.) com bandeiras emoji
- Dropdown simples ao lado do input para trocar o pais
- Placeholder muda para "11999999999" (sem +55)
- No `handleSubmit`, concatenar `codigoPais + telefone.replace(/\D/g, '')` antes de enviar
- Manter formatacao limpa: o backend recebe sempre o numero completo com codigo de pais

---

### 2. Desarquivar conversa -- Menu de contexto dinamico

**Problema atual**: Quando o usuario esta na aba "Arquivadas", o menu de contexto do `ConversaItem` ainda mostra "Arquivar conversa" em vez de "Desarquivar conversa".

**Solucao**: Tornar o botao de arquivar/desarquivar dinamico com base no estado `conversa.arquivada`.

**Arquivos**:
- `src/modules/conversas/components/ConversaItem.tsx` -- Alterar o texto e icone do botao de arquivar para mostrar "Desarquivar conversa" quando `conversa.arquivada === true`. Usar icone `ArchiveRestore` (lucide) para desarquivar.
- `src/modules/conversas/services/conversas.api.ts` -- Criar funcao `desarquivarConversa(conversaId)` que seta `arquivada: false` e sincroniza com WAHA.
- `src/modules/conversas/hooks/useConversas.ts` -- Criar hook `useDesarquivarConversa()`.
- `src/modules/conversas/pages/ConversasPage.tsx` -- Atualizar `handleArquivar` para verificar se a conversa esta arquivada e chamar a funcao correta (arquivar ou desarquivar).

---

### 3. Historico de Interacoes no Drawer lateral

**Problema atual**: O drawer lateral ("Info do Contato") nao exibe metricas de interacao como total de mensagens enviadas/recebidas e tempo medio de resposta.

**Solucao**: Adicionar secao "Historico de Interacoes" no `ContatoDrawer` com metricas calculadas a partir das mensagens da conversa.

**Arquivo**: `src/modules/conversas/components/ContatoDrawer.tsx`

**Detalhes tecnicos**:
- Nova secao colapsavel `HistoricoInteracoes` entre "Informacoes da Conversa" e as outras secoes
- Query no Supabase para contar mensagens da conversa agrupando por `from_me`
- Exibir:
  - Total de mensagens (ja existe em `conversa.total_mensagens`)
  - Mensagens enviadas (count where `from_me = true`)
  - Mensagens recebidas (count where `from_me = false`)
  - Tempo medio de resposta (calculado pela diferenca entre mensagem recebida e proxima enviada)
- Layout em grid 2 colunas com label/valor, estilo consistente com "Informacoes da Conversa"

---

### 4. Finalizar conversa e Badge "Template" em mensagens prontas

**Problema atual**:
- (a) Nao ha botao para "Finalizar" (fechar) a conversa diretamente
- (b) Mensagens enviadas via atalho/mensagem pronta nao sao identificadas visualmente no chat

**Solucao (a) -- Finalizar Conversa**:
- Adicionar botao "Finalizar" no `ChatHeader.tsx` (ao lado do menu, ou como item do menu dropdown)
- Ao finalizar, chamar `alterarStatus(id, 'fechada')` que ja existe
- Quando uma nova mensagem chegar numa conversa fechada, o webhook ja a reabre automaticamente (logica existente em `reabrirSeNecessario`)

**Solucao (b) -- Badge "Template"**:
- Ao enviar mensagem pronta via `handleQuickReplySelect` no `ChatWindow.tsx`, marcar a mensagem com metadata indicando que e template
- Adicionar coluna ou usar campo existente `raw_data` para armazenar `{ is_template: true }` na mensagem
- No `ChatMessageBubble.tsx`, verificar `mensagem.raw_data?.is_template` e renderizar um badge "Template" discreto (pill verde/azul) ao lado do horario na bolha

**Arquivos**:
- `src/modules/conversas/components/ChatWindow.tsx` -- Alterar `handleQuickReplySelect` para passar flag de template ao enviar
- `src/modules/conversas/services/conversas.api.ts` -- Aceitar parametro opcional `isTemplate` em `enviarTexto` e gravar no `raw_data`
- `src/modules/conversas/components/ChatMessageBubble.tsx` -- Renderizar badge "Template" quando `raw_data?.is_template`
- `src/modules/conversas/components/ChatHeader.tsx` -- Adicionar item "Finalizar" no menu dropdown (com confirmacao)

---

### Resumo de arquivos impactados

| Arquivo | Alteracao |
|---------|-----------|
| `NovaConversaModal.tsx` | Seletor de pais com bandeira + input formatado |
| `ConversaItem.tsx` | Texto dinamico arquivar/desarquivar |
| `conversas.api.ts` | `desarquivarConversa()` + param `isTemplate` em `enviarTexto` |
| `useConversas.ts` | `useDesarquivarConversa()` |
| `ConversasPage.tsx` | Toggle arquivar/desarquivar no handler |
| `ContatoDrawer.tsx` | Secao "Historico de Interacoes" |
| `ChatHeader.tsx` | Item "Finalizar" no menu |
| `ChatWindow.tsx` | Flag template no envio de mensagem pronta |
| `ChatMessageBubble.tsx` | Badge "Template" visual |

