# Padrao para Criacao de PRDs

Este documento define o padrao oficial para criacao de PRDs (Product Requirements Documents) no projeto CRMBeta. Deve ser consultado antes de criar qualquer PRD.

---

## O que e um PRD

O PRD (Product Requirements Document) e um documento que define **O QUE** construir, **PARA QUEM** e **POR QUE** - nunca o **COMO**.

Serve como fonte unica de verdade para alinhar produto, design, engenharia e stakeholders.

---

## Hierarquia de Documentos de Produto

Antes de criar um PRD, entenda onde ele se encaixa:

| Documento | Foco | Pergunta-chave | Quando criar |
|-----------|------|----------------|--------------|
| **MRD** | Mercado | Por que construir isso? | Antes de validar a oportunidade |
| **BRD** | Negocio | Por que o negocio precisa? | Apos validar mercado |
| **PRD** | Produto | O que construir? | Apos aprovar BRD |

**Ordem recomendada:** MRD → BRD → PRD

Para features menores, MRD e BRD podem ser secoes resumidas dentro do proprio PRD.

---

## Estrutura Obrigatoria do PRD

### 1. Cabecalho e Metadados

```markdown
# PRD: [Nome da Feature/Produto]

| Campo | Valor |
|-------|-------|
| **Autor** | [Nome do PM] |
| **Data de criacao** | YYYY-MM-DD |
| **Ultima atualizacao** | YYYY-MM-DD |
| **Versao** | v1.0 |
| **Status** | Rascunho / Em revisao / Aprovado / Em desenvolvimento |
| **Stakeholders** | [Lista de envolvidos] |
| **Revisor tecnico** | [Nome do tech lead] |
```

---

### 2. Resumo Executivo

**Maximo 3 paragrafos** respondendo:

- O que estamos construindo?
- Qual problema resolve?
- Qual o impacto esperado?

---

### 3. Contexto e Motivacao

#### 3.1 Problema

Descreva o problema atual com dados concretos:

- Qual dor do usuario?
- Qual impacto no negocio?
- Evidencias (metricas, feedback, pesquisas)

#### 3.2 Oportunidade de Mercado (MRD resumido)

- Tamanho do mercado
- Tendencias relevantes
- Analise competitiva
- Product-market fit

#### 3.3 Alinhamento Estrategico (BRD resumido)

- Como isso se conecta aos objetivos da empresa?
- Qual o impacto em receita/retencao/engajamento?
- ROI esperado

---

### 4. Usuarios e Personas

#### 4.1 Persona Primaria

```markdown
**Nome:** [Nome da persona]
**Role:** [Cargo/funcao]
**Contexto:** [Situacao de uso]
**Dores:**
- [Dor 1]
- [Dor 2]
**Objetivos:**
- [Objetivo 1]
- [Objetivo 2]
**Citacao representativa:** "[Frase que resume a necessidade]"
```

#### 4.2 Personas Secundarias

Listar outras personas impactadas.

#### 4.3 Anti-personas

Quem NAO e o usuario-alvo desta feature.

---

### 5. Hierarquia de Requisitos

Organize requisitos em niveis:

#### 5.1 Theme (Objetivo Estrategico)

> [Objetivo de alto nivel que pode durar trimestres/anos]

#### 5.2 Epic (Iniciativa)

> [Projeto grande que contribui para o theme]

#### 5.3 Features e User Stories

Use o formato padrao:

```markdown
**Feature:** [Nome da feature]

**User Story:**
Como [persona],
Quero [acao/funcionalidade],
Para que [beneficio/resultado].

**Criterios de Aceitacao:**
- [ ] [Criterio 1 - mensuravel e verificavel]
- [ ] [Criterio 2]
- [ ] [Criterio 3]

**Prioridade:** Must-have / Should-have / Could-have / Won't-have
```

---

### 6. Requisitos Funcionais

Liste O QUE o sistema deve fazer (nao COMO):

| ID | Requisito | Prioridade | Criterio de aceitacao |
|----|-----------|------------|----------------------|
| RF-001 | [Descricao] | Must | [Como verificar] |
| RF-002 | [Descricao] | Should | [Como verificar] |

