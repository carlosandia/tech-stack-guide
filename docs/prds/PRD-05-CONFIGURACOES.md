# PRD-05: Modulo de Configuracoes - CRM Renove

| Campo | Valor |
|-------|-------|
| **Autor** | Arquiteto de Produto |
| **Data de criacao** | 2026-01-31 |
| **Ultima atualizacao** | 2026-02-03 |
| **Versao** | v1.6 |
| **Status** | Em desenvolvimento |
| **Dependencias** | PRD-04, PRD-14 |
| **Revisor tecnico** | Tech Lead |

---

## Resumo Executivo

Este documento define o modulo de Configuracoes do CRM Renove, que permite ao Admin personalizar o comportamento do sistema para seu tenant.

O modulo esta dividido em tres categorias principais:
1. **Pipeline** - Campos, Produtos, Motivos, Tarefas, Etapas, Regras, Cards
2. **Integracoes** - Conexoes OAuth e Webhooks
3. **Equipe** - Gestao de membros e perfis de permissao

---

## Pre-Requisito: Criacao pelo Super Admin

**IMPORTANTE:** Este modulo so pode ser acessado apos o tenant e o Admin terem sido criados pelo Super Admin (PRD-14).

### Fluxo de Acesso

```
┌─────────────────────────────────────────────────────────────────┐
│                   FLUXO DE INICIALIZACAO                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Super Admin cria organizacao (tenant) via wizard PRD-14     │
│                        ↓                                        │
│  2. Super Admin cria Admin vinculado ao tenant                  │
│                        ↓                                        │
│  3. Admin recebe email de boas-vindas e faz primeiro login      │
│                        ↓                                        │
│  4. Admin acessa /app/configuracoes                             │
│                        ↓                                        │
│  5. Sistema cria defaults automaticos (campos, etapas, perfis)  │
│                        ↓                                        │
│  6. Admin pode customizar todas configuracoes                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Dependencia de Dados

| O que este modulo fornece | Quem consome |
|--------------------------|--------------|
| Campos personalizados | PRD-06 (Contatos), PRD-07 (Negocios) |
| Etapas do funil | PRD-07 (Negocios - Pipeline Kanban) |
| Produtos | PRD-07 (Negocios - Calculo de valor) |
| Templates de tarefas | PRD-07 (Negocios), PRD-10 (Tarefas) |
| Membros da equipe | PRD-07 (Distribuicao), PRD-09 (Conversas) |
| Metas | PRD-13 (Dashboard) |
| Conexoes OAuth | PRD-08 (Integracoes), PRD-09 (Conversas) |

**Conclusao:** PRD-05 deve ser implementado ANTES de PRD-06, PRD-07, PRD-08, PRD-09 e PRD-10.

---

## Hierarquia de Requisitos

### Theme

**Personalizacao e Gestao Multi-Tenant**

Sistema completo de configuracoes que permite cada tenant personalizar campos, produtos, workflows, integracoes, equipes e metas de forma independente e isolada.

### Epic

**Configuracoes de Pipeline, Integracoes e Equipe com Metas Hierarquicas**

Implementar modulo de configuracoes completo permitindo Admins customizar campos, produtos, etapas de pipeline, conectar integracoes OAuth, gerenciar equipe e definir metas de vendas hierarquicas.

### Features

#### Feature 1: Campos Personalizados

**User Story:** Como Admin, quero criar campos customizados para contatos e oportunidades para capturar informacoes especificas do meu negocio.

**Criterios de Aceite:**
- 13 tipos de campo disponiveis (texto, numero, data, select, etc.)
- Campos do sistema bloqueados para edicao
- Campos por entidade (Contato, Pessoa, Empresa, Oportunidade)
- Reordenacao por drag and drop

#### Feature 2: Catalogo de Produtos

**User Story:** Como Admin, quero cadastrar produtos e servicos para vincular a oportunidades e calcular valores de vendas.

**Criterios de Aceite:**
- CRUD de produtos com preco e categorias
- Suporte a produtos recorrentes (MRR)
- Unidades configuraveis (un, kg, hora, mes)
- Soft delete para historico

#### Feature 3: Templates de Pipeline (Etapas e Tarefas)

**User Story:** Como Admin, quero definir etapas padrao e tarefas automaticas para meus funis de vendas.

**Criterios de Aceite:**
- Templates de etapas com probabilidade
- Etapas fixas de Ganho/Perda imutaveis
- Templates de tarefas vinculaveis a etapas
- 6 tipos de tarefa (ligacao, email, reuniao, etc.)

#### Feature 4: Integracoes OAuth e Webhooks

**User Story:** Como Admin, quero conectar WhatsApp, Meta Ads, Google Calendar e configurar webhooks para automatizar fluxos.

**Criterios de Aceite:**
- OAuth para Meta e Google
- WAHA para WhatsApp
- Webhooks de entrada com API Key
- Webhooks de saida com retry

#### Feature 5: Gestao de Equipe e Metas

**User Story:** Como Admin, quero criar equipes, gerenciar membros e definir metas hierarquicas (empresa, equipe, individual).

**Criterios de Aceite:**
- CRUD de membros com perfis de permissao
- Criacao de equipes de vendedores
- Metas por empresa/equipe/individual
- Distribuicao automatica de metas
- 15+ tipos de metricas (receita, quantidade, atividades)

---

## Roles e Permissoes

| Funcionalidade | Super Admin | Admin | Member |
|----------------|-------------|-------|--------|
| Campos Personalizados | - | CRUD | Ler |
| Produtos/Categorias | - | CRUD | Ler |
| Motivos de Resultado | - | CRUD | Ler |
| Tarefas (Templates) | - | CRUD | Ler |
| Etapas (Templates) | - | CRUD | Ler |
| Regras de Qualificacao | - | CRUD | Ler |
| Personalizacao Cards | - | CRUD | - |
| Conexoes OAuth | Config global | Conectar/Desconectar | **BLOQUEADO** |
| Webhooks | - | CRUD | **BLOQUEADO** |
| Gestao de Membros | - | CRUD | **BLOQUEADO** |
| Perfis de Permissao | - | CRUD | **BLOQUEADO** |
| Config do Tenant | - | Editar | **BLOQUEADO** |

### Restricoes Absolutas do Member (CRITICO)

**O Member NAO pode acessar a area de "Equipe & Permissoes" em nenhuma circunstancia.**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AREAS BLOQUEADAS PARA MEMBER                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ❌ Configuracoes > Equipe & Permissoes                                     │
│     - Member NAO ve este item no menu                                       │
│     - Member NAO pode acessar via URL direta (/configuracoes/equipe)        │
│     - Tentativa de acesso retorna 403 Forbidden                             │
│                                                                             │
│  ❌ Criar/Editar/Excluir Usuarios                                           │
│     - Member NAO pode criar outros Members                                  │
│     - Member NAO pode criar Admins                                          │
│     - Member NAO pode editar dados de outros usuarios                       │
│     - Member NAO pode desativar usuarios                                    │
│                                                                             │
│  ❌ Perfis de Permissao                                                     │
│     - Member NAO pode ver lista de perfis                                   │
│     - Member NAO pode criar novos perfis                                    │
│     - Member NAO pode editar permissoes                                     │
│                                                                             │
│  ❌ Conexoes e Integracoes                                                  │
│     - Member NAO pode conectar/desconectar OAuth                            │
│     - Member NAO pode gerenciar webhooks                                    │
│                                                                             │
│  ❌ Configuracoes do Tenant                                                 │
│     - Member NAO pode alterar moeda, timezone, notificacoes                 │
│                                                                             │
│  NOTA: Estas restricoes sao IMUTAVEIS e nao podem ser concedidas           │
│        via perfil de permissao personalizado.                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Implementacao no Frontend:**
- Menu "Equipe & Permissoes" so aparece para role === 'admin'
- Rotas /configuracoes/equipe/* tem guard que verifica role
- Se Member tentar acessar URL direto, redireciona para /dashboard

**Implementacao no Backend:**
- Middleware verifica role antes de processar requisicao
- Endpoints /api/v1/usuarios/* retornam 403 para role !== 'admin'
- Endpoints /api/v1/perfis/* retornam 403 para role !== 'admin'

---

## 3.1 Configuracoes de Pipeline

### 3.1.1 Campos Personalizados

**Descricao:** Permite criar campos dinamicos para contatos e oportunidades.

#### Campos do Sistema (Bloqueados)

Estes campos existem por padrao e NAO podem ser editados ou removidos:

| Entidade | Campo | Tipo |
|----------|-------|------|
| Contato | Nome | texto |
| Contato | Email | email |
| Contato | Telefone | telefone |
| Pessoa | Sobrenome | texto |
| Empresa | Nome da Empresa | texto |
| Empresa | CNPJ | cnpj |
| Empresa | Razao Social | texto |

#### Tipos de Campo Disponiveis

| Tipo | Descricao | Validacao |
|------|-----------|-----------|
| texto | Texto curto (ate 255 chars) | max_length |
| texto_longo | Textarea multilinha | max_length |
| numero | Inteiro | min, max |
| decimal | Numero com casas decimais | min, max, precision |
| data | Apenas data (DD/MM/YYYY) | min_date, max_date |
| data_hora | Data e hora | min_date, max_date |
| booleano | Sim/Nao | - |
| select | Lista suspensa (uma opcao) | opcoes[] |
| multi_select | Lista com multiplas opcoes | opcoes[] |
| email | Email com validacao | regex |
| telefone | Telefone com mascara | regex |
| url | Link com validacao | regex |
| cpf | CPF com mascara e validacao | regex + digito verificador |
| cnpj | CNPJ com mascara e validacao | regex + digito verificador |

#### Interface do Usuario

```
┌─────────────────────────────────────────────────────────────┐
│ Configuracoes > Pipeline > Campos                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Contatos] [Pessoas] [Empresas] [Oportunidades]  <- Tabs   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Nome *                          [texto]    [Sistema]│    │
│  │ Email *                         [email]    [Sistema]│    │
│  │ Telefone *                      [telefone] [Sistema]│    │
│  │ ────────────────────────────────────────────────────│    │
│  │ Cargo                           [texto]    [Editar] │    │
│  │ Origem do Lead                  [select]   [Editar] │    │
│  │ Data de Nascimento              [data]     [Editar] │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  [+ Novo Campo]                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Endpoints de API

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /api/v1/campos | Listar campos por entidade |
| POST | /api/v1/campos | Criar campo |
| GET | /api/v1/campos/:id | Detalhes do campo |
| PATCH | /api/v1/campos/:id | Atualizar campo |
| DELETE | /api/v1/campos/:id | Soft delete do campo |
| PATCH | /api/v1/campos/reordenar | Alterar ordem dos campos |

