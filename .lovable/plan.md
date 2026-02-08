
# Plano de Correcao: Responsividade e Progressive Disclosure - Modulo /conversas

## Resumo da Analise

Analisei o documento `designsystem.md` (Secoes 7, 7.7, 11) e todos os 12 componentes do modulo `/conversas`. Encontrei **8 gaps** de conformidade com o Design System, sendo 2 criticos que afetam a experiencia em todas as viewports.

---

## Gaps Identificados

### GAP 1 - CRITICO: Breakpoints Tailwind nao correspondem ao Design System

**Problema:** O `tailwind.config.ts` usa os breakpoints DEFAULT do Tailwind (`sm: 640px`), mas o Design System define `sm: 480px`. Isso significa que todas as classes `sm:` no projeto inteiro quebram em dispositivos entre 480-640px.

**Impacto:** Todo o sistema de Progressive Disclosure esta desalinhado. Elementos que deveriam aparecer a partir de 480px so aparecem em 640px, desperdicando espaco em mobiles grandes.

**Evidencia no Design System:**
- Secao 7.1: `sm = 480px` (Mobile grande)
- Secao 7.2: Configuracao Tailwind recomendada

**Correcao:** Atualizar `tailwind.config.ts` para adicionar os breakpoints `xs`, `sm: 480px` e `3xl: 1920px` conforme Design System.

### GAP 2 - CRITICO: Toolbar vazia e header duplicado

**Problema (visivel no screenshot):** O modulo Conversas renderiza DOIS headers:
1. Toolbar do AppLayout mostrando "Conversas" (48px, vazio)
2. Header interno do painel esquerdo mostrando "Conversas" + "+ Nova" (mais 44px)

O Design System (Secao 11.4) define que o Toolbar de Conversas deve conter:
- Esquerda: "Conversas" + Filtro (Todas | Abertas | Pendentes)
- Direita: Buscar + Filtros avancados + [+ Nova Conversa]

**Impacto:** ~92px de espaco vertical desperdicado com informacao redundante. Em viewports de 800px de altura, isso representa ~11% da area util perdida.

**Correcao:** 
- Mover os controles do header interno do painel esquerdo para o Toolbar do AppLayout via `setActions` e `setCenterContent`
- Remover o header interno duplicado do painel esquerdo
- No mobile, quando uma conversa esta ativa, ocultar a toolbar (o ChatHeader ja faz esse papel)

### GAP 3 - MEDIO: Touch targets abaixo do minimo (48x48px)

**Problema:** Varios botoes interativos nao atendem ao tamanho minimo de 48x48px definido na Secao 7.7.3:

| Componente | Elemento | Tamanho atual | Minimo |
|------------|----------|---------------|--------|
| ChatHeader | Botao Buscar | ~28px (p-1.5) | 48px |
| ChatHeader | Botao + Oportunidade | ~28px (p-1.5) | 48px |
| ChatHeader | Botao Menu (tres pontos) | ~28px (p-1.5) | 48px |
| ChatInput | Botoes Zap/Clip/MapPin/AtSign | ~28px (p-1.5) | 48px |
| FiltrosConversas | Tabs de canal | ~24px (py-1) | 44px |
| ConversaItem | Botao da conversa | py-3 (~46px) | 48px |

**Correcao:** Aumentar padding dos botoes para p-2.5 (minimo 40px com icone de 16px) ou usar classes min-w/min-h de 44px.

### GAP 4 - MEDIO: Progressive Disclosure ausente no ChatInput

**Problema:** O ChatInput mostra 4 botoes de acao inline (Zap, Paperclip, MapPin, AtSign) em TODOS os viewports. No mobile, isso comprime a area de texto e viola a Secao 7.7.1:
- MapPin e AtSign estao disabled ("em breve") - nao deveriam aparecer no mobile
- A Secao 7.7.2 diz: "Acoes em linha" no mobile devem usar "Menu (tres pontos)"

**Correcao:** 
- Mobile: mostrar apenas Zap + Paperclip. Esconder MapPin e AtSign (disabled)
- Tablet+: mostrar todos

### GAP 5 - MEDIO: ContatoDrawer sem suporte mobile adequado