---

### 7. Requisitos Nao-Funcionais

#### 7.1 Performance

- Tempo de resposta maximo
- Throughput esperado
- Limites de carga

#### 7.2 Seguranca

- Autenticacao/autorizacao
- Criptografia
- Compliance (LGPD, etc)

#### 7.3 Usabilidade

- Acessibilidade
- Responsividade
- Navegacao (ex: uma mao em mobile)

#### 7.4 Sistema/Ambiente

- Navegadores suportados
- Dispositivos
- Integracoes obrigatorias

---

### 8. Escopo

#### 8.1 O que ESTA no escopo

- [Item 1]
- [Item 2]

#### 8.2 O que NAO esta no escopo

- [Item 1 - e por que]
- [Item 2 - e por que]

#### 8.3 Escopo futuro (backlog)

- [Item para proxima versao]

---

### 9. Suposicoes, Dependencias e Restricoes

#### 9.1 Suposicoes

O que assumimos ser verdade (mas nao e garantido):

- [Suposicao 1]
- [Suposicao 2]

#### 9.2 Dependencias

De quem/que dependemos:

| Dependencia | Responsavel | Status | Risco |
|-------------|-------------|--------|-------|
| [Sistema X] | [Time Y] | Confirmado | Baixo |

#### 9.3 Restricoes

Limitacoes conhecidas:

- **Tecnicas:** [Ex: deve usar stack existente]
- **Orcamentarias:** [Ex: limite de X horas]
- **Temporais:** [Ex: lancamento ate data Y]

---

### 10. Design e UX

#### 10.1 Fluxo do Usuario

Descreva o fluxo principal em passos:

1. Usuario acessa [tela]
2. Usuario clica em [elemento]
3. Sistema exibe [resultado]

#### 10.2 Wireframes/Prototipos

> Link para Figma/prototipos (se disponivel)

**Nota:** Wireframes sao opcionais no PRD inicial. Podem ser adicionados apos discovery.

#### 10.3 Consideracoes de UX

- [Principio de design 1]
- [Padrao de interacao esperado]

---

### 11. Metricas de Sucesso

#### 11.1 KPIs Primarios

| Metrica | Baseline atual | Meta | Prazo |
|---------|----------------|------|-------|
| [Metrica 1] | X | Y | Z meses |

#### 11.2 KPIs Secundarios

- [Metrica de suporte]

#### 11.3 Criterios de Lancamento

O que precisa ser verdade para lancar:

- [ ] [Criterio 1]
- [ ] [Criterio 2]

---

### 12. Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|---------------|---------|-----------|
| [Risco 1] | Alta/Media/Baixa | Alto/Medio/Baixo | [Acao] |

---

### 13. Time to Value (TTV)

#### 13.1 MVP (Minimo Viavel)

O que e o MINIMO que resolve o problema core?

- [Funcionalidade essencial 1]
- [Funcionalidade essencial 2]

#### 13.2 Fases de Entrega

| Fase | Escopo | TTV |
|------|--------|-----|
| MVP | [Descricao] | [Semanas] |
| V1.1 | [Incremento] | [Semanas] |
| V2.0 | [Expansao] | [Semanas] |

---

### 14. Plano de Validacao

#### 14.1 Validacao Pre-Desenvolvimento

- [ ] Entrevistas com usuarios
- [ ] Prototipo testado
- [ ] Feedback de stakeholders

#### 14.2 Validacao Durante Desenvolvimento

- [ ] Testes de usabilidade com prototipo
- [ ] Review tecnico

#### 14.3 Validacao Pos-Lancamento

- [ ] Metricas de adocao
- [ ] Feedback qualitativo
- [ ] Iteracao baseada em dados

---

### 15. Historico de Versoes

| Versao | Data | Autor | Mudancas |
|--------|------|-------|----------|
| v1.0 | YYYY-MM-DD | [Nome] | Versao inicial |
| v1.1 | YYYY-MM-DD | [Nome] | [Descricao da mudanca] |

