# PRD: Programa de Parceiros (Partner Program)

| Campo | Valor |
|-------|-------|
| **Autor** | Carlos Andia |
| **Data de criacao** | 2026-02-22 |
| **Ultima atualizacao** | 2026-02-22 (v1.1 — gaps corrigidos) |
| **Versao** | v1.1 |
| **Status** | Aprovado — Em desenvolvimento |
| **Stakeholders** | Super Admin, Parceiros/Padrinhos, Financeiro |
| **Revisor tecnico** | Equipe CRMBeta |

---

## 1. Resumo Executivo

Estamos construindo um **Programa de Parceiros** nativo dentro do CRM Renove, onde admins de tenants existentes podem se tornar "padrinhos" de novas organizacoes que ingressam na plataforma via link ou codigo de indicacao unico. O parceiro recebe uma comissao mensal configuravel sobre o valor da assinatura de cada empresa que ele indicou, enquanto o plano estiver ativo.

O problema que resolve e duplo: para o negocio, cria um canal de aquisicao organico e de baixo custo (indicacoes geram maior taxa de conversao e retencao); para os parceiros, cria uma fonte de renda recorrente atrelada ao sucesso da plataforma. O programa inclui um mecanismo de gratuidade — o parceiro pode ter o proprio plano custeado caso cumpra metas configuradas pelo Super Admin.

O impacto esperado e crescimento de novas organizacoes via canal de indicacao, com MRR incremental e reducao do custo de aquisicao por cliente (CAC).

---

## 2. Contexto e Motivacao

### 2.1 Problema

Atualmente o CRM Renove nao possui mecanismo de indicacao estruturado. Admins que ja usam a plataforma e tem contato com outras empresas nao tem incentivo formal para indicar. Eventuais indicacoes sao perdidas porque nao existe rastreamento, gerando comissoes nao pagas e dados inconsistentes.

O Super Admin nao tem visibilidade sobre quem indicou quem, nem como calcular possiveis beneficios para os melhores indicadores.

### 2.2 Oportunidade de Mercado

Programas de referral SaaS B2B tem taxa de conversao 3–5x maior que leads de marketing pago. Plataformas como HubSpot, Pipedrive e Monday.com possuem programas de parceiros consolidados. A diferencao do CRM Renove e que o programa e totalmente configuravel pelo proprio Super Admin, sem dependencia de plataformas externas de afiliados.

### 2.3 Alinhamento Estrategico

- Aumenta MRR com custo de aquisicao zero (comissao so paga se org estiver ativa)
- Cria vinculo de longo prazo com parceiros (churn menor)
- Posiciona o CRM Renove como plataforma de ecossistema, nao apenas ferramenta

---

## 3. Usuarios e Personas

### 3.1 Persona Primaria — Super Admin

```
Nome: Carlos (Super Admin da plataforma)
Role: Administrador global do SaaS
Contexto: Precisa gerenciar o programa de indicacoes sem depender de planilhas externas
Dores:
- Nao sabe quem indicou qual empresa
- Nao tem como calcular comissoes automaticamente
- Nao tem visibilidade do desempenho dos melhores parceiros
Objetivos:
- Configurar regras do programa uma vez e deixar rodar
- Visualizar rapidamente parceiros, indicados e comissoes
- Aplicar gratuidade para quem cumpre metas
Citacao: "Preciso saber quanto devo para cada parceiro no fechamento do mes."
```

### 3.2 Persona Secundaria — Parceiro/Padrinho

```
Nome: Rafael (Admin de um tenant ativo)
Role: Admin de uma empresa que usa o CRM Renove
Contexto: Tem contato com outras empresas do mesmo segmento
Dores:
- Nao tem incentivo formal para indicar
- Nao sabe se sua indicacao foi registrada
- Nao consegue acompanhar o que ganhou
Objetivos:
- Ter um link unico para compartilhar
- Ver quais empresas indicadas estao ativas
- Saber quando recebera comissao
Citacao: "Se eu vou indicar amigos, quero saber que vou receber por isso."
```

### 3.3 Anti-personas

- **Visitante anonimo:** Nao tem acesso ao programa — parceiro e sempre um usuario cadastrado
- **Member (operador):** Nao tem permissao de gerenciar parceiros — e funcao do Admin e Super Admin
- **Empresa sem assinatura ativa:** Nao gera comissao — comissao so existe sobre assinatura paga ativa

---

## 4. Hierarquia de Requisitos

### 4.1 Theme

> Transformar o CRM Renove em uma plataforma de ecossistema, onde clientes satisfeitos se tornam canal de crescimento orgânico.

### 4.2 Epic

> Programa de Parceiros configuravel pelo Super Admin com rastreamento de indicacoes, calculo de comissoes e metas de gratuidade.

### 4.3 Features e User Stories

---

**Feature 1: Cadastro e gestao de parceiros**

Como Super Admin,
Quero cadastrar um admin de tenant como parceiro do programa,
Para que ele receba um codigo unico de indicacao e passe a ter comissoes rastreadas.

Criterios de Aceitacao:
- [ ] Super Admin acessa /admin/parceiros e ve lista de parceiros
- [ ] Botao "Novo Parceiro" abre modal com select de organizacao + campo opcional de % comissao
- [ ] Ao salvar, sistema gera codigo unico no formato RENOVE-XXXXXX
- [ ] Parceiro aparece na lista com status "ativo"
- [ ] Nao e possivel cadastrar a mesma organizacao como parceira duas vezes

**Prioridade:** Must-have

---

**Feature 2: Rastreamento de indicacoes**

Como Super Admin,
Quero registrar que uma nova organizacao foi indicada por um parceiro,
Para que a relacao padrinho → empresa seja rastreada e gere comissao futura.

Criterios de Aceitacao:
- [ ] Campo "Codigo do Parceiro" aparece no wizard de criacao de nova organizacao (Step 1)
- [ ] Campo valida o codigo em tempo real (debounce 600ms) e exibe nome da empresa parceira
- [ ] Se codigo invalido ou inativo, exibe erro inline e nao bloqueia o fluxo
- [ ] Ao criar a org com codigo valido, grava registro em indicacoes_parceiro automaticamente
- [ ] Org aparece na tab "Indicados" do detalhe do parceiro

**Prioridade:** Must-have

---

**Feature 3: Calculo e registro de comissoes**

Como Super Admin,
Quero gerar o registro de comissoes mensais de cada parceiro,
Para que o controle financeiro seja rastreavel e historico.

Criterios de Aceitacao:
- [ ] Super Admin pode acionar "Gerar Comissoes" para um mes/ano especifico
- [ ] Sistema calcula: valor_assinatura × percentual_snapshot = valor_comissao
- [ ] Operacao e idempotente (gerar duas vezes no mesmo mes nao duplica)
- [ ] Super Admin pode marcar comissao como "pago"
- [ ] Historico de comissoes e visivel na tab "Comissoes" do detalhe do parceiro

**Prioridade:** Must-have

---

**Feature 4: Configuracao do programa**

Como Super Admin,
Quero configurar as regras globais do programa de parceiros,
Para que percentuais e metas de gratuidade sejam controlados por mim sem mexer em codigo.

Criterios de Aceitacao:
- [ ] Aba "Programa de Parceiros" em /admin/configuracoes
- [ ] Campo "% Comissao Padrao" configuravel (0–100%)
- [ ] Toggle para ativar/desativar programa de gratuidade
- [ ] Campos de meta: contas iniciais, periodo de renovacao (meses), meta de renovacao, dias de carencia
- [ ] Salvar exibe toast de confirmacao
- [ ] Configuracao e refletida imediatamente nos calculos de status de meta

**Prioridade:** Must-have

---

**Feature 5: Meta de gratuidade e status do parceiro**

Como Super Admin,
Quero ver se um parceiro cumpriu as metas do programa de gratuidade,
Para que eu possa aplicar o beneficio manualmente de forma informada.

Criterios de Aceitacao:
- [ ] Card de status da meta exibe: indicados atuais, meta, barra de progresso, % de conclusao
- [ ] Badge na lista de parceiros: "Cumprindo" (verde) ou "Em risco" (ambar)
- [ ] Botao "Aplicar Gratuidade" ativo apenas quando parceiro cumpriu a meta
- [ ] Super Admin define ate quando a gratuidade e valida (data ou indefinida)
- [ ] Status e recalculado a cada acesso (sem cache)

**Prioridade:** Should-have

