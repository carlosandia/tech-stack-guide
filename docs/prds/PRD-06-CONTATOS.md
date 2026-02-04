# PRD-06: Modulo de Contatos

| Campo | Valor |
|-------|-------|
| **Autor** | Arquiteto de Produto |
| **Data de criacao** | 2026-02-03 |
| **Ultima atualizacao** | 2026-02-03 |
| **Versao** | v1.3 |
| **Status** | Aprovado |
| **Stakeholders** | Time de Produto, Engenharia |
| **Revisor tecnico** | Tech Lead |

---

## Resumo Executivo

O **Modulo de Contatos** e o repositorio centralizado de pessoas e empresas do CRM Renove. Permite gerenciar, segmentar, importar e exportar contatos com campos customizaveis definidos em `/configuracoes`. O modulo oferece deteccao de duplicatas para higienizacao da base e integracao direta com o modulo de Negocios para criacao de oportunidades.

Este modulo e fundamental para que equipes de vendas tenham uma visao unica e organizada de seus prospects e clientes, permitindo segmentacao inteligente e importacao em massa de bases externas.

---

## Contexto e Motivacao

### Problema

1. **Dados fragmentados** - Contatos em planilhas, emails e sistemas diversos
2. **Duplicatas** - Mesma pessoa/empresa cadastrada multiplas vezes, gerando ruido
3. **Falta de segmentacao** - Dificuldade em agrupar contatos por perfil ou campanha
4. **Importacao manual** - Processo demorado e propenso a erros
5. **Campos padronizados** - Cada vendedor cadastra informacoes diferentes

### Oportunidade

- CRMs com gestao unificada de contatos tem **40% mais conversao**
- Segmentacao permite **campanhas direcionadas** com maior ROI
- Deteccao de duplicatas economiza **horas de trabalho manual**
- Importacao CSV/XLSX acelera **onboarding de novos clientes**

---

## Usuarios e Personas

### Persona Primaria: Admin (Gestor Comercial)

**Role:** Admin
**Contexto:** Gerencia equipe de vendas, precisa de visao consolidada
**Dores:**
- Base de contatos suja com duplicatas
- Dificuldade em importar leads de campanhas
- Nao consegue segmentar contatos para acoes especificas

**Objetivos:**
- Ter base de contatos limpa e organizada
- Importar leads rapidamente de outras fontes
- Criar segmentos para campanhas e automacoes

**Citacao:** "Preciso saber exatamente quantos prospects temos por segmento para planejar as acoes do mes."

### Persona Secundaria: Member (Vendedor)

**Role:** Member
**Contexto:** Trabalha apenas com seus proprios contatos
**Dores:**
- Cadastrar contato novo demora muito
- Nao encontra informacoes do contato facilmente

**Objetivos:**
- Cadastrar contatos rapidamente
- Visualizar historico e dados do contato
- Criar oportunidades a partir do contato

### Anti-Persona

**Super Admin** - NAO utiliza este modulo. Gerencia a plataforma, nao dados operacionais dos tenants.

---

## Hierarquia de Requisitos

### Theme (Objetivo Estrategico)

> Centralizar e organizar todos os contatos do CRM com segmentacao inteligente e higienizacao automatica.

### Epic (Iniciativa)

> Modulo de Contatos com CRUD completo, segmentacao, importacao/exportacao e deteccao de duplicatas.

---

## Requisitos Funcionais

### RF-001: Interface Principal `/contatos`

**User Story:**
Como Admin ou Member,
Quero acessar uma pagina centralizada de contatos,
Para visualizar e gerenciar pessoas e empresas do CRM.

**Descricao:**

Pagina principal com sub-menu de navegacao entre Pessoas e Empresas.

**Layout da Interface:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ☰  CRM Renove              Visao Geral  Negocios  Contatos  Configuracoes  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Contatos                                                                   │
│  ┌─────────┬──────────┐                                                     │
│  │ Pessoas │ Empresas │                                                     │
│  └─────────┴──────────┘                                                     │
│                                                                             │
│  [🔍 Buscar...]  [Filtros ▼]  [Segmento ▼]  [Colunas ⚙]                     │
│                                                                             │
│  [+ Novo Contato]  [↑ Importar]  [↓ Exportar]  [🔄 Duplicatas]              │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ □ │ Nome          │ Email            │ Telefone    │ Segmento │ Acoes  ││
│  ├───┼───────────────┼──────────────────┼─────────────┼──────────┼────────┤│
│  │ □ │ Maria Silva   │ maria@email.com  │ 11999998888 │ 🟢 VIP   │ ⚡ ✏ 🗑 ││
│  │ □ │ Joao Santos   │ joao@empresa.com │ 11988887777 │ 🔵 Lead  │ ⚡ ✏ 🗑 ││
│  │ □ │ Ana Costa     │ ana@corp.com     │ 11977776666 │ —        │ ⚡ ✏ 🗑 ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  Mostrando 1-20 de 150 contatos          [◀ Anterior] [1] [2] [3] [▶ Prox] │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Sub-menu Pessoas/Empresas:**
- **Pessoas:** Lista apenas contatos do tipo 'pessoa'
- **Empresas:** Lista apenas contatos do tipo 'empresa'
- Contador de registros ao lado de cada aba

**Criterios de Aceitacao:**
- [ ] Pagina acessivel via menu lateral em `/contatos`
- [ ] Sub-menu com abas Pessoas e Empresas
- [ ] Cada aba exibe contador de registros
- [ ] URL reflete a aba: `/contatos/pessoas` e `/contatos/empresas`
- [ ] Estado da aba persiste na navegacao

**Prioridade:** Must-have

---

### RF-002: Lista de Contatos com Colunas Fixas e Configuraveis

**User Story:**
Como Admin ou Member,
Quero visualizar contatos em uma lista com colunas fixas e personalizaveis,
Para ver as informacoes mais importantes de forma consistente.

**Descricao:**

Tabela paginada com colunas fixas (nao podem ser ocultadas) e campos customizaveis (podem ser mostrados/ocultados).

#### Contatos > Pessoas

**Ordem das Colunas:**

| Ordem | Coluna | Tipo | Pode Ocultar | Descricao |
|-------|--------|------|--------------|-----------|
| 1 | Nome | FIXA | NAO | Nome + indicador de oportunidades |
| 2-N | [Campos Customizaveis] | Dinamica | SIM | Campos globais de /configuracoes |
| N+1 | Empresa Vinculada | FIXA | NAO | Nome da empresa vinculada ou "—" |
| N+2 | Segmentacao | FIXA | NAO | Badges coloridos dos segmentos |
| N+3 | Atribuido A | FIXA | NAO | Nome do responsavel |
| N+4 | Status | FIXA | NAO | Badge Ativo/Inativo |
| N+5 | Acoes | FIXA | NAO | Visualizar (olho), Excluir (lixeira) |

**Coluna Nome - Formato:**
- Se TEM oportunidades: "Rafael"
- Se NAO tem oportunidades: "Rafael · Sem oportunidades +"
  - O texto "Sem oportunidades +" e clicavel
  - Ao clicar no "+", abre modal de criacao de oportunidade (RF-011)

**Layout da Linha (Pessoas):**

```
┌─────┬────────────────────────────────┬─────────┬─────────────┬───────────┬────────┬───────┬────────┐
│  □  │ Nome                           │ Cargo   │ Empresa     │ Segmento  │ Resp.  │Status │ Acoes  │
├─────┼────────────────────────────────┼─────────┼─────────────┼───────────┼────────┼───────┼────────┤
│  □  │ Rafael · Sem oportunidades +   │ Diretor │ TechCorp    │ 🔵 VIP    │ Maria  │ Ativo │ 👁 🗑  │
│  □  │ Maria Silva                    │ Gerente │ —           │ 🟢 Lead   │ Joao   │ Ativo │ 👁 🗑  │
└─────┴────────────────────────────────┴─────────┴─────────────┴───────────┴────────┴───────┴────────┘
```

#### Contatos > Empresas

**Ordem das Colunas:**

| Ordem | Coluna | Tipo | Pode Ocultar | Descricao |
|-------|--------|------|--------------|-----------|
| 1 | Nome da Empresa | FIXA | NAO | Campo principal (nome fantasia) |
| 2-N | [Campos Customizaveis] | Dinamica | SIM | Razao Social, CNPJ, outros |
| N+1 | Pessoa Vinculada | FIXA | NAO | "nome (+N)" se houver mais pessoas |
| N+2 | Status | FIXA | NAO | Badge "Ativa"/"Inativa" |
| N+3 | Acoes | FIXA | NAO | Visualizar (olho), Excluir (lixeira) |

**Coluna Pessoa Vinculada - Formato:**
- Se 0 pessoas: "—"
- Se 1 pessoa: "carlos"
- Se 2+ pessoas: "carlos (+1)" ou "carlos (+2)"