---

## Anti-patterns: O que NAO fazer

### Erros Criticos

| Anti-pattern | Problema | Solucao |
|--------------|----------|---------|
| PRD como checkbox | Documento feito por obrigacao, ninguem usa | Envolver stakeholders desde o inicio |
| Excesso de detalhes | Documento gigante que ninguem le | Manter conciso e escanevel |
| Especificar o COMO | PRD vira especificacao tecnica | Focar no O QUE, deixar COMO para engenharia |
| Validacao tardia | Descobrir problemas so no Beta | Testar com prototipos antes de codar |
| PRD estatico | Documento desatualizado em semanas | Versionar e revisar regularmente |
| Ignorar TTV | Over-engineering no primeiro ciclo | Priorizar MVP que gera valor rapido |
| Falta de metricas | Nao saber se teve sucesso | Definir KPIs antes de comecar |
| Requisitos vagos | "Sistema deve ser rapido" | Especificar: "Resposta < 200ms no P95" |

### Frases Proibidas

- "O sistema deve ser intuitivo" → Vago. Defina criterios especificos.
- "Deve ter boa performance" → Defina numeros.
- "Similar ao [concorrente]" → Descreva o comportamento esperado.
- "Deve ser facil de usar" → Defina para quem e em qual contexto.

---

## Checklist de Validacao

Antes de considerar o PRD pronto:

### Clareza

- [ ] Esta claro por que o produto/feature existe?
- [ ] O problema esta bem definido com evidencias?
- [ ] Os usuarios-alvo estao identificados?

### Completude

- [ ] Escopo esta definido (dentro E fora)?
- [ ] Requisitos funcionais estao listados?
- [ ] Requisitos nao-funcionais estao especificados?
- [ ] Dependencias estao mapeadas?
- [ ] Riscos estao identificados com mitigacoes?

### Mensurabilidade

- [ ] Criterios de aceitacao sao verificaveis?
- [ ] KPIs estao definidos com baseline e meta?
- [ ] Criterios de lancamento estao claros?

### Alinhamento

- [ ] Stakeholders revisaram e aprovaram?
- [ ] Engenharia validou viabilidade tecnica?
- [ ] Design revisou fluxos e UX?

### Priorizacao

- [ ] MVP esta definido?
- [ ] Time to Value esta priorizado?
- [ ] Fases de entrega estao planejadas?

---

## Template Rapido (para features menores)

Para features pequenas, use esta versao simplificada:

```markdown
# PRD: [Nome da Feature]

**Autor:** [Nome] | **Data:** YYYY-MM-DD | **Versao:** v1.0

## Problema
[1-2 paragrafos descrevendo o problema]

## Solucao Proposta
[1-2 paragrafos descrevendo a solucao]

## Usuarios
- **Primario:** [Persona]
- **Secundario:** [Persona]

## Requisitos
| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-001 | [Descricao] | Must |

## Fora do Escopo
- [Item 1]

## Criterios de Sucesso
- [ ] [Metrica 1]
- [ ] [Metrica 2]

## Riscos
- [Risco 1]: [Mitigacao]
```

---

## Referencias

- [Product School - PRD Template](https://productschool.com/blog/product-strategy/product-template-requirements-document-prd)
- [Atlassian - Product Requirements](https://www.atlassian.com/agile/product-management/requirements)
- [Perforce - How to Write a PRD](https://www.perforce.com/blog/alm/how-write-product-requirements-document-prd)
- [Aakash Gupta - Modern PRD Guide](https://www.news.aakashg.com/p/product-requirements-documents-prds)
- [Findernest - PRD vs BRD vs MRD](https://www.findernest.com/en/blog/understanding-prd-brd-mrd-and-srd-a-quick-guide)
- [AltexSoft - PRD Templates](https://www.altexsoft.com/blog/product-requirements-document/)

---

**Lembre-se:** PRD moderno e enxuto, iterativo e focado em valor. Nao e um documento para engavetar - e uma ferramenta viva de alinhamento.