---

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Criterio de Aceitacao |
|----|-----------|------------|----------------------|
| RF-001 | Sistema deve permitir cadastrar um admin de tenant como parceiro | Must | Modal funcional com geracao de codigo unico |
| RF-002 | Cada parceiro deve ter um codigo de indicacao unico | Must | Formato RENOVE-XXXXXX, UNIQUE no banco |
| RF-003 | Campo de codigo de parceiro no wizard de criacao de org | Must | Campo no Step1Empresa com validacao debounce |
| RF-004 | Indicacao deve ser gravada automaticamente ao criar org | Must | Registro em indicacoes_parceiro criado no submit |
| RF-005 | Comissao pode ser gerada manualmente por mes/ano | Must | Funcao idempotente, INSERT ON CONFLICT DO NOTHING |
| RF-006 | Percentual de comissao configuravel por programa, por parceiro e por indicacao | Must | Hierarquia: snapshot > individual > padrao |
| RF-007 | Super Admin pode marcar comissao como paga | Must | Campo status em comissoes_parceiro atualizado |
| RF-008 | Super Admin pode suspender ou reativar parceiro | Must | Status do parceiro atualizado, indicacoes nao geram comissao se suspenso |
| RF-009 | Configuracao global do programa via painel | Must | Aba em ConfiguracoesGlobaisPage |
| RF-010 | Meta de gratuidade calculada e exibida visualmente | Should | Card com barra de progresso no detalhe do parceiro |
| RF-011 | Super Admin pode aplicar gratuidade manualmente | Should | Botao ativo apos meta cumprida, define data de validade |
| RF-012 | Percentual individual por organizacao indicada | Could | Campo na tab Indicados do parceiro |

---

## 6. Requisitos Nao-Funcionais

### 6.1 Performance
- Listagem de parceiros deve responder em menos de 500ms para ate 500 registros
- Validacao de codigo de parceiro em tempo real: resposta em menos de 300ms

### 6.2 Seguranca
- Todas as tabelas do programa protegidas por RLS: apenas `super_admin` acessa
- Codigo de indicacao nao expoe dados do parceiro (e um token opaco)
- Operacoes financeiras (marcar como pago, aplicar gratuidade) requerem role `super_admin`
- Conformidade com LGPD: dados de parceiros vinculados a usuario ja consentido

### 6.3 Usabilidade
- Lista de parceiros deve seguir o mesmo layout de OrganizacoesPage (zero curva de aprendizado)
- Campo de codigo no wizard nao bloqueia o fluxo se codigo invalido (apenas avisa)
- Barra de progresso de meta deve ser intuitiva sem necessidade de leitura de documentacao
- Mobile: cards empilhados na lista, tabs no detalhe

### 6.4 Sistema
- Stack exclusiva do projeto: React 18, TypeScript, Vite, TailwindCSS, shadcn/ui, TanStack Query, Zod, Supabase
- Sem dependencias externas novas (graficos via HTML/Tailwind customizado, mesmo padrao existente)
- Compativel com navegadores modernos (Chrome 90+, Firefox 88+, Safari 14+)

---

## 7. Escopo

### 7.1 O que ESTA no escopo (MVP)

- Cadastro e gestao de parceiros pelo Super Admin
- Geracao de codigo unico de indicacao
- Campo de codigo no wizard de criacao de organizacao
- Rastreamento de indicacoes (indicacoes_parceiro)
- Geracao manual de comissoes mensais
- Configuracao global do programa (% padrao, regras de gratuidade)
- Status visual da meta de gratuidade com barra de progresso
- Aplicacao manual de gratuidade pelo Super Admin
- Suspensao/reativacao de parceiros

### 7.2 O que NAO esta no escopo

- **Painel do parceiro no /app:** V2 — adiciona logica de role e rotas separadas; o parceiro ve os dados pelo Super Admin por ora
- **Geracao automatica de comissoes (cron/trigger):** V2 — requer job scheduler (Supabase pg_cron ou servico externo)
- **Pagamento automatico ao parceiro via Stripe/Pix:** V2 — integracao financeira complexa; MVP e controle manual
- **Multi-nivel (parceiro que indica parceiro):** Fora de escopo permanente no MVP — complexidade exponencial sem uso comprovado
- **Notificacoes automaticas por email ao parceiro:** V2 — usa SMTP global existente, mas nao e critico para rastreamento
- **Export CSV de comissoes:** V2 — trivial de adicionar apos historico existir
- **Link publico de indicacao com tracking (UTM automatico):** V2 — cadastro via link exige landing page dedicada

### 7.3 Escopo futuro (backlog)

- Painel do parceiro: tab "Meu Programa" no /app com indicados, comissoes e link pessoal
- Geracao automatica de comissoes no dia X de cada mes
- Pagamento integrado via Stripe Connect ou geracao de nota fiscal
- Dashboard analytics com serie temporal de indicacoes e comissoes (Recharts)
- Ranking de parceiros no Super Admin
- Notificacao por email quando comissao e gerada

---

## 8. Suposicoes, Dependencias e Restricoes

### 8.1 Suposicoes

- Todo parceiro e obrigatoriamente um admin de tenant ja existente no sistema
- O Super Admin sempre gera comissoes manualmente no fechamento mensal
- O codigo de indicacao e inserido manualmente pelo Super Admin no wizard (nao via link publico no MVP)
- Um unico parceiro pode ser padrinho de N organizacoes; uma organizacao tem no maximo 1 padrinho

### 8.2 Dependencias

| Dependencia | Responsavel | Status | Risco |
|-------------|-------------|--------|-------|
| Tabela organizacoes_saas | Banco existente (PRD-14) | Confirmado | Baixo |
| Tabela usuarios com role admin | Banco existente (PRD-02) | Confirmado | Baixo |
| Tabela assinaturas (valor mensal) | Banco existente | Confirmado | Medio — verificar campo de valor |
| AdminLayout.tsx (menu) | Frontend existente | Confirmado | Baixo |
| NovaOrganizacaoModal / Step1Empresa | Frontend existente | Confirmado | Baixo |
| ConfiguracoesGlobaisPage | Frontend existente | Confirmado | Baixo |

### 8.3 Restricoes

- **Tecnicas:** Stack imutavel — sem Prisma, GraphQL, tRPC ou libs nao listadas no CLAUDE.md
- **Arquiteturais:** Todas as tabelas novas com RLS; sem remocao de tenant_id; nomenclatura PT-BR no banco
- **Seguranca:** Nenhum dado financeiro hardcoded; percentuais sempre via configuracao

---

## 9. Design e UX

### 9.1 Fluxo Principal — Super Admin cria parceiro e registra indicacao

```
1. Super Admin acessa /admin/parceiros
2. Clica em "Novo Parceiro"
3. Modal: seleciona organizacao (search) + define % comissao (opcional)
4. Salva → codigo RENOVE-XXXXXX gerado e exibido
5. Super Admin copia o codigo e repassa ao parceiro
─────────────────────────────────────────────
6. Super Admin cria nova organizacao (/admin/organizacoes → Novo)
7. Step 1 do wizard: preenche dados + insere codigo do parceiro
8. Campo valida codigo em tempo real → badge verde com nome do parceiro
9. Conclui wizard → indicacao gravada automaticamente
─────────────────────────────────────────────
10. Mes seguinte: Super Admin acessa /admin/parceiros/:id
11. Tab "Comissoes" → clica "Gerar Comissoes"
12. Seleciona mes/ano → confirma → comissoes inseridas
13. Super Admin efetua pagamento externo → marca comissao como "Pago"
```

### 9.2 Fluxo de Meta de Gratuidade

```
1. Super Admin configura programa: meta_inicial = 2 indicados ativos
2. Parceiro tem 2 indicados ativos → barra de progresso 100%
3. Badge na lista: "Cumprindo ✓" (verde)
4. Super Admin acessa detalhe → card de meta exibe botao "Aplicar Gratuidade"
5. Super Admin define data de validade (ou indefinida) → confirma
6. Gratuidade registrada → parceiro nao paga o proximo ciclo (acao manual na assinatura)
```

### 9.3 Consideracoes de UX

- Lista de parceiros segue EXATAMENTE o layout de OrganizacoesPage (tabela + toolbar + filtros) — zero curva de aprendizado para o Super Admin
- Campo de codigo no wizard e opcional e nao bloqueia o fluxo principal
- Barra de progresso da meta usa a mesma paleta semantica do Design System (success, warning)
- Graficos sao barras HTML/Tailwind (padrao existente no projeto) — sem Recharts no MVP
- Mobile: lista em cards, detalhe em tabs com scroll horizontal

---

## 10. Metricas de Sucesso

### 10.1 KPIs Primarios

| Metrica | Baseline | Meta (3 meses) | Prazo |
|---------|----------|----------------|-------|
| Novos tenants via indicacao | 0 | 10% do total de novos tenants | 3 meses |
| Parceiros ativos cadastrados | 0 | 5 parceiros | 1 mes |
| MRR incremental via canal partner | 0 | +R$ 500/mes | 3 meses |

### 10.2 KPIs Secundarios

- Taxa de ativacao do parceiro: % de parceiros que tem ao menos 1 indicacao ativa em 30 dias
- Retencao de orgs indicadas vs media geral (hipotese: orgs indicadas churnaram menos)
- Tempo medio entre cadastro do parceiro e primeira indicacao

### 10.3 Criterios de Lancamento

