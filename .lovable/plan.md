

# Nova Secao de Modulos na Landing Page

## Objetivo

Substituir a atual `FeaturesSection` generica por uma nova secao `ModulesSection` estrategica, que apresenta cada modulo do CRM Renove com copywriting persuasivo focado nos beneficios e na transformacao que cada um traz para o ICP.

## Estrategia de Conteudo

A secao tera um formato de **tabs/accordion interativo** onde cada modulo e apresentado com:
- Titulo do modulo com icone
- Frase de beneficio principal (headline curta e impactante)
- 3-4 bullet points de beneficios traduzidos em linguagem de dor/solucao
- Nao sera extenso - cada modulo tera no maximo 4 linhas de conteudo

## Modulos a Apresentar (7 modulos)

1. **Formularios** - "Crie formularios sem depender de desenvolvedor"
2. **Contatos** - "Sua base de leads organizada e inteligente"
3. **Conversas** - "WhatsApp profissional dentro do CRM"
4. **Automacos** - "Sua operacao no piloto automatico"
5. **Negocios** - "Pipeline completo com qualificacao e metas"
6. **Caixa de Entrada** - "E-mail integrado sem sair do CRM"
7. **Tarefas** - "Nenhuma atividade fica para tras"

## Design da Secao

Layout com navegacao lateral (desktop) ou tabs scrollaveis (mobile):
- Lado esquerdo: lista de modulos clicaveis (tabs verticais)
- Lado direito: conteudo do modulo selecionado com bullets de beneficios
- Visual limpo, sem imagens embutidas, usando icones lucide-react
- Fundo alternado (`bg-muted/30`) para destaque na pagina

## Detalhes Tecnicos

### Arquivo a Criar
- `src/modules/public/components/landing/ModulesSection.tsx`

### Arquivos a Modificar
- `src/modules/public/components/landing/FeaturesSection.tsx` - Sera removido/substituido
- `src/modules/public/pages/LandingPage.tsx` - Trocar `FeaturesSection` por `ModulesSection`

### Implementacao
- Componente com estado interno (`useState`) para tab ativa
- 7 tabs, uma por modulo
- Icones do `lucide-react` para cada modulo
- Responsivo: tabs horizontais scrollaveis no mobile, verticais no desktop
- Animacao suave de transicao entre tabs (CSS transition)
- Seguindo o Design System: cores primarias, tipografia Inter, espacamentos grid 8px, border-radius conforme DS

### Copywriting por Modulo (resumido e estrategico)

**Formularios**: Sem depender de dev. Teste A/B. QR Code. Notificacao automatica. Logica condicional. Analytics.

**Contatos**: Importacao em massa. Segmentacao. Historico de oportunidades. Colunas customizaveis. Vinculo com empresa.

**Conversas**: Sincronizado com WhatsApp. Correcao ortografica. Agendamento texto/audio. Notas privadas. Mensagens prontas. Anexos completos.

**Automacoes**: Editor visual drag-and-drop. Gatilhos por evento. Condicoes e validacoes. Distribuicao Round Robin. Acoes de CRM, comunicacao e integracao.

**Negocios**: Pipeline Kanban configuravel. Qualificacao MQL. Rodizio de leads. Tarefas de cadencia comercial. Scripts via WhatsApp/e-mail. Metas por equipe e individual.

**Caixa de Entrada**: E-mail completo sem sair do CRM. Enviar, responder, consultar. Rastreamento de abertura.

**Tarefas**: Central de tarefas unificada. Visualizacao e execucao rapida. Vinculada a oportunidades e contatos.