**Layout da Linha (Empresas):**

```
┌─────┬─────────────────────────┬─────────────────┬────────┬────────┐
│  □  │ Nome da Empresa         │ Pessoa Vinculada│ Status │ Acoes  │
├─────┼─────────────────────────┼─────────────────┼────────┼────────┤
│  □  │ TechCorp LTDA           │ carlos (+2)     │ Ativa  │ 👁 🗑  │
│  □  │ Renove Digital          │ maria           │ Ativa  │ 👁 🗑  │
│  □  │ StartupX                │ —               │ Ativa  │ 👁 🗑  │
└─────┴─────────────────────────┴─────────────────┴────────┴────────┘
```

**Colunas Ocultas por Padrao (Empresas):**
- Razao Social
- CNPJ
- Segmento de Mercado
- Porte
- Website
- Endereco completo

**Criterios de Aceitacao:**
- [ ] Lista exibe contatos paginados
- [ ] Colunas fixas sempre visiveis e nao podem ser ocultadas
- [ ] Campos customizaveis podem ser mostrados/ocultados via RF-005
- [ ] "Sem oportunidades +" aparece na coluna Nome para pessoas sem oportunidades
- [ ] Clicar em "+" abre modal de criacao de oportunidade
- [ ] Pessoa Vinculada mostra contador quando mais de uma pessoa
- [ ] Ordenacao por qualquer coluna (clicando no header)

**Prioridade:** Must-have

---

### RF-003: Busca por Nome, Email, Telefone

**User Story:**
Como Admin ou Member,
Quero buscar contatos por nome, email ou telefone,
Para encontrar rapidamente quem estou procurando.

**Descricao:**

Campo de busca unificado que pesquisa em multiplos campos simultaneamente.

**Comportamento:**
- Busca inicia apos 3 caracteres ou tecla Enter
- Debounce de 300ms para evitar requisicoes excessivas
- Busca em: `nome`, `email`, `telefone`
- Para Pessoas: busca tambem em `sobrenome`, `cargo`
- Para Empresas: busca tambem em `razao_social`, `cnpj`

**Criterios de Aceitacao:**
- [ ] Campo de busca presente no topo da lista
- [ ] Busca funciona em tempo real (debounce 300ms)
- [ ] Resultados atualizam a lista imediatamente
- [ ] Busca case-insensitive
- [ ] Icone de limpar busca (X) quando ha texto

**Prioridade:** Must-have

---

### RF-004: Filtros por Segmento, Responsavel, Status, Periodo

**User Story:**
Como Admin,
Quero filtrar contatos por diversos criterios,
Para analisar subconjuntos especificos da minha base.

**Descricao:**

Painel de filtros com multiplos criterios combinaveis.

**Filtros Disponiveis:**

| Filtro | Tipo | Visivel para |
|--------|------|--------------|
| Segmento | Multi-select | Admin, Member |
| Responsavel | Select | APENAS Admin |
| Status | Select (novo, lead, mql, sql, cliente, perdido) | Admin, Member |
| Origem | Select | Admin, Member |
| Periodo de Criacao | Date range | Admin, Member |

**REGRA CRITICA - Filtro Responsavel:**
- **Admin:** Ve filtro de responsavel com todos os Members da equipe
- **Member:** NAO ve filtro de responsavel (oculto automaticamente)

**Criterios de Aceitacao:**
- [ ] Filtros combinaveis (E logico)
- [ ] Contador de filtros ativos no botao
- [ ] Botao "Limpar filtros"
- [ ] Filtros persistem durante a sessao
- [ ] Admin ve filtro de responsavel, Member nao

**Prioridade:** Must-have

---

### RF-005: Toggle de Colunas (Campos Globais)

**User Story:**
Como Admin ou Member,
Quero escolher quais campos customizaveis aparecem como colunas na lista,
Para personalizar minha visualizacao sem perder as colunas essenciais.

**Descricao:**

Popover com checkboxes para mostrar/ocultar colunas. Colunas fixas (definidas em RF-002) nao podem ser ocultadas.

**Layout do Popover - Pessoas:**

```
┌─────────────────────────────────────┐
│  Colunas Visiveis              [X] │
├─────────────────────────────────────┤
│  ── Colunas Fixas ──                │
│  ☑ Nome                 (bloqueado) │
│  ☑ Empresa Vinculada    (bloqueado) │
│  ☑ Segmentacao          (bloqueado) │
│  ☑ Atribuido A          (bloqueado) │
│  ☑ Status               (bloqueado) │
│  ☑ Acoes                (bloqueado) │
│                                     │
│  ── Campos Globais ──               │
│  ☐ Email                            │
│  ☐ Telefone                         │
│  ☐ Cargo                            │
│  ☐ Data de Nascimento               │
│  ☐ LinkedIn                         │
│  ☐ Origem                           │
│                                     │
│  [Restaurar Padrao]                 │
└─────────────────────────────────────┘
```

**Layout do Popover - Empresas:**

```
┌─────────────────────────────────────┐
│  Colunas Visiveis              [X] │
├─────────────────────────────────────┤
│  ── Colunas Fixas ──                │
│  ☑ Nome da Empresa      (bloqueado) │
│  ☑ Pessoa Vinculada     (bloqueado) │
│  ☑ Status               (bloqueado) │
│  ☑ Acoes                (bloqueado) │
│                                     │
│  ── Campos Globais ──               │
│  ☐ Razao Social                     │
│  ☐ CNPJ                             │
│  ☐ Segmento de Mercado              │
│  ☐ Porte                            │
│  ☐ Website                          │
│  ☐ Endereco                         │
│                                     │
│  [Restaurar Padrao]                 │
└─────────────────────────────────────┘
```

**Comportamento:**
- **Colunas fixas:** Checkbox marcado e desabilitado (cinza), NAO podem ser desmarcadas
- **Campos customizaveis:** Podem ser mostrados/ocultados livremente
- Configuracao salva por usuario (localStorage ou preferencias_usuario)
- Botao "Restaurar Padrao" volta para configuracao inicial (apenas colunas fixas)
- Popover funciona TANTO para Pessoas quanto para Empresas

**Criterios de Aceitacao:**
- [ ] Popover abre ao clicar em icone de engrenagem
- [ ] Lista campos padrao e campos globais separadamente
- [ ] Checkboxes controlam visibilidade das colunas
- [ ] Configuracao persiste entre sessoes
- [ ] Botao restaurar padrao funciona

**Prioridade:** Should-have

---

### RF-006: Sistema de Segmentacao

**User Story:**
Como Admin,
Quero criar segmentos com nome e cor para organizar meus contatos,
Para facilitar filtragem e campanhas futuras.

**Descricao:**

CRUD completo de segmentos que podem ser vinculados a contatos (N:N).

**Layout do Modal - Gerenciar Segmentos:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Gerenciar Segmentos                                                   [X] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [+ Novo Segmento]                                                          │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ 🟢 VIP                     12 contatos                    [✏] [🗑]     ││
│  │ 🔵 Lead CSV Renove         45 contatos                    [✏] [🗑]     ││
│  │ 🟡 Teste Automacao         8 contatos                     [✏] [🗑]     ││
│  │ 🟣 Campanha Janeiro        23 contatos                    [✏] [🗑]     ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  [Fechar]                                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Layout do Modal - Criar/Editar Segmento:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Novo Segmento                                                         [X] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Nome do Segmento *                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ Ex: Leads Qualificados                                                  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  Cor *                                                                      │
│  [🟢] [🔵] [🟡] [🟠] [🔴] [🟣] [⚫] [⚪]                                       │
│                                                                             │
│  Descricao (opcional)                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                                                                         ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  [Cancelar]                                      [Salvar Segmento]          │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Cores Disponiveis:**
| Cor | Hex |
|-----|-----|
| Verde | #22C55E |
| Azul | #3B82F6 |
| Amarelo | #EAB308 |
| Laranja | #F97316 |
| Vermelho | #EF4444 |
| Roxo | #A855F7 |
| Preto | #1F2937 |
| Cinza | #9CA3AF |

**Vincular Segmento a Contato:**
- Na linha do contato: dropdown para adicionar/remover segmentos
- Na edicao do contato: campo multi-select de segmentos
- Na importacao: selecao de segmento para todos os registros

**Criterios de Aceitacao:**
- [ ] CRUD completo de segmentos (criar, listar, editar, excluir)
- [ ] Segmento tem nome obrigatorio e cor obrigatoria
- [ ] Segmento pode ser vinculado a multiplos contatos
- [ ] Contato pode ter multiplos segmentos
- [ ] Badge colorido exibido na lista de contatos
- [ ] Apenas Admin pode criar/editar/excluir segmentos
- [ ] Member pode apenas visualizar e filtrar por segmento