- [ ] 4 tabelas criadas no banco com RLS ativa e testada
- [ ] Super Admin consegue cadastrar parceiro, registrar indicacao e gerar comissao em fluxo end-to-end
- [ ] Campo de codigo no wizard funciona sem bloquear criacao de org sem codigo
- [ ] Configuracao do programa salva e reflete nos calculos de status

---

## 11. Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|---------------|---------|-----------|
| Colisao de codigo de indicacao | Baixa | Medio | Geracao com retry (max 3 tentativas) + UNIQUE constraint no banco |
| Comissao gerada com valor errado | Media | Alto | Snapshot do percentual gravado no momento da indicacao (imutavel) |
| Parceiro suspenso continua gerando comissao | Media | Alto | Verificar status do parceiro antes de gerar comissao |
| Org indicada cancela e comissao continua sendo gerada | Media | Medio | Status da indicacao vinculado ao status da org; suspender indicacao ao cancelar org |
| Super Admin esquece de gerar comissoes mensais | Alta | Medio | V2: geracao automatica; MVP: lembrete visual na dashboard do SA |
| Conflito de codigo de parceiro no wizard (digitado errado) | Alta | Baixo | Campo nao bloqueia fluxo; apenas avisa com badge visual |

---

## 12. Time to Value

### 12.1 MVP

O minimo que resolve o problema core:
- Cadastro de parceiros com codigo unico
- Campo de codigo no wizard + rastreamento de indicacoes
- Geracao manual de comissoes
- Configuracao basica do programa (% padrao)

### 12.2 Fases de Entrega

| Fase | Escopo | Complexidade |
|------|--------|-------------|
| MVP (este PRD) | Banco + CRUD parceiros + indicacoes + comissoes manuais + config | Alta |
| V1.1 | Meta de gratuidade avancada + export CSV | Media |
| V2.0 | Painel do parceiro no /app + geracao automatica de comissoes | Alta |

---

## 13. Plano de Validacao

### 13.1 Pre-Desenvolvimento
- [x] Exploracao do codebase realizada (arquitetura, tabelas, padroes)
- [x] PRD revisado pelo desenvolvedor principal
- [x] Plano tecnico aprovado

### 13.2 Durante Desenvolvimento
- [ ] Review de migration antes de aplicar no banco
- [ ] Teste do fluxo end-to-end em ambiente de desenvolvimento
- [ ] Validacao de idempotencia na geracao de comissoes

### 13.3 Pos-Lancamento
- [ ] Acompanhar primeiros 5 parceiros cadastrados
- [ ] Verificar se indicacoes estao sendo gravadas corretamente
- [ ] Confirmar calculo de comissoes bate com expectativa do SA

---

## 14. Historico de Versoes

| Versao | Data | Autor | Mudancas |
|--------|------|-------|----------|
| v1.0 | 2026-02-22 | Carlos Andia | Versao inicial |
| v1.1 | 2026-02-22 | Carlos Andia + Claude | 7 gaps corrigidos: query JOIN assinaturas→planos em gerarComissoesMes, aba Parceiros em ConfigGlobal usa hook separado, STEPS + onSubmit em NovaOrganizacaoModal, queries admin e orgs disponiveis em NovoParceirModal, CriarOrganizacaoPayload atualizada, sincronizacao de indicacoes ao suspender/reativar org, Etapa 10B adicionada |

---

---

# ESPECIFICACAO TECNICA DE IMPLEMENTACAO

> Esta secao e o COMO. Separada do PRD (que e o O QUE) e destinada exclusivamente ao time de engenharia.
> Organizada em etapas sequenciais com prompts prontos para uso com IA.

---

## Contexto Tecnico

### Stack
- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui + TanStack Query + React Hook Form + Zod
- **Backend:** Supabase (queries diretas no service layer do frontend, sem Express para este modulo)
- **Banco:** PostgreSQL (Supabase) com RLS
- **Graficos:** HTML/Tailwind customizado (sem Recharts no MVP)
- **Notificacoes:** Sonner (`toast.success`, `toast.error`)

### Arquivos de Referencia Obrigatoria (ler antes de codar)
- `src/modules/admin/pages/OrganizacoesPage.tsx` — template de lista
- `src/modules/admin/pages/OrganizacaoDetalhesPage.tsx` — template de detalhe com tabs
- `src/modules/admin/services/admin.api.ts` — padrao de service layer
- `src/modules/admin/hooks/useOrganizacoes.ts` — padrao de hooks React Query
- `src/modules/admin/schemas/organizacao.schema.ts` — padrao de schemas Zod
- `src/modules/admin/layouts/AdminLayout.tsx` — menu e titulo de pagina
- `src/modules/admin/components/wizard/Step1Empresa.tsx` — campo a ser adicionado

### O que NAO fazer (regras absolutas)
- **NAO criar tipos manualmente** — sempre `z.infer<typeof Schema>`
- **NAO usar `any`** — sempre `unknown` + refinamento ou schema Zod
- **NAO hardcodar percentuais** — sempre vir da config ou do banco
- **NAO duplicar logica de suspensao de org** — reaproveitar funcoes existentes em admin.api.ts
- **NAO alterar arquivos de teste**
- **NAO criar rotas Express** para este modulo — usar Supabase direto no service layer
- **NAO usar Recharts** — graficos sao barras HTML/Tailwind no padrao do projeto
- **NAO criar tabelas sem RLS** — toda tabela nova deve ter policy de super_admin
- **NAO remover campo `organizacao_id`** de nenhuma operacao existente
- **NAO criar paginas separadas para configuracao** — adicionar como aba em ConfiguracoesGlobaisPage

---

## ETAPA 1 — Banco de Dados (Migrations)

### Objetivo
Criar as 4 tabelas do programa de parceiros, adicionar colunas nas tabelas existentes e configurar RLS.

### Prompt para implementacao

```
Preciso criar as migrations do Programa de Parceiros no CRMBeta (Supabase PostgreSQL).

CONTEXTO:
- Banco usa convencao PT-BR snake_case sem acento
- Toda tabela nova precisa de RLS com policy apenas para super_admin
- A funcao que identifica super_admin e: is_super_admin_v2() (ja existe no banco)
- Indices compostos obrigatorios por padrao do projeto
- Campos obrigatorios: criado_em TIMESTAMPTZ DEFAULT now(), atualizado_em TIMESTAMPTZ DEFAULT now()
- Soft delete onde aplicavel: deletado_em TIMESTAMPTZ

TABELAS A CRIAR:

1. config_programa_parceiros (registro unico da plataforma):
   - id UUID PK DEFAULT gen_random_uuid()
   - percentual_padrao NUMERIC(5,2) NOT NULL DEFAULT 10.00
   - regras_gratuidade JSONB NOT NULL DEFAULT '{"ativo": false}'
     (estrutura esperada: { ativo: bool, meta_inicial_indicados: int, renovacao_periodo_meses: int, renovacao_meta_indicados: int, carencia_dias: int })
   - base_url_indicacao TEXT DEFAULT 'https://app.renovedigital.com.br/cadastro'
   - observacoes TEXT
   - atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
   - atualizado_por UUID REFERENCES usuarios(id)

2. parceiros:
   - id UUID PK DEFAULT gen_random_uuid()
   - usuario_id UUID NOT NULL REFERENCES usuarios(id) UNIQUE
   - organizacao_id UUID NOT NULL REFERENCES organizacoes_saas(id) UNIQUE
   - codigo_indicacao VARCHAR(20) NOT NULL UNIQUE
   - status VARCHAR(20) NOT NULL DEFAULT 'ativo' CHECK IN ('ativo','suspenso','inativo')
   - percentual_comissao NUMERIC(5,2) -- NULL = usa padrao da config global
   - aderiu_em TIMESTAMPTZ NOT NULL DEFAULT now()
   - suspenso_em TIMESTAMPTZ
   - motivo_suspensao TEXT
   - gratuidade_aplicada_em TIMESTAMPTZ
   - gratuidade_valida_ate TIMESTAMPTZ
   - criado_em, atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
   - Indices: idx_parceiros_codigo ON (codigo_indicacao), idx_parceiros_status ON (status)

3. indicacoes_parceiro:
   - id UUID PK DEFAULT gen_random_uuid()
   - parceiro_id UUID NOT NULL REFERENCES parceiros(id)
   - organizacao_id UUID NOT NULL REFERENCES organizacoes_saas(id) UNIQUE (1 padrinho por org)
   - percentual_comissao_snapshot NUMERIC(5,2) NOT NULL (imutavel, gravado no momento da indicacao)
   - origem VARCHAR(30) NOT NULL DEFAULT 'codigo_manual' CHECK IN ('link','codigo_manual','pre_cadastro')
   - status VARCHAR(20) NOT NULL DEFAULT 'ativa' CHECK IN ('ativa','inativa','cancelada')
   - criado_em, atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
   - Indices: idx_indicacoes_parceiro ON (parceiro_id, status), idx_indicacoes_org ON (organizacao_id)

4. comissoes_parceiro:
   - id UUID PK DEFAULT gen_random_uuid()
   - parceiro_id UUID NOT NULL REFERENCES parceiros(id)
   - indicacao_id UUID NOT NULL REFERENCES indicacoes_parceiro(id)
   - periodo_mes INTEGER NOT NULL CHECK (periodo_mes BETWEEN 1 AND 12)
   - periodo_ano INTEGER NOT NULL
   - valor_assinatura NUMERIC(10,2) NOT NULL
   - percentual_aplicado NUMERIC(5,2) NOT NULL
   - valor_comissao NUMERIC(10,2) NOT NULL (valor_assinatura * percentual / 100)
   - status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK IN ('pendente','pago','cancelado')
   - pago_em TIMESTAMPTZ
   - observacoes TEXT
   - criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
   - UNIQUE(indicacao_id, periodo_mes, periodo_ano) para idempotencia
   - Indices: idx_comissoes_parceiro ON (parceiro_id, periodo_ano, periodo_mes), idx_comissoes_status ON (status)

COLUNAS A ADICIONAR EM TABELAS EXISTENTES:
- organizacoes_saas: ADD COLUMN codigo_parceiro_origem VARCHAR(20)
- pre_cadastros_saas: ADD COLUMN codigo_parceiro VARCHAR(20)

RLS PARA TODAS AS 4 TABELAS NOVAS:
- ENABLE ROW LEVEL SECURITY
- CREATE POLICY "super_admin_[tabela]" ON [tabela] USING (is_super_admin_v2())
- INSERT em config_programa_parceiros do registro inicial com valores default

Gere a migration completa em um unico arquivo SQL.
```

