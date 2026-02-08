

# Plano: Gaps do PRD-09 - Modulo de Conversas

## Resumo da Analise

Apos investigacao completa do PRD-09-CONVERSAS.md (1932 linhas) versus a implementacao atual, identifiquei **6 gaps** que precisam ser corrigidos. A maioria sao funcionalidades parcialmente implementadas ou detalhes de UI faltantes.

## Gaps Identificados (por prioridade)

### 1. Menu de Anexos (RF-006) - Must-have
**Problema:** O botao de clip (Paperclip) existe no ChatInput mas nao faz nada ao clicar. O PRD especifica um menu popup com opcoes: Documento, Fotos e Videos, Camera, Audio, Contato, Enquete, Evento, Resposta Rapida.

**Solucao:** Criar um componente `AnexosMenu.tsx` com popup posicionado acima do botao clip. As opcoes de Documento e Fotos/Videos abrirao file pickers nativos do navegador. Contato, Enquete e Camera terao modais dedicados. Evento, Pix e Camera ficarao como placeholders (futuro).

**Arquivo:** `src/modules/conversas/components/AnexosMenu.tsx`

### 2. Scroll Infinito na Lista de Conversas (RF-002) - Must-have
**Problema:** A lista de conversas (ConversasList) renderiza todas as conversas retornadas de uma unica vez. O PRD exige "scroll infinito com paginacao (20 por vez)".

**Solucao:** Modificar `ConversasList.tsx` para detectar scroll ate o final e chamar proxima pagina. O hook `useConversas` precisa ser migrado para `useInfiniteQuery` (como ja feito em useMensagens).

**Arquivos:**
- `src/modules/conversas/hooks/useConversas.ts` (migrar para useInfiniteQuery)
- `src/modules/conversas/components/ConversasList.tsx` (adicionar scroll detection)
- `src/modules/conversas/pages/ConversasPage.tsx` (adaptar ao novo formato de dados)

### 3. Botoes de Acao no Drawer do Contato (RF-004) - Must-have
**Problema:** O PRD especifica 4 botoes de acao abaixo dos dados do contato: "Nova mensagem", "Nova tarefa", "Nova oportunidade" e "Excluir". A implementacao atual nao tem esses botoes.

**Solucao:** Adicionar uma barra de acoes com icones ao ContatoDrawer, abaixo dos dados de contato.

**Arquivo:** `src/modules/conversas/components/ContatoDrawer.tsx`

### 4. Botao de Criar Mensagem Pronta no Popover (RF-008) - Must-have
**Problema:** O popover de MensagensProntas nao possui o botao "[+ Nova mensagem pronta]" descrito no PRD. Atualmente so lista as existentes.

**Solucao:** Adicionar um botao no rodape do popover que abre um mini-formulario inline (atalho, titulo, conteudo) para criacao rapida. Usar o `conversasApi.criarPronta()` que ja existe.

**Arquivo:** `src/modules/conversas/components/MensagensProntasPopover.tsx`

### 5. Icones Faltantes na Barra de Entrada (RF-003) - Detalhes de UI
**Problema:** O PRD especifica icones adicionais na barra: [@] mencao, [pin] localizacao, [emoji] picker. Atualmente so temos: raio (quick replies), clip (anexos), mic.

**Solucao:** Adicionar icones para localizacao (MapPin) e mencao (@) como placeholders com tooltip "Em breve". O emoji picker pode ser adicionado como placeholder tambem, ja que requer uma lib externa.

**Arquivo:** `src/modules/conversas/components/ChatInput.tsx`

### 6. Integracao com Negocios - Botao +Opp Funcional (RF-014) - Must-have
**Problema:** O botao [+Opp] no ChatHeader atualmente exibe apenas um toast placeholder. O PRD diz que deve abrir o modal de criacao de oportunidade (NovaOportunidadeModal do modulo negocios) com o contato pre-selecionado.

**Solucao:** Importar e abrir o NovaOportunidadeModal existente do modulo de negocios, passando o contato da conversa como valor pre-preenchido.

**Arquivos:**
- `src/modules/conversas/components/ChatWindow.tsx`
- `src/modules/conversas/components/ChatHeader.tsx`

