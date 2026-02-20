# PRD-17: Modulo de Formularios Avancados (Backend)

| Campo | Valor |
|-------|-------|
| **Autor** | Arquiteto de Produto |
| **Data de criacao** | 2026-02-09 |
| **Ultima atualizacao** | 2026-02-09 |
| **Versao** | v1.0 |
| **Status** | Em desenvolvimento |
| **Stakeholders** | Time de Produto, Engenharia |
| **Revisor tecnico** | Tech Lead |

---

## 1. Resumo Executivo

Implementar um modulo completo de criacao de formularios no CRM Renove, permitindo que usuarios Admin criem formularios personalizados do zero com total autonomia. O sistema deve suportar:

1. **4 Tipos de Formulario:**
   - **Popup de Saida** - Formulario exibido quando usuario tenta sair da pagina
   - **Newsletter** - Captura de email para newsletter com configuracoes LGPD
   - **Step-by-Step** - Formulario multi-etapa com progresso visual
   - **Padrao** - Formulario tradicional para criacao do zero

2. **Funcionalidades Core:**
   - Drag-and-drop de campos com reordenacao
   - Estilizacao completa de campos (obrigatorio, bordas, placeholder, label)
   - Configuracao visual do formulario (background, bordas, imagens)
   - Botao de envio normal ou WhatsApp (envia + redireciona)
   - Compartilhamento via embed, link direto e QR Code
   - Integracao com pipeline para criacao automatica de oportunidades
   - Logica condicional (mostrar/ocultar campos)
   - Progressive profiling (personalizar para leads conhecidos)
   - A/B Testing para otimizacao de conversao
   - Webhooks com retry para integracoes externas

3. **Seguranca:**
   - Rate limiting por IP (10 submissoes/minuto)
   - reCAPTCHA/hCaptcha obrigatorio em formularios publicos
   - Honeypot para deteccao de bots
   - RLS (Row Level Security) por organizacao

---

## 2. Contexto e Motivacao

### 2.1 Problema

Atualmente o CRM possui estrutura basica de formularios (`form_templates`, `custom_forms`, `form_fields`, `form_submissions`) que nao atende necessidades avancadas:

| Problema | Impacto |
|----------|---------|
| Falta de tipos de formulario (popup, newsletter, step) | Usuarios criam solucoes externas |
| Sem configuracao de estilos visuais | Formularios sem identidade visual da marca |
| Sem integracao WhatsApp completa | Perda de leads que preferem WhatsApp |
| Sem logica condicional | Formularios longos que causam abandono |
| Sem progressive profiling | Leads conhecidos preenchem mesmos dados |
| Sem A/B testing | Impossivel otimizar taxas de conversao |

### 2.2 Oportunidade de Mercado