---

### 3.1.2 Produtos e Categorias

**Descricao:** Catalogo de produtos/servicos que podem ser vinculados a oportunidades.

#### Estrutura de Dados

**Categoria:**
- Nome (obrigatorio)
- Descricao
- Cor
- Ordem

**Produto:**
- Nome (obrigatorio)
- Descricao
- SKU (codigo unico)
- Preco
- Moeda (BRL, USD, EUR)
- Unidade (un, kg, hora, dia, mes, ano)
- Recorrente (boolean)
- Periodo de Recorrencia (mensal, trimestral, semestral, anual)
- Categoria (opcional)
- Ativo (boolean)

#### Interface do Usuario

```
┌─────────────────────────────────────────────────────────────┐
│ Configuracoes > Pipeline > Produtos                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Produtos] [Categorias]                           <- Tabs  │
│                                                             │
│  Buscar: [________________] [+ Novo Produto]                │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Consultoria Basica         R$ 500,00/hora    Ativo  │    │
│  │ SKU: CONS-001              Categoria: Servicos      │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │ Plano Starter              R$ 99,00/mes      Ativo  │    │
│  │ SKU: PLAN-001              Recorrente: Mensal       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Endpoints de API

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /api/v1/produtos | Listar produtos |
| POST | /api/v1/produtos | Criar produto |
| PATCH | /api/v1/produtos/:id | Atualizar produto |
| DELETE | /api/v1/produtos/:id | Soft delete |
| GET | /api/v1/categorias-produtos | Listar categorias |
| POST | /api/v1/categorias-produtos | Criar categoria |
| PATCH | /api/v1/categorias-produtos/:id | Atualizar categoria |
| DELETE | /api/v1/categorias-produtos/:id | Soft delete |

---

### 3.1.3 Motivos de Resultado

**Descricao:** Motivos padronizados para quando uma oportunidade e ganha ou perdida.

#### Motivos Padrao (Criados Automaticamente)

**Ganho:**
- Preco competitivo
- Qualidade do produto
- Atendimento
- Indicacao

**Perda:**
- Preco muito alto
- Escolheu concorrente
- Projeto cancelado
- Sem budget
- Sem resposta

#### Interface do Usuario

```
┌─────────────────────────────────────────────────────────────┐
│ Configuracoes > Pipeline > Motivos de Resultado             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Ganho] [Perda]                                   <- Tabs  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ [verde] Preco competitivo                   [Editar]│    │
│  │ [verde] Qualidade do produto                [Editar]│    │
│  │ [verde] Atendimento                         [Editar]│    │
│  │ [verde] Indicacao                           [Editar]│    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  [+ Novo Motivo]                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Endpoints de API

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /api/v1/motivos-resultado | Listar motivos |
| POST | /api/v1/motivos-resultado | Criar motivo |
| PATCH | /api/v1/motivos-resultado/:id | Atualizar motivo |
| DELETE | /api/v1/motivos-resultado/:id | Soft delete |

---

### 3.1.4 Tarefas (Templates Globais)

**Descricao:** Templates de tarefas que podem ser vinculados a etapas da pipeline.

#### Tipos de Tarefa

| Tipo | Icone | Descricao |
|------|-------|-----------|
| ligacao | Phone | Ligacao telefonica |
| email | Mail | Envio de email |
| reuniao | Calendar | Reuniao presencial ou online |
| whatsapp | MessageCircle | Mensagem WhatsApp |
| visita | MapPin | Visita presencial |
| outro | CheckSquare | Outros tipos |

#### Estrutura do Template

- Titulo (obrigatorio)
- Descricao
- Tipo (ligacao, email, reuniao, whatsapp, visita, outro)
- Canal (whatsapp, instagram, email, telefone)
- Prioridade (baixa, media, alta, urgente)
- Dias de Prazo (dias apos entrar na etapa)
- Ativo

#### Interface do Usuario

