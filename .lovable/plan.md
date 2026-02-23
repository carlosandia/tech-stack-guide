

## Redesign Premium da Pagina de Planos (com Parceiro)

### Problema

A experiencia visual quando o visitante vem de um parceiro e praticamente identica a de um visitante comum. O gradiente aplicado (`primary/0.06`) e quase invisivel. Nao ha diferenciacao real que gere pertencimento ou exclusividade.

### Proposta

Quando `partnerName` estiver presente, transformar o **hero section inteiro** com uma abordagem visual escura e premium, criando contraste imediato com o restante da pagina.

### Mudancas Visuais

**1. Hero Section com fundo escuro (apenas quando tem parceiro)**

| Elemento | Sem Parceiro (atual) | Com Parceiro (novo) |
|----------|---------------------|---------------------|
| Fundo do hero | `bg-gradient-to-b from-background to-muted/30` | `bg-[#0F172A]` (slate-900) com gradiente radial primary |
| Texto do titulo | `text-foreground` | `text-white` |
| Texto do subtitulo | `text-muted-foreground` | `text-slate-300` |
| Badge de indicacao | `bg-primary/5 border-primary/20` | `bg-white/10 border-white/20 text-white` com glow sutil |
| Toggle periodo | `bg-muted` | `bg-white/10` com botoes `bg-white/20` |

**2. Efeitos premium**
- Gradiente radial no fundo: `radial-gradient(ellipse_at_top, hsl(var(--primary)/0.15), transparent 70%)`
- Borda inferior com gradiente: `border-b border-white/10`
- Animacao sutil de fade-in no badge

**3. Cards dos planos (com parceiro)**
- Adicionar uma faixa superior sutil nos cards: `border-t-2 border-primary/30` no card popular
- Manter cards claros para contraste com o hero escuro

### Sem Parceiro

A pagina permanece **exatamente como esta hoje** — fundo claro, sem nenhuma alteracao. Apenas quando `partnerName` existir a experiencia muda.

### Responsividade

Nenhuma mudanca estrutural de layout. Apenas cores e backgrounds condicionais que funcionam identicamente em qualquer viewport. A badge ja usa `text-xs sm:text-sm` e o hero ja tem `py-16 sm:py-24`.

### Detalhes Tecnicos

**Arquivo unico:** `src/modules/public/pages/PlanosPage.tsx`

1. No hero section (linha 276), aplicar classes condicionais baseadas em `!!partnerName`:
   - Fundo: `partnerName ? 'bg-[#0F172A] relative overflow-hidden' : ''`
   - Gradiente overlay: `bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15)_0%,transparent_70%)]`

2. No titulo h1 (linha 291): `partnerName ? 'text-white' : 'text-foreground'`

3. No subtitulo p (linha 294): `partnerName ? 'text-slate-300' : 'text-muted-foreground'`

4. Na badge (linha 285): `bg-white/10 border-white/20 text-white`

5. No toggle de periodo (linhas 320-346): classes condicionais para fundo e botoes

6. No link "Ja tem conta?" do header: manter como esta (header e separado do hero)

Nenhuma dependencia nova. Apenas Tailwind classes condicionais.