**Fontes pesquisadas:**
- [HubSpot Form Builder](https://knowledge.hubspot.com/forms/create-and-edit-forms) - Conditional logic (100 regras, 10 condicoes/regra)
- [HubSpot Conditional Logic](https://knowledge.hubspot.com/forms/customize-form-steps-with-conditional-logic)
- [RD Station Features](https://tldv.io/blog/rd-station-review/) - Landing pages, popups, A/B testing
- [Progressive Profiling](https://www.reform.app/blog/top-tools-for-progressive-profiling) - Reducao de 20-30% em abandono
- [GDPR Compliant Forms](https://forms.app/en/blog/best-gdpr-compliant-form-builders)

| Concorrente | Funcionalidade Destaque | Status no PRD |
|-------------|-------------------------|---------------|
| HubSpot | Conditional Logic (100 regras) | Implementado |
| HubSpot | Progressive Profiling | Implementado |
| RD Station | A/B Testing | Implementado |
| Typeform | Multi-step com animacoes | Implementado |
| Gravity Forms | Webhooks + Retry | Implementado |
| WPForms | Prefill via URL | Implementado |
| LeadGen App | Lead Scoring | Implementado |
| FormAssembly | Field Dependencies | Implementado |

### 2.3 Alinhamento Estrategico

- **Objetivo:** Aumentar captura de leads qualificados
- **Impacto em conversao:** +15-25% com formularios otimizados
- **Reducao de abandono:** -20-30% com progressive profiling
- **ROI:** Menos dependencia de ferramentas externas

---

## 3. Usuarios e Personas

### 3.1 Persona Primaria

**Nome:** Maria - Gerente de Marketing
**Role:** Admin
**Contexto:** Precisa criar formularios para campanhas de marketing
**Dores:**
- Formularios estaticos que nao se adaptam ao usuario
- Sem visibilidade de metricas de conversao
- Dependencia de desenvolvedor para alteracoes
**Objetivos:**
- Criar formularios personalizados rapidamente
- Testar variacoes para otimizar conversao
- Integrar com pipeline automaticamente
**Citacao representativa:** "Preciso de autonomia para criar e otimizar meus formularios sem depender do TI"

### 3.2 Personas Secundarias

**Nome:** Carlos - Analista de Vendas
**Role:** Member
**Contexto:** Visualiza leads capturados pelos formularios
**Dores:**
- Leads incompletos ou duplicados
- Sem contexto de origem do lead
**Objetivos:**
- Receber leads qualificados com informacoes completas
- Ver historico de interacoes do lead

### 3.3 Anti-personas

- **Desenvolvedor que quer customizar codigo** - Formularios sao no-code
- **Usuario sem permissao de Admin** - Members apenas visualizam submissoes

---

## 4. Hierarquia de Requisitos

### 4.1 Theme (Objetivo Estrategico)

> Aumentar captura e qualificacao de leads atraves de formularios inteligentes e personalizaveis

### 4.2 Epic (Iniciativa)

> Modulo de Formularios Avancados com builder visual, logica condicional e integracao completa com pipeline

### 4.3 Features e User Stories

**Feature: Criacao de Formulario**

**User Story:**
Como Admin,
Quero criar formularios com drag-and-drop,
Para que possa construir formularios personalizados sem codigo.

**Criterios de Aceitacao:**
- [ ] Arrastar campos da lista para o formulario
- [ ] Reordenar campos com drag-and-drop
- [ ] Configurar cada campo (label, placeholder, obrigatorio)
- [ ] Salvar como rascunho ou publicar

**Prioridade:** Must-have

---

**Feature: Logica Condicional**

**User Story:**
Como Admin,
Quero criar regras condicionais para campos,
Para que formularios se adaptem as respostas do usuario.

**Criterios de Aceitacao:**
- [ ] Criar ate 100 regras por formulario
- [ ] Ate 10 condicoes por regra
- [ ] Acoes: mostrar/ocultar campo, pular etapa, redirecionar
- [ ] Operadores: igual, diferente, contem, maior que, menor que

**Prioridade:** Should-have

---

**Feature: Progressive Profiling**

**User Story:**
Como Admin,
Quero que leads conhecidos vejam formularios mais curtos,
Para que nao precisem preencher dados ja informados.

**Criterios de Aceitacao:**
- [ ] Identificar visitante por email ou cookie
- [ ] Ocultar campos ja preenchidos
- [ ] Mostrar campos alternativos
- [ ] Minimo de 2 campos mesmo para leads conhecidos

**Prioridade:** Should-have

---

**Feature: A/B Testing**

**User Story:**
Como Admin,
Quero testar variacoes de formulario,
Para que possa otimizar taxas de conversao.

**Criterios de Aceitacao:**
- [ ] Criar variantes A/B com diferentes configs
- [ ] Distribuir trafego igualmente ou customizado
- [ ] Medir taxa de conversao por variante
- [ ] Declarar vencedor automaticamente com 95% confianca

**Prioridade:** Could-have

---

## 5. Requisitos Funcionais

### 5.1 CRUD de Formularios

| ID | Requisito | Prioridade | Criterio de aceitacao |
|----|-----------|------------|----------------------|
| RF-001 | Criar formulario com nome, slug e tipo | Must | Formulario salvo com dados validos |
| RF-002 | Listar formularios do tenant com filtros | Must | Lista paginada com busca |
| RF-003 | Editar formulario existente | Must | Alteracoes persistidas |
| RF-004 | Excluir formulario (soft delete) | Must | Marcado como deletado |
| RF-005 | Publicar/despublicar formulario | Must | Status atualizado |
| RF-006 | Duplicar formulario existente | Should | Copia criada com novo nome |

### 5.2 Campos do Formulario

| ID | Requisito | Prioridade | Criterio de aceitacao |
|----|-----------|------------|----------------------|
| RF-007 | Adicionar campo ao formulario | Must | Campo criado com configuracoes |
| RF-008 | Remover campo do formulario | Must | Campo excluido |
| RF-009 | Reordenar campos (drag-and-drop) | Must | Ordem atualizada no banco |
| RF-010 | Configurar validacao do campo | Must | Regras de validacao salvas |
| RF-011 | Mapear campo para leads_master | Should | Mapeamento salvo |

### 5.3 Estilos e Visual

| ID | Requisito | Prioridade | Criterio de aceitacao |
|----|-----------|------------|----------------------|
| RF-012 | Configurar estilos do container | Must | JSONB com estilos salvo |
| RF-013 | Configurar estilos dos campos | Must | Estilos aplicados |
| RF-014 | Configurar estilos do botao | Must | Botao customizado |
| RF-015 | Adicionar imagem de cabecalho | Should | Imagem exibida |
| RF-016 | Configurar cores e fontes | Must | Visual personalizado |

### 5.4 Tipos Especificos

| ID | Requisito | Prioridade | Criterio de aceitacao |
|----|-----------|------------|----------------------|
| RF-017 | Configurar popup de saida | Must | Trigger e animacao funcionando |
| RF-018 | Configurar newsletter com LGPD | Must | Consent e double opt-in |
| RF-019 | Configurar formulario multi-step | Must | Etapas navegaveis |
| RF-020 | Configurar botao WhatsApp | Must | Envia + redireciona |

### 5.5 Submissao e Integracao

| ID | Requisito | Prioridade | Criterio de aceitacao |
|----|-----------|------------|----------------------|
| RF-021 | Receber submissao publica | Must | Dados salvos no banco |
| RF-022 | Validar captcha | Must | Submissao rejeitada sem captcha |
| RF-023 | Aplicar rate limiting | Must | IP bloqueado apos limite |
| RF-024 | Criar lead no pipeline | Must | Oportunidade criada automaticamente |
| RF-025 | Rastrear UTMs | Must | Parametros salvos na submissao |

### 5.6 Compartilhamento

| ID | Requisito | Prioridade | Criterio de aceitacao |
|----|-----------|------------|----------------------|
| RF-026 | Gerar link direto | Must | URL unica funcionando |
| RF-027 | Gerar codigo embed | Must | Codigo copiavel |
| RF-028 | Gerar QR Code | Should | Imagem PNG gerada |
| RF-029 | Configurar expiracao do link | Could | Link expira na data |

### 5.7 Logica Condicional

| ID | Requisito | Prioridade | Criterio de aceitacao |
|----|-----------|------------|----------------------|
| RF-030 | Criar regra condicional | Should | Regra salva no banco |
| RF-031 | Avaliar condicoes em tempo real | Should | Campo mostrado/oculto |
| RF-032 | Pular para etapa especifica | Should | Navegacao condicional |
| RF-033 | Redirecionar por condicao | Could | URL diferente por resposta |

### 5.8 Progressive Profiling

| ID | Requisito | Prioridade | Criterio de aceitacao |
|----|-----------|------------|----------------------|
| RF-034 | Identificar visitante conhecido | Should | Cookie ou email reconhecido |
| RF-035 | Ocultar campos ja preenchidos | Should | Campos nao exibidos |
| RF-036 | Mostrar campo alternativo | Should | Campo substituto exibido |

### 5.9 A/B Testing

| ID | Requisito | Prioridade | Criterio de aceitacao |
|----|-----------|------------|----------------------|
| RF-037 | Criar teste A/B | Could | Teste com variantes criado |
| RF-038 | Distribuir trafego | Could | Variantes recebem trafego |
| RF-039 | Calcular conversao | Could | Taxa calculada por variante |
| RF-040 | Declarar vencedor | Could | Variante marcada como vencedora |

### 5.10 Webhooks

| ID | Requisito | Prioridade | Criterio de aceitacao |
|----|-----------|------------|----------------------|
| RF-041 | Configurar webhook | Should | URL e headers salvos |
| RF-042 | Disparar webhook na submissao | Should | Request enviado |
| RF-043 | Retry em caso de falha | Should | Ate 3 tentativas |
| RF-044 | Log de webhooks | Should | Historico registrado |

### 5.11 Analytics

| ID | Requisito | Prioridade | Criterio de aceitacao |
|----|-----------|------------|----------------------|
| RF-045 | Rastrear visualizacoes | Should | Contador incrementado |
| RF-046 | Rastrear inicio de preenchimento | Should | Evento registrado |
| RF-047 | Rastrear abandono por campo | Should | Campo identificado |
| RF-048 | Calcular taxa de conversao | Should | Percentual calculado |

---

## 6. Requisitos Nao-Funcionais

### 6.1 Performance

| Requisito | Meta | Medicao |
|-----------|------|---------|
| Tempo de carregamento do formulario | < 500ms | P95 |
| Tempo de submissao | < 1s | P95 |
| Submissoes simultaneas | 1000/min por tenant | Load test |

### 6.2 Seguranca

| Requisito | Implementacao |
|-----------|---------------|
| Autenticacao | JWT via Supabase Auth |
| Autorizacao | RLS por organizacao_id |
| Rate Limiting | 10 submissoes/min por IP |
| Anti-spam | reCAPTCHA v3 + Honeypot |
| LGPD | Consent explicito em newsletter |

### 6.3 Usabilidade

| Requisito | Criterio |
|-----------|----------|
| Responsividade | Mobile-first em todos formularios |
| Acessibilidade | WCAG 2.1 AA |
| Internacionalizacao | PT-BR (interface e mensagens) |

### 6.4 Sistema/Ambiente

| Requisito | Especificacao |
|-----------|---------------|
| Banco de dados | Supabase (PostgreSQL) |
| Backend | Node.js + Express |
| Validacao | Zod schemas |
| Storage | Supabase Storage (imagens) |

---

## 7. Escopo

### 7.1 O que ESTA no escopo

- Backend completo (tabelas, rotas, services)
- Validacao Zod de todos schemas
- Integracao com pipeline (criar oportunidade)
- Integracao WhatsApp (enviar + redirecionar)
- Rate limiting e captcha
- Webhooks com retry
- Analytics basico (views, submissoes, abandono)

### 7.2 O que NAO esta no escopo

- **Frontend/UI** - Sera outro PRD dedicado
- **Editor visual drag-and-drop** - Depende do frontend
- **Landing page builder** - Fora do modulo de formularios
- **Email marketing integrado** - Apenas integracao externa

### 7.3 Escopo futuro (backlog)

- Integracao nativa com Mailchimp/SendGrid
- Templates de formulario predefinidos
- Formularios condicionais avancados (branch logic)
- Testes multivariados (mais de 2 variantes)

---

## 8. Suposicoes, Dependencias e Restricoes

### 8.1 Suposicoes

- Usuarios Admin terao conhecimento basico para criar formularios
- reCAPTCHA sera configurado pelo Admin nas integracoes
- WhatsApp Business API esta disponivel para integracao

### 8.2 Dependencias

| Dependencia | Responsavel | Status | Risco |
|-------------|-------------|--------|-------|
| PRD-06 Contatos | Time Produto | Aprovado | Baixo |
| PRD-07 Negocios | Time Produto | Em desenvolvimento | Medio |
| PRD-08 Conexoes | Time Produto | Em desenvolvimento | Medio |
| Supabase Storage | Infra | Disponivel | Baixo |
| reCAPTCHA API | Google | Externo | Baixo |

### 8.3 Restricoes

- **Tecnicas:** Deve usar stack existente (Node.js, Supabase, Zod)
- **Nomenclatura:** Tabelas em PT-BR snake_case sem acento
- **Isolamento:** Todas tabelas devem ter organizacao_id

---

## 9. Modelo de Dados (Migracoes)

### 9.1 Tabela Principal: `formularios`

```sql
-- Migration: create_formularios_table
CREATE TABLE formularios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id UUID NOT NULL REFERENCES organizacoes_saas(id) ON DELETE CASCADE,

  -- Identificacao
  nome VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  descricao TEXT,

  -- Tipo de formulario
  tipo VARCHAR(50) NOT NULL DEFAULT 'padrao',
  -- Valores: 'padrao', 'popup_saida', 'newsletter', 'multi_etapas'

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'rascunho',
  -- Valores: 'rascunho', 'publicado', 'arquivado'
  ativo BOOLEAN DEFAULT true,

  -- Configuracao de destino
  funil_id UUID REFERENCES funis(id) ON DELETE SET NULL,
  etapa_id UUID REFERENCES etapas_funil(id) ON DELETE SET NULL,

  -- Botao de envio
  tipo_botao_envio VARCHAR(20) DEFAULT 'padrao',
  -- Valores: 'padrao', 'whatsapp'
  whatsapp_numero VARCHAR(20),
  whatsapp_mensagem_template TEXT,

  -- Configuracoes de comportamento
  url_redirecionamento TEXT,
  mensagem_sucesso TEXT DEFAULT 'Formulario enviado com sucesso!',

  -- Limites e agendamento
  max_submissoes INTEGER,
  submissoes_atuais INTEGER DEFAULT 0,
  data_inicio TIMESTAMP WITH TIME ZONE,
  data_fim TIMESTAMP WITH TIME ZONE,
  mensagem_fechado TEXT DEFAULT 'Este formulario nao esta mais aceitando respostas.',

  -- Tracking de conversao
  tracking_conversao_ativo BOOLEAN DEFAULT false,
  google_ads_conversion_id VARCHAR(100),
  google_ads_conversion_label VARCHAR(100),
  facebook_pixel_id VARCHAR(100),
  facebook_event_name VARCHAR(50) DEFAULT 'Lead',

  -- Features avancadas
  progressive_profiling_ativo BOOLEAN DEFAULT false,
  lead_scoring_ativo BOOLEAN DEFAULT false,
  pontuacao_base_lead INTEGER DEFAULT 0,
  ab_testing_ativo BOOLEAN DEFAULT false,
  teste_ab_atual_id UUID,

  -- Versionamento
  versao INTEGER DEFAULT 1,
  ultima_versao_publicada INTEGER,
  duplicado_de_id UUID REFERENCES formularios(id),

  -- Metadados
  criado_por UUID NOT NULL REFERENCES usuarios(id),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  publicado_em TIMESTAMP WITH TIME ZONE,
  deletado_em TIMESTAMP WITH TIME ZONE,

  -- Constraints
  UNIQUE(organizacao_id, slug),
  CHECK (tipo IN ('padrao', 'popup_saida', 'newsletter', 'multi_etapas')),
  CHECK (status IN ('rascunho', 'publicado', 'arquivado')),
  CHECK (tipo_botao_envio IN ('padrao', 'whatsapp'))
);

-- RLS
ALTER TABLE formularios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON formularios
  FOR ALL USING (organizacao_id = current_setting('app.current_tenant')::uuid);

-- Indices
CREATE INDEX idx_formularios_organizacao ON formularios(organizacao_id);
CREATE INDEX idx_formularios_slug ON formularios(slug);
CREATE INDEX idx_formularios_status ON formularios(status);
CREATE INDEX idx_formularios_tipo ON formularios(tipo);
CREATE INDEX idx_formularios_organizacao_status ON formularios(organizacao_id, status);
```

### 9.2 Tabela: `campos_formularios`

```sql
-- Migration: create_campos_formularios_table
CREATE TABLE campos_formularios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formulario_id UUID NOT NULL REFERENCES formularios(id) ON DELETE CASCADE,

  -- Identificacao do campo
  chave_campo VARCHAR(100) NOT NULL,
  tipo_campo VARCHAR(50) NOT NULL,
  -- Tipos basicos: 'texto', 'email', 'telefone', 'area_texto', 'selecao',
  --               'selecao_multipla', 'radio', 'checkbox', 'data', 'data_hora',
  --               'hora', 'numero', 'moeda', 'url', 'arquivo', 'imagem',
  --               'oculto', 'titulo', 'paragrafo'
  -- Tipos avancados: 'assinatura', 'avaliacao', 'nps', 'slider', 'faixa',
  --                  'cor', 'cpf', 'cnpj', 'cep', 'telefone_br', 'pais',
  --                  'estado', 'cidade', 'endereco', 'calculado', 'busca',
  --                  'upload_video', 'upload_audio', 'documento', 'divisor',
  --                  'espacador', 'bloco_html', 'checkbox_termos', 'matriz',
  --                  'ranking', 'agendamento'

  -- Labels e placeholders
  rotulo VARCHAR(255) NOT NULL,
  placeholder VARCHAR(255),
  texto_ajuda TEXT,

  -- Validacao
  obrigatorio BOOLEAN DEFAULT false,
  regras_validacao JSONB DEFAULT '{}',
  -- Exemplo: {"min_length": 3, "max_length": 100, "pattern": "^[a-zA-Z]+$"}

  -- Opcoes (para selecao, radio, checkbox)
  opcoes JSONB DEFAULT '[]',
  -- Exemplo: [{"valor": "op1", "rotulo": "Opcao 1"}, ...]

  -- Estilos do campo
  estilos JSONB DEFAULT '{}',

  -- Ordenacao e agrupamento
  ordem INTEGER NOT NULL DEFAULT 0,
  indice_etapa INTEGER DEFAULT 0, -- Para formularios multi-etapas
  grupo_id UUID,

  -- Mapeamento para contatos
  mapeia_para_campo VARCHAR(100),
  -- Valores: 'nome', 'email', 'telefone', 'empresa', 'cargo', etc.

  -- Lead Scoring
  valor_pontuacao INTEGER DEFAULT 0,
  regras_pontuacao JSONB DEFAULT '[]',
  -- Estrutura: [{"valor": "sim", "pontuacao": 10}, {"valor": "nao", "pontuacao": -5}]

  -- Prefill
  prefill_ativo BOOLEAN DEFAULT false,
  prefill_fonte VARCHAR(30),
  -- Valores: 'url_param', 'cookie', 'campo_crm', 'padrao'
  prefill_chave VARCHAR(100),
  valor_padrao TEXT,

  -- Progressive Profiling
  mostrar_para_leads_conhecidos BOOLEAN DEFAULT true,
  alternativa_para_campo_id UUID,
  prioridade_profiling INTEGER DEFAULT 0,

  -- Logica Condicional
  visibilidade_condicional BOOLEAN DEFAULT false,
  condicoes_visibilidade JSONB,

  -- Campo Calculado
  formula_calculo TEXT,
  -- Exemplo: "{{quantidade}} * {{preco_unitario}}"

  -- Autocomplete
  tipo_autocomplete VARCHAR(30),
  -- Valores: 'endereco', 'cep', 'cpf', 'cnpj', 'dominio_email', 'custom'
  url_api_autocomplete TEXT,

  -- Layout
  colunas INTEGER DEFAULT 1,
  indice_linha INTEGER,

  -- Metadados
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(formulario_id, chave_campo)
);

-- Indices
CREATE INDEX idx_campos_formularios_formulario ON campos_formularios(formulario_id);
CREATE INDEX idx_campos_formularios_ordem ON campos_formularios(formulario_id, ordem);
CREATE INDEX idx_campos_formularios_etapa ON campos_formularios(formulario_id, indice_etapa);
```

### 9.3 Tabela: `estilos_formularios`

```sql
-- Migration: create_estilos_formularios_table
CREATE TABLE estilos_formularios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formulario_id UUID NOT NULL UNIQUE REFERENCES formularios(id) ON DELETE CASCADE,

  -- Estilos gerais do formulario (JSONB unico)
  estilos JSONB NOT NULL DEFAULT '{
    "container": {
      "cor_fundo": "#ffffff",
      "borda_raio": "8px",
      "borda_largura": "1px",
      "borda_cor": "#e5e7eb",
      "padding": "24px",
      "largura_maxima": "500px",
      "sombra": "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
    },
    "cabecalho": {
      "mostrar_logo": false,
      "logo_url": null,
      "logo_posicao": "centro",
      "titulo_tamanho_fonte": "24px",
      "titulo_cor": "#111827",
      "subtitulo_tamanho_fonte": "14px",
      "subtitulo_cor": "#6b7280"
    },
    "campos": {
      "rotulo_tamanho_fonte": "14px",
      "rotulo_cor": "#374151",
      "input_cor_fundo": "#ffffff",
      "input_borda_raio": "6px",
      "input_borda_cor": "#d1d5db",
      "input_foco_borda_cor": "#3b82f6",
      "input_padding": "12px",
      "input_tamanho_fonte": "14px",
      "cor_erro": "#ef4444",
      "espacamento": "16px"
    },
    "botao": {
      "cor_fundo": "#3b82f6",
      "cor_texto": "#ffffff",
      "borda_raio": "6px",
      "padding": "12px 24px",
      "tamanho_fonte": "16px",
      "peso_fonte": "600",
      "hover_cor_fundo": "#2563eb",
      "largura_total": true
    },
    "imagens": {
      "imagem_cabecalho_url": null,
      "imagem_cabecalho_posicao": "topo",
      "imagem_fundo_url": null,
      "opacidade_fundo": 1
    },
    "responsivo": {
      "mobile_padding": "16px",
      "mobile_largura_maxima": "100%"
    }
  }',

  -- Metadados
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indice
CREATE INDEX idx_estilos_formularios_formulario ON estilos_formularios(formulario_id);
```

### 9.4 Tabela: `config_popup_formularios`

```sql
-- Migration: create_config_popup_formularios_table
CREATE TABLE config_popup_formularios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formulario_id UUID NOT NULL UNIQUE REFERENCES formularios(id) ON DELETE CASCADE,

  -- Trigger do popup
  tipo_gatilho VARCHAR(30) NOT NULL DEFAULT 'intencao_saida',
  -- Valores: 'intencao_saida', 'atraso_tempo', 'porcentagem_scroll', 'clique'

  -- Configuracoes de trigger
  atraso_segundos INTEGER DEFAULT 0,
  porcentagem_scroll INTEGER DEFAULT 50,
  seletor_elemento_clique VARCHAR(255),

  -- Comportamento de exibicao
  mostrar_uma_vez_sessao BOOLEAN DEFAULT true,
  dias_expiracao_cookie INTEGER DEFAULT 30,
  mostrar_mobile BOOLEAN DEFAULT true,

  -- Overlay
  cor_fundo_overlay VARCHAR(20) DEFAULT 'rgba(0, 0, 0, 0.5)',
  clique_overlay_fecha BOOLEAN DEFAULT true,

  -- Animacao
  tipo_animacao VARCHAR(20) DEFAULT 'fade',
  -- Valores: 'fade', 'slide_cima', 'slide_baixo', 'zoom', 'nenhum'
  duracao_animacao_ms INTEGER DEFAULT 300,

  -- Imagem do popup
  popup_imagem_url TEXT,
  popup_imagem_posicao VARCHAR(20) DEFAULT 'topo',
  -- Valores: 'topo', 'esquerda', 'direita', 'fundo'

  -- Posicao
  posicao VARCHAR(20) DEFAULT 'centro',
  -- Valores: 'centro', 'topo_direita', 'baixo_direita', 'baixo_esquerda', 'topo_esquerda'

  -- Metadados
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indice
CREATE INDEX idx_config_popup_formularios ON config_popup_formularios(formulario_id);
```

### 9.5 Tabela: `config_newsletter_formularios`

```sql
-- Migration: create_config_newsletter_formularios_table
CREATE TABLE config_newsletter_formularios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formulario_id UUID NOT NULL UNIQUE REFERENCES formularios(id) ON DELETE CASCADE,

  -- Configuracao de double opt-in
  double_optin_ativo BOOLEAN DEFAULT true,
  assunto_email_confirmacao VARCHAR(255) DEFAULT 'Confirme sua inscricao',
  template_email_confirmacao TEXT,

  -- Configuracao de lista
  nome_lista VARCHAR(100),
  tags JSONB DEFAULT '[]',

  -- Frequencia de envio (informativo)
  frequencia_envio VARCHAR(50),
  -- Valores: 'diario', 'semanal', 'quinzenal', 'mensal', 'custom'
  descricao_frequencia_envio TEXT,

  -- LGPD/GDPR
  texto_consentimento TEXT DEFAULT 'Ao se inscrever, voce concorda em receber nossos emails e aceita nossa Politica de Privacidade.',
  url_politica_privacidade TEXT,
  mostrar_checkbox_consentimento BOOLEAN DEFAULT true,

  -- Integracao externa
  provedor_externo VARCHAR(50),
  -- Valores: 'mailchimp', 'sendgrid', 'mailerlite', 'convertkit', 'nenhum'
  id_lista_externa VARCHAR(100),
  ref_api_key_externa VARCHAR(100), -- Referencia ao secret, nao o valor

  -- Metadados
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indice
CREATE INDEX idx_config_newsletter_formularios ON config_newsletter_formularios(formulario_id);
```

### 9.6 Tabela: `etapas_formularios`

```sql
-- Migration: create_etapas_formularios_table
CREATE TABLE etapas_formularios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formulario_id UUID NOT NULL REFERENCES formularios(id) ON DELETE CASCADE,

  -- Identificacao da etapa
  indice_etapa INTEGER NOT NULL,
  titulo_etapa VARCHAR(255) NOT NULL,
  descricao_etapa TEXT,

  -- Icone da etapa
  icone_etapa VARCHAR(50),

  -- Validacao antes de avancar
  validar_ao_avancar BOOLEAN DEFAULT true,

  -- Botoes da etapa
  texto_botao_proximo VARCHAR(50) DEFAULT 'Proximo',
  texto_botao_anterior VARCHAR(50) DEFAULT 'Voltar',
  texto_botao_enviar VARCHAR(50) DEFAULT 'Enviar',

  -- Metadados
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(formulario_id, indice_etapa),
  CHECK (indice_etapa >= 0)
);

-- Indice
CREATE INDEX idx_etapas_formularios ON etapas_formularios(formulario_id, indice_etapa);
```

### 9.7 Tabela: `submissoes_formularios`

```sql
-- Migration: create_submissoes_formularios_table
CREATE TABLE submissoes_formularios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formulario_id UUID NOT NULL REFERENCES formularios(id) ON DELETE CASCADE,
  organizacao_id UUID NOT NULL,

  -- Dados da submissao
  dados_submissao JSONB NOT NULL,

  -- Rastreamento
  ip_address VARCHAR(45),
  user_agent TEXT,
  referrer TEXT,
  pagina_origem TEXT,

  -- UTM
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  utm_term VARCHAR(255),
  utm_content VARCHAR(255),

  -- Geolocalizacao
  geo_pais VARCHAR(100),
  geo_estado VARCHAR(100),
  geo_cidade VARCHAR(100),

  -- Lead gerado
  contato_id UUID REFERENCES contatos(id) ON DELETE SET NULL,
  oportunidade_id UUID REFERENCES oportunidades(id) ON DELETE SET NULL,

  -- Lead Scoring
  pontuacao_calculada INTEGER DEFAULT 0,

  -- Status
  status VARCHAR(20) DEFAULT 'recebida',
  -- Valores: 'recebida', 'processando', 'concluida', 'falhou', 'spam'

  -- WhatsApp (se aplicavel)
  whatsapp_redirecionado BOOLEAN DEFAULT false,
  whatsapp_url_redirecionamento TEXT,

  -- Validacao anti-spam
  captcha_verificado BOOLEAN DEFAULT false,
  honeypot_acionado BOOLEAN DEFAULT false,
  pontuacao_spam DECIMAL(3,2) DEFAULT 0,

  -- A/B Testing
  variante_ab_id UUID,

  -- Metadados
  submetido_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processado_em TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CHECK (status IN ('recebida', 'processando', 'concluida', 'falhou', 'spam'))
);

-- RLS
ALTER TABLE submissoes_formularios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON submissoes_formularios
  FOR ALL USING (organizacao_id = current_setting('app.current_tenant')::uuid);

-- Indices
CREATE INDEX idx_submissoes_formularios_formulario ON submissoes_formularios(formulario_id);
CREATE INDEX idx_submissoes_formularios_organizacao ON submissoes_formularios(organizacao_id);
CREATE INDEX idx_submissoes_formularios_status ON submissoes_formularios(status);
CREATE INDEX idx_submissoes_formularios_data ON submissoes_formularios(submetido_em);
CREATE INDEX idx_submissoes_formularios_contato ON submissoes_formularios(contato_id);
```

### 9.8 Tabela: `links_compartilhamento_formularios`

```sql
-- Migration: create_links_compartilhamento_formularios_table
CREATE TABLE links_compartilhamento_formularios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formulario_id UUID NOT NULL REFERENCES formularios(id) ON DELETE CASCADE,
  organizacao_id UUID NOT NULL,

  -- Tipo de compartilhamento
  tipo_compartilhamento VARCHAR(20) NOT NULL,
  -- Valores: 'link_direto', 'codigo_embed', 'qr_code'

  -- Identificador unico do link
  token_compartilhamento VARCHAR(64) NOT NULL UNIQUE,

  -- Configuracoes
  embed_largura VARCHAR(20) DEFAULT '100%',
  embed_altura VARCHAR(20) DEFAULT 'auto',
  embed_estilo VARCHAR(20) DEFAULT 'inline',
  -- Valores: 'inline', 'modal', 'sidebar'

  -- QR Code
  qr_code_url TEXT,
  qr_code_tamanho INTEGER DEFAULT 256,
  qr_code_cor_frente VARCHAR(20) DEFAULT '#000000',
  qr_code_cor_fundo VARCHAR(20) DEFAULT '#ffffff',

  -- Estatisticas
  contagem_visualizacoes INTEGER DEFAULT 0,
  contagem_submissoes INTEGER DEFAULT 0,

  -- Status
  ativo BOOLEAN DEFAULT true,
  expira_em TIMESTAMP WITH TIME ZONE,

  -- Metadados
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  criado_por UUID REFERENCES usuarios(id)
);

-- Indices
CREATE INDEX idx_links_compartilhamento_formulario ON links_compartilhamento_formularios(formulario_id);
CREATE INDEX idx_links_compartilhamento_token ON links_compartilhamento_formularios(token_compartilhamento);
CREATE INDEX idx_links_compartilhamento_ativo ON links_compartilhamento_formularios(ativo);
```

### 9.9 Tabela: `regras_condicionais_formularios`

```sql
-- Migration: create_regras_condicionais_formularios_table
-- AIDEV-NOTE: Logica condicional e funcionalidade core do HubSpot
CREATE TABLE regras_condicionais_formularios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formulario_id UUID NOT NULL REFERENCES formularios(id) ON DELETE CASCADE,

  -- Identificacao da regra
  nome_regra VARCHAR(100) NOT NULL,
  ordem_regra INTEGER NOT NULL DEFAULT 0,
  ativa BOOLEAN DEFAULT true,

  -- Tipo de acao
  tipo_acao VARCHAR(30) NOT NULL,
  -- Valores: 'mostrar_campo', 'ocultar_campo', 'mostrar_etapa', 'ocultar_etapa',
  --          'pular_para_etapa', 'redirecionar', 'definir_valor', 'tornar_obrigatorio'

  -- Alvo da acao
  campo_alvo_id UUID REFERENCES campos_formularios(id) ON DELETE CASCADE,
  indice_etapa_alvo INTEGER,
  url_redirecionamento_alvo TEXT,
  valor_alvo TEXT,

  -- Condicoes (JSONB para flexibilidade)
  condicoes JSONB NOT NULL DEFAULT '[]',
  -- Estrutura: [
  --   {
  --     "campo_id": "uuid",
  --     "operador": "igual|diferente|contem|nao_contem|maior_que|menor_que|vazio|nao_vazio",
  --     "valor": "valor_comparacao",
  --     "logica": "e|ou" (para proxima condicao)
  --   }
  -- ]

  -- Operador logico entre condicoes
  logica_condicoes VARCHAR(3) DEFAULT 'e',
  -- Valores: 'e', 'ou'

  -- Metadados
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices
CREATE INDEX idx_regras_condicionais_formulario ON regras_condicionais_formularios(formulario_id);
CREATE INDEX idx_regras_condicionais_campo_alvo ON regras_condicionais_formularios(campo_alvo_id);
CREATE INDEX idx_regras_condicionais_ativa ON regras_condicionais_formularios(formulario_id, ativa);
```

### 9.10 Tabela: `config_progressive_profiling_formularios`

```sql
-- Migration: create_config_progressive_profiling_formularios_table
-- AIDEV-NOTE: Progressive profiling reduz abandono em 20-30% segundo HubSpot
CREATE TABLE config_progressive_profiling_formularios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formulario_id UUID NOT NULL UNIQUE REFERENCES formularios(id) ON DELETE CASCADE,

  -- Configuracao geral
  ativo BOOLEAN DEFAULT false,

  -- Identificacao de visitante
  metodo_identificacao VARCHAR(30) DEFAULT 'email',
  -- Valores: 'email', 'cookie', 'email_e_cookie'
  nome_cookie VARCHAR(100) DEFAULT 'crm_visitor_id',
  dias_expiracao_cookie INTEGER DEFAULT 365,

  -- Comportamento
  ocultar_campos_conhecidos BOOLEAN DEFAULT true,
  mostrar_campos_alternativos BOOLEAN DEFAULT true,
  min_campos_exibir INTEGER DEFAULT 2,

  -- Campos prioritarios (ordem de exibicao para leads conhecidos)
  ordem_prioridade_campos JSONB DEFAULT '[]',
  -- Estrutura: ["campo_id_1", "campo_id_2", ...]

  -- Mensagem para leads conhecidos
  saudacao_lead_conhecido TEXT DEFAULT 'Ola, {{primeiro_nome}}! Complete suas informacoes:',

  -- Metadados
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indice
CREATE INDEX idx_config_progressive_profiling_formulario ON config_progressive_profiling_formularios(formulario_id);
```

### 9.11 Tabela: `testes_ab_formularios`

```sql
-- Migration: create_testes_ab_formularios_table
-- AIDEV-NOTE: RD Station Pro oferece A/B testing nativo
CREATE TABLE testes_ab_formularios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formulario_id UUID NOT NULL REFERENCES formularios(id) ON DELETE CASCADE,
  organizacao_id UUID NOT NULL,

  -- Configuracao do teste
  nome_teste VARCHAR(255) NOT NULL,
  descricao_teste TEXT,

  -- Status
  status VARCHAR(20) DEFAULT 'rascunho',
  -- Valores: 'rascunho', 'executando', 'pausado', 'concluido', 'cancelado'

  -- Duracao
  data_inicio TIMESTAMP WITH TIME ZONE,
  data_fim TIMESTAMP WITH TIME ZONE,
  auto_encerrar_significancia BOOLEAN DEFAULT true,
  limiar_significancia DECIMAL(3,2) DEFAULT 0.95, -- 95% de confianca

  -- Distribuicao de trafego
  metodo_divisao_trafego VARCHAR(20) DEFAULT 'igual',
  -- Valores: 'igual', 'customizado'

  -- Metrica de sucesso
  metrica_primaria VARCHAR(30) DEFAULT 'taxa_conversao',
  -- Valores: 'taxa_conversao', 'contagem_submissoes', 'tempo_medio_submissao'

  -- Resultado
  variante_vencedora_id UUID,
  confianca_vencedor DECIMAL(5,4),

  -- Metadados
  criado_por UUID REFERENCES usuarios(id),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  concluido_em TIMESTAMP WITH TIME ZONE
);

-- Indices
CREATE INDEX idx_testes_ab_formulario ON testes_ab_formularios(formulario_id);
CREATE INDEX idx_testes_ab_status ON testes_ab_formularios(status);
```

### 9.12 Tabela: `variantes_ab_formularios`

```sql
-- Migration: create_variantes_ab_formularios_table
CREATE TABLE variantes_ab_formularios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teste_ab_id UUID NOT NULL REFERENCES testes_ab_formularios(id) ON DELETE CASCADE,

  -- Identificacao
  nome_variante VARCHAR(100) NOT NULL, -- 'Controle', 'Variante A', etc.
  letra_variante CHAR(1) NOT NULL, -- 'A', 'B', 'C', etc.
  e_controle BOOLEAN DEFAULT false,

  -- Configuracao da variante (JSONB com diferencas)
  alteracoes JSONB NOT NULL DEFAULT '{}',
  -- Estrutura: {
  --   "campos": [{ "campo_id": "uuid", "alteracoes": { "rotulo": "novo", ... } }],
  --   "estilos": { "botao": { "cor_fundo": "#ff0000" } },
  --   "formulario": { "mensagem_sucesso": "Obrigado!" }
  -- }

  -- Distribuicao de trafego
  porcentagem_trafego INTEGER DEFAULT 50, -- 0-100

  -- Estatisticas
  contagem_visualizacoes INTEGER DEFAULT 0,
  contagem_submissoes INTEGER DEFAULT 0,
  taxa_conversao DECIMAL(5,4) DEFAULT 0, -- Calculado

  -- Metadados
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indice
CREATE INDEX idx_variantes_ab_teste ON variantes_ab_formularios(teste_ab_id);
```

### 9.13 Tabela: `webhooks_formularios`

```sql
-- Migration: create_webhooks_formularios_table
CREATE TABLE webhooks_formularios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formulario_id UUID NOT NULL REFERENCES formularios(id) ON DELETE CASCADE,
  organizacao_id UUID NOT NULL,

  -- Configuracao
  nome_webhook VARCHAR(100) NOT NULL,
  url_webhook TEXT NOT NULL,
  metodo_http VARCHAR(10) DEFAULT 'POST',
  -- Valores: 'POST', 'PUT', 'PATCH'

  -- Headers customizados
  headers_customizados JSONB DEFAULT '{}',
  -- Exemplo: {"Authorization": "Bearer xxx", "X-Custom": "value"}

  -- Payload
  formato_payload VARCHAR(20) DEFAULT 'json',
  -- Valores: 'json', 'form_urlencoded', 'xml'
  incluir_metadados BOOLEAN DEFAULT true,
  mapeamento_campos JSONB DEFAULT '{}',
  -- Exemplo: {"email_field": "contact_email", "nome": "full_name"}

  -- Trigger
  disparar_em VARCHAR(20) DEFAULT 'submissao',
  -- Valores: 'submissao', 'lead_qualificado', 'resposta_especifica'
  condicoes_disparo JSONB,

  -- Retry
  retry_ativo BOOLEAN DEFAULT true,
  max_tentativas INTEGER DEFAULT 3,
  atraso_retry_segundos INTEGER DEFAULT 60,

  -- Status
  ativo BOOLEAN DEFAULT true,
  ultimo_disparo_em TIMESTAMP WITH TIME ZONE,
  ultimo_status_code INTEGER,
  ultimo_erro TEXT,
  contagem_sucesso INTEGER DEFAULT 0,
  contagem_falha INTEGER DEFAULT 0,

  -- Metadados
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices
CREATE INDEX idx_webhooks_formulario ON webhooks_formularios(formulario_id);
CREATE INDEX idx_webhooks_ativo ON webhooks_formularios(formulario_id, ativo);
```

### 9.14 Tabela: `logs_webhooks_formularios`

```sql
-- Migration: create_logs_webhooks_formularios_table
CREATE TABLE logs_webhooks_formularios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks_formularios(id) ON DELETE CASCADE,
  submissao_id UUID REFERENCES submissoes_formularios(id) ON DELETE SET NULL,

  -- Request
  request_url TEXT NOT NULL,
  request_metodo VARCHAR(10),
  request_headers JSONB,
  request_body TEXT,

  -- Response
  response_status_code INTEGER,
  response_headers JSONB,
  response_body TEXT,
  response_tempo_ms INTEGER,

  -- Status
  status VARCHAR(20) DEFAULT 'pendente',
  -- Valores: 'pendente', 'sucesso', 'falhou', 'retry'
  contagem_retry INTEGER DEFAULT 0,
  mensagem_erro TEXT,

  -- Metadados
  disparado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  concluido_em TIMESTAMP WITH TIME ZONE
);

-- Indices
CREATE INDEX idx_logs_webhooks_webhook ON logs_webhooks_formularios(webhook_id);
CREATE INDEX idx_logs_webhooks_status ON logs_webhooks_formularios(status);
CREATE INDEX idx_logs_webhooks_data ON logs_webhooks_formularios(disparado_em);
```

### 9.15 Tabela: `eventos_analytics_formularios`

```sql
-- Migration: create_eventos_analytics_formularios_table
-- AIDEV-NOTE: Analytics granular para otimizacao de conversao
CREATE TABLE eventos_analytics_formularios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formulario_id UUID NOT NULL REFERENCES formularios(id) ON DELETE CASCADE,

  -- Identificacao do visitante
  visitor_id VARCHAR(64),
  session_id VARCHAR(64),

  -- Tipo de evento
  tipo_evento VARCHAR(30) NOT NULL,
  -- Valores: 'visualizacao', 'inicio', 'foco_campo', 'saida_campo',
  --          'erro_campo', 'etapa_concluida', 'submissao', 'abandono'

  -- Dados do evento
  dados_evento JSONB DEFAULT '{}',
  -- Exemplos:
  -- foco_campo: {"campo_id": "uuid", "chave_campo": "email"}
  -- erro_campo: {"campo_id": "uuid", "erro": "Email invalido"}
  -- abandono: {"ultimo_campo_id": "uuid", "tempo_gasto_segundos": 45}

  -- Tempo
  tempo_no_formulario_segundos INTEGER,
  tempo_no_campo_segundos INTEGER,

  -- Contexto
  url_pagina TEXT,
  referrer TEXT,
  tipo_dispositivo VARCHAR(20), -- 'desktop', 'mobile', 'tablet'
  navegador VARCHAR(50),

  -- A/B Testing
  variante_ab_id UUID REFERENCES variantes_ab_formularios(id),

  -- Metadados
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices
CREATE INDEX idx_eventos_analytics_formulario ON eventos_analytics_formularios(formulario_id);
CREATE INDEX idx_eventos_analytics_tipo ON eventos_analytics_formularios(tipo_evento);
CREATE INDEX idx_eventos_analytics_data ON eventos_analytics_formularios(criado_em);
CREATE INDEX idx_eventos_analytics_visitor ON eventos_analytics_formularios(visitor_id);

-- Particionamento por data (recomendado para alto volume)
-- CREATE TABLE eventos_analytics_formularios PARTITION BY RANGE (criado_em);
```

### 9.16 Tabela: `rate_limits_formularios`

```sql
-- Migration: create_rate_limits_formularios_table
CREATE TABLE rate_limits_formularios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formulario_id UUID NOT NULL REFERENCES formularios(id) ON DELETE CASCADE,
  ip_address VARCHAR(45) NOT NULL,

  -- Contagem
  contagem_submissoes INTEGER DEFAULT 1,
  primeira_submissao_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ultima_submissao_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Status
  bloqueado BOOLEAN DEFAULT false,
  bloqueado_ate TIMESTAMP WITH TIME ZONE,
  motivo_bloqueio VARCHAR(50),

  -- Constraints
  UNIQUE(formulario_id, ip_address)
);

-- Indices
CREATE INDEX idx_rate_limits_formulario_ip ON rate_limits_formularios(formulario_id, ip_address);
CREATE INDEX idx_rate_limits_bloqueado ON rate_limits_formularios(bloqueado);

-- Funcao para limpar registros antigos (executar via cron)
CREATE OR REPLACE FUNCTION limpar_rate_limits_formularios()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits_formularios
  WHERE ultima_submissao_em < NOW() - INTERVAL '1 hour'
    AND bloqueado = false;
END;
$$ LANGUAGE plpgsql;
```

---

## 10. Rotas da API

### 10.1 CRUD Principal - Formularios

| Rota | Metodo | Descricao | Permissao |
|------|--------|-----------|-----------|
| `/api/v1/formularios` | GET | Listar formularios do tenant | Admin, Member |
| `/api/v1/formularios/:id` | GET | Buscar formulario especifico | Admin, Member |
| `/api/v1/formularios` | POST | Criar formulario | Admin |
| `/api/v1/formularios/:id` | PUT | Atualizar formulario | Admin |
| `/api/v1/formularios/:id` | DELETE | Excluir formulario (soft delete) | Admin |
| `/api/v1/formularios/:id/publicar` | POST | Publicar formulario | Admin |
| `/api/v1/formularios/:id/despublicar` | POST | Despublicar formulario | Admin |
| `/api/v1/formularios/:id/duplicar` | POST | Duplicar formulario | Admin |

### 10.2 Campos

| Rota | Metodo | Descricao | Permissao |
|------|--------|-----------|-----------|
| `/api/v1/formularios/:id/campos` | GET | Listar campos | Admin, Member |
| `/api/v1/formularios/:id/campos` | POST | Adicionar campo | Admin |
| `/api/v1/formularios/:id/campos/:campoId` | PUT | Atualizar campo | Admin |
| `/api/v1/formularios/:id/campos/:campoId` | DELETE | Remover campo | Admin |
| `/api/v1/formularios/:id/campos/reordenar` | PUT | Reordenar campos | Admin |

### 10.3 Configuracoes

| Rota | Metodo | Descricao | Permissao |
|------|--------|-----------|-----------|
| `/api/v1/formularios/:id/estilos` | GET | Buscar estilos | Admin, Member |
| `/api/v1/formularios/:id/estilos` | PUT | Atualizar estilos | Admin |
| `/api/v1/formularios/:id/config-popup` | GET | Buscar config popup | Admin, Member |
| `/api/v1/formularios/:id/config-popup` | PUT | Atualizar config popup | Admin |
| `/api/v1/formularios/:id/config-newsletter` | GET | Buscar config newsletter | Admin, Member |
| `/api/v1/formularios/:id/config-newsletter` | PUT | Atualizar config newsletter | Admin |
| `/api/v1/formularios/:id/etapas` | GET | Listar etapas | Admin, Member |
| `/api/v1/formularios/:id/etapas` | PUT | Atualizar etapas (bulk) | Admin |

### 10.4 Submissao Publica

| Rota | Metodo | Descricao | Rate Limit |
|------|--------|-----------|------------|
| `/api/v1/publico/formularios/:slug` | GET | Buscar formulario para renderizacao | 60/min |
| `/api/v1/publico/formularios/:slug/submeter` | POST | Submeter formulario | 10/min |
| `/api/v1/publico/formularios/:slug/rastrear` | POST | Tracking de eventos | 100/min |

### 10.5 Compartilhamento

| Rota | Metodo | Descricao | Permissao |
|------|--------|-----------|-----------|
| `/api/v1/formularios/:id/compartilhar` | POST | Gerar link/embed/QR | Admin |
| `/api/v1/formularios/:id/links-compartilhamento` | GET | Listar links | Admin, Member |
| `/api/v1/formularios/:id/links-compartilhamento/:linkId` | DELETE | Revogar link | Admin |

### 10.6 Submissoes

| Rota | Metodo | Descricao | Permissao |
|------|--------|-----------|-----------|
| `/api/v1/formularios/:id/submissoes` | GET | Listar submissoes | Admin, Member |
| `/api/v1/formularios/:id/submissoes/:submissaoId` | GET | Buscar submissao | Admin, Member |
| `/api/v1/formularios/:id/submissoes/exportar` | POST | Exportar CSV | Admin |

### 10.7 Logica Condicional

| Rota | Metodo | Descricao | Permissao |
|------|--------|-----------|-----------|
| `/api/v1/formularios/:id/regras-condicionais` | GET | Listar regras | Admin, Member |
| `/api/v1/formularios/:id/regras-condicionais` | POST | Criar regra | Admin |
| `/api/v1/formularios/:id/regras-condicionais/:regraId` | PUT | Atualizar regra | Admin |
| `/api/v1/formularios/:id/regras-condicionais/:regraId` | DELETE | Excluir regra | Admin |
| `/api/v1/formularios/:id/regras-condicionais/reordenar` | PUT | Reordenar regras | Admin |

### 10.8 Progressive Profiling

| Rota | Metodo | Descricao | Permissao |
|------|--------|-----------|-----------|
| `/api/v1/formularios/:id/progressive-profiling` | GET | Buscar config | Admin, Member |
| `/api/v1/formularios/:id/progressive-profiling` | PUT | Atualizar config | Admin |

### 10.9 A/B Testing

| Rota | Metodo | Descricao | Permissao |
|------|--------|-----------|-----------|
| `/api/v1/formularios/:id/testes-ab` | GET | Listar testes | Admin, Member |
| `/api/v1/formularios/:id/testes-ab` | POST | Criar teste | Admin |
| `/api/v1/formularios/:id/testes-ab/:testeId` | GET | Buscar teste | Admin, Member |
| `/api/v1/formularios/:id/testes-ab/:testeId` | PUT | Atualizar teste | Admin |
| `/api/v1/formularios/:id/testes-ab/:testeId/iniciar` | POST | Iniciar teste | Admin |
| `/api/v1/formularios/:id/testes-ab/:testeId/pausar` | POST | Pausar teste | Admin |
| `/api/v1/formularios/:id/testes-ab/:testeId/concluir` | POST | Concluir teste | Admin |
| `/api/v1/formularios/:id/testes-ab/:testeId/resultados` | GET | Ver resultados | Admin, Member |
| `/api/v1/formularios/:id/testes-ab/:testeId/variantes` | GET | Listar variantes | Admin, Member |
| `/api/v1/formularios/:id/testes-ab/:testeId/variantes` | POST | Criar variante | Admin |
| `/api/v1/formularios/:id/testes-ab/:testeId/variantes/:varianteId` | PUT | Atualizar variante | Admin |
| `/api/v1/formularios/:id/testes-ab/:testeId/variantes/:varianteId` | DELETE | Excluir variante | Admin |

### 10.10 Webhooks

| Rota | Metodo | Descricao | Permissao |
|------|--------|-----------|-----------|
| `/api/v1/formularios/:id/webhooks` | GET | Listar webhooks | Admin, Member |
| `/api/v1/formularios/:id/webhooks` | POST | Criar webhook | Admin |
| `/api/v1/formularios/:id/webhooks/:webhookId` | PUT | Atualizar webhook | Admin |
| `/api/v1/formularios/:id/webhooks/:webhookId` | DELETE | Excluir webhook | Admin |
| `/api/v1/formularios/:id/webhooks/:webhookId/testar` | POST | Testar webhook | Admin |
| `/api/v1/formularios/:id/webhooks/:webhookId/logs` | GET | Ver logs | Admin, Member |

### 10.11 Analytics

| Rota | Metodo | Descricao | Permissao |
|------|--------|-----------|-----------|
| `/api/v1/formularios/:id/analytics` | GET | Metricas gerais | Admin, Member |
| `/api/v1/formularios/:id/analytics/funil` | GET | Funil de conversao | Admin, Member |
| `/api/v1/formularios/:id/analytics/desempenho-campos` | GET | Performance por campo | Admin, Member |
| `/api/v1/formularios/:id/analytics/abandono` | GET | Taxa de abandono | Admin, Member |
| `/api/v1/formularios/:id/analytics/conversao-por-origem` | GET | Conversao por UTM | Admin, Member |

---

## 11. Services

| Service | Responsabilidade |
|---------|------------------|
| `FormularioService` | Logica de negocio principal (CRUD) |
| `CampoFormularioService` | Gerenciamento de campos |
| `EstiloFormularioService` | Aplicacao de estilos |
| `SubmissaoFormularioService` | Processamento de submissoes |
| `CompartilhamentoFormularioService` | Geracao de links e QR codes |
| `CaptchaFormularioService` | Validacao de reCAPTCHA/hCaptcha |
| `WhatsAppFormularioService` | Integracao com WhatsApp |
| `LogicaCondicionalFormularioService` | Avaliar e aplicar regras condicionais |
| `ProgressiveProfilingFormularioService` | Identificar visitantes e personalizar |
| `PrefillFormularioService` | Pre-preencher campos |
| `TesteABFormularioService` | Gerenciar testes A/B e distribuir variantes |
| `WebhookFormularioService` | Disparar webhooks com retry e logging |
| `NotificacaoFormularioService` | Enviar notificacoes multi-canal |
| `AnalyticsFormularioService` | Processar e agregar dados de analytics |
| `LeadScoringFormularioService` | Calcular pontuacao do lead |

---

## 12. Metricas de Sucesso

### 12.1 KPIs Primarios

| Metrica | Baseline atual | Meta | Prazo |
|---------|----------------|------|-------|
| Taxa de conversao media | 2-3% | 5-8% | 3 meses |
| Taxa de abandono | 70% | 50% | 3 meses |
| Tempo medio de preenchimento | 90s | 60s | 3 meses |

### 12.2 KPIs Secundarios

- Numero de formularios criados por tenant/mes
- Numero de submissoes processadas/dia
- Taxa de sucesso de webhooks

### 12.3 Criterios de Lancamento

- [ ] Todas tabelas criadas com RLS
- [ ] Rotas principais funcionando (CRUD + submissao)
- [ ] Rate limiting e captcha implementados
- [ ] Integracao com pipeline funcionando
- [ ] Testes de carga aprovados (1000 submissoes/min)

---

## 13. Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|---------------|---------|-----------|
| Performance com muitos campos | Media | Alto | Paginacao e lazy loading |
| Spam em formularios publicos | Alta | Alto | Rate limit + captcha + honeypot |
| Falha de webhooks externos | Media | Medio | Retry com backoff exponencial |
| Complexidade da logica condicional | Media | Medio | Limite de 100 regras como HubSpot |
| Dados perdidos em submissao | Baixa | Alto | Transacao atomica + fallback |

---

## 14. Time to Value (TTV)

### 14.1 MVP (Minimo Viavel)

- Tabelas principais (formularios, campos, estilos, submissoes)
- CRUD de formularios com campos basicos
- Submissao publica com rate limit e captcha
- Integracao com pipeline (criar oportunidade)
- Compartilhamento via link direto

### 14.2 Fases de Entrega

| Fase | Escopo | Estimativa |
|------|--------|------------|
| MVP | Tabelas core + CRUD + submissao | Semana 1-2 |
| v1.1 | Popup, Newsletter, Multi-step | Semana 3-4 |
| v1.2 | Logica condicional + Progressive profiling | Semana 5-6 |
| v2.0 | A/B Testing + Webhooks + Analytics | Semana 7-8 |

---

## 15. Plano de Validacao

### 15.1 Validacao Pre-Desenvolvimento

- [x] Analise de mercado (HubSpot, RD Station)
- [x] Requisitos funcionais mapeados
- [x] Modelo de dados definido
- [ ] Revisao tecnica com equipe

### 15.2 Validacao Durante Desenvolvimento

- [ ] Testes unitarios dos services
- [ ] Testes de integracao das rotas
- [ ] Testes de seguranca (rate limit, captcha)
- [ ] Code review

### 15.3 Validacao Pos-Lancamento

- [ ] Metricas de adocao
- [ ] Feedback qualitativo
- [ ] Iteracao baseada em dados

---

## 16. Historico de Versoes

| Versao | Data | Autor | Mudancas |
|--------|------|-------|----------|
| v1.0 | 2026-02-09 | Arquiteto de Produto | Versao inicial consolidada com analise de mercado |

---

## Referencias

- [HubSpot Form Builder](https://knowledge.hubspot.com/forms/create-and-edit-forms)
- [HubSpot Conditional Logic](https://knowledge.hubspot.com/forms/customize-form-steps-with-conditional-logic)
- [RD Station Features](https://tldv.io/blog/rd-station-review/)
- [Progressive Profiling Best Practices](https://www.reform.app/blog/top-tools-for-progressive-profiling)
- [GDPR Compliant Forms](https://forms.app/en/blog/best-gdpr-compliant-form-builders)
- [Form Builder Features 2025](https://clearout.io/blog/form-builder-tools/)

---

**AIDEV-NOTE:** Este PRD e exclusivamente backend. Frontend sera tratado em PRD separado.