```
┌─────────────────────────────────────────────────────────────┐
│ Configuracoes > Pipeline > Tarefas                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Tarefas disponiveis para vincular nas etapas da pipeline   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ [Phone] Ligacao de Qualificacao                     │    │
│  │         Prioridade: Alta | Prazo: 1 dia             │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │ [Mail] Enviar Proposta Comercial                    │    │
│  │        Prioridade: Media | Prazo: 2 dias            │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │ [Calendar] Reuniao de Fechamento                    │    │
│  │            Prioridade: Alta | Prazo: 3 dias         │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  [+ Nova Tarefa]                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Endpoints de API

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /api/v1/tarefas-templates | Listar templates |
| POST | /api/v1/tarefas-templates | Criar template |
| PATCH | /api/v1/tarefas-templates/:id | Atualizar template |
| DELETE | /api/v1/tarefas-templates/:id | Soft delete |

---

### 3.1.5 Etapas (Templates Globais)

**Descricao:** Templates de etapas que podem ser usados ao criar pipelines.

#### Tipos de Etapa

| Tipo | Descricao | Comportamento |
|------|-----------|---------------|
| entrada | Primeira etapa | Oportunidades novas entram aqui |
| normal | Etapas intermediarias | Fluxo padrao |
| ganho | Etapa de sucesso | Marca oportunidade como ganha |
| perda | Etapa de fracasso | Marca oportunidade como perdida |

#### Etapas Padrao (Criadas Automaticamente)

| Nome | Tipo | Cor | Probabilidade |
|------|------|-----|---------------|
| Novos Negocios | entrada | azul | 10% |
| Qualificacao | normal | amarelo | 20% |
| Proposta | normal | laranja | 50% |
| Negociacao | normal | roxo | 75% |
| Ganho | ganho | verde | 100% |
| Perdido | perda | vermelho | 0% |

#### Interface do Usuario

```
┌─────────────────────────────────────────────────────────────┐
│ Configuracoes > Pipeline > Etapas                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Etapas disponiveis para usar nas pipelines                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ [azul] Novos Negocios        Entrada    10%         │    │
│  │ [amarelo] Qualificacao       Normal     20%         │    │
│  │ [laranja] Proposta           Normal     50%         │    │
│  │ [roxo] Negociacao            Normal     75%         │    │
│  │ [verde] Ganho                Ganho      100%  [Lock]│    │
│  │ [vermelho] Perdido           Perda      0%    [Lock]│    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  [+ Nova Etapa]                                             │
│                                                             │
│  * Etapas Ganho e Perdido nao podem ser removidas           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Endpoints de API

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /api/v1/etapas-templates | Listar templates |
| POST | /api/v1/etapas-templates | Criar template |
| PATCH | /api/v1/etapas-templates/:id | Atualizar template |
| DELETE | /api/v1/etapas-templates/:id | Soft delete (exceto ganho/perda) |

---

### 3.1.6 Regras de Qualificacao

**Descricao:** Regras para marcar automaticamente um contato como MQL (Marketing Qualified Lead).

#### Estrutura da Regra

- Nome (obrigatorio)
- Descricao
- Campo (referencia a campos_customizados.id)
- Operador (igual, diferente, contem, maior_que, etc.)
- Valor
- Ativo

#### Operadores Disponiveis

| Operador | Descricao | Tipos de Campo |
|----------|-----------|----------------|
| igual | Valor exato | todos |
| diferente | Valor diferente | todos |
| contem | Contem substring | texto, texto_longo |
| nao_contem | Nao contem substring | texto, texto_longo |
| maior_que | Maior que | numero, decimal, data |
| menor_que | Menor que | numero, decimal, data |
| maior_igual | Maior ou igual | numero, decimal, data |
| menor_igual | Menor ou igual | numero, decimal, data |
| vazio | Campo vazio | todos |
| nao_vazio | Campo preenchido | todos |

#### Logica de Aplicacao

- Regras sao avaliadas em **AND** (todas devem ser verdadeiras)
- Se TODAS as regras ativas forem verdadeiras, contato recebe badge **MQL**
- Avaliacao ocorre quando contato e criado ou atualizado

#### Interface do Usuario

```
┌─────────────────────────────────────────────────────────────┐
│ Configuracoes > Pipeline > Regras de Qualificacao           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Quando TODAS as regras abaixo forem verdadeiras,           │
│  o contato sera marcado como MQL automaticamente.           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ [x] Email corporativo                               │    │
│  │     Campo: Email | Operador: nao contem             │    │
│  │     Valor: gmail.com, hotmail.com, yahoo.com        │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │ [x] Cargo de decisao                                │    │
│  │     Campo: Cargo | Operador: contem                 │    │
│  │     Valor: Diretor, Gerente, CEO, Proprietario      │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │ [x] Empresa com mais de 10 funcionarios             │    │
│  │     Campo: Numero Funcionarios | Operador: maior_que│    │
│  │     Valor: 10                                       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  [+ Nova Regra]                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Endpoints de API

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /api/v1/regras-qualificacao | Listar regras |
| POST | /api/v1/regras-qualificacao | Criar regra |
| PATCH | /api/v1/regras-qualificacao/:id | Atualizar regra |
| DELETE | /api/v1/regras-qualificacao/:id | Soft delete |

---

### 3.1.7 Personalizacao de Cards

**Descricao:** Define quais campos aparecem no card da oportunidade no Kanban.

#### Campos Disponiveis

| Campo | Padrao | Descricao |
|-------|--------|-----------|
| Valor | Sim | Valor estimado da oportunidade |
| Contato | Sim | Nome do contato principal |
| Empresa | Sim | Empresa vinculada |
| Telefone | Nao | Telefone do contato |
| Email | Nao | Email do contato |
| Owner | Sim | Responsavel pela oportunidade |
| Data Criacao | Nao | Quando a oportunidade foi criada |
| Previsao Fechamento | Sim | Data prevista para fechar |
| Tarefas Pendentes | Sim | Badge com numero de tarefas |
| Tags | Sim | Tags da oportunidade |
| Campos Customizados | - | Selecao de campos dinamicos |

#### Interface do Usuario

```
┌─────────────────────────────────────────────────────────────┐
│ Configuracoes > Pipeline > Personalizacao de Cards          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Pipeline: [Vendas Principais v]                            │
│                                                             │
│  Campos visiveis no card:                                   │
│                                                             │
│  [x] Valor                    [ ] Data de Criacao           │
│  [x] Contato                  [x] Previsao Fechamento       │
│  [x] Empresa                  [x] Tarefas Pendentes         │
│  [ ] Telefone                 [x] Tags                      │
│  [ ] Email                    [x] Owner                     │
│                                                             │
│  Campos Customizados:                                       │
│  [ ] Origem do Lead                                         │
│  [ ] Segmento                                               │
│  [x] Produto de Interesse                                   │
│                                                             │
│  [Salvar Alteracoes]                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Endpoints de API

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /api/v1/configuracoes-card | Obter configuracao |
| PUT | /api/v1/configuracoes-card | Salvar configuracao |

---

## 3.2 Integracoes

### 3.2.0 Conexoes

**Descricao:** Gerenciamento de conexoes OAuth com plataformas externas.

> **Documentacao detalhada:** Ver [PRD-08: Conexoes](./PRD-08-CONEXOES.md) para especificacao completa de cada integracao, incluindo fluxos, tabelas SQL, endpoints e interfaces.

#### Plataformas Suportadas

| Plataforma | Tipo | Descricao |
|------------|------|-----------|
| WhatsApp | WAHA | Integracao via WAHA (WhatsApp HTTP API) |
| Instagram | Direct | Mensagens do Instagram Direct |
| Meta Ads | Lead Ads | Captura automatica de leads do Facebook/Instagram Ads |
| Google | Calendar | Sincronizacao de agendamentos |
| Email | SMTP | Envio de emails pelo CRM |

#### Modelo de Configuracao

**Camada Global (Super Admin):**
- App ID
- App Secret
- Webhook Base URL
- Verify Token

**Camada Tenant (Admin):**
- OAuth Authentication (access_token, refresh_token)
- Conta externa vinculada
- Status da conexao

#### Interface do Usuario

