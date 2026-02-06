
# Auditoria de Design System: PRD-05 Configuracoes

## Resultado Geral

**Conformidade atual: ~30%** do Design System esta sendo seguido corretamente nos componentes do PRD-05.

O modulo possui **13 modais** e **15 paginas**. Apenas os 4 modais do Prompt 1 (Campos, Produtos, Categorias, Motivos) seguem parcialmente o DS. Os 9 modais restantes (Prompts 2-5) divergem significativamente.

---

## Inventario de Violacoes

### 1. Z-INDEX - 70% incorreto (Critico)

O Design System define (Secao 8):
- Overlay do modal: `z-[400]`
- Conteudo do modal: `z-[401]`

| Modal | Z-Index Atual | Correto? |
|-------|--------------|----------|
| CampoFormModal | z-[400] | Sim |
| ProdutoFormModal | z-[400] | Sim |
| CategoriaFormModal | z-[400] | Sim |
| MotivoFormModal | z-[400] | Sim |
| TarefaTemplateFormModal | z-50 | NAO |
| EtapaTemplateFormModal | z-50 | NAO |
| RegraFormModal | z-50 | NAO |
| MembroFormModal | z-50 | NAO |
| EquipeFormModal | z-50 | NAO |
| PerfilFormModal | z-50 | NAO |
| WebhookEntradaFormModal | z-50 | NAO |
| WebhookSaidaFormModal | z-50 | NAO |
| MetaFormModal | z-[500] | NAO (deveria ser 401) |

### 2. OVERLAY - 70% inconsistente

O DS define: `bg-black/80 backdrop-blur-sm`

| Grupo | Overlay Usado |
|-------|---------------|
| Prompt 1 (4 modais) | `bg-foreground/20 backdrop-blur-sm` |
| Prompt 2 (3 modais) | `bg-black/40 backdrop-blur-sm` |
| Prompt 3 (2 modais) | `bg-black/50` (sem blur) |
| Prompt 4 (3 modais) | `bg-black/40` (sem blur) |
| Prompt 5 (1 modal) | `bg-foreground/20 backdrop-blur-sm` |

Ha 3 padroes diferentes. Deveria ser 1 unico padrao.

### 3. ESTRUTURA DO MODAL - 60% incorreto (Critico)

O DS (Secao 10.5) define:
- Container: `flex flex-col max-h-[90vh]`
- Header: `flex-shrink-0`, `sticky top-0`
- Content: `flex-1 overflow-y-auto min-h-0 overscroll-contain`
- Footer: `flex-shrink-0`, `sticky bottom-0`, `border-t bg-background`

| Modal | flex-col? | Header fixo? | Content scrollavel? | Footer separado? |
|-------|-----------|-------------|---------------------|-----------------|
| Campos, Produtos, Categorias, Motivos | Sim | Sim | Sim | Sim |
| TarefaTemplate | NAO | NAO | overflow no container inteiro | Footer dentro do form |
| EtapaTemplate | NAO | NAO | overflow no container inteiro | Footer dentro do form |
| RegraFormModal | NAO | NAO | overflow no container inteiro | Footer dentro do form |
| WebhookEntrada | NAO | NAO | Sem scroll | Sem separacao |
| WebhookSaida | NAO | Parcial (sticky) | overflow no container | Sem separacao |
| MembroFormModal | NAO | NAO | Sem scroll | Dentro do form |
| EquipeFormModal | NAO | NAO | Sem scroll | Dentro do form |
| PerfilFormModal | SIM | Sim | Sim | Sim |
| MetaFormModal | NAO | NAO | overflow no container inteiro | Dentro do form |

### 4. HEADER BADGE ICON - 60% faltando

O DS define badge visual no header conforme o tipo de acao (criar/editar):

```text
Correto (DS):
[Badge Icon Circle]  Titulo
                     Descricao

Incorreto (atual na maioria):
[Icon]  Titulo
```

- Modais do Prompt 1: Badge com `rounded-lg` e cores diferenciadas por acao
- Modais dos Prompts 2-5: Apenas icone simples sem container visual

### 5. RESPONSIVIDADE MOBILE - 95% faltando (Critico)

O DS (Secao 10.5) exige para mobile:

- Width: `w-[calc(100%-32px)] sm:w-auto`
- Max Height: `max-h-[calc(100dvh-32px)] sm:max-h-[85vh]`
- Footer: `pb-[max(16px,env(safe-area-inset-bottom))]`
- Botoes: `flex-1 sm:flex-none`
- Padding: `px-4 sm:px-6`

**NENHUM dos 13 modais** implementa essas regras de responsividade mobile.

### 6. TOAST/FEEDBACK - 100% faltando

O DS (Secao 10.8 e 13.4) define:
- Usar `sonner` para feedback de sucesso/erro
- Toast apos acoes de CRUD

**Nenhuma pagina ou modal** mostra toast apos operacoes bem-sucedidas. Os modais simplesmente fecham silenciosamente.

### 7. ALTURAS DE INPUTS - 50% inconsistente

O DS define: inputs = `h-10` (40px)

- Prompt 1: `h-10` (correto)
- Prompts 2-5: `h-9` (36px) - 4px menor que o padrao

### 8. ALTURAS DE BOTOES - 30% inconsistente

O DS define: botao default = `h-9` (36px)