**Prioridade:** Must-have

---

### RF-007: Deteccao de Duplicatas

**User Story:**
Como Admin,
Quero identificar e mesclar contatos duplicados,
Para manter minha base limpa e confiavel.

**Descricao:**

Sistema de deteccao automatica de duplicatas com interface para revisao e mesclagem.

**Criterios de Duplicata:**
| Criterio | Peso | Descricao |
|----------|------|-----------|
| Email identico | Alto | Emails iguais (case-insensitive) |
| Telefone identico | Alto | Telefones normalizados (apenas digitos) |
| Nome similar + Empresa | Medio | Levenshtein distance < 3 + mesma empresa |

**Layout da Interface de Duplicatas:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Possiveis Duplicatas                                                  [X] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Encontramos 5 grupos de possiveis duplicatas                               │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ Grupo 1 - Email identico                                                ││
│  │ ┌─────────────────────────┐ ┌─────────────────────────┐                 ││
│  │ │ Maria Silva             │ │ Maria S.                │                 ││
│  │ │ maria@email.com         │ │ maria@email.com         │                 ││
│  │ │ 11999998888             │ │ (11) 99999-8888         │                 ││
│  │ │ Criado: 15/01/2026      │ │ Criado: 20/01/2026      │                 ││
│  │ │ [◉ Manter este]         │ │ [○ Mesclar neste]       │                 ││
│  │ └─────────────────────────┘ └─────────────────────────┘                 ││
│  │ [Mesclar Selecionados]  [Nao sao duplicatas]                            ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ Grupo 2 - Telefone identico                                             ││
│  │ ...                                                                     ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Acoes:**
- **Mesclar:** Une dois ou mais contatos em um (mantendo o selecionado como principal)
- **Nao sao duplicatas:** Marca o grupo como revisado (nao aparece mais)
- **Pular:** Ignora temporariamente o grupo

**Comportamento da Mesclagem:**
1. Contato principal mantem seus dados
2. Campos vazios sao preenchidos com dados do secundario
3. Segmentos sao unificados
4. Oportunidades sao transferidas para o principal
5. Contato secundario e soft-deleted
6. Registro em audit_log

**Criterios de Aceitacao:**
- [ ] Botao "Duplicatas" abre modal com grupos detectados
- [ ] Comparacao lado a lado dos contatos
- [ ] Selecao de qual manter como principal
- [ ] Mesclagem preserva dados e transfere oportunidades
- [ ] Opcao de marcar como "nao duplicata"
- [ ] Apenas Admin pode mesclar duplicatas

**Prioridade:** Should-have

---

### RF-008: Importacao CSV/XLSX

**User Story:**
Como Admin,
Quero importar contatos de um arquivo CSV ou XLSX,
Para migrar bases externas rapidamente para o CRM.

**Descricao:**

Wizard de 4 etapas para importacao em massa de contatos.

**Restricoes:**
- Tamanho maximo: 5MB
- Formatos: CSV (separador ; ou ,) e XLSX
- Maximo de registros: 10.000 por arquivo
- Encoding: UTF-8 (CSV)

**Etapa 1 - Upload:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Importar Contatos                                                     [X] │
├─────────────────────────────────────────────────────────────────────────────┤
│  Etapa 1 de 4: Upload                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                                                                         ││
│  │                    📁 Arraste seu arquivo aqui                          ││
│  │                                                                         ││
│  │                    ou [Selecionar Arquivo]                              ││
│  │                                                                         ││
│  │              Formatos: CSV, XLSX | Maximo: 5MB                          ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  [Cancelar]                                                    [Proximo →] │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Etapa 2 - Mapeamento:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Importar Contatos                                                     [X] │
├─────────────────────────────────────────────────────────────────────────────┤
│  Etapa 2 de 4: Mapeamento de Campos                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Tipo de Contato: [Pessoa ▼]                                                │
│                                                                             │
│  Coluna do Arquivo          →     Campo do CRM                              │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ nome_cliente              →     [Nome *               ▼]              │ │
│  │ email_contato             →     [Email                ▼]              │ │
│  │ telefone                  →     [Telefone             ▼]              │ │
│  │ empresa                   →     [— Ignorar —          ▼]              │ │
│  │ cargo_atual               →     [Cargo                ▼]              │ │
│  │ data_cadastro             →     [— Ignorar —          ▼]              │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  * Campo obrigatorio                                                        │
│                                                                             │
│  Preview (primeiras 5 linhas):                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ Maria Silva | maria@email.com | 11999... | Empresa X | Gerente        │ │
│  │ Joao Santos | joao@corp.com   | 1188... | Empresa Y | Diretor         │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  [← Voltar]                                                   [Proximo →]  │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Etapa 3 - Segmentacao (Opcional):**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Importar Contatos                                                     [X] │
├─────────────────────────────────────────────────────────────────────────────┤
│  Etapa 3 de 4: Segmentacao                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Deseja adicionar estes contatos a um segmento?                             │
│                                                                             │
│  [○] Nao adicionar a nenhum segmento                                        │
│                                                                             │
│  [○] Adicionar a segmento existente:                                        │
│      [Selecionar segmento...              ▼]                                │
│                                                                             │
│  [○] Criar novo segmento:                                                   │
│      Nome: [Leads CSV Janeiro 2026        ]                                 │
│      Cor:  [🔵] [🟢] [🟡] [🟠] [🔴] [🟣]                                      │
│                                                                             │
│  [← Voltar]                                                   [Proximo →]  │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Etapa 4 - Resultado:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Importar Contatos                                                     [X] │
├─────────────────────────────────────────────────────────────────────────────┤
│  Etapa 4 de 4: Resultado                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ✅ Importacao concluida com sucesso!                                       │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  📊 Resumo                                                              ││
│  │                                                                         ││
│  │  Total de registros:        150                                         ││
│  │  ✅ Importados com sucesso: 142                                         ││
│  │  ⚠️ Duplicatas ignoradas:   5                                           ││
│  │  ❌ Erros:                   3                                           ││
│  │                                                                         ││
│  │  Segmento aplicado: 🔵 Leads CSV Janeiro 2026                           ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  [↓ Baixar relatorio de erros]                                              │
│                                                                             │
│  [Fechar]                                              [Ver Contatos →]     │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Tratamento de Duplicatas na Importacao:**
- Verifica email e telefone antes de inserir
- Duplicatas sao ignoradas (nao sobrescrevem)
- Relatorio final lista duplicatas encontradas

**Criterios de Aceitacao:**
- [ ] Upload aceita CSV e XLSX ate 5MB
- [ ] Mapeamento automatico por nome similar de coluna
- [ ] Usuario pode ajustar mapeamento manualmente
- [ ] Campo Nome e obrigatorio no mapeamento
- [ ] Etapa de segmentacao opcional
- [ ] Pode criar novo segmento durante importacao
- [ ] Resumo final mostra importados/duplicados/erros
- [ ] Apenas Admin pode importar contatos
- [ ] Registro em `importacoes_contatos` com historico

**Prioridade:** Must-have

---

### RF-009: Exportacao de Contatos

**User Story:**
Como Admin ou Member,
Quero exportar contatos para CSV,
Para usar em outras ferramentas ou backup.

**Descricao:**

Exportacao com selecao de colunas e filtros aplicados.

**Layout do Modal de Exportacao:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Exportar Contatos                                                     [X] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Formato: [CSV ▼]                                                           │
│                                                                             │
│  Selecione as colunas para exportar:                                        │
│                                                                             │
│  ☑ Selecionar todas                                                         │
│                                                                             │
│  ── Campos Padrao ──                                                        │
│  ☑ Nome                                                                     │
│  ☑ Email                                                                    │
│  ☑ Telefone                                                                 │
│  ☑ Tipo (Pessoa/Empresa)                                                    │
│  ☑ Status                                                                   │
│  ☑ Segmentos                                                                │
│                                                                             │
│  ── Campos Globais ──                                                       │
│  ☐ Data de Nascimento                                                       │
│  ☐ Cargo                                                                    │
│  ☐ LinkedIn                                                                 │
│                                                                             │
│  Filtros aplicados: Segmento = "VIP", Status = "Lead"                       │
│  Total de registros: 45                                                     │
│                                                                             │
│  [Cancelar]                                           [↓ Exportar CSV]      │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Comportamento:**
- Exporta apenas contatos visiveis (respeitando filtros)
- Admin exporta qualquer contato filtrado
- Member exporta apenas seus contatos
- Nome do arquivo: `contatos_YYYYMMDD_HHMMSS.csv`

**Criterios de Aceitacao:**
- [ ] Selecao de colunas a exportar
- [ ] Respeita filtros aplicados na lista
- [ ] Formato CSV com separador ponto-e-virgula
- [ ] Encoding UTF-8 com BOM (compativel com Excel)
- [ ] Member exporta apenas seus contatos
- [ ] Admin exporta todos (filtrados)