```
┌─────────────────────────────────────────────────────────────┐
│ Configuracoes > Integracoes > Conexoes                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ [WhatsApp]                                          │    │
│  │ Status: Conectado                                   │    │
│  │ Conta: +55 11 99999-9999                            │    │
│  │ Ultimo sync: Hoje, 14:30                            │    │
│  │ [Desconectar]                                       │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │ [Instagram]                                         │    │
│  │ Status: Nao conectado                               │    │
│  │ [Conectar com Instagram]                            │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │ [Meta Ads]                                          │    │
│  │ Status: Conectado                                   │    │
│  │ Conta: Renove Marketing                             │    │
│  │ Formularios: 3 ativos                               │    │
│  │ [Gerenciar Formularios] [Desconectar]               │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │ [Google Calendar]                                   │    │
│  │ Status: Conectado                                   │    │
│  │ Conta: admin@renove.com                             │    │
│  │ [Desconectar]                                       │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │ [Email SMTP]                                        │    │
│  │ Status: Configurado                                 │    │
│  │ Servidor: smtp.gmail.com                            │    │
│  │ [Editar Configuracoes] [Testar Conexao]             │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Endpoints de API

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /api/v1/integracoes | Listar conexoes |
| GET | /api/v1/integracoes/:plataforma/auth-url | Obter URL OAuth |
| POST | /api/v1/integracoes/:plataforma/callback | Callback OAuth |
| DELETE | /api/v1/integracoes/:id | Desconectar |
| POST | /api/v1/integracoes/:id/sync | Forcar sincronizacao |

---

### 3.2.1 Webhooks de Entrada

**Descricao:** URLs para receber dados de sistemas externos.

#### Estrutura do Webhook

- Nome (obrigatorio)
- Descricao
- URL Token (gerado automaticamente, unico)
- API Key (opcional, para autenticacao)
- Secret Key (opcional, para validar assinatura)
- Ativo

#### URL Gerada

```
https://api.crmrenove.com/webhooks/entrada/{url_token}
```

#### Interface do Usuario

```
┌─────────────────────────────────────────────────────────────┐
│ Configuracoes > Integracoes > Webhooks de Entrada           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Formulario Site                                     │    │
│  │ URL: https://api.crmrenove.com/webhooks/entrada/    │    │
│  │      abc123def456                                   │    │
│  │ API Key: *** (mostrar)                              │    │
│  │ Status: Ativo                                       │    │
│  │ Ultimo request: Hoje, 15:22                         │    │
│  │ [Editar] [Ver Logs] [Copiar URL]                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  [+ Novo Webhook]                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Endpoints de API

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /api/v1/webhooks-entrada | Listar webhooks |
| POST | /api/v1/webhooks-entrada | Criar webhook |
| PATCH | /api/v1/webhooks-entrada/:id | Atualizar webhook |
| DELETE | /api/v1/webhooks-entrada/:id | Soft delete |
| POST | /api/v1/webhooks-entrada/:id/regenerar-token | Regenerar URL |

---

### 3.2.2 Webhooks de Saida

**Descricao:** Enviar eventos do CRM para sistemas externos.

#### Eventos Disponiveis

| Evento | Descricao |
|--------|-----------|
| contato.criado | Novo contato criado |
| contato.atualizado | Contato atualizado |
| oportunidade.criada | Nova oportunidade |
| oportunidade.etapa_alterada | Oportunidade mudou de etapa |
| oportunidade.ganha | Oportunidade fechada como ganha |
| oportunidade.perdida | Oportunidade fechada como perdida |
| tarefa.criada | Nova tarefa |
| tarefa.concluida | Tarefa concluida |

#### Estrutura do Webhook

- Nome (obrigatorio)
- URL destino (obrigatorio)
- Eventos (array de eventos)
- Tipo de autenticacao (nenhum, bearer, api_key, basic)
- Header de autenticacao
- Valor de autenticacao (criptografado)
- Retry ativo (boolean)
- Max tentativas (default: 3)
- Ativo

#### Interface do Usuario

```
┌─────────────────────────────────────────────────────────────┐
│ Configuracoes > Integracoes > Webhooks de Saida             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Notificar ERP                                       │    │
│  │ URL: https://erp.empresa.com/api/webhooks/crm       │    │
│  │ Eventos: oportunidade.ganha, oportunidade.perdida   │    │
│  │ Auth: Bearer Token                                  │    │
│  │ Status: Ativo | Retry: Sim (3 tentativas)           │    │
│  │ [Editar] [Ver Logs] [Testar]                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  [+ Novo Webhook]                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Endpoints de API

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /api/v1/webhooks-saida | Listar webhooks |
| POST | /api/v1/webhooks-saida | Criar webhook |
| PATCH | /api/v1/webhooks-saida/:id | Atualizar webhook |
| DELETE | /api/v1/webhooks-saida/:id | Soft delete |
| POST | /api/v1/webhooks-saida/:id/testar | Enviar teste |
| GET | /api/v1/webhooks-saida/:id/logs | Ver historico |

---

## 3.3 Equipe (ADMIN ONLY)

**IMPORTANTE:** Esta secao inteira e acessivel APENAS pelo role Admin.
Member NAO tem acesso a nenhuma funcionalidade desta area.

### 3.3.1 Gestao de Membros (Admin Only)

**Descricao:** Gerenciamento de usuarios do tenant.
**Acesso:** Apenas Admin pode criar, editar, visualizar e desativar membros.

#### Estrutura do Membro

- Nome (obrigatorio)
- Sobrenome (obrigatorio)
- Email (obrigatorio, unico)
- Telefone
- Avatar
- Perfil de Permissao
- Status (ativo, inativo, pendente)

#### Interface do Usuario

```
┌─────────────────────────────────────────────────────────────┐
│ Configuracoes > Equipe > Membros                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [+ Novo Membro]                             Buscar: [____] │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ [Avatar] Maria Silva                                │    │
│  │          maria@empresa.com                          │    │
│  │          Perfil: Vendedor | Status: Ativo           │    │
│  │          Ultimo login: Hoje, 14:30                  │    │
│  │          [Editar] [Desativar]                       │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │ [Avatar] Joao Santos                                │    │
│  │          joao@empresa.com                           │    │
│  │          Perfil: Gerente | Status: Ativo            │    │
│  │          Ultimo login: Ontem, 18:45                 │    │
│  │          [Editar] [Desativar]                       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Endpoints de API (Admin Only)

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| GET | /api/v1/usuarios | Listar membros | **Admin ONLY** |
| POST | /api/v1/usuarios | Criar membro | **Admin ONLY** |
| GET | /api/v1/usuarios/:id | Detalhes do membro | **Admin ONLY** |
| PATCH | /api/v1/usuarios/:id | Atualizar membro | **Admin ONLY** |
| PATCH | /api/v1/usuarios/:id/status | Ativar/Desativar | **Admin ONLY** |
| POST | /api/v1/usuarios/:id/reenviar-convite | Reenviar email | **Admin ONLY** |

**NOTA:** Todos endpoints retornam 403 Forbidden para role Member.

---

### 3.3.2 Perfis de Permissao (Admin Only)

**Descricao:** Perfis configuraveis de permissoes para members.
**Acesso:** Apenas Admin pode criar, editar e excluir perfis de permissao.

#### Perfis Padrao

| Perfil | Descricao |
|--------|-----------|
| Vendedor | Acesso apenas aos proprios dados |
| Gerente de Vendas | Acesso a todos os dados da equipe |
| Visualizador | Apenas leitura de dados |

#### Estrutura de Permissao

```typescript
interface Permissao {
  modulo: string;        // contatos, oportunidades, tarefas, etc.
  acoes: string[];       // criar, ler, editar, deletar
  escopo: 'proprio' | 'todos';  // apenas seus dados ou todos
}
```

#### Interface do Usuario