### Input esperado
- Supabase com funcao `is_super_admin_v2()` ja existente
- Tabelas `usuarios`, `organizacoes_saas`, `pre_cadastros_saas` ja existentes

### Output esperado
- 1 arquivo de migration em `supabase/migrations/` com timestamp atual
- 4 tabelas criadas com RLS ativa
- 2 colunas adicionadas em tabelas existentes
- 1 registro inicial inserido em `config_programa_parceiros`

### Verificacao
```sql
-- Verificar tabelas criadas
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('parceiros','indicacoes_parceiro','comissoes_parceiro','config_programa_parceiros');

-- Verificar RLS ativa
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename IN ('parceiros','indicacoes_parceiro','comissoes_parceiro','config_programa_parceiros');

-- Verificar colunas adicionadas
SELECT column_name FROM information_schema.columns
WHERE table_name = 'organizacoes_saas' AND column_name = 'codigo_parceiro_origem';
```

---

## ETAPA 2 — Schemas Zod e Types

### Objetivo
Criar os schemas Zod do modulo de parceiros. Todos os tipos devem ser derivados de `z.infer`.

### Prompt para implementacao

```
Preciso criar o arquivo de schemas Zod para o modulo de parceiros do CRMBeta.

CONTEXTO:
- Arquivo: src/modules/admin/schemas/parceiro.schema.ts
- Padrao do projeto: NUNCA criar tipos manuais, sempre z.infer<typeof Schema>
- Referencia de padrao: src/modules/admin/schemas/organizacao.schema.ts

SCHEMAS NECESSARIOS:

1. ParceiroSchema (entidade completa do banco):
   - id: z.string().uuid()
   - usuario_id: z.string().uuid()
   - organizacao_id: z.string().uuid()
   - codigo_indicacao: z.string()
   - status: z.enum(['ativo','suspenso','inativo'])
   - percentual_comissao: z.number().min(0).max(100).nullable()
   - aderiu_em: z.string().datetime()
   - suspenso_em: z.string().datetime().nullable()
   - motivo_suspensao: z.string().nullable()
   - gratuidade_aplicada_em: z.string().datetime().nullable()
   - gratuidade_valida_ate: z.string().datetime().nullable()
   - criado_em: z.string().datetime()
   - atualizado_em: z.string().datetime()
   Joins opcionais:
   - organizacao: z.object({ nome, email_contato, plano, status }).optional()
   - usuario: z.object({ nome, sobrenome: z.string().nullable(), email }).optional()
   - total_indicados_ativos: z.number().optional()
   - total_comissoes_geradas: z.number().optional()

2. IndicacaoParceiroSchema:
   - id, parceiro_id, organizacao_id: z.string().uuid()
   - percentual_comissao_snapshot: z.number()
   - origem: z.enum(['link','codigo_manual','pre_cadastro'])
   - status: z.enum(['ativa','inativa','cancelada'])
   - criado_em, atualizado_em: z.string().datetime()
   Join opcional:
   - organizacao: z.object({ nome, plano, status, criado_em }).optional()

3. ComissaoParceiroSchema:
   - id, parceiro_id, indicacao_id: z.string().uuid()
   - periodo_mes: z.number().int().min(1).max(12)
   - periodo_ano: z.number().int()
   - valor_assinatura, percentual_aplicado, valor_comissao: z.number()
   - status: z.enum(['pendente','pago','cancelado'])
   - pago_em: z.string().datetime().nullable()
   - observacoes: z.string().nullable()
   - criado_em: z.string().datetime()

4. ConfigProgramaParceiroSchema (configuracao global):
   - id: z.string().uuid()
   - percentual_padrao: z.number().min(0).max(100)
   - regras_gratuidade: z.object({
       ativo: z.boolean(),
       meta_inicial_indicados: z.number().int().positive().optional(),
       renovacao_periodo_meses: z.number().int().positive().optional(),
       renovacao_meta_indicados: z.number().int().positive().optional(),
       carencia_dias: z.number().int().positive().optional(),
     })
   - base_url_indicacao: z.string().url().nullable()
   - observacoes: z.string().nullable()

5. CriarParceiroSchema (input do modal):
   - organizacao_id: z.string().uuid('Selecione uma organizacao')
   - usuario_id: z.string().uuid()
   - percentual_comissao: z.number().min(0).max(100).nullable().optional()

6. AtualizarParceiroSchema (input de edicao):
   - status: z.enum(['ativo','suspenso','inativo']).optional()
   - percentual_comissao: z.number().min(0).max(100).nullable().optional()
   - motivo_suspensao: z.string().optional()

7. AtualizarConfigProgramaSchema (input da aba de configuracao):
   - Todos os campos de ConfigProgramaParceiroSchema exceto id

8. GerarComissoesSchema (input do modal de geracao):
   - periodo_mes: z.number().int().min(1).max(12)
   - periodo_ano: z.number().int().min(2020)
   - parceiro_id: z.string().uuid().optional() (opcional: se vazio gera para todos)

9. AplicarGratuidadeSchema:
   - parceiro_id: z.string().uuid()
   - gratuidade_valida_ate: z.string().datetime().nullable() (null = indefinida)

Exportar todos os schemas e seus tipos inferidos.
Adicionar comentario AIDEV-NOTE em cada schema indicando que tipos sao derivados via z.infer.
```

### Output esperado
- `src/modules/admin/schemas/parceiro.schema.ts` com 9 schemas e tipos derivados

---

## ETAPA 3 — Service Layer (parceiros.api.ts)

### Objetivo
Criar o arquivo de servicos com todas as funcoes de acesso ao banco via Supabase client.

### Prompt para implementacao

