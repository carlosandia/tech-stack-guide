
## Adicionar Seção de Planos na Landing Page

### Analise do funil atual

O storytelling da landing segue uma jornada de convencimento classica:

1. **Hero** -- Ataca a dor principal (leads escapando)
2. **SocialProofBar** -- Credibilidade com numeros
3. **PainSection** -- Aprofunda 3 dores do ICP
4. **SolutionSection** -- Apresenta a solucao
5. **ModulesSection** -- Mostra o produto em detalhe
6. **HowItWorksSection** -- Simplifica a adesao (3 passos)
7. **TestimonialsSection** -- Prova social real
8. **ComparisonSection** -- Antes vs Depois (elimina duvidas)
9. **FAQSection** -- Elimina objecoes finais
10. **FinalCTASection** -- CTA de urgencia

### Posicionamento estrategico da secao de Planos

A secao de planos deve entrar **entre ComparisonSection e FAQSection** (posicao 9, empurrando FAQ para 10 e CTA Final para 11).

**Justificativa:** neste ponto do funil o visitante ja:
- Entendeu sua dor (seções 1-3)
- Conheceu a solucao e os modulos (seções 4-6)
- Viu que e simples comecar (seção 7)
- Foi convencido por prova social (seção 8)
- Visualizou o antes/depois (seção 9)

Agora ele esta pronto para a pergunta: **"Quanto custa?"**. Mostrar precos antes disso gera abandono. Mostrar depois do FAQ desperdiça o momento de decisao. O FAQ entao funciona como ultima barreira pos-preco, e o CTA final fecha.

### O que sera implementado

**1. Novo componente `PricingSection.tsx`**

- Secao com `id="planos"` para navegacao por ancora
- Titulo e subtitulo contextualizados no storytelling ("Escolha o plano ideal para o tamanho da sua operacao")
- Carregamento dos planos via widget loader existente (`pricing-widget-loader`)
- Toggle mensal/anual integrado (ja vem do widget)
- Cards de planos com destaque no "Popular"
- Animacao de scroll reveal consistente com as demais secoes
- Background alternado (`bg-muted/50`) seguindo o ritmo visual da landing

**2. Implementacao do widget**

O widget sera carregado via `useEffect` injetando o script da edge function `pricing-widget-loader`. Ao inves de usar `<script>` inline (que React nao executa), o componente criara o script element dinamicamente no mount.

**3. CTAs atualizados para apontar para `#planos`**

Pontos que receberao link/ancora para `#planos`:
- **Header nav**: o item "Planos" que hoje aponta para `/planos` passara a ser `#planos` (ancora na mesma pagina)
- **HowItWorksSection**: o botao "Comecar agora, e gratis" ganhara um CTA secundario "Ver planos" apontando para `#planos`
- **FinalCTASection**: alem do CTA principal de trial, adicionar um link discreto "Comparar planos" que leva a `#planos`

**4. Ordem final do funil na LandingPage**

```text
Hero
SocialProofBar
PainSection
SolutionSection
ModulesSection
HowItWorksSection
TestimonialsSection
ComparisonSection
PricingSection    <-- NOVA
FAQSection
FinalCTASection
```

### Detalhes tecnicos

**Arquivos a criar:**
- `src/modules/public/components/landing/PricingSection.tsx`

**Arquivos a editar:**
- `src/modules/public/pages/LandingPage.tsx` -- importar e posicionar PricingSection entre ComparisonSection e FAQSection
- `src/modules/public/components/landing/LandingHeader.tsx` -- alterar link "Planos" de `/planos` para `#planos`
- `src/modules/public/components/landing/FinalCTASection.tsx` -- adicionar link secundario "Comparar planos" apontando para `#planos`

**PricingSection.tsx -- Abordagem tecnica:**
- `useEffect` no mount para criar `<script>` apontando para a edge function `/functions/v1/pricing-widget-loader?periodo=mensal`
- Container `<div id="renove-pricing-widget">` onde o widget renderiza
- Wrapper com titulo, subtitulo e animacao `useScrollReveal`
- Estilos seguindo o design system (cores semanticas, Inter, espacamento do DS)
- URL do script montada a partir de `VITE_SUPABASE_URL`

**LandingHeader.tsx:**
- Linha do `navLinks`: mudar `{ label: 'Planos', href: '/planos' }` para `{ label: 'Planos', href: '#planos' }`

**FinalCTASection.tsx:**
- Abaixo do botao principal, adicionar um `<button>` com `onClick` scroll smooth para `#planos` com texto "Comparar planos" em estilo link discreto (underline, text-primary-foreground/70)