```
┌─────────────────────────────────────────────────────────────┐
│ Configuracoes > Equipe > Perfis de Permissao                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Vendedor (Padrao)                                   │    │
│  │ Acesso aos proprios dados                           │    │
│  │ [Ver Detalhes]                                      │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │ Gerente de Vendas (Padrao)                          │    │
│  │ Acesso a todos os dados                             │    │
│  │ [Ver Detalhes]                                      │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │ SDR Customizado                                     │    │
│  │ Criar contatos, sem acesso a oportunidades          │    │
│  │ [Editar] [Excluir]                                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  [+ Novo Perfil]                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Endpoints de API (Admin Only)

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| GET | /api/v1/perfis-permissao | Listar perfis | **Admin ONLY** |
| POST | /api/v1/perfis-permissao | Criar perfil | **Admin ONLY** |
| PATCH | /api/v1/perfis-permissao/:id | Atualizar perfil | **Admin ONLY** |
| DELETE | /api/v1/perfis-permissao/:id | Excluir perfil | **Admin ONLY** |

**NOTA:** Todos endpoints retornam 403 Forbidden para role Member.

---

### 3.3.3 Metas e Objetivos (Admin Only)

**Descricao:** Sistema hierarquico de metas de vendas, seguindo padrao de mercado (Salesforce, HubSpot, Pipedrive).
**Acesso:** Apenas Admin configura metas. Member visualiza seus proprios resultados no Dashboard.

#### Hierarquia de Metas

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        HIERARQUIA DE METAS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                    ┌─────────────────────────┐                              │
│                    │   META DA EMPRESA       │  ← Total da organizacao      │
│                    │   R$ 1.000.000/mes      │     (definida primeiro)      │
│                    └───────────┬─────────────┘                              │
│                                │                                            │
│              ┌─────────────────┼─────────────────┐                          │
│              ▼                 ▼                 ▼                          │
│     ┌────────────────┐ ┌────────────────┐ ┌────────────────┐               │
│     │ EQUIPE VENDAS  │ │ EQUIPE SDR     │ │ EQUIPE CS      │ ← Por equipe  │
│     │ R$ 600.000     │ │ 200 MQLs       │ │ 95% retencao   │   (opcional)  │
│     └───────┬────────┘ └───────┬────────┘ └───────┬────────┘               │
│             │                  │                  │                         │
│      ┌──────┼──────┐    ┌──────┼──────┐   ┌──────┼──────┐                  │
│      ▼      ▼      ▼    ▼      ▼      ▼   ▼      ▼      ▼                  │
│    ┌───┐ ┌───┐ ┌───┐  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                 │
│    │200│ │200│ │200│  │70 │ │70 │ │60 │ │95%│ │95%│ │95%│ ← Individual    │
│    │ k │ │ k │ │ k │  │MQL│ │MQL│ │MQL│ │ret│ │ret│ │ret│   (por member)  │
│    └───┘ └───┘ └───┘  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘                 │
│                                                                             │
│  NOTA: Meta da empresa pode ser dividida automaticamente por equipe/pessoa │
│        ou cada nivel pode ter sua propria meta independente                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Tipos de Metricas Disponiveis

| Categoria | Metrica | Descricao | Calculo |
|-----------|---------|-----------|---------|
| **RECEITA** | Valor de Vendas | Receita total das vendas | SUM(oportunidades.valor) WHERE status='ganha' |
| | Receita Recorrente (MRR) | Receita mensal recorrente | SUM(produtos.valor) WHERE recorrente=true |
| | Ticket Medio | Valor medio por venda | AVG(oportunidades.valor) WHERE status='ganha' |
| **QUANTIDADE** | Vendas Fechadas | Numero de negocios ganhos | COUNT(oportunidades) WHERE status='ganha' |
| | Novos Negocios | Oportunidades criadas | COUNT(oportunidades) criadas no periodo |
| | Taxa de Conversao | % de ganhos vs total | (ganhos / total) * 100 |
| **ATIVIDADES** | Reunioes Realizadas | Reunioes concluidas | COUNT(reunioes) WHERE status='realizada' |
| | Ligacoes Feitas | Tarefas tipo ligacao | COUNT(tarefas) WHERE tipo='ligacao' AND concluida |
| | E-mails Enviados | E-mails pelo CRM | COUNT(emails_oportunidades) |
| | Tarefas Concluidas | Total de tarefas | COUNT(tarefas) WHERE concluida=true |
| **LEADS** | Novos Contatos | Contatos criados | COUNT(contatos) criados no periodo |
| | MQLs Gerados | Leads qualificados MKT | COUNT(contatos) WHERE qualificacao='mql' |
| | SQLs Gerados | Leads qualificados Vendas | COUNT(contatos) WHERE qualificacao='sql' |
| **TEMPO** | Tempo Medio de Fechamento | Dias ate ganhar | AVG(dias entre criacao e ganho) |
| | Velocidade do Pipeline | Valor/tempo | SUM(valor) / AVG(dias_no_funil) |

#### Periodos de Meta

| Periodo | Comportamento |
|---------|---------------|
| **Mensal** | Renovacao automatica todo dia 1 |
| **Trimestral** | Renovacao a cada 3 meses |
| **Semestral** | Renovacao a cada 6 meses |
| **Anual** | Renovacao todo dia 1 de janeiro |

#### Interface de Configuracao (Admin)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Configuracoes > Equipe > Metas e Objetivos                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [+ Nova Meta]       Periodo: [Fevereiro 2026 v]       Pipeline: [Todas v] │
│                                                                             │
│  ══════════════════════════════════════════════════════════════════════    │
│  🏢 META DA EMPRESA (Global)                               [Editar]         │
│  ══════════════════════════════════════════════════════════════════════    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  💰 Receita Total          🎯 R$ 1.000.000,00    📊 R$ 640.000 (64%) │   │
│  │      [████████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░] 64%   │   │
│  │                                                                       │   │
│  │  📈 Ticket Medio           🎯 R$ 25.000,00       📊 R$ 23.500 (94%)  │   │
│  │      [██████████████████████████████████████████████░░░░░░░░░░] 94%  │   │
│  │                                                                       │   │
│  │  🔢 Qtd. Vendas            🎯 40 vendas          📊 28 vendas (70%)  │   │
│  │      [████████████████████████████████████░░░░░░░░░░░░░░░░░░░] 70%   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ── METAS POR EQUIPE (opcional) ────────────────────────────────────────   │
│                                                                             │
│  [+ Criar Equipe]   ou   [⚡ Distribuir Meta Empresa Automaticamente]       │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  👥 Equipe Vendas B2B (3 membros)                      [Expandir ▼] │   │
│  │     Meta: R$ 600.000,00 | Atingido: R$ 420.000 (70%)                │   │
│  │     [██████████████████████████████████░░░░░░░░░░░░░░░] 70%          │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  👥 Equipe Pre-Vendas (2 membros)                      [Expandir ▼] │   │
│  │     Meta: R$ 400.000,00 | Atingido: R$ 220.000 (55%)                │   │
│  │     [██████████████████████████░░░░░░░░░░░░░░░░░░░░░░░] 55%          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ── METAS INDIVIDUAIS ──────────────────────────────────────────────────   │
│                                                                             │
│  [⚡ Distribuir Meta Equipe para Membros]  [📋 Aplicar Meta Padrao]        │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  👤 Carlos Silva           Equipe: Vendas B2B                       │   │
│  │     💰 Receita: R$ 200k → R$ 156k (78%)  [██████████████████░░] 78% │   │
│  │     🎯 Ticket: R$ 25k → R$ 26k (104%) ✓  [████████████████████] 104%│   │
│  │     🔢 Vendas: 8 → 6 (75%)               [███████████████░░░░░] 75% │   │
│  │     [Editar Metas]                                                   │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  👤 Maria Santos           Equipe: Vendas B2B               🏆 TOP  │   │
│  │     💰 Receita: R$ 200k → R$ 184k (92%)  [██████████████████████] 92%│   │
│  │     🎯 Ticket: R$ 25k → R$ 30.6k (122%)✓ [████████████████████] 122%│   │
│  │     🔢 Vendas: 8 → 6 (75%)               [███████████████░░░░░] 75% │   │
│  │     [Editar Metas]                                                   │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  👤 Joao Pereira           Equipe: Vendas B2B              ⚠ ALERTA │   │
│  │     💰 Receita: R$ 200k → R$ 80k (40%)   [████████░░░░░░░░░░░░] 40% │   │
│  │     🎯 Ticket: R$ 25k → R$ 20k (80%)     [████████████████░░░░] 80% │   │
│  │     🔢 Vendas: 8 → 4 (50%)               [██████████░░░░░░░░░░] 50% │   │
│  │     [Editar Metas]                                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  🏆 Ranking do Periodo                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  1. Maria Santos   - 97% media  🥇                                   │   │
│  │  2. Carlos Silva   - 86% media  🥈                                   │   │
│  │  3. Pedro Lima     - 72% media  🥉                                   │   │
│  │  4. Joao Pereira   - 57% media  ⚠                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Modal de Criacao/Edicao de Meta

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🎯 Nova Meta                                                          X   │
│     Configure uma meta para a empresa, equipe ou membro individual         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Nivel da Meta *                                                            │
│  ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐      │
│  │       🏢           │ │       👥           │ │       👤           │      │
│  │     Empresa        │ │      Equipe        │ │    Individual      │      │
│  │  Meta global da    │ │  Meta por grupo    │ │  Meta por membro   │      │
│  │  organizacao       │ │  de vendedores     │ │  especifico        │      │
│  │       [✓]          │ │       [ ]          │ │       [ ]          │      │
│  └────────────────────┘ └────────────────────┘ └────────────────────┘      │
│                                                                             │
│  ── SE EQUIPE ─────────────────────────────────────────────────────────    │
│                                                                             │
│  Equipe *                                                                   │
│  [Selecione a equipe...______________________ v]                           │
│                                                                             │
│  ── SE INDIVIDUAL ─────────────────────────────────────────────────────    │
│                                                                             │
│  Membro *                                                                   │
│  [Selecione o membro...______________________ v]                           │
│                                                                             │
│  Equipe (opcional)                                                          │
│  [Nenhuma / Vendas B2B / Pre-Vendas__________ v]                           │
│  Associar a uma equipe para distribuicao automatica                         │
│                                                                             │
│  ── DETALHES DA META ──────────────────────────────────────────────────    │
│                                                                             │
│  Nome da Meta *                                                             │
│  [Meta de Receita Fevereiro 2026_____________]                             │
│                                                                             │
│  Categoria da Metrica *                                                     │
│  [💰 Receita v]  [📊 Quantidade]  [📋 Atividades]  [👥 Leads]  [⏱ Tempo]  │
│                                                                             │
│  Metrica *                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  ● Valor de Vendas (R$)                                               │ │
│  │    Soma do valor das oportunidades ganhas no periodo                  │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │  ○ Receita Recorrente (MRR)                                           │ │
│  │    Soma de produtos recorrentes nas vendas                            │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │  ○ Ticket Medio                                                       │ │
│  │    Valor medio por venda realizada                                    │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  Valor da Meta *                                                            │
│  [R$ 1.000.000,00________________________]                                 │
│                                                                             │
│  Periodo *                                                                  │
│  ○ Mensal     ○ Trimestral     ○ Semestral     ○ Anual                     │
│                                                                             │
│  Data de Inicio *              Data de Fim (automatica)                    │
│  [01/02/2026______]            28/02/2026                                  │
│                                                                             │
│  Pipeline (opcional)                                                        │
│  [Todas as pipelines_______________________ v]                             │
│  Filtrar meta por pipeline especifica                                       │
│                                                                             │
│  ── DISTRIBUICAO AUTOMATICA (apenas para Empresa/Equipe) ─────────────     │
│                                                                             │
│  Distribuir automaticamente                                     [ toggle ] │
│  Dividir o valor da meta entre os niveis inferiores                         │
│                                                                             │
│  Modo de Distribuicao                                                       │
│  ○ Igual - Dividir igualmente entre todos                                  │
│  ○ Proporcional - Baseado em performance historica                         │
│  ○ Manual - Definir valores individuais depois                             │
│                                                                             │
│  [Cancelar]                                          [🎯 Criar Meta]       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Visualizacao pelo Member (Dashboard)

O Member visualiza suas metas no proprio Dashboard (PRD-13), NAO na area de Configuracoes.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Dashboard > Minhas Metas                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Fevereiro 2026                                                             │
│                                                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                   │
│  │  🎯 Vendas    │  │  📊 Contatos  │  │  📅 Reunioes  │                   │
│  │  R$ 78.000    │  │  45 / 50      │  │  12 / 15      │                   │
│  │  de R$ 100k   │  │  (90%)        │  │  (80%)        │                   │
│  │  [████████░░] │  │  [█████████░] │  │  [████████░░] │                   │
│  │  78%          │  │  90%          │  │  80%          │                   │
│  └───────────────┘  └───────────────┘  └───────────────┘                   │
│                                                                             │
│  📈 Meta da Equipe: R$ 320.000 / R$ 500.000 (64%)                          │
│     Sua contribuicao: R$ 78.000 (24.4% do total)                           │
│                                                                             │
│  🏆 Ranking da Equipe                                                       │
│     1. Maria Santos - 115% ✓                                               │
│     2. Carlos Silva - 78%  (voce)                                          │
│     3. Joao Pereira - 56%                                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Regras de Visibilidade

| Role | Configurar Metas | Ver Metas Proprias | Ver Metas Equipe | Ver Ranking |
|------|------------------|-------------------|------------------|-------------|
| **Admin** | SIM | SIM | SIM | SIM |
| **Member** | **NAO** | SIM | SIM (total) | SIM |

#### Tabelas de Banco de Dados

##### equipes (Nova Tabela - Agrupamento de Membros)

```sql
CREATE TABLE equipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),

  nome varchar(255) NOT NULL,
  descricao text,
  cor varchar(7), -- Hex color ex: #3B82F6

  ativo boolean DEFAULT true,

  criado_em timestamptz NOT NULL DEFAULT now(),
  criado_por uuid NOT NULL REFERENCES usuarios(id),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz,

  UNIQUE(organizacao_id, nome)
);