**Prioridade:** Should-have

---

### RF-010: Modal de Novo Contato

**User Story:**
Como Admin ou Member,
Quero criar um novo contato rapidamente,
Para cadastrar pessoas ou empresas no CRM.

**Descricao:**

Modal com formulario dinamico baseado no tipo de contato (Pessoa ou Empresa).

**Layout do Modal - Pessoa:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  + Novo Contato                                                        [X] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Tipo de Contato                                                            │
│  [◉ Pessoa]  [○ Empresa]                                                    │
│                                                                             │
│  ── Informacoes Basicas ──                                                  │
│                                                                             │
│  Nome *                           Sobrenome                                 │
│  ┌────────────────────────────┐   ┌────────────────────────────┐           │
│  │                            │   │                            │           │
│  └────────────────────────────┘   └────────────────────────────┘           │
│                                                                             │
│  Email                            Telefone                                  │
│  ┌────────────────────────────┐   ┌────────────────────────────┐           │
│  │                            │   │                            │           │
│  └────────────────────────────┘   └────────────────────────────┘           │
│                                                                             │
│  Empresa (vincular)               Cargo                                     │
│  ┌────────────────────────────┐   ┌────────────────────────────┐           │
│  │ [Buscar empresa...]    [⚙]│   │                            │           │
│  └────────────────────────────┘   └────────────────────────────┘           │
│                                                                             │
│  ── Campos Globais ──                                                       │
│                                                                             │
│  [Campo customizado 1]            [Campo customizado 2]                     │
│  ┌────────────────────────────┐   ┌────────────────────────────┐           │
│  │                            │   │                            │           │
│  └────────────────────────────┘   └────────────────────────────┘           │
│                                                                             │
│  ── Atribuicao ──                                                           │
│                                                                             │
│  Status                           Responsavel (Admin only)                  │
│  ┌────────────────────────────┐   ┌────────────────────────────┐           │
│  │ [Novo                   ▼]│   │ [Selecionar...         ▼]│            │
│  └────────────────────────────┘   └────────────────────────────┘           │
│                                                                             │
│  Segmentos                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ [+ Adicionar segmento...]                                               ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  [Cancelar]                                            [Salvar Contato]     │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Layout do Modal - Empresa:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  + Novo Contato                                                        [X] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Tipo de Contato                                                            │
│  [○ Pessoa]  [◉ Empresa]                                                    │
│                                                                             │
│  ── Informacoes Basicas ──                                                  │
│                                                                             │
│  Nome Fantasia *                  Razao Social                              │
│  ┌────────────────────────────┐   ┌────────────────────────────┐           │
│  │                            │   │                            │           │
│  └────────────────────────────┘   └────────────────────────────┘           │
│                                                                             │
│  CNPJ                             Website                                   │
│  ┌────────────────────────────┐   ┌────────────────────────────┐           │
│  │                            │   │                            │           │
│  └────────────────────────────┘   └────────────────────────────┘           │
│                                                                             │
│  Email                            Telefone                                  │
│  ┌────────────────────────────┐   ┌────────────────────────────┐           │
│  │                            │   │                            │           │
│  └────────────────────────────┘   └────────────────────────────┘           │
│                                                                             │
│  Segmento de Mercado              Porte                                     │
│  ┌────────────────────────────┐   ┌────────────────────────────┐           │
│  │ [Selecionar...         ▼]│   │ [Selecionar...         ▼]│             │
│  └────────────────────────────┘   └────────────────────────────┘           │
│                                                                             │
│  ── Endereco ──                                                             │
│                                                                             │
│  CEP                  Logradouro                       Numero               │
│  ┌──────────────┐     ┌──────────────────────────┐     ┌──────────┐        │
│  │              │     │                          │     │          │        │
│  └──────────────┘     └──────────────────────────┘     └──────────┘        │
│                                                                             │
│  Complemento          Bairro            Cidade         Estado               │
│  ┌──────────────┐     ┌────────────┐    ┌─────────┐    ┌─────┐             │
│  │              │     │            │    │         │    │  ▼ │             │
│  └──────────────┘     └────────────┘    └─────────┘    └─────┘             │
│                                                                             │
│  [Cancelar]                                            [Salvar Contato]     │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Vinculo Pessoa-Empresa:**
- Ao criar Pessoa, pode buscar e vincular a uma Empresa existente
- Icone de engrenagem [⚙] permite criar nova Empresa inline
- Campo `empresa_id` em `contatos_pessoas` armazena o vinculo

**REGRA - Campo Responsavel:**
- **Admin:** Ve campo para selecionar responsavel (qualquer Member)
- **Member:** NAO ve campo (automaticamente atribuido a si mesmo)

**Criterios de Aceitacao:**
- [ ] Toggle entre Pessoa e Empresa muda formulario
- [ ] Campos globais carregados dinamicamente de /configuracoes
- [ ] Validacao de campos obrigatorios (Nome)
- [ ] Validacao de formato (Email, CNPJ, Telefone)
- [ ] Busca de empresa existente funcional
- [ ] Multi-select de segmentos
- [ ] Member sempre e owner do contato que cria
- [ ] Admin pode definir outro responsavel

**Prioridade:** Must-have

---

### RF-011: Criacao de Oportunidade a partir do Contato

**User Story:**
Como Admin ou Member,
Quero criar uma oportunidade diretamente da lista de contatos,
Para agilizar a conversao de um contato em negocio.

**Descricao:**

Botao de acao rapida na linha do contato que abre modal de criacao de oportunidade (conforme PRD-07).

**Fluxo:**
1. Usuario clica no icone de raio [⚡] na coluna Acoes
2. Abre modal "Selecionar Pipeline"
3. Usuario escolhe pipeline (dentre as que tem acesso)
4. Abre modal de criacao de oportunidade (PRD-07 RF-10)
5. Contato ja vem preenchido automaticamente

**Layout do Modal - Selecionar Pipeline:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Criar Oportunidade                                                    [X] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Contato: Maria Silva (maria@email.com)                                     │
│                                                                             │
│  Selecione a Pipeline:                                                      │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ [○] Vendas B2B                                                          ││
│  │     5 etapas | 23 oportunidades ativas                                  ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │ [○] Vendas B2C                                                          ││
│  │     4 etapas | 45 oportunidades ativas                                  ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │ [○] Parcerias                                                           ││
│  │     3 etapas | 8 oportunidades ativas                                   ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  [Cancelar]                                                    [Continuar]  │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Criterios de Aceitacao:**
- [ ] Botao de criar oportunidade visivel na coluna Acoes
- [ ] Lista apenas pipelines que o usuario tem acesso
- [ ] Apos selecionar pipeline, abre modal de oportunidade (PRD-07)
- [ ] Contato ja vem vinculado na nova oportunidade
- [ ] Member so cria oportunidade para seus contatos
- [ ] Admin pode criar para qualquer contato

**Prioridade:** Must-have

---

### RF-012: Visibilidade por Role

**User Story:**
Como sistema,
Quero garantir que cada role veja apenas os dados permitidos,
Para manter a seguranca e privacidade dos dados.

**Descricao:**

Regras de visibilidade aplicadas em todas as operacoes do modulo.

**Matriz de Permissoes:**

| Acao | Super Admin | Admin | Member |
|------|-------------|-------|--------|
| Acessar /contatos | NAO | SIM | SIM |
| Ver todos contatos | — | SIM | NAO (apenas seus) |
| Criar contato | — | SIM | SIM (como owner) |
| Editar contato | — | SIM | SIM (apenas seus) |
| Excluir contato | — | SIM | SIM (apenas seus) |
| Criar segmento | — | SIM | NAO |
| Editar segmento | — | SIM | NAO |
| Excluir segmento | — | SIM | NAO |
| Importar contatos | — | SIM | NAO |
| Exportar contatos | — | SIM (todos) | SIM (apenas seus) |
| Ver duplicatas | — | SIM | NAO |
| Mesclar duplicatas | — | SIM | NAO |
| Filtrar por responsavel | — | SIM | NAO (oculto) |
| **Selecao em lote** | — | SIM | SIM (apenas seus) |
| **Excluir em massa** | — | SIM | SIM (apenas seus) |
| **Exportar selecionados** | — | SIM | SIM (apenas seus) |
| **Atribuir vendedor em massa** | — | SIM | NAO |
| **Segmentar em massa** | — | SIM | SIM (apenas seus) |

**REGRA CRITICA - Query de Contatos:**

```typescript
// Admin: ve todos os contatos do tenant
const queryAdmin = `
  SELECT * FROM contatos
  WHERE organizacao_id = $1
  AND deletado_em IS NULL