```
Preciso criar o service layer do modulo de parceiros do CRMBeta.

CONTEXTO:
- Arquivo: src/modules/admin/services/parceiros.api.ts
- Padrao de referencia: src/modules/admin/services/admin.api.ts
- Client Supabase: importar de '@/lib/supabase' (padrao do projeto)
- Schemas: importar de '../schemas/parceiro.schema' (criado na Etapa 2)
- Nao criar rotas Express — queries Supabase direto
- Erros: lançar erro com mensagem em PT-BR descritiva

FUNCOES NECESSARIAS:

--- PARCEIROS ---

async function listarParceiros(params?: {
  busca?: string
  status?: 'ativo' | 'suspenso' | 'inativo'
  page?: number
  limit?: number
}): Promise<{ parceiros: Parceiro[]; total: number }>
// Query: SELECT parceiros.*, organizacoes_saas(nome, email_contato, plano, status), usuarios(nome, sobrenome, email)
// COUNT: subquery de indicacoes_parceiro WHERE status='ativa' agrupado por parceiro_id
// SUM: subquery de comissoes_parceiro.valor_comissao agrupado por parceiro_id
// Filtros: ilike em organizacoes_saas.nome ou parceiros.codigo_indicacao
// Paginacao: offset/limit

async function obterParceiro(id: string): Promise<Parceiro>
// Retorna parceiro com joins completos
// Inclui: indicacoes (com join de org), ultimas 12 comissoes

async function criarParceiro(payload: CriarParceiroData): Promise<Parceiro>
// 1. Verificar se organizacao_id ou usuario_id ja e parceiro (UNIQUE)
// 2. Gerar codigo_indicacao: "RENOVE-" + 6 chars random uppercase (nanoid ou crypto.getRandomValues)
//    Retry ate 3 vezes em caso de colisao (catch do UNIQUE constraint)
// 3. INSERT em parceiros
// 4. Retornar parceiro criado

async function atualizarParceiro(id: string, data: AtualizarParceiroData): Promise<Parceiro>
// UPDATE simples, atualiza atualizado_em
// Se status = 'suspenso', gravar suspenso_em = now()
// Se status = 'ativo' (reativando), limpar suspenso_em

async function aplicarGratuidade(payload: AplicarGratuidadeData): Promise<Parceiro>
// UPDATE parceiros SET gratuidade_aplicada_em = now(), gratuidade_valida_ate = payload.gratuidade_valida_ate

--- INDICACOES ---

async function listarIndicacoesParceiro(parceiroId: string): Promise<IndicacaoParceiro[]>
// SELECT indicacoes_parceiro.*, organizacoes_saas(nome, plano, status, criado_em)
// ORDER BY criado_em DESC

async function validarCodigoParceiro(codigo: string): Promise<{
  valido: boolean
  parceiro?: { id: string; nome_empresa: string; percentual_comissao: number | null }
}>
// SELECT parceiros.id, parceiros.percentual_comissao, organizacoes_saas.nome
// WHERE codigo_indicacao = codigo AND status = 'ativo'
// Se nao encontrar: retornar { valido: false }
// Se encontrar: retornar { valido: true, parceiro: { id, nome_empresa, percentual_comissao } }

async function criarIndicacao(payload: {
  parceiro_id: string
  organizacao_id: string
  percentual_comissao_snapshot: number
  origem: 'link' | 'codigo_manual' | 'pre_cadastro'
}): Promise<IndicacaoParceiro>
// INSERT em indicacoes_parceiro
// Usado internamente pelo fluxo de criarOrganizacao no admin.api.ts

--- COMISSOES ---

async function listarComissoesParceiro(
  parceiroId: string,
  params?: { page?: number; limit?: number }
): Promise<{ comissoes: ComissaoParceiro[]; total: number }>
// SELECT * FROM comissoes_parceiro WHERE parceiro_id = parceiroId
// JOIN indicacoes_parceiro (para exibir nome da org indicada)
// ORDER BY periodo_ano DESC, periodo_mes DESC

async function gerarComissoesMes(payload: GerarComissoesData): Promise<{
  geradas: number
  ignoradas: number
}>
// AIDEV-NOTE: tabela assinaturas NAO tem campo de valor — deve fazer JOIN com planos para obter preco
// Para cada indicacao ativa do parceiro (ou todos se parceiro_id nao informado):
//   1. Buscar assinatura da org:
//      SELECT assinaturas.id, assinaturas.periodo, planos(preco_mensal, preco_anual)
//      FROM assinaturas JOIN planos ON assinaturas.plano_id = planos.id
//      WHERE assinaturas.organizacao_id = indicacao.organizacao_id
//        AND assinaturas.status IN ('ativa', 'trial')
//        AND assinaturas.cortesia IS NOT TRUE   -- orgs em cortesia NAO geram comissao (decisao de negocio)
//      LIMIT 1
//   2. Se nao encontrar assinatura ativa: ignorar e continuar (org sem plano pago)
//   3. Calcular valor base:
//      valorBase = periodo === 'anual' ? preco_anual / 12 : preco_mensal
//   4. Calcular comissao:
//      valorComissao = valorBase * indicacao.percentual_comissao_snapshot / 100
//   5. INSERT INTO comissoes_parceiro (valor_assinatura = valorBase, ...) ON CONFLICT DO NOTHING
//   6. Contar geradas e ignoradas (conflito = ja existia — idempotencia garantida pelo UNIQUE constraint)

async function marcarComissaoPaga(comissaoId: string): Promise<ComissaoParceiro>
// UPDATE comissoes_parceiro SET status='pago', pago_em=now()

--- ORGANIZACOES DISPONIVEIS PARA PARCEIRO ---

async function listarOrganizacoesDisponiveis(busca?: string): Promise<Array<{
  id: string; nome: string; email_contato: string; status: string
}>>
// Retorna orgs que ainda NAO sao parceiras para uso no NovoParceirModal
// 1. SELECT organizacao_id FROM parceiros  (lista de orgs que ja tem parceiro)
// 2. SELECT id, nome, email_contato, status FROM organizacoes_saas
//    WHERE id NOT IN (<ids acima>)
//      AND status = 'ativa'
//      AND (nome ILIKE '%busca%' OR email_contato ILIKE '%busca%')
//    ORDER BY nome ASC
//    LIMIT 30
// Nota: Se parceirosExistentes for vazio, omitir o NOT IN para nao gerar SQL invalido

--- CONFIG DO PROGRAMA ---

async function obterConfigPrograma(): Promise<ConfigProgramaParceiro>
// SELECT * FROM config_programa_parceiros LIMIT 1
// Se nao existir, retornar config com valores default

async function atualizarConfigPrograma(data: AtualizarConfigProgramaData): Promise<ConfigProgramaParceiro>
// UPSERT em config_programa_parceiros (ON CONFLICT DO UPDATE)
// atualizado_em = now()

Cada funcao deve:
- Tratar erros do Supabase e relançar com mensagem descritiva em PT-BR
- Usar os tipos Zod importados de '../schemas/parceiro.schema'
- Adicionar comentario AIDEV-NOTE em logicas criticas
```

### Output esperado
- `src/modules/admin/services/parceiros.api.ts` com todas as funcoes documentadas

---

## ETAPA 4 — Hooks React Query (useParceiros.ts)

### Objetivo
Criar hooks TanStack Query para todas as operacoes do modulo de parceiros.

### Prompt para implementacao

```
Preciso criar o arquivo de hooks React Query para o modulo de parceiros do CRMBeta.

CONTEXTO:
- Arquivo: src/modules/admin/hooks/useParceiros.ts
- Padrao de referencia: src/modules/admin/hooks/useOrganizacoes.ts
- Importar funcoes de: '../services/parceiros.api'
- Importar tipos de: '../schemas/parceiro.schema'
- Usar toast da lib 'sonner' para feedback de mutacoes
- QueryClient: usar useQueryClient() do TanStack Query

HOOKS NECESSARIOS:

--- QUERIES ---

export function useParceiros(params?: { busca?: string; status?: string; page?: number })
// queryKey: ['admin', 'parceiros', params]
// staleTime: 30_000

export function useParceiro(id: string)
// queryKey: ['admin', 'parceiro', id]
// enabled: !!id

export function useIndicacoesParceiro(parceiroId: string)
// queryKey: ['admin', 'parceiro', parceiroId, 'indicacoes']
// enabled: !!parceiroId

export function useComissoesParceiro(parceiroId: string, params?: { page?: number })
// queryKey: ['admin', 'parceiro', parceiroId, 'comissoes', params]

export function useConfigPrograma()
// queryKey: ['admin', 'config-programa-parceiros']
// staleTime: 60_000

--- MUTATIONS ---

export function useCreateParceiro()
// onSuccess: invalidate ['admin', 'parceiros']
// onSuccess: toast.success('Parceiro cadastrado com sucesso')
// onError: toast.error(error.message)

export function useUpdateParceiro()
// onSuccess: invalidate ['admin', 'parceiros'] e ['admin', 'parceiro', variables.id]
// onSuccess: toast.success('Parceiro atualizado')

export function useAplicarGratuidade()
// onSuccess: invalidate parceiro especifico
// onSuccess: toast.success('Gratuidade aplicada com sucesso')

export function useGerarComissoes()
// onSuccess: invalidate comissoes do parceiro
// onSuccess: toast.success(`${result.geradas} comissoes geradas`)
// onError: toast.error

export function useMarcarComissaoPaga()
// onSuccess: invalidate comissoes do parceiro
// onSuccess: toast.success('Comissao marcada como paga')

export function useUpdateConfigPrograma()
// onSuccess: invalidate ['admin', 'config-programa-parceiros']
// onSuccess: toast.success('Configuracoes salvas')

--- HOOK DERIVADO ---

export function useStatusMetaParceiro(parceiroId: string)
// Usa useParceiro(parceiroId) + useConfigPrograma()
// Calcula e retorna:
// {
//   cumpriuMeta: boolean
//   indicadosNecessarios: number
//   indicadosAtuais: number
//   percentualProgresso: number (0-100)
//   descricao: string
//   programaAtivo: boolean
// }
// Logica:
//   Se regras_gratuidade.ativo === false: retornar programaAtivo: false
//   meta = parceiro.gratuidade_aplicada_em ? regras.renovacao_meta_indicados : regras.meta_inicial_indicados
//   cumpriuMeta = parceiro.total_indicados_ativos >= meta

Exportar todos os hooks com tipagem correta.
```

### Output esperado
- `src/modules/admin/hooks/useParceiros.ts` com todos os hooks

---

## ETAPA 5 — Pagina de Lista de Parceiros (ParceirosPage.tsx)

### Objetivo
Criar a pagina de lista de parceiros, seguindo EXATAMENTE o padrao de OrganizacoesPage.tsx.

### Prompt para implementacao