CREATE INDEX idx_equipes_org ON equipes(organizacao_id) WHERE deletado_em IS NULL;

ALTER TABLE equipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON equipes
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

##### equipes_membros (Vinculo Equipe-Usuario)

```sql
CREATE TABLE equipes_membros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipe_id uuid NOT NULL REFERENCES equipes(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),

  ativo boolean DEFAULT true,

  criado_em timestamptz NOT NULL DEFAULT now(),

  UNIQUE(equipe_id, usuario_id)
);

CREATE INDEX idx_equipes_membros_equipe ON equipes_membros(equipe_id);
CREATE INDEX idx_equipes_membros_usuario ON equipes_membros(usuario_id);

ALTER TABLE equipes_membros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON equipes_membros
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

##### metas (Definicao da Meta - Hierarquica)

```sql
CREATE TABLE metas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),

  -- Escopo Hierarquico (CRITICO)
  tipo varchar(20) NOT NULL, -- 'empresa', 'equipe' ou 'individual'
  equipe_id uuid REFERENCES equipes(id), -- Preenchido se tipo = 'equipe'
  usuario_id uuid REFERENCES usuarios(id), -- Preenchido se tipo = 'individual'
  funil_id uuid REFERENCES funis(id), -- NULL = todas pipelines

  -- Hierarquia (para distribuicao automatica)
  meta_pai_id uuid REFERENCES metas(id), -- Referencia a meta superior

  -- Detalhes
  nome varchar(255) NOT NULL,
  descricao text,

  -- Metrica
  metrica varchar(50) NOT NULL,
    -- RECEITA: 'valor_vendas', 'mrr', 'ticket_medio'
    -- QUANTIDADE: 'quantidade_vendas', 'novos_negocios', 'taxa_conversao'
    -- ATIVIDADES: 'reunioes_realizadas', 'ligacoes_feitas', 'emails_enviados', 'tarefas_concluidas'
    -- LEADS: 'novos_contatos', 'mqls_gerados', 'sqls_gerados'
    -- TEMPO: 'tempo_medio_fechamento', 'velocidade_pipeline'
  valor_meta decimal(15,2) NOT NULL, -- Valor alvo

  -- Periodo
  periodo varchar(20) NOT NULL, -- 'mensal', 'trimestral', 'semestral', 'anual'
  data_inicio date NOT NULL,
  data_fim date NOT NULL,

  -- Status
  ativo boolean DEFAULT true,

  -- Timestamps
  criado_em timestamptz NOT NULL DEFAULT now(),
  criado_por uuid NOT NULL REFERENCES usuarios(id),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz,

  -- Validacoes
  CONSTRAINT chk_tipo_empresa CHECK (
    tipo != 'empresa' OR (equipe_id IS NULL AND usuario_id IS NULL)
  ),
  CONSTRAINT chk_tipo_equipe CHECK (
    tipo != 'equipe' OR (equipe_id IS NOT NULL AND usuario_id IS NULL)
  ),
  CONSTRAINT chk_tipo_individual CHECK (
    tipo != 'individual' OR usuario_id IS NOT NULL
  )
);