`;

// Member: ve APENAS seus contatos
const queryMember = `
  SELECT * FROM contatos
  WHERE organizacao_id = $1
  AND owner_id = $2
  AND deletado_em IS NULL
`;
```

**Criterios de Aceitacao:**
- [ ] Super Admin NAO acessa /contatos
- [ ] Admin ve todos contatos do tenant
- [ ] Member ve APENAS contatos onde owner_id = seu id
- [ ] Todas operacoes validam permissao no backend
- [ ] Tentativa de acesso nao autorizado retorna 403
- [ ] RLS ativo no Supabase como camada adicional

**Prioridade:** Must-have (CRITICO)

---

### RF-013: Modal de Visualizacao do Contato

**User Story:**
Como Admin ou Member,
Quero visualizar todos os dados de um contato em um modal,
Para ter uma visao completa sem sair da lista.

**Descricao:**

Modal de visualizacao com abas para organizar informacoes. Pessoas tem 2 abas (Dados + Historico), Empresas tem apenas 1 aba (Dados).

#### Layout do Modal - Pessoas:

**Aba "Dados do Contato" (default):**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  👤 Maria Silva                                                  ⚙    [X]  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────┐  ┌───────────────────────────────────┐         │
│  │ ● Dados do Contato      │  │   Historico de Oportunidades  (3) │         │
│  └─────────────────────────┘  └───────────────────────────────────┘         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  👤 Informacoes de Contato                                                  │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  NOME                              E-MAIL                                   │
│  Maria Silva                       maria@empresa.com                        │
│                                                                             │
│  TELEFONE                          LINKEDIN                                 │
│  11999998888                       linkedin.com/in/maria                    │
│                                                                             │
│  CARGO                             EMPRESA                                  │
│  Gerente Comercial                 TechCorp LTDA                            │
│                                                                             │
│  [Campos customizados renderizados dinamicamente]                           │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  🏢 Status & Estagio                                                        │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  STATUS DO CONTATO          ESTAGIO DO CICLO          ORIGEM                │
│  [Ativo]                    Lead                      Google Ads            │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  📅 Criado em 14/01/2026              📅 Atualizado em 27/01/2026           │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  [🗑 Excluir]                                        [Fechar]  [✏ Editar]   │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Aba "Historico de Oportunidades":**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  👤 Maria Silva                                                  ⚙    [X]  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────┐  ┌───────────────────────────────────┐         │
│  │   Dados do Contato      │  │ ● Historico de Oportunidades  (3) │         │
│  └─────────────────────────┘  └───────────────────────────────────┘         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ ⏱ TechCorp Playwright - jan. de 2026                              👁   ││
│  │                                                                         ││
│  │ $ R$ 15.000,00                                                          ││
│  │ 📅 Criado em 10/01/2026                                                 ││
│  │ 🏢 Pipeline Vendas B2B                                                  ││
│  │                                                                         ││
│  │ [● Em Negociacao]                                    [Em Andamento]     ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ ⏱ Projeto Dashboard - dez. de 2025                               👁    ││
│  │ ...                                                                     ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  [🗑 Excluir]                                                    [Fechar]   │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Se nenhuma oportunidade:**
```
│                                                                             │
│                          Sem oportunidades +                                │
│                                                                             │
│  O "+" e clicavel e abre modal de criacao de oportunidade (RF-011)          │
│                                                                             │
```

#### Layout do Modal - Empresas (SEM aba de Historico):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🏢 TechCorp LTDA                                                ⚙    [X]  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────┐                                                │
│  │ ● Dados da Empresa      │    (Sem aba de historico para empresas)        │
│  └─────────────────────────┘                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🏢 Informacoes da Empresa                                                  │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  NOME DA EMPRESA                   RAZAO SOCIAL                             │
│  TechCorp LTDA                     TechCorp Solucoes em TI LTDA             │
│                                                                             │
│  CNPJ                              WEBSITE                                  │
│  12.345.678/0001-90                www.techcorp.com.br                      │
│                                                                             │
│  SEGMENTO                          PORTE                                    │
│  Tecnologia                        Medio (50-200 funcionarios)              │
│                                                                             │
│  [Campos customizados renderizados dinamicamente]                           │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  📍 Endereco                                                                │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Rua das Flores, 123 - Sala 45                                              │
│  Jardim Paulista - Sao Paulo/SP - 01234-567                                 │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  📅 Criado em 14/01/2026              📅 Atualizado em 27/01/2026           │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  [🗑 Excluir]                                        [Fechar]  [✏ Editar]   │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Acoes do Modal:**
- **Botao [✏ Editar]:** Abre modal de edicao do contato (RF-010)
- **Botao [🗑 Excluir]:** Inicia fluxo de exclusao (RF-014)
- **Botao [Fechar]:** Fecha o modal
- **Icone 👁 (olho) em oportunidade:** Navega para detalhes da oportunidade

**Criterios de Aceitacao:**
- [ ] Modal abre ao clicar no icone de olho (👁) na coluna Acoes
- [ ] Pessoas mostram 2 abas: Dados do Contato + Historico de Oportunidades
- [ ] Empresas mostram apenas 1 aba: Dados da Empresa
- [ ] Contador de oportunidades exibido na aba (ex: "(3)")
- [ ] Campos customizados carregados dinamicamente
- [ ] "Sem oportunidades +" clicavel quando nao ha oportunidades
- [ ] Botao Editar abre modal de edicao
- [ ] Botao Excluir inicia fluxo de confirmacao

**Prioridade:** Must-have

---

### RF-014: Exclusao com Confirmacao

**User Story:**
Como Admin ou Member,
Quero excluir um contato com confirmacao,
Para evitar exclusoes acidentais e manter a integridade dos dados.

**Descricao:**

Exclusao **permanente** (DELETE fisico) com modal de confirmacao e bloqueio quando ha vinculos.

**IMPORTANTE:** Este modulo utiliza DELETE fisico (permanente), NAO soft delete.

**Layout do Modal de Confirmacao:**

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️ Excluir Contato                                        [X] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Tem certeza que deseja excluir este contato?                   │
│                                                                 │
│  ⚠️ Esta acao nao pode ser desfeita.                            │
│                                                                 │
│  O contato "Maria Silva" sera removido permanentemente.         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                              [Cancelar]  [🗑 Excluir]            │
└─────────────────────────────────────────────────────────────────┘
```

#### REGRA CRITICA - Bloqueio de Exclusao (Pessoas):

Se a pessoa tem oportunidades vinculadas, a exclusao e bloqueada:

```
┌─────────────────────────────────────────────────────────────────┐
│  ❌ Nao e possivel excluir                                 [X] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Este contato possui 3 oportunidade(s) vinculada(s).            │
│                                                                 │
│  Para excluir, primeiro remova ou transfira as oportunidades.   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                    [Entendi]    │
└─────────────────────────────────────────────────────────────────┘
```

#### REGRA CRITICA - Bloqueio de Exclusao (Empresas):

Se a empresa tem pessoas vinculadas, a exclusao e bloqueada:

```
┌─────────────────────────────────────────────────────────────────┐
│  ❌ Nao e possivel excluir                                 [X] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Esta empresa possui 5 pessoa(s) vinculada(s).                  │
│                                                                 │
│  Para excluir, primeiro desvincule as pessoas.                  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                    [Entendi]    │
└─────────────────────────────────────────────────────────────────┘
```

**Fluxo de Exclusao:**
1. Usuario clica no icone lixeira (lista) ou botao [Excluir] (modal)
2. Sistema verifica vinculos:
   - Pessoa: verifica oportunidades vinculadas
   - Empresa: verifica pessoas vinculadas
3. Se ha vinculos: mostra modal de bloqueio
4. Se nao ha vinculos: mostra modal de confirmacao
5. Usuario confirma: DELETE fisico executado
6. Registro em audit_log antes da exclusao

**Criterios de Aceitacao:**
- [ ] Confirmacao obrigatoria antes de excluir
- [ ] Pessoa com oportunidades NAO pode ser excluida
- [ ] Empresa com pessoas vinculadas NAO pode ser excluida
- [ ] Exclusao e permanente (DELETE fisico)
- [ ] Registro em audit_log antes da exclusao
- [ ] Segmentos desvinculados em cascata (contatos_segmentos)
- [ ] Mensagem clara sobre irreversibilidade

**Prioridade:** Must-have

---

### RF-015: Performance para Alto Volume

**User Story:**
Como sistema,
Quero suportar bases com 100.000+ contatos,
Para garantir boa experiencia mesmo em tenants com grande volume.

**Descricao:**

Estrategias de performance para garantir fluidez com grandes volumes de dados.

#### 1. Paginacao Backend (Cursor-based)

```typescript
// Endpoint
GET /api/v1/contatos?cursor=<last_id>&limit=50&tipo=pessoa