```
Preciso criar a pagina ParceirosPage.tsx para o modulo de parceiros do CRMBeta.

CONTEXTO:
- Arquivo: src/modules/admin/pages/ParceirosPage.tsx
- Referencia obrigatoria: src/modules/admin/pages/OrganizacoesPage.tsx (seguir estrutura identica)
- Hooks: importar de '../hooks/useParceiros'
- Navegacao ao clicar: useNavigate() para /admin/parceiros/:id

ESTRUTURA DA PAGINA:

1. Toolbar (injetar via useToolbar ou padrao do projeto):
   - Input de busca (placeholder: "Buscar por empresa ou codigo...")
   - Select de filtro de status: Todos | Ativo | Suspenso | Inativo
   - Botao primario: "Novo Parceiro" (abre NovoParceirModal)

2. Estado de loading: skeleton loader igual ao de OrganizacoesPage

3. Estado vazio: icone Users2 + texto "Nenhum parceiro cadastrado" + botao "Cadastrar primeiro parceiro"

4. Tabela desktop (hidden em mobile):
   Colunas:
   - Empresa Parceira (nome da org + email, com link clicavel)
   - Codigo (badge cinza com font-mono, ex: RENOVE-AB12CD)
   - Indicados Ativos (numero, cor verde se > 0)
   - Comissao Total Gerada (formatado em BRL)
   - Status (badge: ativo=verde, suspenso=ambar, inativo=cinza)
   - Meta (badge: "Cumprindo ✓" verde ou "Em risco" ambar, calculado via useStatusMetaParceiro)
   - Coluna de acoes: dropdown com Visualizar / Suspender / Reativar

5. Cards mobile (visible em mobile):
   - Card com nome da empresa, codigo, indicados, status, meta
   - Click no card: navega para detalhe

6. Modal NovoParceirModal renderizado no final da pagina, controlado por estado local

Importar e usar:
- useParceiros hook para dados
- useStatusMetaParceiro para badge de meta
- NovoParceirModal (criar na proxima etapa, mas deixar placeholder com TODO)
- formatCurrency existente no projeto (buscar onde esta definido)

Seguir EXATAMENTE o mesmo padrao de className e estrutura de OrganizacoesPage.
```

### Output esperado
- `src/modules/admin/pages/ParceirosPage.tsx`

---

## ETAPA 6 — Modal de Novo Parceiro (NovoParceirModal.tsx)

### Objetivo
Modal simples de 1 etapa para cadastrar um parceiro.

### Prompt para implementacao

```
Preciso criar o NovoParceirModal.tsx para o modulo de parceiros do CRMBeta.

CONTEXTO:
- Arquivo: src/modules/admin/components/NovoParceirModal.tsx
- Referencia de padrao de modal: src/modules/admin/components/PlanoFormModal.tsx
- Usar Dialog do shadcn/ui
- Formulario com React Hook Form + Zod (CriarParceiroSchema)
- Hooks: useCreateParceiro de '../hooks/useParceiros'

CONTEXTO ADICIONAL DE QUERIES (obrigatorio seguir):
- Importar: import { supabase } from '@/lib/supabase'
- Importar formatCurrency: import { formatCurrency } from '@/lib/formatters'

CAMPOS DO FORMULARIO:

1. Select "Empresa Parceira" (obrigatorio):
   - Dados: chamar listarOrganizacoesDisponiveis() do parceiros.api.ts
     (retorna apenas orgs ativas que ainda NAO sao parceiras)
   - Renderizar como lista searchable com input de busca (debounce 400ms)
   - Exibir cada opcao: nome da empresa + email_contato
   - Ao selecionar uma org (onChange), executar a seguinte query para auto-preencher usuario_id:
     const { data: adminUsuario } = await supabase
       .from('usuarios')
       .select('id, nome, email')
       .eq('organizacao_id', selectedOrgId)
       .eq('role', 'admin')
       .eq('status', 'ativo')
       .order('criado_em', { ascending: true })  // primeiro admin criado
       .limit(1)
       .maybeSingle()
     Se adminUsuario encontrado: setValue('usuario_id', adminUsuario.id)
     Se NAO encontrado: exibir mensagem de erro inline "Esta organizacao nao possui admin ativo"
       e desabilitar o botao submit

2. Campo "% de Comissao" (opcional, numerico 0-100):
   - Placeholder: "Usar padrao do programa (10%)"
   - Se vazio, envia null (usa padrao da config global)
   - Dica visual: "Deixe em branco para usar o percentual padrao configurado no programa"

3. Botoes:
   - Cancelar (variant="outline" — classe: "border border-border rounded-md hover:bg-accent")
   - Cadastrar Parceiro (loading state — classe: "bg-primary text-primary-foreground rounded-md hover:bg-primary/90")
   - Spinner: <Loader2 className="w-4 h-4 animate-spin" /> importado de 'lucide-react'

COMPORTAMENTO:
- Submit: chamar useCreateParceiro mutation
- onSuccess: fechar modal + exibir codigo gerado em toast.success("Parceiro cadastrado! Codigo: RENOVE-XXXXXX")
- onError: exibir toast.error com mensagem

Nao mostrar campo usuario_id para o usuario — deve ser resolvido automaticamente pelo select de empresa.
```

### Output esperado
- `src/modules/admin/components/NovoParceirModal.tsx`

---

## ETAPA 7 — Pagina de Detalhe do Parceiro (ParceiroDetalhesPage.tsx)

### Objetivo
Pagina de detalhe com 3 tabs e card de status da meta.

### Prompt para implementacao

```
Preciso criar a ParceiroDetalhesPage.tsx para o modulo de parceiros do CRMBeta.

CONTEXTO:
- Arquivo: src/modules/admin/pages/ParceiroDetalhesPage.tsx
- Referencia: src/modules/admin/pages/OrganizacaoDetalhesPage.tsx (seguir padrao de tabs)
- Usar useParams() para obter o id da URL
- Hooks: useParceiro, useIndicacoesParceiro, useComissoesParceiro, useStatusMetaParceiro, useUpdateParceiro, useAplicarGratuidade

ESTRUTURA DA PAGINA:

--- HEADER ---
- Botao voltar (← Parceiros) com useNavigate(-1)
- Nome da empresa parceira (heading)
- Badge do codigo: "RENOVE-XXXXXX" (font-mono, bg-muted)
- Badge de status: ativo (verde) | suspenso (ambar) | inativo (cinza)
- Menu de acoes (DropdownMenu): Suspender / Reativar / Editar %

--- CARD DE META DE GRATUIDADE ---
(exibir apenas se config.regras_gratuidade.ativo === true)
- Titulo: "Meta do Programa de Parceiros"
- Texto descritivo: descricao do useStatusMetaParceiro
- Barra de progresso HTML/Tailwind (nao usar componente externo):
  - bg-muted como track
  - bg-green-500 (cumprido) ou bg-amber-500 (em risco) como fill
  - Largura = percentualProgresso + "%"
- Texto: "X de Y indicados ativos"
- Botao "Aplicar Gratuidade" (visivel apenas se cumpriuMeta === true):
  - Abre mini modal/AlertDialog para confirmar e definir data de validade (ou indefinida)

--- TABS ---

Tab 1: "Indicados" (badge com total)
- Tabela: Empresa | Plano | Status da Org | Data da Indicacao | % Comissao (snapshot) | Status da Indicacao
- Estado vazio: "Nenhuma organizacao indicada ainda"
- Ordenar por criado_em DESC

Tab 2: "Comissoes" (badge com total pendente)
- Botao "Gerar Comissoes" no header da tab (abre ComissaoMesModal)
- Tabela: Periodo (Mês/Ano) | Empresa | Valor Assinatura | % | Valor Comissao | Status | Acao
- Status badges: pendente (ambar) | pago (verde) | cancelado (cinza)
- Acao: botao "Marcar como Pago" se status=pendente
- Total no rodape: "Total pendente: R$ X.XXX,XX"
- Paginacao se > 20 registros

Tab 3: "Configuracao"
- Campo "% Comissao Individual": input numerico, salva ao clicar em salvar
- Campo "Observacoes": textarea
- Data de adesao (readonly)
- Data de gratuidade (readonly, se aplicada)

Seguir mesmo padrao visual de OrganizacaoDetalhesPage (tab component, spacing, etc).
```

### Output esperado
- `src/modules/admin/pages/ParceiroDetalhesPage.tsx`

---

## ETAPA 8 — Modal de Gerar Comissoes (ComissaoMesModal.tsx)

### Objetivo
Modal para o Super Admin selecionar mes/ano e gerar comissoes do parceiro.

### Prompt para implementacao