CREATE INDEX idx_metas_org ON metas(organizacao_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_metas_tipo ON metas(organizacao_id, tipo) WHERE deletado_em IS NULL;
CREATE INDEX idx_metas_equipe ON metas(equipe_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_metas_usuario ON metas(usuario_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_metas_periodo ON metas(data_inicio, data_fim) WHERE deletado_em IS NULL;
CREATE INDEX idx_metas_pai ON metas(meta_pai_id) WHERE deletado_em IS NULL;

ALTER TABLE metas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON metas
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

##### metas_progresso (Cache de Progresso - opcional)

```sql
CREATE TABLE metas_progresso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_id uuid NOT NULL REFERENCES metas(id) ON DELETE CASCADE,
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),

  -- Snapshot
  valor_atual decimal(15,2) NOT NULL DEFAULT 0,
  percentual_atingido decimal(5,2) NOT NULL DEFAULT 0,

  -- Timestamp do calculo
  calculado_em timestamptz NOT NULL DEFAULT now(),

  UNIQUE(meta_id)
);

ALTER TABLE metas_progresso ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON metas_progresso
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

#### Endpoints de API - Equipes (Admin Only)

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| GET | /api/v1/equipes | Listar equipes | **Admin ONLY** |
| POST | /api/v1/equipes | Criar equipe | **Admin ONLY** |
| GET | /api/v1/equipes/:id | Detalhes da equipe | **Admin ONLY** |
| PATCH | /api/v1/equipes/:id | Atualizar equipe | **Admin ONLY** |
| DELETE | /api/v1/equipes/:id | Excluir equipe | **Admin ONLY** |
| POST | /api/v1/equipes/:id/membros | Adicionar membro a equipe | **Admin ONLY** |
| DELETE | /api/v1/equipes/:id/membros/:userId | Remover membro da equipe | **Admin ONLY** |

#### Endpoints de API - Metas (Admin Only para escrita)

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| GET | /api/v1/metas | Listar metas (filtro por tipo) | Admin |
| POST | /api/v1/metas | Criar meta | **Admin ONLY** |
| GET | /api/v1/metas/:id | Detalhes da meta | Admin |
| PATCH | /api/v1/metas/:id | Atualizar meta | **Admin ONLY** |
| DELETE | /api/v1/metas/:id | Excluir meta | **Admin ONLY** |
| GET | /api/v1/metas/empresa | Meta global da empresa | Admin |
| GET | /api/v1/metas/equipes | Metas por equipe | Admin |
| GET | /api/v1/metas/individuais | Metas individuais | Admin |
| POST | /api/v1/metas/:id/distribuir | Distribuir meta para niveis inferiores | **Admin ONLY** |
| GET | /api/v1/metas/progresso | Progresso geral | Admin + Member (proprios) |
| GET | /api/v1/metas/ranking | Ranking da equipe | Admin + Member |
| GET | /api/v1/metas/minhas | Minhas metas (Member) | Member |

**NOTA:** Todos endpoints de escrita retornam 403 Forbidden para role Member.

---

## 4. Configuracoes Gerais do Tenant (Admin Only)

**Descricao:** Preferencias globais da organizacao.

#### Campos Configuraveis

| Campo | Tipo | Padrao | Descricao |
|-------|------|--------|-----------|
| Moeda Padrao | select | BRL | Moeda para valores |
| Timezone | select | America/Sao_Paulo | Fuso horario |
| Formato de Data | select | DD/MM/YYYY | Formato de exibicao |
| Notificar Nova Oportunidade | boolean | true | Email ao criar oportunidade |
| Notificar Tarefa Vencida | boolean | true | Email quando tarefa vencer |
| Notificar Mudanca Etapa | boolean | false | Email ao mover etapa |
| Criar Tarefa Automatica | boolean | true | Criar tarefas da etapa automaticamente |
| Dias Alerta Inatividade | numero | 7 | Alertar apos X dias sem atividade |
| Assinatura de Mensagem | texto | - | Assinatura padrao nas mensagens |
| Horario Inicio Envio | hora | 08:00 | Inicio do horario comercial |
| Horario Fim Envio | hora | 18:00 | Fim do horario comercial |

#### Endpoints de API

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /api/v1/configuracoes-tenant | Obter configuracoes |
| PATCH | /api/v1/configuracoes-tenant | Atualizar configuracoes |

---

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-001 | Admin pode criar campos personalizados | Must |
| RF-002 | Campos do sistema sao bloqueados | Must |
| RF-003 | Admin pode criar produtos e categorias | Must |
| RF-004 | Admin pode definir motivos de ganho/perda | Must |
| RF-005 | Admin pode criar templates de tarefas | Must |
| RF-006 | Admin pode criar templates de etapas | Must |
| RF-007 | Admin pode definir regras de qualificacao | Should |
| RF-008 | Admin pode personalizar campos do card | Should |
| RF-009 | Admin pode conectar integracoes OAuth | Must |
| RF-010 | Admin pode criar webhooks de entrada | Must |
| RF-011 | Admin pode criar webhooks de saida | Must |
| RF-012 | Admin pode gerenciar membros | Must |
| RF-013 | Admin pode criar perfis de permissao | Must |
| RF-014 | Admin pode configurar preferencias do tenant | Should |
| RF-015 | Admin pode criar e gerenciar equipes de vendedores | Must |
| RF-016 | Admin pode configurar metas hierarquicas (Empresa/Equipe/Individual) | Must |
| RF-017 | Admin pode distribuir metas automaticamente entre niveis | Should |
| RF-018 | Sistema calcula progresso das metas em tempo real | Must |
| RF-019 | Member visualiza suas metas e ranking no Dashboard | Must |

---

## Metricas de Sucesso

### KPIs Primarios

| Metrica | Meta | Medicao |
|---------|------|---------|
| Tempo medio de configuracao inicial | < 30 min | Tempo ate Admin completar setup basico |
| Taxa de configuracoes customizadas | >= 60% | Tenants com campos/produtos customizados |
| Taxa de integracao ativa | >= 40% | Tenants com pelo menos 1 OAuth conectado |
| Disponibilidade das configuracoes | >= 99.5% | Uptime do modulo de configuracoes |

### KPIs Secundarios

| Metrica | Meta | Medicao |
|---------|------|---------|
| Campos customizados por tenant | >= 5 | Media de campos criados |
| Produtos cadastrados por tenant | >= 10 | Media de produtos ativos |
| Taxa de uso de metas | >= 50% | Tenants com metas configuradas |
| Webhooks ativos por tenant | >= 1 | Media de webhooks de saida |

### Criterios de Lancamento

| Criterio | Requisito |
|----------|-----------|
| CRUD funcionando | Todos os endpoints retornando 200/201/204 |
| RLS validado | Isolamento de tenant em todas as tabelas |
| Soft delete implementado | Campos deletado_em em todas as entidades |
| Perfis padrao criados | 3 perfis criados automaticamente por tenant |
| OAuth testado | Meta e Google com fluxo completo |

---

## Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|---------------|---------|-----------|
| Vazamento de dados entre tenants | Baixa | Critico | RLS em todas tabelas, testes automatizados de isolamento |
| Member acessando area de Equipe | Media | Alto | Validacao dupla (frontend + backend), logs de tentativa |
| Token OAuth expirado | Media | Medio | Refresh proativo, notificacao ao Admin |
| Webhook de saida falhando | Alta | Medio | Sistema de retry (3 tentativas), logs detalhados |
| Conflito de campos customizados | Baixa | Medio | Validacao de nome unico por entidade/tenant |
| Perda de dados em soft delete | Baixa | Alto | Confirmacao dupla, periodo de recuperacao 30 dias |
| Performance com muitos campos | Media | Medio | Lazy loading, paginacao, cache de schema |
| Distribuicao de metas incorreta | Media | Alto | Validacao de soma, preview antes de aplicar |

---

## Time to Value

### MVP (4 dias)

| Dia | Entrega |
|-----|---------|
| 1 | CRUD Campos Personalizados (13 tipos) |
| 2 | CRUD Produtos e Categorias |
| 3 | CRUD Membros e Perfis de Permissao (Admin only) |
| 4 | Templates de Etapas e Tarefas |

**Funcionalidades MVP:**
- Campos customizados por entidade
- Catalogo de produtos basico
- Gestao de membros e perfis
- Templates de pipeline

### Versao 1.0 (+ 4 dias)

| Dia | Entrega |
|-----|---------|
| 5 | OAuth Meta Ads (Lead Ads) |
| 6 | OAuth Google Calendar |
| 7 | Webhooks de entrada e saida |
| 8 | Configuracoes gerais do tenant |

**Funcionalidades V1.0:**
- Todas integracoes OAuth
- Webhooks bidirecionais
- Preferencias do tenant
- Motivos de ganho/perda

### Versao 1.1 (+ 3 dias)

| Dia | Entrega |
|-----|---------|
| 9 | CRUD Equipes |
| 10 | Sistema de Metas hierarquicas |
| 11 | Distribuicao automatica + Ranking |

**Funcionalidades V1.1:**
- Equipes de vendedores
- Metas empresa/equipe/individual
- 15 tipos de metricas
- Dashboard de metas para Member

---

## Plano de Validacao

### Pre-Lancamento

| Item | Validacao | Responsavel |
|------|-----------|-------------|
| Testes unitarios | >= 85% cobertura | Dev Team |
| Testes de isolamento | Validar RLS em todas tabelas | QA + Security |
| Teste de OAuth | Fluxo completo Meta e Google | QA |
| Teste de webhooks | Envio e recebimento funcionando | QA |
| Revisao de permissoes | Member bloqueado de Equipe | Tech Lead |

### Durante Lancamento

| Item | Validacao | Responsavel |
|------|-----------|-------------|
| Monitoramento de erros 403 | Alertas para tentativas de Member | DevOps |
| Performance de listagens | < 500ms para listas com paginacao | DevOps |
| Logs de configuracao | Audit trail completo | Security |
| Webhooks de saida | Taxa de sucesso > 95% | DevOps |

### Pos-Lancamento

| Item | Validacao | Frequencia |
|------|-----------|------------|
| Revisao de campos criados | Identificar padroes de uso | Mensal |
| Saude das integracoes | Tokens validos, sync funcionando | Semanal |
| Feedback de Admins | NPS do modulo de configuracoes | Mensal |
| Otimizacao de queries | Analise de slow queries | Quinzenal |
| Auditoria de permissoes | Revisar acessos por tenant | Mensal |

---

## 6. Checklist de Implementacao

### Backend
- [ ] CRUD campos_customizados
- [ ] CRUD valores_campos_customizados
- [ ] CRUD produtos
- [ ] CRUD categorias_produtos
- [ ] CRUD motivos_resultado
- [ ] CRUD tarefas_templates
- [ ] CRUD etapas_templates
- [ ] CRUD regras_qualificacao
- [ ] CRUD configuracoes_card
- [ ] CRUD configuracoes_tenant
- [ ] CRUD integracoes (OAuth flow)
- [ ] CRUD webhooks_entrada
- [ ] CRUD webhooks_saida
- [ ] CRUD usuarios (members)
- [ ] CRUD perfis_permissao
- [ ] CRUD equipes
- [ ] CRUD equipes_membros
- [ ] CRUD metas (hierarquico)
- [ ] CRUD metas_progresso
- [ ] Endpoint distribuicao automatica de metas
- [ ] Endpoint calculo de progresso por metrica
- [ ] Endpoint ranking de equipe

### Frontend
- [ ] Pagina Campos Personalizados
- [ ] Pagina Produtos
- [ ] Pagina Categorias
- [ ] Pagina Motivos de Resultado
- [ ] Pagina Tarefas (Templates)
- [ ] Pagina Etapas (Templates)
- [ ] Pagina Regras de Qualificacao
- [ ] Pagina Personalizacao de Cards
- [ ] Pagina Conexoes
- [ ] Pagina Webhooks Entrada
- [ ] Pagina Webhooks Saida
- [ ] Pagina Membros
- [ ] Pagina Perfis de Permissao
- [ ] Pagina Configuracoes Gerais
- [ ] Pagina Equipes (CRUD)
- [ ] Pagina Metas e Objetivos (Admin)
- [ ] Modal criacao/edicao de meta hierarquica
- [ ] Componente barra de progresso de metas
- [ ] Componente ranking de equipe
- [ ] Widget Minhas Metas (Dashboard Member)

---

## Historico de Versoes

| Versao | Data | Autor | Mudancas |
|--------|------|-------|----------|
| v1.0 | 2026-01-31 | Arquiteto de Produto | Versao inicial |
| v1.1 | 2026-01-31 | Arquiteto de Produto | Adicionadas restricoes explicitas do Member (Equipe & Permissoes BLOQUEADO), endpoints marcados como Admin ONLY |
| v1.2 | 2026-01-31 | Arquiteto de Produto | Adicionada referencia ao PRD-08 na secao Conexoes |
| v1.3 | 2026-02-03 | Arquiteto de Produto | Adicionada secao 3.3.3 Metas e Objetivos (RF-015 a RF-019): Sistema hierarquico de metas (Empresa/Equipe/Individual) com 15 tipos de metricas, distribuicao automatica, 4 novas tabelas (equipes, equipes_membros, metas, metas_progresso), visualizacao por Member no Dashboard |
| v1.5 | 2026-02-03 | Arquiteto de Produto | Adicionadas secoes conforme prdpadrao.md: Hierarquia de Requisitos (Theme/Epic/5 Features), Metricas de Sucesso (KPIs e criterios lancamento), Riscos e Mitigacoes (8 riscos identificados), Time to Value (MVP 4 dias, V1.0 +4 dias, V1.1 +3 dias), Plano de Validacao (Pre/Durante/Pos-Lancamento) |
| v1.6 | 2026-02-03 | Arquiteto de Produto | **PRE-REQUISITO SUPER ADMIN**: Adicionada dependencia de PRD-14; Nova secao "Pre-Requisito: Criacao pelo Super Admin" com fluxo de inicializacao; Tabela de dependencia de dados mostrando quem consome o que este modulo fornece; Este modulo agora esta na Fase 1 (apos PRD-14) |