// Response
{
  data: [...],
  nextCursor: "uuid-do-ultimo-item",
  hasMore: true,
  total: 100000
}
```

**Configuracao:**
- Limite padrao: 50 registros
- Opcoes disponiveis: 25, 50, 100
- Cursor baseado em ID (NAO offset)
- Ordenacao consistente por `criado_em DESC, id`

**Por que cursor-based?**
- Offset-based degrada com volumes grandes (O(n) para pular registros)
- Cursor-based e constante (O(1)) independente da posicao

#### 2. Virtualizacao Frontend

```typescript
// Bibliotecas recomendadas
import { useVirtualizer } from '@tanstack/react-virtual';
// ou
import { FixedSizeList } from 'react-window';

// Configuracao
const virtualizer = useVirtualizer({
  count: totalItems,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 56, // Row height fixo
  overscan: 5,           // Rows extras para smooth scroll
});
```

**Configuracao:**
- Row height fixo: 56px
- Overscan: 5 rows (pre-renderiza antes/depois)
- Renderiza apenas rows visiveis no viewport

#### 3. Indices de Banco Obrigatorios

```sql
-- Index para listagem por tipo (mais usado)
CREATE INDEX idx_contatos_org_tipo ON contatos(organizacao_id, tipo, criado_em DESC)
  WHERE deletado_em IS NULL;

-- Index para filtragem por owner (Member)
CREATE INDEX idx_contatos_org_owner ON contatos(organizacao_id, owner_id, criado_em DESC)
  WHERE deletado_em IS NULL;

-- Index para busca full-text com trigram
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_contatos_nome_trgm ON contatos
  USING gin(nome gin_trgm_ops);

-- Index para email (busca exata e duplicatas)
CREATE INDEX idx_contatos_email ON contatos(organizacao_id, email)
  WHERE email IS NOT NULL AND deletado_em IS NULL;

-- Index para telefone (busca e duplicatas)
CREATE INDEX idx_contatos_telefone ON contatos(organizacao_id, telefone)
  WHERE telefone IS NOT NULL AND deletado_em IS NULL;
```

#### 4. Debounce e Cache

**Busca:**
- Debounce: 300ms
- Minimo de caracteres: 2
- Cache local de resultados recentes

**Contadores:**
- Cache local de totais
- Invalidacao em mutacoes (create/update/delete)
- Background refresh a cada 60s

**Campos Customizados:**
- Lazy loading (carrega apenas quando visivel)
- Cache de definicoes de campos

#### 5. Otimizacoes de Query

```sql
-- Query otimizada para listagem
SELECT
  c.id, c.nome, c.email, c.telefone, c.status,
  e.nome as empresa_nome,
  COALESCE(
    (SELECT COUNT(*) FROM oportunidades o WHERE o.contato_id = c.id),
    0
  ) as total_oportunidades
FROM contatos c
LEFT JOIN contatos_empresas e ON c.empresa_id = e.id
WHERE c.organizacao_id = $1
  AND c.tipo = 'pessoa'
  AND c.deletado_em IS NULL
  AND c.id > $2  -- cursor
ORDER BY c.criado_em DESC, c.id
LIMIT 51;  -- +1 para saber se hasMore
```

**Regras:**
- SELECT apenas campos necessarios (nunca SELECT *)
- JOINs apenas quando necessario
- Subqueries com COUNT limitadas
- LIMIT +1 para detectar hasMore sem COUNT total

**Criterios de Aceitacao:**
- [ ] Paginacao cursor-based implementada
- [ ] Virtualizacao de lista no frontend
- [ ] Indices de banco criados
- [ ] Debounce em busca (300ms)
- [ ] Tempo de carregamento inicial < 500ms (50 registros)
- [ ] Scroll fluido (60fps, < 16ms por frame)
- [ ] Suporte a 100.000+ contatos por tenant

**Prioridade:** Must-have

---

### RF-016: Selecao em Lote e Acoes em Massa

**User Story:**
Como Admin ou Member,
Quero selecionar multiplos contatos na lista,
Para executar acoes em massa como exportar, excluir, atribuir vendedor ou segmentar.

**Descricao:**

Sistema de checkbox em cada linha da lista com barra de acoes flutuante que aparece quando ha selecao.

#### Layout da Lista com Selecao - Pessoas:

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  Contatos > Pessoas                                              [🔍] [Colunas] [Filtros]│
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌───┐                                                                                  │
│  │ ☑ │ Total: 3.614        Ativos: 3.500        Novos Mes: 8                            │
│  └───┘ (selecionar todos)                                                               │
│                                                                                         │
│  ┌───┬──────────────────────────────┬─────────┬───────────┬────────┬───────┬────────┐  │
│  │ □ │ NOME                         │ CARGO   │ EMPRESA   │ SEGM.  │STATUS │ ACOES  │  │
│  ├───┼──────────────────────────────┼─────────┼───────────┼────────┼───────┼────────┤  │
│  │ ☑ │ Rafael · Sem oportunidades + │ Diretor │ TechCorp  │ 🔵 VIP │ Ativo │ 👁 🗑  │  │
│  │ ☑ │ Maria Silva                  │ Gerente │ —         │ 🟢 Lead│ Ativo │ 👁 🗑  │  │
│  │ □ │ Carlos Santos                │ Analista│ Renove    │ —      │ Ativo │ 👁 🗑  │  │
│  └───┴──────────────────────────────┴─────────┴───────────┴────────┴───────┴────────┘  │
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐│
│  │ 📋 2 pessoas selecionadas  [Atribuir Vendedor ▼] [Segmentacao ▼] [↓Exportar] [🗑Excluir] [✕Limpar] ││
│  └─────────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Layout da Lista com Selecao - Empresas:

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  Contatos > Empresas                                             [🔍] [Colunas] [Filtros]│
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌───┐                                                                                  │
│  │ ☑ │ Total: 18           Ativas: 18           Setores: 5                              │
│  └───┘ (selecionar todos)                                                               │
│                                                                                         │
│  ┌───┬─────────────────────────────┬─────────────────┬────────┬────────┐               │
│  │ □ │ EMPRESA                     │ CONTATO         │ STATUS │ ACOES  │               │
│  ├───┼─────────────────────────────┼─────────────────┼────────┼────────┤               │
│  │ ☑ │ TestCorp Validacao 2026     │ Acacia2         │ Ativa  │ 👁 🗑  │               │
│  │ ☑ │ TechVision Solutions        │ —               │ Ativa  │ 👁 🗑  │               │
│  │ ☑ │ Renove Digital Updated      │ carlos          │ Ativa  │ 👁 🗑  │               │
│  └───┴─────────────────────────────┴─────────────────┴────────┴────────┘               │
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐│
│  │ 🏢 18 empresas selecionadas                       [↓ Exportar] [🗑 Excluir] [✕ Limpar] ││
│  └─────────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Comportamento da Selecao

**Checkbox Individual:**
- Cada linha tem checkbox na primeira coluna
- Clicar marca/desmarca o item
- Estado visual: borda azul na linha selecionada

**Checkbox "Selecionar Todos":**
- No header da lista (ao lado de Total)
- Seleciona TODOS os itens da pagina atual
- Se ja houver selecao parcial: desmarca todos
- NAO seleciona itens de outras paginas (seguranca)

**Barra de Acoes Flutuante:**
- Aparece APENAS quando ha 1+ item selecionado
- Posicao: fixa no rodape da lista (sticky bottom)
- Desaparece ao limpar selecao

#### Acoes Disponiveis por Tipo

| Acao | Pessoas | Empresas | Descricao |
|------|---------|----------|-----------|
| Exportar | SIM | SIM | Exporta apenas selecionados para CSV |
| Excluir | SIM | SIM | Exclusao em massa com confirmacao |
| Atribuir Vendedor | SIM | NAO | Dropdown para selecionar responsavel |
| Segmentacao | SIM | NAO | Dropdown para adicionar/remover segmentos |
| Limpar | SIM | SIM | Desmarca todas as selecoes |

**REGRA CRITICA:** "Atribuir Vendedor" e "Segmentacao" sao exclusivos para PESSOAS.

#### Acao: Exportar Selecionados

**Fluxo:**
1. Usuario seleciona contatos
2. Clica em [↓ Exportar]
3. Modal de exportacao abre (RF-009)
4. Filtro automatico: apenas IDs selecionados
5. Exporta CSV

**Diferenca da exportacao normal:**
- Ignora filtros da lista
- Usa lista explicita de IDs selecionados

#### Acao: Excluir em Massa

**Fluxo:**
1. Usuario seleciona contatos
2. Clica em [🗑 Excluir]
3. Sistema verifica vinculos de TODOS os selecionados
4. Se ALGUM tiver vinculo: mostra bloqueio
5. Se nenhum tiver: mostra confirmacao
6. Usuario confirma: DELETE fisico em transacao

**Modal de Confirmacao (sem vinculos):**

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️ Excluir 5 Contatos                                     [X] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Tem certeza que deseja excluir 5 contato(s)?                   │
│                                                                 │
│  ⚠️ Esta acao nao pode ser desfeita.                            │
│                                                                 │
│  Os contatos selecionados serao removidos permanentemente.      │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                              [Cancelar]  [🗑 Excluir Todos]      │
└─────────────────────────────────────────────────────────────────┘
```