---

## Secao Tecnica

### 1. AnexosMenu.tsx (novo componente)

```text
Componente popup que aparece acima do botao clip
Opcoes com icone + label:
  - FileText: "Documento" --> file picker (PDF, DOC, XLS, ZIP, max 100MB)
  - Image: "Fotos e Videos" --> file picker (JPG, PNG, GIF, MP4, max 16MB/64MB)
  - Camera: "Camera" --> placeholder (futuro)
  - Mic: "Audio" --> placeholder (futuro, liga com RF-009)
  - User: "Contato" --> placeholder (compartilhar vCard)
  - BarChart3: "Enquete" --> placeholder (futuro)
  
Ao selecionar arquivo, chama enviarMedia mutation com tipo detectado pelo mimetype.
```

Integracao no ChatInput:
- O botao Paperclip recebe `onClick` que abre/fecha o AnexosMenu
- Ao selecionar arquivo, o input de upload e ativado
- Apos upload ao Supabase Storage, chama `enviarMedia`

### 2. useConversas migrado para useInfiniteQuery

```text
Mudanca:
  De: useQuery({ queryKey: ['conversas', params], queryFn: ... })
  Para: useInfiniteQuery({
    queryKey: ['conversas', params],
    queryFn: ({ pageParam = 1 }) => conversasApi.listar({ ...params, page: pageParam }),
    getNextPageParam: (lastPage) => lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  })

ConversasList: adicionar onScroll handler que detecta scroll ate o fundo
ConversasPage: flatMap pages para obter array completo de conversas
```

### 3. Botoes de acao no ContatoDrawer

```text
Apos secao de dados de contato, antes das secoes expansiveis:

<div className="flex items-center justify-center gap-3 py-3 border-b">
  <ActionButton icon={MessageSquare} label="Mensagem" />
  <ActionButton icon={ListTodo} label="Tarefa" />
  <ActionButton icon={TrendingUp} label="Oportunidade" onClick={onCriarOportunidade} />
  <ActionButton icon={Trash2} label="Excluir" variant="destructive" />
</div>
```

### 4. Formulario inline no MensagensProntasPopover

```text
Adicionar estado `criando: boolean` no popover
Quando criando=true, exibir formulario com:
  - Input: Atalho (sem barra, sem espacos)
  - Input: Titulo
  - Textarea: Conteudo
  - Botoes: Cancelar / Salvar
  
Usar conversasApi.criarPronta() + invalidar queryKey ['mensagens-prontas']
```

### 5. Icones adicionais no ChatInput

```text
Adicionar na barra de acoes (entre clip e mic):
  - MapPin (Localização) - disabled, title="Em breve"
  - AtSign (@) Menção - disabled, title="Em breve"
  
O emoji picker fica como placeholder (precisa lib externa futuramente)
```

### 6. Integracao com NovaOportunidadeModal

```text
No ChatWindow:
  - Importar NovaOportunidadeModal do modulo negocios
  - Estado: oportunidadeModalOpen
  - Ao clicar +Opp: abre modal com dados pre-preenchidos do contato
  - Dados passados: contato_id, nome, telefone, email
```

## Sequencia de Implementacao

1. `AnexosMenu.tsx` (novo) + integracao no `ChatInput.tsx`
2. `useConversas.ts` (migrar para useInfiniteQuery)
3. `ConversasList.tsx` (scroll infinito)
4. `ConversasPage.tsx` (adaptar ao novo formato)
5. `ContatoDrawer.tsx` (botoes de acao)
6. `MensagensProntasPopover.tsx` (formulario criacao)
7. `ChatInput.tsx` (icones adicionais)
8. `ChatWindow.tsx` + `ChatHeader.tsx` (integracao com NovaOportunidadeModal)

## Itens Fora do Escopo (confirmados como fase futura)

- RF-009: Gravacao de audio nativo (precisa MediaRecorder API)
- RF-011: Agendamento de mensagens (precisa cron job no backend)
- Emoji picker (precisa lib externa como emoji-mart)
- Busca dentro da conversa (header Search)
- Compartilhamento de vCard
- Criacao de enquetes
