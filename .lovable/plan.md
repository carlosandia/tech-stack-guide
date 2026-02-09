

# Plano de Frontend - Modulo de Formularios Avancados (PRD-17)

## Analise do Backend

O backend esta **substancialmente completo** com todas as 4 etapas implementadas:

- **Etapa 1**: CRUD de formularios, campos, estilos, submissoes, compartilhamento
- **Etapa 2**: Config popup, newsletter (LGPD), multi-step
- **Etapa 3**: Regras condicionais, progressive profiling
- **Etapa 4**: A/B testing, webhooks, analytics

Unica lacuna menor: tabela `rate_limits_formularios` nao foi criada como tabela separada (rate limiting e tratado no service). Isso nao impacta o frontend.

---

## Estrutura do Modulo Frontend

```text
src/modules/formularios/
  index.ts                         -- Barrel exports
  services/
    formularios.api.ts             -- Chamadas Supabase/API
  hooks/
    useFormularios.ts              -- TanStack Query (CRUD)
    useFormularioCampos.ts         -- Campos do formulario
    useFormularioEstilos.ts        -- Estilos
    useFormularioConfig.ts         -- Popup/Newsletter/Etapas
    useFormularioSubmissoes.ts     -- Submissoes
    useFormularioAnalytics.ts      -- Analytics
    useFormularioCompartilhar.ts   -- Links/Embed/QR
    useFormularioRegras.ts         -- Logica condicional
    useFormularioAB.ts             -- A/B Testing
    useFormularioWebhooks.ts       -- Webhooks
  schemas/
    formulario.schema.ts           -- Zod validacao frontend
  pages/
    FormulariosPage.tsx            -- Listagem principal
    FormularioEditorPage.tsx       -- Editor completo (tabs)
  components/
    -- Listagem --
    FormulariosList.tsx            -- Tabela/cards com filtros
    FormularioStatusBadge.tsx      -- Badge de status
    FormularioTipoBadge.tsx        -- Badge de tipo
    NovoFormularioModal.tsx        -- Modal de criacao (tipo + nome)
    DuplicarFormularioModal.tsx    -- Modal de duplicacao
    -- Editor (Tabs) --
    editor/
      EditorHeader.tsx             -- Nome, status, acoes (publicar/salvar)
      EditorTabsCampos.tsx         -- Tab: Campos (drag-and-drop)
      EditorTabsEstilos.tsx        -- Tab: Estilos visuais
      EditorTabsConfig.tsx         -- Tab: Configuracoes (popup/newsletter/etapas)
      EditorTabsLogica.tsx         -- Tab: Regras condicionais
      EditorTabsIntegracoes.tsx    -- Tab: Webhooks + Pipeline
      EditorTabsCompartilhar.tsx   -- Tab: Links, embed, QR
      EditorTabsAnalytics.tsx      -- Tab: Metricas e funil
      EditorTabsAB.tsx             -- Tab: A/B Testing
    -- Campos --
    campos/
      CampoItem.tsx                -- Item arrastavel do campo
      CampoConfigPanel.tsx         -- Painel lateral de config do campo
      CamposPaleta.tsx             -- Paleta de tipos de campo
      CamposReordenar.tsx          -- Lista drag-and-drop
    -- Estilos --
    estilos/
      EstiloContainerForm.tsx      -- Config visual container
      EstiloCamposForm.tsx         -- Config visual campos
      EstiloBotaoForm.tsx          -- Config visual botao
      EstiloPreview.tsx            -- Preview em tempo real
    -- Config Especifico --
    config/
      ConfigPopupForm.tsx          -- Trigger, animacao, overlay
      ConfigNewsletterForm.tsx     -- LGPD, double opt-in
      ConfigEtapasForm.tsx         -- Multi-step builder
    -- Logica --
    logica/
      RegraCondicionalItem.tsx     -- Uma regra
      RegraCondicionalForm.tsx     -- Form de criar/editar regra
      RegrasCondicionaisList.tsx   -- Lista de regras
    -- Compartilhamento --
    compartilhar/
      LinkDiretoCard.tsx           -- Link copiavel
      EmbedCodeCard.tsx            -- Codigo embed
      QRCodeCard.tsx               -- QR Code
    -- Analytics --
    analytics/
      FunilConversaoChart.tsx      -- Grafico funil
      MetricasResumoCards.tsx      -- Cards de metricas
      DesempenhoCamposTable.tsx    -- Tabela de performance
    -- A/B Testing --
    ab/
      TesteABForm.tsx              -- Criar/editar teste
      VariantesList.tsx            -- Lista de variantes
      ResultadosAB.tsx             -- Resultados com metricas
    -- Webhooks --
    webhooks/
      WebhookFormularioForm.tsx    -- Config do webhook
      WebhookFormularioLogs.tsx    -- Logs de execucao
    -- Submissoes --
    submissoes/
      SubmissoesList.tsx           -- Lista de submissoes
      SubmissaoDetalhe.tsx         -- Detalhe de uma submissao
```