**Modal de Bloqueio (Pessoas com vinculos):**

```
┌─────────────────────────────────────────────────────────────────┐
│  ❌ Nao e possivel excluir                                 [X] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  2 contato(s) possuem oportunidades vinculadas:                 │
│                                                                 │
│  • Maria Silva (3 oportunidades)                                │
│  • Carlos Santos (1 oportunidade)                               │
│                                                                 │
│  Remova ou transfira as oportunidades antes de excluir.         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                    [Entendi]    │
└─────────────────────────────────────────────────────────────────┘
```

**Modal de Bloqueio (Empresas com vinculos):**

```
┌─────────────────────────────────────────────────────────────────┐
│  ❌ Nao e possivel excluir                                 [X] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  3 empresa(s) possuem pessoas vinculadas:                       │
│                                                                 │
│  • TechCorp (5 pessoas)                                         │
│  • Renove Digital (3 pessoas)                                   │
│  • StartupX (1 pessoa)                                          │
│                                                                 │
│  Desvincule as pessoas antes de excluir.                        │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                    [Entendi]    │
└─────────────────────────────────────────────────────────────────┘
```

#### Acao: Atribuir Vendedor (APENAS Pessoas)

**Fluxo:**
1. Usuario seleciona pessoas
2. Clica em [Atribuir Vendedor ▼]
3. Dropdown abre com lista de membros da equipe
4. Usuario seleciona vendedor
5. Sistema atualiza `owner_id` de todos os selecionados

**Layout do Dropdown:**

```
┌─────────────────────────────────────────┐
│  Atribuir 2 contato(s) para:            │
├─────────────────────────────────────────┤
│  👤 Teste                               │
│     teste.membro@renovedigit...         │
├─────────────────────────────────────────┤
│  👤 gabriel                             │
│     gabriel@renovedigital.com...        │
├─────────────────────────────────────────┤
│  👤 Rafael                              │
│     rafael@renovedigital.com.br         │
├─────────────────────────────────────────┤
│  👤 Carlos                              │
│     carlos@renovedigital.com.br         │
├─────────────────────────────────────────┤
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ✕ Remover atribuicao                   │
└─────────────────────────────────────────┘
```

**Regras:**
- Lista apenas Members ativos do tenant
- "Remover atribuicao" define `owner_id = NULL`
- Registra em audit_log
- Atualiza `atualizado_em` de cada contato

**REGRA DE ROLE:**
- **Admin:** Ve todos os Members da equipe
- **Member:** NAO pode atribuir a outros (botao oculto ou desabilitado)

#### Acao: Segmentacao (APENAS Pessoas)

**Fluxo:**
1. Usuario seleciona pessoas
2. Clica em [Segmentacao ▼]
3. Dropdown abre com segmentos disponiveis
4. Usuario seleciona segmento (adicionar ou remover)
5. Sistema atualiza tabela `contatos_segmentos`

**Layout do Dropdown:**

```
┌─────────────────────────────────────────┐
│  Segmentar 2 contato(s):                │
├─────────────────────────────────────────┤
│  ── Adicionar Segmento ──               │
│  🟢 VIP                                 │
│  🔵 Lead CSV Renove                     │
│  🟡 Teste Automacao                     │
│  🟣 Campanha Janeiro                    │
├─────────────────────────────────────────┤
│  ── Remover Segmento ──                 │
│  ✕ 🟢 VIP                               │
│  ✕ 🔵 Lead CSV Renove                   │
└─────────────────────────────────────────┘
```

**Regras:**
- Secao "Adicionar" mostra todos os segmentos do tenant
- Secao "Remover" mostra apenas segmentos que ALGUM selecionado possui
- Operacao idempotente (nao duplica vinculos)
- Registra em audit_log

**REGRA DE ROLE:**
- **Admin:** Pode adicionar/remover qualquer segmento
- **Member:** Pode adicionar/remover segmentos dos SEUS contatos

#### Limites e Seguranca

| Parametro | Valor | Motivo |
|-----------|-------|--------|
| Max selecao por pagina | 100 | Performance |
| Max exclusao por request | 100 | Seguranca |
| Max atribuicao por request | 100 | Performance |
| Max segmentacao por request | 100 | Performance |
| Rate limit acoes em massa | 10 req/min | Prevenir abuso |

**REGRA CRITICA:** Todas as acoes em massa executam em transacao. Se uma falhar, todas falham.

**Criterios de Aceitacao:**
- [ ] Checkbox individual funciona em cada linha
- [ ] Checkbox "selecionar todos" marca apenas pagina atual
- [ ] Barra flutuante aparece com 1+ selecao
- [ ] Barra flutuante mostra contagem correta
- [ ] Exportar respeita apenas IDs selecionados
- [ ] Excluir verifica vinculos de TODOS antes de permitir
- [ ] Atribuir Vendedor disponivel APENAS para Pessoas
- [ ] Segmentacao disponivel APENAS para Pessoas
- [ ] Admin pode atribuir a qualquer Member
- [ ] Member NAO pode atribuir (botao oculto)
- [ ] Acoes em massa limitadas a 100 registros
- [ ] Todas acoes registradas em audit_log
- [ ] Transacao atomica em exclusao/atualizacao

**Prioridade:** Must-have

---

## Requisitos Nao-Funcionais

### Performance

| Metrica | Valor | Condicao |
|---------|-------|----------|
| Tempo de carregamento inicial | < 500ms | 50 registros |
| Tempo de scroll | < 16ms | 60fps |
| Tempo de busca | < 300ms | Apos debounce |
| Tempo de importacao | < 30s | 1000 registros |
| Tempo de exportacao | < 10s | 1000 registros |
| Memoria maxima | < 50MB | 100k registros virtualizados |
| Suporte minimo | 100.000 | Contatos por tenant |

### Seguranca

- RLS obrigatorio em todas tabelas (Supabase)
- Validacao de `organizacao_id` em toda requisicao
- Validacao de `owner_id` para Member
- Sanitizacao de inputs (prevencao SQL injection)
- Rate limiting: 100 req/min para importacao

### Usabilidade

- Interface responsiva (mobile-friendly)
- Feedback visual em todas acoes (loading, sucesso, erro)
- Mensagens de erro claras e acionaveis
- Atalhos de teclado para acoes frequentes

---

## Escopo

### O que ESTA no escopo

- CRUD completo de Pessoas e Empresas
- Sistema de segmentacao com cor
- Importacao CSV/XLSX com wizard
- Exportacao CSV
- Deteccao e mesclagem de duplicatas
- Criacao de oportunidade a partir do contato
- Toggle de colunas (campos globais)

### O que NAO esta no escopo

- Importacao via API externa (futuro)
- Deduplicacao automatica em tempo real (futuro)
- Enriquecimento de dados via API (futuro)
- Historico de alteracoes do contato (usa audit_log geral)
- Comunicacao direta (WhatsApp, Email) - ver PRD-09

### Escopo futuro (backlog)

- RF-017: Importacao via Webhook/API
- RF-018: Enriquecimento automatico (Clearbit, etc)
- RF-019: Timeline de interacoes do contato
- RF-020: Merge automatico com confianca alta

---

## Novas Tabelas

### segmentos

```sql
CREATE TABLE segmentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),

  nome varchar(100) NOT NULL,
  cor varchar(7) NOT NULL, -- Hex color #RRGGBB
  descricao text,

  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz,

  UNIQUE(organizacao_id, nome)
);

-- Indices
CREATE INDEX idx_segmentos_organizacao ON segmentos(organizacao_id) WHERE deletado_em IS NULL;

-- RLS
ALTER TABLE segmentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON segmentos
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

### contatos_segmentos

```sql
CREATE TABLE contatos_segmentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contato_id uuid NOT NULL REFERENCES contatos(id) ON DELETE CASCADE,
  segmento_id uuid NOT NULL REFERENCES segmentos(id) ON DELETE CASCADE,

  criado_em timestamptz NOT NULL DEFAULT now(),

  UNIQUE(contato_id, segmento_id)
);