```
Preciso criar o ComissaoMesModal.tsx para o modulo de parceiros do CRMBeta.

CONTEXTO:
- Arquivo: src/modules/admin/components/ComissaoMesModal.tsx
- Props: isOpen, onClose, parceiroId (string), nomeEmpresa (string)
- Hook: useGerarComissoes de '../hooks/useParceiros'
- Usar Dialog do shadcn/ui e React Hook Form + Zod (GerarComissoesSchema)

CAMPOS:
1. Select "Mes": Janeiro a Dezembro (valor 1-12)
2. Input "Ano": numerico, default = ano atual
   Pre-popular com mes e ano atuais

COMPORTAMENTO:
- Submit: chamar useGerarComissoes com { periodo_mes, periodo_ano, parceiro_id }
- onSuccess: toast mostrando "X comissoes geradas, Y ja existiam" + fechar modal
- onError: toast.error

VISUAL:
- Titulo: "Gerar Comissoes — [nomeEmpresa]"
- Descricao: "Comissoes ja geradas para este periodo serao ignoradas automaticamente."
- Botoes: Cancelar | Gerar Comissoes (loading state)
```

### Output esperado
- `src/modules/admin/components/ComissaoMesModal.tsx`

---

## ETAPA 9 — Rotas e Menu (App.tsx + AdminLayout.tsx)

### Objetivo
Registrar as rotas do modulo e adicionar o item no menu de navegacao.

### Prompt para implementacao

```
Preciso atualizar App.tsx e AdminLayout.tsx para incluir o modulo de parceiros no CRMBeta.

CONTEXTO:
- App.tsx: src/App.tsx — adicionar lazy imports e rotas dentro do bloco /admin
- AdminLayout.tsx: src/modules/admin/layouts/AdminLayout.tsx — adicionar item no menu

MUDANCAS EM App.tsx:

1. Adicionar lazy imports (junto com os outros imports de admin):
   const AdminParceirosPage = lazy(() => import('@/modules/admin/pages/ParceirosPage'))
   const AdminParceiroDetalhesPage = lazy(() => import('@/modules/admin/pages/ParceiroDetalhesPage'))

2. Adicionar rotas dentro de <Route path="/admin" element={<AdminLayout />}>:
   <Route path="parceiros" element={<AdminParceirosPage />} />
   <Route path="parceiros/:id" element={<AdminParceiroDetalhesPage />} />

MUDANCAS EM AdminLayout.tsx:

1. Adicionar import do icone: import { ..., Users2 } from 'lucide-react'

2. No array menuItems, adicionar entre "Organizacoes" e "Planos":
   { label: 'Parceiros', path: '/admin/parceiros', icon: Users2 }

3. Na funcao getPageTitle (ou equivalente que mapeia pathname para titulo):
   Adicionar: if (pathname.startsWith('/admin/parceiros')) return 'Parceiros'

NAO alterar nenhuma outra parte dos arquivos.
Mostrar APENAS as linhas alteradas com contexto suficiente para localizar a posicao correta.
```

### Output esperado
- Modificacoes cirurgicas em `src/App.tsx` e `src/modules/admin/layouts/AdminLayout.tsx`

---

## ETAPA 10 — Integracao no Wizard de Nova Organizacao

### Objetivo
Adicionar campo de codigo de parceiro no Step1 do wizard e integrar a criacao de indicacao no fluxo de submit.

### Prompt para implementacao

```
Preciso integrar o sistema de parceiros no wizard de criacao de organizacoes do CRMBeta.

CONTEXTO:
- Arquivos a modificar:
  1. src/modules/admin/schemas/organizacao.schema.ts
  2. src/modules/admin/services/admin.api.ts (interface CriarOrganizacaoPayload + funcao criarOrganizacao)
  3. src/modules/admin/components/NovaOrganizacaoModal.tsx (STEPS array + onSubmit)
  4. src/modules/admin/components/wizard/Step1Empresa.tsx (campo visual + debounce)

MUDANCA 1 — organizacao.schema.ts:

No schema principal (CriarOrganizacaoSchema ou equivalente), adicionar campo:
  codigo_parceiro: z.string().max(20).optional().or(z.literal(''))

MUDANCA 2 — admin.api.ts (interface CriarOrganizacaoPayload):

Adicionar campo apos 'senha_inicial' (linha ~78):
  codigo_parceiro?: string  // codigo de indicacao do parceiro (opcional)

MUDANCA 3 — NovaOrganizacaoModal.tsx (DOIS LUGARES):

Lugar 1 — Array STEPS (adicionar 'codigo_parceiro' ao fields do Step 1):
  const STEPS = [
    { id: 1, label: 'Empresa', fields: ['nome', 'segmento', 'segmento_outro', 'email', 'website', 'telefone', 'endereco', 'codigo_parceiro'] },
    // ... steps 2 e 3 sem alteracao
  ] as const

Lugar 2 — Funcao onSubmit() (adicionar codigo_parceiro ao payload):
  criarOrganizacao({
    // ... todos campos existentes sem alteracao ...
    codigo_parceiro: data.codigo_parceiro || undefined,  // NOVO campo
  }, { onSuccess: ... })

MUDANCA 4 — Step1Empresa.tsx:

Referencia: o arquivo ja usa Collapsible do shadcn/ui para o bloco de Endereco (com ChevronDown/ChevronUp).
Seguir o MESMO padrao visual para a secao de codigo de parceiro.

Adicionar no final do formulario (apos o bloco de Endereco), antes do fechamento do JSX:

Secao colapsavel "Indicacao de Parceiro":
  - Import adicional necessario: parceirosApi (import * as parceirosApi from '../../../modules/admin/services/parceiros.api')
  - Toggle com ChevronDown/ChevronUp (mesmo padrao do bloco Endereco)
  - Titulo: "Esta empresa foi indicada por um parceiro? (opcional)"
  - Quando expandido:
    - Input texto: label "Codigo do Parceiro", placeholder "RENOVE-XXXXXX"
    - maxLength={20}, autoComplete="off"
    - Hook useState: statusValidacao ('idle'|'validando'|'valido'|'invalido')
    - Hook useState: nomeParceiro (string | null) para exibir o nome quando valido
    - useEffect com debounce de 600ms:
        ao digitar (campo nao vazio): setStatusValidacao('validando')
        apos 600ms: chamar parceirosApi.validarCodigoParceiro(codigo.trim().toUpperCase())
        Se valido: setStatusValidacao('valido'), setNomeParceiro(result.parceiro.nome_empresa)
        Se invalido: setStatusValidacao('invalido'), setNomeParceiro(null)
        Se campo vazio: setStatusValidacao('idle'), setNomeParceiro(null)
    - Feedback visual ao lado do input (usando div absoluto ou span inline):
        'validando': <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        'valido': <span className="text-green-600 text-sm">Parceiro: {nomeParceiro}</span>
        'invalido': <span className="text-destructive text-sm">Codigo nao encontrado ou inativo</span>
    - O campo e registrado no form: {...register('codigo_parceiro')}

MUDANCA 5 — admin.api.ts (funcao criarOrganizacao):

Apos o bloco que cria a organizacao, admin e assinatura com sucesso, adicionar:

  if (payload.codigo_parceiro && payload.codigo_parceiro.trim() !== '') {
    // Buscar parceiro pelo codigo
    const { data: parceiro } = await supabase
      .from('parceiros')
      .select('id, percentual_comissao')
      .eq('codigo_indicacao', payload.codigo_parceiro.trim().toUpperCase())
      .eq('status', 'ativo')
      .maybeSingle()

    if (parceiro) {
      // Buscar percentual padrao da config se parceiro nao tem percentual individual
      const { data: config } = await supabase
        .from('config_programa_parceiros')
        .select('percentual_padrao')
        .limit(1)
        .maybeSingle()

      const pct = parceiro.percentual_comissao ?? config?.percentual_padrao ?? 10

      // Gravar indicacao
      await supabase.from('indicacoes_parceiro').insert({
        parceiro_id: parceiro.id,
        organizacao_id: orgCriada.id,  // usar o id da org criada
        percentual_comissao_snapshot: pct,
        origem: 'codigo_manual',
      })

      // Atualizar campo de rastreio na org
      await supabase
        .from('organizacoes_saas')
        .update({ codigo_parceiro_origem: payload.codigo_parceiro.trim().toUpperCase() })
        .eq('id', orgCriada.id)
    }
    // Se parceiro nao encontrado: ignorar silenciosamente (campo e opcional)
  }

Importante:
- A falha em gravar a indicacao NAO deve falhar a criacao da org (try/catch interno)
- Adicionar comentario AIDEV-NOTE: "Indicacao de parceiro — opcional, nao bloqueia criacao da org"
```

### Output esperado
- 4 arquivos modificados com mudancas cirurgicas e documentadas:
  - organizacao.schema.ts (campo codigo_parceiro)
  - admin.api.ts (interface + funcao criarOrganizacao + suspenderOrganizacao + reativarOrganizacao)
  - NovaOrganizacaoModal.tsx (STEPS + onSubmit)
  - Step1Empresa.tsx (campo visual + debounce)

---

## ETAPA 10B — Sincronizar status de indicacao ao suspender/reativar org (admin.api.ts)

### Objetivo
Garantir que quando uma org patrocinada for suspensa, cancelada ou reativada, o status da indicacao em `indicacoes_parceiro` seja atualizado correspondentemente.