**Problema:** O drawer usa `fixed w-[320px]` em todas as viewports. No mobile:
- Deveria ser fullscreen (w-full) conforme Secao 10.5 (Sheet)
- Falta `padding-bottom: env(safe-area-inset-bottom)` para iOS
- O z-index 301 esta correto per Design System (z-drawer: 300)

**Correcao:** No mobile, drawer ocupa 100% da largura. Adicionar safe-area-inset-bottom.

### GAP 6 - BAIXO: AnexosMenu pode ficar cortado no mobile

**Problema:** O AnexosMenu usa `position: absolute bottom-full left-0` que pode sair da tela em mobiles pequenos. Design System Secao 10.6 recomenda `side offset: 4px` e posicionamento inteligente.

**Correcao:** Adicionar `right-0` no mobile e verificar limites da tela. Alternativamente, usar fullscreen bottom-sheet no mobile.

### GAP 7 - BAIXO: MensagensProntasPopover sem responsividade

**Problema:** O popover usa `absolute bottom-full left-0 right-0` com `max-h-[360px]`. No mobile, deveria ser um drawer/bottom sheet conforme Design System Secao 10.5 (Drawer Mobile).

**Correcao:** Em viewports < 768px, converter para overlay fullscreen com close no header.

### GAP 8 - BAIXO: ChatMessageBubble max-width nao usa breakpoints corretos

**Problema:** Usa `max-w-[75%] lg:max-w-[60%]`. O Design System indica que em mobile as bolhas devem ocupar mais espaco (ate 85%) para leitura confortavel.

**Correcao:** Usar `max-w-[85%] sm:max-w-[75%] lg:max-w-[60%]` para melhor aproveitamento em telas pequenas.

---

## Secao Tecnica

### 1. tailwind.config.ts (GAP 1)

Adicionar no objeto `theme.extend`:

```text
screens: {
  'xs': '0px',
  'sm': '480px',
  'md': '768px',
  'lg': '1024px',
  'xl': '1280px',
  '2xl': '1536px',
  '3xl': '1920px',
},
```

ATENCAO: Mudar `sm` de 640px para 480px afeta TODOS os `sm:` classes no projeto. Sera necessario revisar componentes que usam `sm:` para garantir que nao quebram. Os principais afetados sao:
- AppLayout.tsx (nome usuario `hidden sm:block`, titulo toolbar `hidden sm:block`)
- NovaConversaModal.tsx (padding `p-4 sm:p-6`)
- ChatHeader.tsx (buscar `hidden sm:flex`)

### 2. ConversasPage.tsx + Toolbar Integration (GAP 2)

Refatorar o `useEffect` para popular o toolbar:

```text
// ConversasPage.tsx
useEffect(() => {
  // Toolbar: lado esquerdo vazio (titulo vem do AppLayout)
  // Toolbar: lado direito = botao + Nova Conversa
  setActions(
    <button onClick={() => setNovaConversaAberta(true)}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md">
      <Plus className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Nova Conversa</span>
    </button>
  )

  return () => { setActions(null); setSubtitle(null); setCenterContent(null) }
}, [setActions, setSubtitle, setCenterContent])
```

Remover o header interno do painel esquerdo (linhas 70-80 do ConversasPage.tsx).

No mobile com conversa ativa, ocultar toolbar condicionalmente.

### 3. ChatHeader.tsx - Touch Targets (GAP 3)

Aumentar padding dos botoes de acao de `p-1.5` para `p-2` com min-w/min-h:

```text
// De:
className="p-1.5 rounded-md hover:bg-accent"

// Para:
className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md hover:bg-accent"
```

### 4. ChatInput.tsx - Progressive Disclosure (GAP 4)

Esconder botoes disabled no mobile:

```text
// MapPin e AtSign - esconder em mobile
<button className="p-1.5 ... hidden sm:flex" disabled>
  <MapPin className="w-4 h-4" />
</button>
<button className="p-1.5 ... hidden sm:flex" disabled>
  <AtSign className="w-4 h-4" />
</button>
```

Aumentar touch targets dos botoes visiveis (Zap, Paperclip) para 44px.

