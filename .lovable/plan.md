

# Substituir imagem do Hero por mockup real do modulo /negocios

## Objetivo
Trocar a imagem generica atual (`landing-hero-dashboard.jpg`) por um screenshot real do modulo `/negocios` (Kanban), transformado em estilo mockup profissional usando IA de geracao de imagem.

## Etapas

### 1. Capturar screenshot real
- Navegar ate `/negocios` no preview do projeto
- Tirar um print da tela do Kanban com cards e pipeline visiveis

### 2. Gerar mockup via IA
- Enviar o screenshot para o modelo de geracao de imagem (Gemini Flash Image)
- Prompt de transformacao: criar uma versao "mockup" com visual polido, leve blur nos textos sensiveis, moldura de navegador estilizada, sombras e perspectiva 3D sutil
- O resultado sera uma imagem que mostra a essencia do CRM sem expor o design exato

### 3. Substituir no projeto
- Salvar a imagem gerada em `src/assets/landing-hero-dashboard.jpg` (substituindo a atual)
- Nenhuma alteracao de codigo necessaria no `HeroSection.tsx` pois o import ja aponta para esse arquivo

## Detalhes tecnicos

- Arquivo afetado: `src/assets/landing-hero-dashboard.jpg` (substituicao do asset)
- Componente: `src/modules/public/components/landing/HeroSection.tsx` (sem alteracao de codigo)
- Ferramenta: API de geracao de imagem Gemini para transformar screenshot em mockup

## Resultado esperado
A landing page exibira uma previa realista do CRM Renove mostrando o pipeline de vendas em formato mockup profissional, passando credibilidade sem revelar o design interno exato.

