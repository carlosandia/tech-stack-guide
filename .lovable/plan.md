

# Landing Page de Alta Conversao - CRM Renove

## Visao Geral

Criacao de uma landing page de vendas completa com estrategia de funil por secao, copywriting persuasivo e design profissional. A pagina sera acessivel pela rota raiz `/` (para visitantes nao autenticados) e tera storytelling amarrado entre secoes, falando diretamente com o ICP: dono de empresa B2B com 2+ vendedores que precisa sincronizar marketing e vendas.

---

## Arquitetura de Secoes (Funil por Storytelling)

A landing page seguira a estrutura classica de pagina de alta conversao com 10 secoes sequenciais, cada uma complementando a anterior:

```text
TOPO DO FUNIL (Atencao + Identificacao)
  1. Hero - Impacto imediato com a dor principal
  2. Barra de Prova Social - Logos/numeros de credibilidade
  3. Problema/Dor - Aprofundamento nas dores do ICP

MEIO DO FUNIL (Consideracao + Desejo)
  4. Solucao/Transformacao - Como o CRM Renove resolve
  5. Funcionalidades - Features com beneficios claros
  6. Como Funciona - 3 passos simples para comecar

FUNDO DO FUNIL (Decisao + Acao)
  7. Prova Social/Depoimentos - Resultados reais
  8. Comparativo - Antes vs Depois / Por que o Renove
  9. FAQ - Objecoes eliminadas
 10. CTA Final - Urgencia e acao definitiva
 11. Footer - Links institucionais
```

---

## Detalhamento das Secoes

### 1. Hero Section
- Headline principal atacando a dor: perda de leads por falta de controle
- Subheadline reforçando a transformação
- CTA primário "Teste grátis por 14 dias" + CTA secundário "Ver demonstração"
- Imagem hero: mockup do dashboard do CRM (usar imagem real de Unsplash com overlay)
- Badge de confiança: "Usado por +X empresas B2B"

### 2. Barra de Prova Social
- Números de impacto: leads gerenciados, empresas ativas, taxa de conversão média
- Design discreto mas impactante com contadores animados

### 3. Secao de Dores
- 3 cards com as dores principais do ICP:
  - "Leads caindo no esquecimento" 
  - "Vendedores sem processo definido"
  - "Marketing e vendas desconectados"
- Cada card com icone, titulo e descricao curta
- Copywriting que faz o visitante se identificar

### 4. Secao Solucao/Transformacao
- Titulo: "Chega de perder vendas por desorganizacao"
- Grid com 3 pilares da transformacao
- Imagens reais de dashboards/pipelines

### 5. Funcionalidades Principais
- Grid de 6 features com icones lucide-react:
  - Pipeline visual (Kanban)
  - Automacoes inteligentes
  - Integracao com WhatsApp
  - Gestao de equipes
  - Relatorios e metas
  - Campos customizaveis
- Cada feature com titulo, descricao de beneficio (nao tecnico)

### 6. Como Funciona
- 3 passos simples com numeracao visual:
  1. Crie sua conta em 2 minutos
  2. Configure seu funil de vendas
  3. Comece a fechar mais negocios
- CTA intermediario

### 7. Depoimentos/Prova Social
- 3 cards de depoimentos (placeholder realista)
- Nome, cargo, empresa, foto (avatar placeholder)
- Estrelas de avaliacao

### 8. Comparativo Antes vs Depois
- Tabela visual lado a lado
- "Sem CRM" vs "Com CRM Renove"
- Highlighting visual no lado positivo

### 9. FAQ
- Accordion com 6-8 perguntas frequentes
- Foco em eliminar objecoes: preco, complexidade, migracao, suporte

### 10. CTA Final
- Background com gradiente primario
- Headline de urgencia
- Botao grande CTA "Comece agora - 14 dias gratis"
- Reforco: "Sem cartao de credito. Cancele quando quiser."

### 11. Footer
- Logo, links para Termos, Privacidade, Planos
- Copyright e CNPJ

---

## Detalhes Tecnicos

### Arquivos a Criar
1. `src/modules/public/pages/LandingPage.tsx` - Pagina principal
2. `src/modules/public/components/landing/HeroSection.tsx`
3. `src/modules/public/components/landing/SocialProofBar.tsx`
4. `src/modules/public/components/landing/PainSection.tsx`
5. `src/modules/public/components/landing/SolutionSection.tsx`
6. `src/modules/public/components/landing/FeaturesSection.tsx`
7. `src/modules/public/components/landing/HowItWorksSection.tsx`
8. `src/modules/public/components/landing/TestimonialsSection.tsx`
9. `src/modules/public/components/landing/ComparisonSection.tsx`
10. `src/modules/public/components/landing/FAQSection.tsx`
11. `src/modules/public/components/landing/FinalCTASection.tsx`
12. `src/modules/public/components/landing/LandingFooter.tsx`
13. `src/modules/public/components/landing/LandingHeader.tsx`

### Arquivos a Modificar
1. `src/modules/public/index.ts` - Exportar LandingPage
2. `src/App.tsx` - Adicionar rota `/` para LandingPage (visitantes nao autenticados)

### Roteamento
- Rota `/` para visitantes nao autenticados mostra a LandingPage
- Usuarios autenticados continuam redirecionados para `/dashboard` ou `/admin`
- CTAs da landing redirecionam para `/planos` (fluxo existente de checkout)

### Imagens
- Usar imagens reais do Unsplash via URL para mockups de dashboard, equipes, escritorios
- Screenshots estilizados do produto com bordas e sombras

### Design
- Seguir fielmente o Design System (`docs/designsystem.md`)
- Cores primarias, tipografia Inter, espacamentos do grid 8px
- Animacoes sutis com CSS (fade-in on scroll via IntersectionObserver)
- Responsivo mobile-first conforme breakpoints do DS
- Visual profissional e premium, sem parecer template generico

### Copywriting
- Linguagem direta, PT-BR com acentos
- Foco nas dores do ICP B2B
- Verbos de acao nos CTAs
- Numeros e dados concretos
- Gatilhos: escassez (trial limitado), prova social, autoridade, reciprocidade