---

## Etapas de Implementacao

### Etapa F1 - Fundacao e Listagem (Must-have)

**Objetivo**: Service API, hooks base, pagina de listagem, modal de criacao.

**Arquivos**:
- `src/modules/formularios/services/formularios.api.ts` - Chamadas ao Supabase
- `src/modules/formularios/hooks/useFormularios.ts` - TanStack Query
- `src/modules/formularios/schemas/formulario.schema.ts` - Validacao Zod
- `src/modules/formularios/pages/FormulariosPage.tsx` - Listagem com filtros
- `src/modules/formularios/components/FormulariosList.tsx` - Tabela
- `src/modules/formularios/components/FormularioStatusBadge.tsx`
- `src/modules/formularios/components/FormularioTipoBadge.tsx`
- `src/modules/formularios/components/NovoFormularioModal.tsx`
- `src/modules/formularios/index.ts`
- Registrar rota `/app/formularios` no `App.tsx`

**Funcionalidades**:
- Listar formularios com filtros (status, tipo, busca)
- Paginacao
- Contadores por status
- Criar novo formulario (nome, tipo, slug auto-gerado)
- Excluir (soft delete) com confirmacao
- Duplicar formulario
- Publicar/Despublicar via dropdown de acoes

---

### Etapa F2 - Editor: Campos (Must-have)

**Objetivo**: Pagina de edicao com gerenciamento de campos.

**Arquivos**:
- `src/modules/formularios/pages/FormularioEditorPage.tsx` - Layout com tabs
- `src/modules/formularios/hooks/useFormularioCampos.ts`
- `src/modules/formularios/components/editor/EditorHeader.tsx`
- `src/modules/formularios/components/editor/EditorTabsCampos.tsx`
- `src/modules/formularios/components/campos/CamposPaleta.tsx`
- `src/modules/formularios/components/campos/CampoItem.tsx`
- `src/modules/formularios/components/campos/CampoConfigPanel.tsx`
- `src/modules/formularios/components/campos/CamposReordenar.tsx`
- Rota `/app/formularios/:id` no `App.tsx`

**Funcionalidades**:
- Paleta lateral com tipos de campo disponiveis
- Adicionar campo ao formulario
- Reordenar campos (drag-and-drop ou botoes up/down)
- Editar configuracoes do campo (label, placeholder, obrigatorio, validacoes)
- Mapeamento de campo para contatos (nome, email, telefone, etc.)
- Suporte a etapa_numero para multi-step
- Remover campo com confirmacao

---

### Etapa F3 - Editor: Estilos e Preview (Must-have)

**Objetivo**: Configuracao visual do formulario com preview em tempo real.

**Arquivos**:
- `src/modules/formularios/hooks/useFormularioEstilos.ts`
- `src/modules/formularios/components/editor/EditorTabsEstilos.tsx`
- `src/modules/formularios/components/estilos/EstiloContainerForm.tsx`
- `src/modules/formularios/components/estilos/EstiloCamposForm.tsx`
- `src/modules/formularios/components/estilos/EstiloBotaoForm.tsx`
- `src/modules/formularios/components/estilos/EstiloPreview.tsx`

**Funcionalidades**:
- Configurar cor de fundo, bordas, padding, sombra do container
- Configurar logo, titulo, subtitulo do cabecalho
- Configurar estilos dos campos (cores, bordas, espacamento)
- Configurar botao (cor, texto, largura, hover)
- Preview em tempo real ao lado do formulario de config
- CSS customizado (textarea com highlight)

---

### Etapa F4 - Editor: Config Especifico por Tipo (Must-have)

**Objetivo**: Configuracoes de popup, newsletter e multi-step.

**Arquivos**:
- `src/modules/formularios/hooks/useFormularioConfig.ts`
- `src/modules/formularios/components/editor/EditorTabsConfig.tsx`
- `src/modules/formularios/components/config/ConfigPopupForm.tsx`
- `src/modules/formularios/components/config/ConfigNewsletterForm.tsx`
- `src/modules/formularios/components/config/ConfigEtapasForm.tsx`

**Funcionalidades**:
- **Popup**: Tipo de gatilho, atraso, scroll %, animacao, overlay, posicao, imagem
- **Newsletter**: Double opt-in, texto LGPD, URL privacidade, provedor externo, tags
- **Multi-step**: CRUD de etapas, definir textos dos botoes, validacao por etapa, icones

