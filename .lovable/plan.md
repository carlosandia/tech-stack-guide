

## Plano: Adicionar botao de editar reuniao com sincronizacao Google Calendar

### O que sera feito

Adicionar um icone de lapis (editar) ao lado do icone de lixeira no card de reuniao. Ao clicar, o formulario de reuniao abre preenchido com os dados atuais. Ao salvar, atualiza no banco e sincroniza com o Google Calendar.

### Alteracoes

**Arquivo 1: `src/modules/negocios/services/detalhes.api.ts`**

Adicionar metodo `editarReuniao` que:
- Recebe `reuniaoId` e payload com campos editaveis (titulo, descricao, tipo, local, data_inicio, data_fim, participantes, notificacao_minutos)
- Faz UPDATE na tabela `reunioes_oportunidades`
- Se a reuniao tem `google_event_id`, chama a edge function `google-auth` com action `update-event` para sincronizar as alteracoes no Google Calendar

**Arquivo 2: `src/modules/negocios/hooks/useDetalhes.ts`**

Adicionar hook `useEditarReuniao` seguindo o mesmo padrao dos outros hooks (useMutation, invalidate queries de reunioes e historico).

**Arquivo 3: `src/modules/negocios/components/detalhes/AbaAgenda.tsx`**

1. Importar `Pencil` do lucide-react
2. Adicionar estado `editandoReuniao` (Reuniao | null) no componente principal
3. No `ReuniaoItem`, adicionar prop `onEditar` e renderizar icone de lapis ao lado da lixeira (mesmo estilo opacity-0 group-hover:opacity-100)
4. Ao clicar no lapis:
   - Preencher `formData` com os dados atuais da reuniao (parseando data_inicio/data_fim para extrair data e hora)
   - Setar `editandoReuniao` com a reuniao
   - Abrir o formulario
5. No submit, se `editandoReuniao` esta setado, chamar `useEditarReuniao` ao inves de `useCriarReuniao`
6. Reutilizar o mesmo componente `ReuniaoForm`, apenas mudando o label do botao para "Salvar"

### Detalhes tecnicos do update no Google Calendar

O metodo `editarReuniao` vai:
1. Buscar `google_event_id` da reuniao antes de atualizar
2. Fazer o UPDATE no Supabase
3. Se existe `google_event_id`, chamar `google-auth` com action `update-event` passando os novos dados (titulo, descricao, data_inicio, data_fim, local)
4. A edge function ja tem logica para `update-event` que faz PATCH no evento do Google Calendar

### Arquivos modificados

| Arquivo | Acao |
|---------|------|
| `src/modules/negocios/services/detalhes.api.ts` | Adicionar metodo `editarReuniao` |
| `src/modules/negocios/hooks/useDetalhes.ts` | Adicionar hook `useEditarReuniao` |
| `src/modules/negocios/components/detalhes/AbaAgenda.tsx` | Adicionar botao editar e logica de edicao |

