

## Plano: Centralizar popovers no mobile + melhorar metricas

### Problema atual
1. **Popover de Meta**: abre com `PopoverContent` do Radix que posiciona via portal com alinhamento lateral, cortando no mobile
2. **Popover de Filtros**: mesmo problema - `PopoverContent` do Radix alinha a `end`, corta no mobile
3. **Popover de Periodo**: posicionado com `absolute right-0`, corta a esquerda no mobile
4. **Metricas (MetricasPanel)**: usa scroll horizontal no mobile (`overflow-x-auto`), experiencia ruim

---

### Solucao

#### 1. MetaToolbarIndicator - Centralizar no mobile
- Trocar `PopoverContent` por implementacao manual (igual padrao ja usado em NotificacoesSino e FeedbackButton)
- Mobile: `fixed left-1/2 -translate-x-1/2 top-14 w-[calc(100vw-2rem)]` + overlay escuro (`fixed inset-0 bg-black/40`)
- Desktop (`sm:`): volta ao comportamento absoluto relativo ao botao

#### 2. FiltrosPopover - Centralizar no mobile
- Trocar `Popover`/`PopoverContent` do Radix por controle manual com `useState`
- Mobile: `fixed left-1/2 -translate-x-1/2 top-14 w-[calc(100vw-2rem)]` + overlay escuro
- Desktop (`sm:`): `absolute right-0` como esta hoje

#### 3. PeriodoSelector - Centralizar no mobile
- Ja usa implementacao manual (bom), mas posiciona `absolute right-0`
- Mobile: `fixed left-1/2 -translate-x-1/2 top-14 w-[calc(100vw-2rem)] max-w-64` + overlay escuro
- Desktop (`sm:`): manter `absolute right-0`

#### 4. MetricasPanel - Proposta de UI melhorada para mobile
- **Remover** scroll horizontal no mobile
- **Mobile**: grid `grid-cols-3` compacto, exibindo apenas 3 metricas principais (Ganhas, Perdidas, Valor Pipeline) por padrao
- Cards menores e mais compactos no mobile, sem min-width
- Se houver mais de 3 metricas visiveis, as 3 primeiras aparecem no grid e as demais ficam ocultas com um botao "Ver mais" que expande para mostrar todas em grid `grid-cols-3`
- **Desktop**: manter layout atual com grid responsivo

---

### Detalhes tecnicos

**Padrao de overlay mobile** (consistente com FeedbackButton e NotificacoesSino):
```text
{open && (
  <>
    {/* Overlay - mobile escuro, desktop transparente */}
    <div className="fixed inset-0 z-[59] bg-black/40 sm:bg-transparent" onClick={close} />
    {/* Content */}
    <div className="fixed left-1/2 -translate-x-1/2 top-14 w-[calc(100vw-2rem)] max-w-[20rem] z-[60]
                    sm:absolute sm:left-auto sm:translate-x-0 sm:top-auto sm:right-0 sm:mt-1.5 sm:w-80
                    bg-card border border-border rounded-lg shadow-lg">
      ...
    </div>
  </>
)}
```

**Arquivos a editar:**
1. `src/modules/negocios/components/toolbar/MetaToolbarIndicator.tsx` - trocar Radix Popover por controle manual
2. `src/modules/negocios/components/toolbar/FiltrosPopover.tsx` - trocar Radix Popover por controle manual
3. `src/modules/negocios/components/toolbar/PeriodoSelector.tsx` - adicionar overlay e centralizar
4. `src/modules/negocios/components/toolbar/MetricasPanel.tsx` - novo layout mobile com grid compacto e expand