-- Indices
CREATE INDEX idx_contatos_segmentos_contato ON contatos_segmentos(contato_id);
CREATE INDEX idx_contatos_segmentos_segmento ON contatos_segmentos(segmento_id);
```

### importacoes_contatos

```sql
CREATE TABLE importacoes_contatos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),

  nome_arquivo varchar(255) NOT NULL,
  tipo_arquivo varchar(10) NOT NULL, -- 'csv', 'xlsx'
  tamanho_bytes int NOT NULL,

  total_registros int NOT NULL,
  registros_importados int NOT NULL DEFAULT 0,
  registros_duplicados int NOT NULL DEFAULT 0,
  registros_erro int NOT NULL DEFAULT 0,

  mapeamento_campos jsonb NOT NULL,
  segmento_id uuid REFERENCES segmentos(id),

  status varchar(20) NOT NULL DEFAULT 'pendente', -- 'pendente', 'processando', 'concluido', 'erro'
  erro_mensagem text,

  criado_em timestamptz NOT NULL DEFAULT now(),
  concluido_em timestamptz,

  CONSTRAINT chk_tipo_arquivo CHECK (tipo_arquivo IN ('csv', 'xlsx')),
  CONSTRAINT chk_status CHECK (status IN ('pendente', 'processando', 'concluido', 'erro'))
);

-- Indices
CREATE INDEX idx_importacoes_organizacao ON importacoes_contatos(organizacao_id);
CREATE INDEX idx_importacoes_usuario ON importacoes_contatos(usuario_id);

-- RLS
ALTER TABLE importacoes_contatos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON importacoes_contatos
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

---

## Endpoints de API

### Contatos

| Metodo | Endpoint | Descricao | Roles |
|--------|----------|-----------|-------|
| GET | `/api/v1/contatos` | Listar com filtros e paginacao | Admin, Member |
| GET | `/api/v1/contatos/:id` | Detalhes do contato | Admin, Member (se owner) |
| POST | `/api/v1/contatos` | Criar contato | Admin, Member |
| PATCH | `/api/v1/contatos/:id` | Atualizar contato | Admin, Member (se owner) |
| DELETE | `/api/v1/contatos/:id` | Soft delete | Admin, Member (se owner) |

### Duplicatas

| Metodo | Endpoint | Descricao | Roles |
|--------|----------|-----------|-------|
| GET | `/api/v1/contatos/duplicatas` | Listar possiveis duplicatas | Admin |
| POST | `/api/v1/contatos/mesclar` | Mesclar duplicatas | Admin |

### Segmentos

| Metodo | Endpoint | Descricao | Roles |
|--------|----------|-----------|-------|
| GET | `/api/v1/segmentos` | Listar segmentos | Admin, Member |
| POST | `/api/v1/segmentos` | Criar segmento | Admin |
| PATCH | `/api/v1/segmentos/:id` | Atualizar segmento | Admin |
| DELETE | `/api/v1/segmentos/:id` | Soft delete | Admin |
| POST | `/api/v1/contatos/:id/segmentos` | Vincular segmentos | Admin, Member (se owner) |
| DELETE | `/api/v1/contatos/:id/segmentos/:segId` | Desvincular segmento | Admin, Member (se owner) |

### Importacao

| Metodo | Endpoint | Descricao | Roles |
|--------|----------|-----------|-------|
| POST | `/api/v1/importacoes/upload` | Upload arquivo | Admin |
| GET | `/api/v1/importacoes/:id/preview` | Preview com mapeamento | Admin |
| POST | `/api/v1/importacoes/:id/confirmar` | Confirmar importacao | Admin |
| GET | `/api/v1/importacoes` | Historico de importacoes | Admin |

### Exportacao

| Metodo | Endpoint | Descricao | Roles |
|--------|----------|-----------|-------|
| GET | `/api/v1/contatos/exportar` | Exportar CSV | Admin (todos), Member (seus) |

### Acoes em Massa (RF-016)

| Metodo | Endpoint | Descricao | Roles |
|--------|----------|-----------|-------|
| DELETE | `/api/v1/contatos/lote` | Excluir multiplos contatos | Admin, Member (seus) |
| PATCH | `/api/v1/contatos/lote/atribuir` | Atribuir vendedor em massa | Admin |
| POST | `/api/v1/contatos/lote/segmentos` | Adicionar/remover segmentos em massa | Admin, Member (seus) |
| POST | `/api/v1/contatos/exportar` | Exportar apenas IDs selecionados | Admin, Member (seus) |

**Schemas de Request:**

```typescript
// DELETE /api/v1/contatos/lote
interface DeleteLoteRequest {
  ids: string[];       // UUIDs dos contatos (max 100)
  tipo: 'pessoa' | 'empresa';
}

// PATCH /api/v1/contatos/lote/atribuir
interface AtribuirLoteRequest {
  ids: string[];       // UUIDs dos contatos (max 100)
  owner_id: string | null;  // UUID do vendedor ou null para remover
}

// POST /api/v1/contatos/lote/segmentos
interface SegmentarLoteRequest {
  ids: string[];       // UUIDs dos contatos (max 100)
  adicionar: string[]; // UUIDs dos segmentos a adicionar
  remover: string[];   // UUIDs dos segmentos a remover
}

// POST /api/v1/contatos/exportar (selecionados)
interface ExportarSelecionadosRequest {
  ids: string[];       // UUIDs dos contatos
  tipo: 'pessoa' | 'empresa';
  colunas: string[];   // Nomes das colunas a exportar
}
```

**Limites de Rate:**
- Acoes em massa: 10 req/min por usuario
- Max IDs por request: 100

---

## Metricas de Sucesso

### KPIs Primarios

| Metrica | Baseline | Meta | Prazo |
|---------|----------|------|-------|
| Taxa de duplicatas na base | 15% | < 5% | 3 meses |
| Tempo medio de cadastro | 3 min | < 1 min | 1 mes |
| Contatos com segmento | 0% | > 60% | 2 meses |
| Adocao de importacao CSV | 0 | > 50 imports/mes | 2 meses |

### KPIs Secundarios

- Numero de contatos por tenant
- Taxa de conversao contato → oportunidade
- Uso de campos customizados

---

## Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|---------------|---------|-----------|
| Importacao com dados malformados | Alta | Medio | Validacao rigorosa + preview |
| Performance com bases grandes (>50k) | Media | Alto | Paginacao + indices otimizados |
| Duplicatas falsas (nomes comuns) | Media | Baixo | Permitir "nao e duplicata" |
| Usuario importa dados sensiveis | Baixa | Alto | Aviso sobre LGPD no upload |

---

## Plano de Validacao

### Pre-Lancamento

| Item | Validacao | Responsavel |
|------|-----------|-------------|
| Testes unitarios | >= 85% cobertura | Dev Team |
| Teste de isolamento | Contatos isolados por tenant | QA + Security |
| Teste de importacao | CSV com 10k+ linhas | QA |
| Teste de duplicatas | Algoritmo de deteccao | QA |
| Performance de listagem | 100k contatos em < 2s | DevOps |

### Durante Lancamento

| Item | Validacao | Responsavel |
|------|-----------|-------------|
| Monitoramento de queries | Slow queries identificadas | DevOps |
| Erros de importacao | Taxa de falha < 5% | QA |
| Logs de CRUD | Auditoria completa | Security |
| Duplicatas detectadas | Relatorio de acuracia | QA |

### Pos-Lancamento

| Item | Validacao | Frequencia |
|------|-----------|------------|
| Tamanho medio de base | Contatos por tenant | Semanal |
| Taxa de conversao | Contatos → Oportunidades | Semanal |
| Uso de importacao | Frequencia de uploads | Mensal |
| Feedback de usuarios | NPS do modulo | Mensal |
| Otimizacao de indices | Analise de performance | Quinzenal |

---

## Historico de Versoes

| Versao | Data | Autor | Mudancas |
|--------|------|-------|----------|
| v1.0 | 2026-02-03 | Arquiteto de Produto | Versao inicial com 12 RFs |
| v1.1 | 2026-02-03 | Arquiteto de Produto | RF-002: Colunas fixas para Pessoas/Empresas, "Sem oportunidades +"; RF-005: Toggle de colunas para ambos; RF-013: Modal de Visualizacao (2 abas Pessoas, 1 aba Empresas); RF-014: Exclusao fisica com confirmacao e bloqueio; RF-015: Performance para 100k+ (cursor-based, virtualizacao, indices) |
| v1.2 | 2026-02-03 | Arquiteto de Produto | RF-016: Selecao em Lote e Acoes em Massa (checkbox, barra flutuante, Exportar/Excluir para ambos, Atribuir Vendedor/Segmentacao apenas Pessoas); RF-012: Matriz de permissoes atualizada com acoes em lote; Novos endpoints de API em massa; Backlog renumerado (RF-017 a RF-020) |
| v1.3 | 2026-02-03 | Arquiteto de Produto | Adicionada secao Plano de Validacao formal (Pre/Durante/Pos-Lancamento) conforme prdpadrao.md |