### Prompt para implementacao

```
Preciso adicionar atualizacao de indicacoes_parceiro nas funcoes de suspensao e reativacao de organizacoes.

CONTEXTO:
- Arquivo: src/modules/admin/services/admin.api.ts
- Buscar as funcoes: suspenderOrganizacao(), reativarOrganizacao() e (se existir) cancelarOrganizacao()
- Nao alterar a logica existente — apenas adicionar o bloco de atualizacao de indicacao APOS o UPDATE da org

EM suspenderOrganizacao(orgId) e cancelarOrganizacao(orgId):
Adicionar apos o UPDATE bem-sucedido da organizacao:

  // AIDEV-NOTE: Atualizar indicacao do parceiro para refletir suspensao da org indicada
  await supabase
    .from('indicacoes_parceiro')
    .update({ status: 'inativa', atualizado_em: new Date().toISOString() })
    .eq('organizacao_id', orgId)
    .eq('status', 'ativa')  // apenas atualiza se estava ativa (idempotente)
  // Falha aqui NAO deve reverter a suspensao da org (try/catch separado)

EM reativarOrganizacao(orgId):
Adicionar apos o UPDATE bem-sucedido da organizacao:

  // AIDEV-NOTE: Reativar indicacao do parceiro ao reativar a org indicada
  await supabase
    .from('indicacoes_parceiro')
    .update({ status: 'ativa', atualizado_em: new Date().toISOString() })
    .eq('organizacao_id', orgId)
    .eq('status', 'inativa')  // apenas reativa se estava inativa (idempotente)

Em ambos os casos: envolver em try/catch separado — falha aqui NAO deve reverter a acao principal da org.
```

### Output esperado
- Modificacao cirurgica em `src/modules/admin/services/admin.api.ts`

---

## ETAPA 11 — Aba de Configuracao do Programa (ConfiguracoesGlobaisPage.tsx)

### Objetivo
Adicionar aba "Programa de Parceiros" na pagina de configuracoes globais existente.

### Prompt para implementacao

```
Preciso adicionar uma aba "Programa de Parceiros" na ConfiguracoesGlobaisPage.tsx do CRMBeta.

CONTEXTO CRITICO — DIFERENCA DO PADRAO DAS OUTRAS ABAS:
- As abas existentes (meta, google, waha, stripe, email, login_banner) carregam dados via useConfigGlobais()
  que busca da tabela configuracoes_globais.
- A aba "Parceiros" usa um hook DIFERENTE: useConfigPrograma() + useUpdateConfigPrograma()
  que busca da tabela config_programa_parceiros (tabela separada).
- NAO tentar usar configs?.find(...) para a aba parceiros — os dados vem de outro hook.

MUDANCAS NECESSARIAS:

1. Extender o tipo PlataformaId:
   type PlataformaId = 'meta' | 'google' | 'waha' | 'stripe' | 'email' | 'login_banner' | 'parceiros'

2. Adicionar ao array PLATAFORMAS:
   { id: 'parceiros' as const, label: 'Parceiros', descricao: 'Programa de parceiros' }

3. Adicionar imports no topo:
   import { useConfigPrograma, useUpdateConfigPrograma } from '../hooks/useParceiros'
   import { AtualizarConfigProgramaSchema } from '../schemas/parceiro.schema'
   import type { AtualizarConfigProgramaData } from '../schemas/parceiro.schema'

4. No componente, adicionar hook separado para os dados da aba parceiros:
   const { data: configPrograma, isLoading: configProgramaLoading } = useConfigPrograma()
   const { mutate: atualizarConfig, isPending: salvandoConfig } = useUpdateConfigPrograma()

5. Na renderizacao do conteudo das tabs, adicionar:
   {activeTab === 'parceiros' && (
     <ConfigProgramaParceirosForm
       config={configPrograma}
       isLoading={configProgramaLoading}
       onSalvar={atualizarConfig}
       isSalvando={salvandoConfig}
     />
   )}
   (Ou implementar inline — escolha do implementador)

CONTEUDO DA ABA:

- Arquivo a modificar: src/modules/admin/pages/ConfiguracoesGlobaisPage.tsx
- Hooks: useConfigPrograma, useUpdateConfigPrograma de '../hooks/useParceiros'
- Schema de validacao: AtualizarConfigProgramaSchema de '../schemas/parceiro.schema'
- Usar React Hook Form + Zod

ADICIONAR ABA "Parceiros" no sistema de tabs existente da pagina.

CONTEUDO DA ABA:

Secao 1 — Configuracao Geral:
- Toggle "Programa de Parceiros Ativo": ao desativar, programa nao gera novos parceiros
- Input numerico "% Comissao Padrao": 0-100, sufixo "%"
  Descricao: "Percentual aplicado quando o parceiro nao tem uma taxa individual definida"
- Input texto "URL Base do Link de Indicacao":
  Placeholder: "https://app.renovedigital.com.br/cadastro"
  Descricao: "URL que sera combinada com o codigo do parceiro para formar o link de indicacao"

Secao 2 — Programa de Gratuidade:
- Toggle "Ativar Programa de Gratuidade":
  Descricao: "Parceiros que atingirem as metas podem ter o plano custeado pela plataforma"
- Campos (exibir apenas se toggle ativo):
  - Input numerico "Meta Inicial de Indicados":
    Label: "Quantas empresas o parceiro precisa indicar para ganhar a gratuidade?"
    Min: 1
  - Input numerico "Periodo de Renovacao (meses)":
    Label: "A cada quantos meses a meta deve ser renovada?"
    Min: 1
  - Input numerico "Meta de Renovacao (indicados)":
    Label: "Quantos indicados ativos o parceiro precisa manter para renovar a gratuidade?"
    Min: 1
  - Input numerico "Prazo de Carencia (dias)":
    Label: "Quantos dias o parceiro tem apos nao cumprir a meta antes de perder a gratuidade?"
    Min: 0

Secao 3 — Observacoes:
- Textarea "Observacoes Internas" (nao exibido aos parceiros)

Botao "Salvar Configuracoes" no rodape (loading state, toast de confirmacao).

Pre-popular o formulario com os dados de useConfigPrograma().
Ao salvar, chamar useUpdateConfigPrograma mutation.

NAO alterar outras abas ou logica da pagina.
Mostrar apenas o codigo da nova aba e as modificacoes no componente de tabs.
```

### Output esperado
- Modificacao cirurgica em `src/modules/admin/pages/ConfiguracoesGlobaisPage.tsx`

---

## Verificacao End-to-End

Apos todas as etapas, testar o seguinte fluxo completo:

```
1. Banco
   ☐ Abrir Supabase dashboard
   ☐ Verificar 4 tabelas criadas: parceiros, indicacoes_parceiro, comissoes_parceiro, config_programa_parceiros
   ☐ Verificar colunas adicionadas: organizacoes_saas.codigo_parceiro_origem, pre_cadastros_saas.codigo_parceiro
   ☐ Verificar RLS ativa em todas as 4 tabelas

2. Configurar o programa
   ☐ Acessar /admin/configuracoes → aba Parceiros
   ☐ Definir % padrao = 15%
   ☐ Ativar gratuidade, meta inicial = 2
   ☐ Salvar → toast de confirmacao

3. Cadastrar parceiro
   ☐ Acessar /admin/parceiros → Novo Parceiro
   ☐ Selecionar uma org existente
   ☐ Salvar → codigo RENOVE-XXXXXX aparece no toast
   ☐ Parceiro aparece na lista com status "ativo" e Meta "Em risco" (0/2)

4. Criar org com codigo de parceiro
   ☐ Acessar /admin/organizacoes → Novo
   ☐ Step 1: digitar codigo do parceiro → badge verde aparece com nome da empresa
   ☐ Concluir wizard
   ☐ Verificar no banco: indicacoes_parceiro tem 1 registro com percentual_snapshot = 15

5. Verificar indicacao na lista
   ☐ /admin/parceiros/:id → Tab Indicados → org aparece
   ☐ Badge de Meta atualizado: "Em risco" (1/2)

6. Criar segunda org com mesmo codigo
   ☐ Repetir fluxo → Badge de Meta: "Cumprindo ✓" (2/2)

7. Gerar comissoes
   ☐ /admin/parceiros/:id → Tab Comissoes → Gerar Comissoes
   ☐ Selecionar mes/ano atual → confirmar
   ☐ Toast: "2 comissoes geradas, 0 ja existiam"
   ☐ Gerar novamente → Toast: "0 comissoes geradas, 2 ja existiam" (idempotencia)

8. Marcar como pago
   ☐ Na tabela de comissoes, clicar "Marcar como Pago" na primeira comissao
   ☐ Status muda para "pago" com data

9. Aplicar gratuidade
   ☐ Card de meta exibe botao "Aplicar Gratuidade"
   ☐ Clicar → definir validade → confirmar
   ☐ Campo gratuidade_aplicada_em gravado no banco
```