---

### Etapa F5 - Submissoes e Compartilhamento (Must-have)

**Objetivo**: Visualizar submissoes e compartilhar formulario.

**Arquivos**:
- `src/modules/formularios/hooks/useFormularioSubmissoes.ts`
- `src/modules/formularios/hooks/useFormularioCompartilhar.ts`
- `src/modules/formularios/components/editor/EditorTabsCompartilhar.tsx`
- `src/modules/formularios/components/compartilhar/LinkDiretoCard.tsx`
- `src/modules/formularios/components/compartilhar/EmbedCodeCard.tsx`
- `src/modules/formularios/components/compartilhar/QRCodeCard.tsx`
- `src/modules/formularios/components/submissoes/SubmissoesList.tsx`
- `src/modules/formularios/components/submissoes/SubmissaoDetalhe.tsx`

**Funcionalidades**:
- Listar submissoes com paginacao e filtro por status
- Ver detalhes de uma submissao (dados, UTMs, geo, lead score)
- Gerar link direto com UTMs
- Gerar codigo embed (inline, modal, sidebar)
- Gerar QR Code
- Copiar para clipboard

---

### Etapa F6 - Logica Condicional (Should-have)

**Objetivo**: Interface para criar regras condicionais.

**Arquivos**:
- `src/modules/formularios/hooks/useFormularioRegras.ts`
- `src/modules/formularios/components/editor/EditorTabsLogica.tsx`
- `src/modules/formularios/components/logica/RegrasCondicionaisList.tsx`
- `src/modules/formularios/components/logica/RegraCondicionalForm.tsx`
- `src/modules/formularios/components/logica/RegraCondicionalItem.tsx`

**Funcionalidades**:
- Listar regras do formulario
- Criar regra com: campo fonte, operador, valor, acao (mostrar/ocultar/pular/redirecionar)
- Suporte a multiplas condicoes (E/OU)
- Reordenar regras
- Ativar/desativar regra individual

---

### Etapa F7 - Analytics e A/B Testing (Could-have)

**Objetivo**: Dashboard de metricas e testes A/B.

**Arquivos**:
- `src/modules/formularios/hooks/useFormularioAnalytics.ts`
- `src/modules/formularios/hooks/useFormularioAB.ts`
- `src/modules/formularios/components/editor/EditorTabsAnalytics.tsx`
- `src/modules/formularios/components/editor/EditorTabsAB.tsx`
- `src/modules/formularios/components/analytics/MetricasResumoCards.tsx`
- `src/modules/formularios/components/analytics/FunilConversaoChart.tsx`
- `src/modules/formularios/components/analytics/DesempenhoCamposTable.tsx`
- `src/modules/formularios/components/ab/TesteABForm.tsx`
- `src/modules/formularios/components/ab/VariantesList.tsx`
- `src/modules/formularios/components/ab/ResultadosAB.tsx`

**Funcionalidades**:
- Cards de resumo: visualizacoes, submissoes, taxa de conversao, abandono
- Grafico de funil de conversao
- Tabela de desempenho por campo (tempo, erros, abandono)
- CRUD de testes A/B com variantes
- Iniciar/pausar/concluir testes
- Resultados com taxa de conversao por variante

---

### Etapa F8 - Webhooks e Integracoes (Should-have)

**Objetivo**: Configurar webhooks e integracao com pipeline.

**Arquivos**:
- `src/modules/formularios/hooks/useFormularioWebhooks.ts`
- `src/modules/formularios/components/editor/EditorTabsIntegracoes.tsx`
- `src/modules/formularios/components/webhooks/WebhookFormularioForm.tsx`
- `src/modules/formularios/components/webhooks/WebhookFormularioLogs.tsx`

**Funcionalidades**:
- CRUD de webhooks (URL, metodo, headers, payload)
- Testar webhook (POST real)
- Visualizar logs de execucao
- Config de retry (ativo, max tentativas, atraso)
- Configurar funil e etapa destino para criar oportunidades automaticamente

---

## Padroes Tecnicos

- **API**: Chamadas diretas ao Supabase via `@/lib/supabase` (padrao do projeto)
- **State**: TanStack Query para cache e mutacoes
- **Validacao**: Zod no frontend alinhado com schemas do backend
- **UI**: shadcn/ui + Design System (designsystem.md)
- **Drag-and-drop**: Implementacao com HTML5 Drag API ou botoes up/down como fallback
- **Graficos**: Barras/funil com CSS puro ou SVG simples (sem lib externa pesada)
- **Rotas**: `/app/formularios` (lista) e `/app/formularios/:id` (editor com tabs)

