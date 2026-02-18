

# Melhoria Visual da Landing Page: Remoção de Labels e Diferenciação de Seções

## O que será feito

### 1. Remover todos os subtítulos azuis (labels uppercase)

Serão removidas as tags `<p>` com classe `text-primary uppercase` de **7 seções**:
- PainSection: "Isso soa familiar?"
- SolutionSection: "A transformação"
- ModulesSection: "Módulos"
- HowItWorksSection: "Simples de começar"
- TestimonialsSection: "Quem já usa, aprova"
- ComparisonSection: "Antes vs depois"
- FAQSection: "Dúvidas frequentes"

### 2. Substituir todos os travessões (—)

Trocar "—" por vírgula ou ponto em:
- SolutionSection (2 ocorrências nos textos dos pilares e subtítulo)
- ModulesSection (2 ocorrências nos benefícios)
- HowItWorksSection (botão CTA)
- FinalCTASection (botão CTA)

### 3. Diferenciação visual entre seções (recomendação UX)

Para evitar cansaço visual e melhorar retenção, aplicaremos um padrão de **alternância rítmica** com 3 variações de fundo:

| Seção | Fundo Atual | Novo Fundo |
|-------|------------|------------|
| Hero | bg-background | Mantém (branco com gradiente sutil) |
| SocialProof | bg-muted/50 | Mantém (barra cinza com borda) |
| **PainSection** | bg-background | **bg-muted/30** (cinza claro para agrupar com "dor") |
| **SolutionSection** | bg-muted/30 | **bg-background** (branco, contraste com a anterior) |
| **ModulesSection** | bg-muted/30 | **Gradiente sutil primary**: `bg-gradient-to-b from-primary/[0.03] to-primary/[0.06]` |
| **HowItWorksSection** | bg-muted/30 | **bg-background** (branco limpo para os 3 passos) |
| **TestimonialsSection** | bg-background | **bg-muted/30** (cinza para destaque dos cards) |
| **ComparisonSection** | bg-muted/30 | **bg-background** (branco para o comparativo) |
| **FAQSection** | bg-background | **bg-muted/30** (cinza para alternância) |
| FinalCTA | bg-primary | Mantém (azul forte) |

A lógica de UX aplicada:
- **Alternância consistente**: branco e cinza se revezam, criando ritmo visual
- **Seção de destaque**: ModulesSection ganha um gradiente sutil com tom do primary, sinalizando que é a seção principal do produto
- **Ritmo de leitura**: o olho descansa ao alternar entre fundos, reduzindo fadiga visual e aumentando scroll depth

## Detalhes Técnicos

### Arquivos a editar (8 arquivos)

1. `PainSection.tsx` - Remover label, trocar bg para `bg-muted/30`
2. `SolutionSection.tsx` - Remover label, trocar bg para `bg-background`, remover travessões
3. `ModulesSection.tsx` - Remover label, aplicar gradiente sutil, remover travessões
4. `HowItWorksSection.tsx` - Remover label, trocar bg para `bg-background`, remover travessão do botão
5. `TestimonialsSection.tsx` - Remover label, trocar bg para `bg-muted/30`
6. `ComparisonSection.tsx` - Remover label, trocar bg para `bg-background`
7. `FAQSection.tsx` - Remover label, trocar bg para `bg-muted/30`
8. `FinalCTASection.tsx` - Remover travessão do botão CTA