- Maioria usa `h-9` (correto)
- WebhookEntradaFormModal e WebhookSaidaFormModal usam `py-2` (inconsistente)
- MetaFormModal usa `py-2`

### 9. TABELAS MOBILE - 90% faltando

O DS (Secao 10.10 + 7.7) define: mobile = cards empilhados

**Nenhuma pagina** implementa versao mobile em cards para suas tabelas/listas. Todas usam tabelas desktop que ficam cortadas no mobile.

### 10. CONFIRM() NATIVO - Anti-pattern

`EquipeFormModal.tsx` usa `confirm()` nativo do browser para confirmacao de exclusao. O DS define `AlertDialog` para confirmacoes criticas.

### 11. ACESSIBILIDADE ARIA - 80% faltando

- Labels sem `htmlFor`/`id` pareados
- Inputs sem `aria-invalid` em estado de erro
- Inputs sem `aria-describedby` para mensagens de erro
- Modais sem `role="dialog"`, `aria-modal`, `aria-labelledby`

### 12. ANIMACOES DE MODAL - 100% faltando

O DS (Secao 14.4) define: Modal (entrada) = Scale In + Fade In. Nenhum modal customizado possui animacao de entrada/saida.

### 13. FOCUS MANAGEMENT - 100% faltando

O DS (Secao 10.5) define: focus trap, foco no primeiro elemento ao abrir. Nenhum dos modais customizados implementa focus trap (usam divs nativos em vez de Radix Dialog).

---

## Resumo Quantitativo por Area

| Area | Conformidade | Severidade |
|------|-------------|------------|
| Z-Index | 30% | Critica |
| Overlay Padrao | 30% | Alta |
| Estrutura Modal | 40% | Critica |
| Header Badge | 40% | Media |
| Mobile Responsive | 5% | Critica |
| Toast Feedback | 0% | Alta |
| Alturas Input | 50% | Media |
| Alturas Botao | 70% | Baixa |
| Tabelas Mobile | 10% | Media |
| Confirm Dialogs | 40% | Media |
| Acessibilidade | 20% | Media |
| Animacoes | 0% | Baixa |
| Focus Management | 0% | Media |

---

## Plano de Correcao por Prioridade

### Prompt 1 - Padronizacao dos Modais (Critico)

Criar um componente reutilizavel `ModalBase` que encapsula TODAS as regras do DS:

- Z-index correto (400 overlay + 401 content)
- Overlay padronizado com backdrop-blur
- Estrutura flex-col com header/content/footer
- Header com badge icon por tipo de acao
- Footer com flex-shrink-0 e sticky
- Responsividade mobile completa (widths, heights, safe areas, botoes full-width)
- Animacoes de entrada/saida (Scale In + Fade In)
- Focus trap
- ARIA attributes (role, aria-modal, aria-labelledby)
- Fechar com Escape

Migrar todos os 13 modais para usar esse `ModalBase`.

Instalar `sonner` e adicionar toasts em todas as operacoes de CRUD.

**Arquivos a criar:**
- `src/modules/configuracoes/components/ui/ModalBase.tsx`

**Arquivos a editar (13 modais):**
- `CampoFormModal.tsx`
- `ProdutoFormModal.tsx`
- `CategoriaFormModal.tsx`
- `MotivoFormModal.tsx`
- `TarefaTemplateFormModal.tsx`
- `EtapaTemplateFormModal.tsx`
- `RegraFormModal.tsx`
- `WebhookEntradaFormModal.tsx`
- `WebhookSaidaFormModal.tsx`
- `MembroFormModal.tsx`
- `EquipeFormModal.tsx`
- `PerfilFormModal.tsx`
- `MetaFormModal.tsx`

### Prompt 2 - Toast Feedback + Padronizacao de Inputs

Adicionar `sonner` (ou `useToast` se ja instalado) e integrar toast.success / toast.error em todas as mutacoes de cada hook:

**Arquivos a editar (11 hooks):**
- `useCampos.ts`
- `useProdutos.ts`
- `useMotivos.ts`
- `useTarefasTemplates.ts`
- `useEtapasTemplates.ts`
- `useRegras.ts`
- `useWebhooks.ts`
- `useIntegracoes.ts`
- `useEquipe.ts`
- `useMetas.ts`
- `useConfigTenant.ts`

Padronizar alturas de input para `h-10` em todos os modais dos Prompts 2-5 que usam `h-9`.

### Prompt 3 - Tabelas Mobile + Confirm Dialog

Implementar versao mobile (cards empilhados) para todas as paginas que listam dados:

- ProdutosPage
- MotivosPage
- TarefasTemplatesPage
- EtapasTemplatesPage
- RegrasPage
- MembrosPage
- EquipesPage
- PerfisPermissaoPage
- WebhooksEntradaPage
- WebhooksSaidaPage

Substituir `confirm()` nativo por AlertDialog do shadcn/ui no EquipeFormModal.

### Prompt 4 - Acessibilidade e Polish

Corrigir acessibilidade em todos os formularios:
- `htmlFor` / `id` pareados em labels/inputs
- `aria-invalid` em campos com erro
- `aria-describedby` para mensagens de erro
- Adicionar `overscroll-contain` no content scrollavel
- Empty states seguindo o padrao exato do DS (icone circular + titulo + descricao + CTA)
