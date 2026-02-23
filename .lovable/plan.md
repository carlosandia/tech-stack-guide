

## Redesign da Pagina de Planos com Experiencia de Parceiro

### Contexto Atual

A pagina `/planos` nao reconhece o parametro `?ref=CODIGO` de parceiros. Quando um lead chega via link de indicacao (ex: `/planos?ref=RENOVE-MBP7VY`), a experiencia e identica a de qualquer visitante -- sem nenhum senso de exclusividade ou pertencimento.

### O que sera feito

Ao detectar `?ref=CODIGO` na URL, a pagina buscara o parceiro no banco (`parceiros` + `organizacoes_saas`) e transformara a experiencia visual para transmitir exclusividade e confianca.

### Elementos Visuais da Experiencia de Parceiro

1. **Badge de Indicacao** (topo do hero)
   - Pill com icone de estrela: "Indicado por **Litoral Place**"
   - Background sutil com borda (`bg-primary/5 border border-primary/20 text-primary`)
   - Sinaliza imediatamente que o visitante veio de um canal especial

2. **Subtitulo Personalizado**
   - Texto: "Voce foi indicado por **{nome_parceiro}**. Cancele quando quiser."
   - Destaque no nome do parceiro com `font-semibold text-foreground`

3. **Gradiente de fundo premium**
   - Faixa sutil com gradiente radial no hero (`from-primary/5 via-transparent`) para diferenciar visualmente do acesso padrao

4. **Armazenamento do `ref` para checkout**
   - O codigo do parceiro sera passado ao `PreCadastroModal` e incluido no body do `create-checkout-session` para rastreio da indicacao

### Responsividade (conforme Design System)

| Viewport | Comportamento |
|----------|---------------|
| Mobile (< 480px) | Badge e titulo em coluna, cards 1 coluna, padding `px-4` |
| Tablet (768px) | Cards em 2 colunas, hero com `py-16` |
| Desktop (1024px+) | Cards em 3-4 colunas (grid existente), hero com `py-24` |

Nao sera alterado o layout do grid de cards -- apenas o hero section recebe os elementos de parceiro. A badge usa `text-xs sm:text-sm` e `px-3 py-1.5` para caber em qualquer viewport.

### Detalhes Tecnicos

**Arquivo:** `src/modules/public/pages/PlanosPage.tsx`

1. Extrair `ref` dos searchParams: `const refCode = searchParams.get('ref')`
2. Novo state: `partnerName: string | null`
3. Novo `useEffect` que busca o parceiro:
   ```typescript
   if (refCode) {
     supabase
       .from('parceiros')
       .select('organizacao:organizacoes_saas(nome)')
       .eq('codigo_indicacao', refCode)
       .eq('status', 'ativo')
       .single()
   }
   ```
4. Renderizar badge condicional no hero quando `partnerName` existir
5. Atualizar subtitulo para mencionar o parceiro
6. Passar `refCode` ao `PreCadastroModal` como prop, que o repassara ao checkout
7. Atualizar o footer com ano correto (2026)

**Arquivo:** `src/modules/public/components/PreCadastroModal.tsx`
- Aceitar nova prop `refCode?: string`
- Incluir no corpo do `onCheckout` ou no salvamento do pre-cadastro

Nenhuma nova dependencia sera adicionada. Tudo usa Tailwind e componentes existentes.