### 5. ContatoDrawer.tsx - Mobile Fullscreen (GAP 5)

Ajustar largura responsiva e safe areas:

```text
// De:
className="fixed right-0 top-0 bottom-0 z-[301] w-[320px] bg-white ..."

// Para:
className="fixed right-0 top-0 bottom-0 z-[301] w-full sm:w-[320px] bg-white ..."
```

Adicionar no container scrollable:

```text
className="flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]"
```

### 6. AnexosMenu.tsx - Posicionamento Mobile (GAP 6)

Adicionar responsividade:

```text
// De:
className="absolute bottom-full left-0 mb-1 z-[301] ..."

// Para (mobile: centralizado, desktop: alinhado):
className="absolute bottom-full left-0 right-0 sm:right-auto mb-1 z-[301] w-full sm:w-52 ..."
```

### 7. MensagensProntasPopover.tsx - Mobile Overlay (GAP 7)

No mobile, usar overlay mais amigavel:

```text
// Adicionar classes responsivas
className="absolute bottom-full left-0 right-0 mb-1 z-[301] ...
  sm:max-h-[360px]
  max-h-[70vh]
"
```

### 8. ChatMessageBubble.tsx - Max Width (GAP 8)

```text
// De:
className="max-w-[75%] lg:max-w-[60%]"

// Para:
className="max-w-[85%] sm:max-w-[75%] lg:max-w-[60%]"
```

### 9. FiltrosConversas.tsx - Touch Targets (GAP 3)

Aumentar height dos tabs de canal:

```text
// De:
className="px-2 py-1 text-xs ..."

// Para:
className="px-2.5 py-1.5 text-xs min-h-[36px] ..."
```

### Arquivos a Modificar

| Arquivo | GAP(s) | Tipo |
|---------|--------|------|
| `tailwind.config.ts` | 1 | Configuracao |
| `src/modules/conversas/pages/ConversasPage.tsx` | 2 | Refatoracao |
| `src/modules/conversas/components/ChatHeader.tsx` | 3 | CSS |
| `src/modules/conversas/components/ChatInput.tsx` | 3, 4 | CSS + Logica |
| `src/modules/conversas/components/ContatoDrawer.tsx` | 5 | CSS |
| `src/modules/conversas/components/AnexosMenu.tsx` | 6 | CSS |
| `src/modules/conversas/components/MensagensProntasPopover.tsx` | 7 | CSS |
| `src/modules/conversas/components/ChatMessageBubble.tsx` | 8 | CSS |
| `src/modules/conversas/components/FiltrosConversas.tsx` | 3 | CSS |
| `src/modules/conversas/components/ConversaItem.tsx` | 3 | CSS |

### Sequencia de Implementacao

1. `tailwind.config.ts` (GAP 1) - Breakpoints corretos, impacta tudo
2. `ConversasPage.tsx` (GAP 2) - Toolbar integration, remover header duplicado
3. `ChatHeader.tsx` (GAP 3) - Touch targets
4. `ChatInput.tsx` (GAP 3+4) - Touch targets + progressive disclosure
5. `ContatoDrawer.tsx` (GAP 5) - Mobile fullscreen
6. `FiltrosConversas.tsx` + `ConversaItem.tsx` (GAP 3) - Touch targets
7. `AnexosMenu.tsx` (GAP 6) - Posicionamento mobile
8. `MensagensProntasPopover.tsx` (GAP 7) - Mobile overlay
9. `ChatMessageBubble.tsx` (GAP 8) - Max width responsivo

### Riscos e Cuidados

- **GAP 1 (Breakpoints)**: Alterar `sm` de 640px para 480px pode afetar outros modulos que usam `sm:`. Revisao necessaria em AppLayout, ContatosPage, NegociosPage apos a mudanca.
- **GAP 2 (Toolbar)**: A remocao do header interno do painel esquerdo muda o layout visual. O botao "+ Nova" precisa ficar acessivel no mobile (via toolbar ou FAB).
- Testes obrigatorios nos viewports: 360x800, 390x844, 768x1024, 1024x768, 1280x800, 1920x1080 (Secao 7.6).
