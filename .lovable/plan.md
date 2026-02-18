
# Remoção de "Sem cartão de crédito" e Diferenciação Visual Real entre Seções

## 1. Remover "Sem cartão de crédito"

**HeroSection.tsx** - Remover a linha inteira que contém "Sem cartão de crédito • Configuração em 2 minutos • Cancele quando quiser"

**FinalCTASection.tsx** - Remover o item "Sem cartão de crédito" e o separador "•" que vem depois dele, mantendo apenas "Cancele quando quiser" e "Suporte incluso"

A menção no FAQ ("Preciso de cartão de crédito para o trial?") será mantida pois é uma pergunta/resposta contextual.

## 2. Tornar a diferenciação de fundo realmente visível

O problema atual: `bg-muted/30` tem opacidade de apenas 30%, tornando a diferença quase imperceptível. A correção será aumentar a intensidade:

| Seção | Fundo Atual | Novo Fundo |
|-------|------------|------------|
| PainSection | bg-muted/30 | **bg-muted/50** (mais visível) |
| SolutionSection | bg-background | Mantém bg-background |
| ModulesSection | gradient primary/[0.03-0.06] | **gradient primary/[0.04-0.08]** (mais perceptível) |
| HowItWorksSection | bg-background | Mantém bg-background |
| TestimonialsSection | bg-muted/30 | **bg-muted/50** |
| ComparisonSection | bg-background | Mantém bg-background |
| FAQSection | bg-muted/30 | **bg-muted/50** |

Dessa forma a alternância branco/cinza fica realmente perceptível ao scrollar.

## Arquivos a editar

1. `src/modules/public/components/landing/HeroSection.tsx` - Remover linha "Sem cartão de crédito..."
2. `src/modules/public/components/landing/FinalCTASection.tsx` - Remover item "Sem cartão de crédito" e separador
3. `src/modules/public/components/landing/PainSection.tsx` - bg-muted/30 para bg-muted/50
4. `src/modules/public/components/landing/ModulesSection.tsx` - Intensificar gradiente
5. `src/modules/public/components/landing/TestimonialsSection.tsx` - bg-muted/30 para bg-muted/50
6. `src/modules/public/components/landing/FAQSection.tsx` - bg-muted/30 para bg-muted/50
