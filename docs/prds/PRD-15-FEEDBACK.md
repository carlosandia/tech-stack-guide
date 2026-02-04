# PRD-15: Modulo de Feedback/Evolucao - CRM Renove

| Campo | Valor |
|-------|-------|
| **Autor** | Arquiteto de Produto |
| **Data de criacao** | 2026-02-03 |
| **Ultima atualizacao** | 2026-02-03 |
| **Versao** | v1.1 |
| **Status** | Rascunho |
| **Stakeholders** | Product Owner, Tech Lead, Design Lead |
| **Revisor tecnico** | Tech Lead |
| **Dependencias** | PRD-02-MULTI-TENANT, PRD-03-AUTENTICACAO, PRD-04-DATABASE-SCHEMA |

---

## Resumo Executivo

O **Modulo de Feedback/Evolucao** estabelece um canal estruturado de comunicacao entre usuarios do CRM (Admin e Member) e a equipe de produto (Super Admin). Atraves de um **botao flutuante** presente em todas as telas, usuarios podem enviar bugs, sugestoes ou duvidas de forma rapida e organizada.

O Super Admin acessa o painel exclusivo **`/evolucao`** onde visualiza todos os feedbacks enviados por todas as empresas (tenants), podendo filtrar, analisar e marcar como resolvido. Ao resolver um feedback, o usuario original e **notificado automaticamente** atraves do sistema de notificacoes (sino no header).

**Impacto esperado**: Reducao de 80% no tempo de comunicacao de bugs, aumento de 50% na taxa de sugestoes de melhoria capturadas, e melhoria significativa na percepcao de atendimento pelos usuarios do CRM.

---

## Contexto e Motivacao

### Problema

**Dor do usuario:**
- Usuarios encontram bugs mas nao sabem como reportar
- Sugestoes de melhoria se perdem em conversas informais
- Falta de visibilidade sobre se o problema foi resolvido
- Canais desorganizados (WhatsApp, email, ligacoes)

**Impacto no negocio:**
- Bugs criticos nao chegam rapidamente a equipe de produto
- Perda de insights valiosos de usuarios ativos
- Sensacao de abandono quando feedback nao e respondido
- Dificuldade em priorizar melhorias sem dados estruturados

**Evidencias:**
- 73% dos usuarios abandonam SaaS por falta de suporte responsivo
- Empresas com canal de feedback ativo tem 40% mais retencao
- Bugs reportados estruturadamente sao resolvidos 3x mais rapido
- 65% das melhores features vem de sugestoes de usuarios

### Oportunidade de Mercado

O mercado de SaaS brasileiro valoriza cada vez mais a proximidade entre produto e usuario. CRMs que oferecem canais de feedback integrados se destacam na fidelizacao e NPS.

**Tendencias relevantes:**
- Crescimento de feedback in-app (vs. formularios externos)
- Expectativa de resposta rapida (< 24h)
- Transparencia no status de resolucao
- Gamificacao de contribuicoes de usuarios

### Alinhamento Estrategico

**Conexao com objetivos:**
- Epic 5: Engajamento e Retencao
- Melhoria continua baseada em dados de usuarios
- Fortalecimento do relacionamento com clientes

**Metricas de sucesso:**
- Volume de feedbacks recebidos: > 10/mes por tenant ativo
- Tempo medio de resolucao: < 72h
- Taxa de satisfacao pos-resolucao: > 85%

---

## Usuarios e Personas

### Super Admin (Gestor da Plataforma)

**Necessidades neste modulo:**
- Visualizar todos os feedbacks de todos os tenants
- Filtrar por empresa, tipo e status
- Analisar detalhes do feedback
- Marcar como resolvido e notificar usuario

**Acoes permitidas:**
- Acessar modulo /evolucao
- Listar todos os feedbacks
- Ver detalhes completos
- Alterar status para "resolvido"
- Nao pode enviar feedback (nao e usuario do CRM)

### Admin (Gestor do Tenant)

**Necessidades neste modulo:**
- Reportar bugs encontrados no CRM
- Sugerir melhorias para o produto
- Tirar duvidas sobre funcionalidades
- Ser notificado quando feedback for resolvido

**Restricoes:**
- Ve apenas suas proprias notificacoes
- Nao acessa o painel /evolucao

### Member (Vendedor)

**Necessidades neste modulo:**
- Reportar problemas encontrados no dia a dia
- Sugerir funcionalidades que facilitariam o trabalho
- Ser notificado quando feedback for atendido

**Restricoes:**
- Ve apenas suas proprias notificacoes
- Nao acessa o painel /evolucao

### Anti-Persona

**Super Admin enviando feedback** - O Super Admin gerencia a plataforma, nao opera como usuario do CRM. Ele NAO utiliza o botao flutuante de feedback.

---

## Hierarquia de Requisitos

### Theme (Objetivo Estrategico)

> Estabelecer canal de comunicacao bidirecional entre usuarios e equipe de produto para melhoria continua do CRM.

### Epic (Iniciativa)

> Sistema de feedback in-app com gestao centralizada e notificacoes automaticas de resolucao.

---

## Requisitos Funcionais

### RF-001: Botao Flutuante de Feedback

**User Story:**
Como Admin ou Member,
Quero ter um botao de facil acesso para enviar feedback,
Para reportar bugs ou sugerir melhorias de forma rapida sem interromper meu trabalho.

**Descricao:**

Botao circular fixo no canto inferior direito da tela, visivel em todas as paginas do CRM.

**Layout:**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  CRM Renove          Negocios  Contatos  Conversas  Config        [🔔]  👤 User │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│                                                                                 │
│                        [ Conteudo da pagina atual ]                             │
│                                                                                 │
│                                                                                 │
│                                                                                 │
│                                                                    ┌─────────┐ │
│                                                                    │   💡    │ │
│                                                                    └─────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
                                                                         ↑
                                                               Botao Flutuante
                                                               fixed, bottom: 24px
                                                               right: 24px
```

**Especificacoes Visuais:**

| Propriedade | Valor |
|-------------|-------|
| Tamanho | 56x56px |
| Background | linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%) |
| Border-radius | 50% (circulo) |
| Icone | Lightbulb (Lucide) branco, 24px |
| Sombra | 0 4px 12px rgba(0,0,0,0.15) |
| Z-index | 9999 |

**Estados:**

| Estado | Visual |
|--------|--------|
| Normal | Conforme especificacao |
| Hover | transform: scale(1.1); box-shadow: 0 6px 16px rgba(0,0,0,0.2) |
| Active | transform: scale(0.95) |
| Focus | ring: 2px solid #3B82F6 offset 2px |

**Visibilidade por Role:**

| Role | Visivel |
|------|---------|
| Super Admin | NAO |
| Admin | SIM |
| Member | SIM |

**Criterios de Aceitacao:**
- [ ] Botao visivel em todas as paginas para Admin e Member
- [ ] Botao NAO visivel para Super Admin
- [ ] Posicao fixa no canto inferior direito (24px de margem)
- [ ] Hover aumenta escala e sombra suavemente
- [ ] Click abre popover de feedback (RF-002)
- [ ] Nao sobrepoe elementos criticos (modais, drawers)
- [ ] Transicao suave ao aparecer/desaparecer

**Prioridade:** Must-have

---

### RF-002: Popover de Envio de Feedback

**User Story:**
Como Admin ou Member,
Quero preencher tipo e descricao do meu feedback,
Para comunicar problemas ou sugestoes de forma estruturada ao time de produto.

**Descricao:**

Popover que abre acima e a esquerda do botao flutuante com formulario de feedback.

**Layout do Popover:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  ┌───────┐                                                          ││
│  │  │  💡   │  Nos ajude a melhorar                               X    ││
│  │  └───────┘  Reporte bugs ou sugira ideias                           ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  Tipo de feedback                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ⚙️  Bug/Problema                                            ▼   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Descricao                                                              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Descreva em detalhes o problema ou sugestao...                  │   │
│  │                                                                 │   │
│  │                                                                 │   │
│  │                                                                 │   │
│  │                                                                 │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│  Minimo 10 caracteres, maximo 10.000                                    │
│                                                                         │
│  ┌─────────────┐  ┌─────────────────────────────────────────────────┐  │
│  │  Cancelar   │  │             Enviar Feedback                     │  │
│  └─────────────┘  └─────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Especificacoes do Popover:**

| Propriedade | Valor |
|-------------|-------|
| Largura | 400px |
| Background | white |
| Border-radius | 12px |
| Sombra | 0 8px 24px rgba(0,0,0,0.15) |
| Header background | linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%) |
| Header text | white |

**Campos do Formulario:**

| Campo | Tipo | Obrigatorio | Validacao |
|-------|------|-------------|-----------|
| tipo | select | Sim | Enum: bug, sugestao, duvida |
| descricao | textarea | Sim | Min: 10, Max: 10.000 caracteres |

**Opcoes do Dropdown Tipo:**

| Valor | Label | Icone | Cor Icone |
|-------|-------|-------|-----------|
| bug | Bug/Problema | Settings2 | #EF4444 (vermelho) |
| sugestao | Sugestao/Melhoria | Lightbulb | #7C3AED (roxo) |
| duvida | Duvida/Ajuda | HelpCircle | #3B82F6 (azul) |

**Dropdown Expandido:**

```
┌─────────────────────────────────────────────────────────────────┐
│ ⚙️  Bug/Problema                                            ▼   │
├─────────────────────────────────────────────────────────────────┤
│  ✓  ⚙️  Bug/Problema                                            │
│     💡  Sugestao/Melhoria                                       │
│     ❓  Duvida/Ajuda                                            │
└─────────────────────────────────────────────────────────────────┘
```

**Comportamento:**
- Popover abre ao clicar no botao flutuante
- Posicao: acima e a esquerda do botao (ajusta se nao couber)
- Fecha ao clicar em X, Cancelar ou fora do popover
- Valida campos em tempo real
- Botao "Enviar" desabilitado se descricao < 10 caracteres
- Toast de sucesso apos envio
- Limpa campos e fecha apos sucesso
- Contador de caracteres visivel abaixo do textarea

**Botoes:**

| Botao | Estilo | Acao |
|-------|--------|------|
| Cancelar | outline, cinza | Fecha popover sem enviar |
| Enviar Feedback | solid, azul #3B82F6 | Valida e envia feedback |

**Criterios de Aceitacao:**
- [ ] Header com gradiente roxo/azul e icone lampada
- [ ] Dropdown funciona com 3 opcoes (icones coloridos)
- [ ] Textarea expande conforme digitacao (max 200px altura)
- [ ] Contador de caracteres atualiza em tempo real
- [ ] Validacao: minimo 10 caracteres para habilitar envio
- [ ] Botao "Enviar Feedback" desabilitado se invalido
- [ ] Loading spinner no botao durante envio
- [ ] Toast de sucesso: "Feedback enviado com sucesso!"
- [ ] Popover fecha e limpa apos envio bem-sucedido
- [ ] Erro tratado com toast de erro especifico

**Prioridade:** Must-have

---

### RF-003: Modulo /evolucao (Super Admin)

**User Story:**
Como Super Admin,
Quero acessar um painel centralizado de feedbacks,
Para visualizar e gerenciar sugestoes e bugs reportados por usuarios de todos os tenants.

**Descricao:**

Pagina exclusiva do painel Super Admin para gestao de feedbacks.

**Layout da Pagina:**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Renove Admin                                                  [🔔 3]  Super Admin│
├──────────────────┬──────────────────────────────────────────────────────────────┤
│                  │                                                              │
│  ┌────────────┐  │  Evolucao do Produto                                         │
│  │ Dashboard  │  │                                                              │
│  └────────────┘  │  ┌────────────────────────────────────────────────────────┐  │
│  ┌────────────┐  │  │ [Empresa ▼] [Tipo ▼] [Status ▼]     [🔍 Buscar...]    │  │
│  │ Empresas   │  │  └────────────────────────────────────────────────────────┘  │
│  └────────────┘  │                                                              │
│  ┌────────────┐  │  ┌────────┬──────────┬─────────┬────────────┬────────────┐  │
│  │ Usuarios   │  │  │EMPRESA │ USUARIO  │ TIPO    │ DATA       │ STATUS     │  │
│  └────────────┘  │  ├────────┼──────────┼─────────┼────────────┼────────────┤  │
│  ┌────────────┐  │  │TechCorp│ Joao S.  │🔴 Bug   │03/02 14:30 │🟡 Aberto   │  │
│  │>Evolucao  <│  │  ├────────┼──────────┼─────────┼────────────┼────────────┤  │
│  └────────────┘  │  │Renove  │ Maria S. │💡 Sug.  │02/02 10:15 │🟢 Resolvido│  │
│  ┌────────────┐  │  ├────────┼──────────┼─────────┼────────────┼────────────┤  │
│  │Configuracoes│  │  │StartupX│ Carlos   │❓ Duv.  │01/02 09:00 │🟡 Aberto   │  │
│  └────────────┘  │  └────────┴──────────┴─────────┴────────────┴────────────┘  │
│                  │                                                              │
│                  │  Mostrando 1-10 de 45 feedbacks          [< 1 2 3 4 5 >]     │
│                  │                                                              │
└──────────────────┴──────────────────────────────────────────────────────────────┘
```

**Acesso:**
- Rota: `/admin/evolucao`
- Menu lateral do painel Super Admin
- Acesso exclusivo para role `super_admin`

**Elementos da Pagina:**
- Header com titulo "Evolucao do Produto"
- Barra de filtros
- Tabela de feedbacks
- Paginacao

**Criterios de Aceitacao:**
- [ ] Pagina acessivel apenas para Super Admin
- [ ] Rota protegida retorna 403 para outros roles
- [ ] Menu lateral com item "Evolucao" destacado quando ativo
- [ ] Header com titulo "Evolucao do Produto"
- [ ] Tabela carrega feedbacks de TODOS os tenants
- [ ] Click na linha abre modal de detalhes (RF-005)
- [ ] Paginacao com 10 itens por pagina

**Prioridade:** Must-have

---

### RF-004: Lista de Feedbacks com Filtros

**User Story:**
Como Super Admin,
Quero filtrar feedbacks por empresa, tipo e status,
Para encontrar rapidamente os itens que preciso analisar.

**Descricao:**

Sistema de filtros combinaveis para a lista de feedbacks.

**Filtros Disponiveis:**

| Filtro | Tipo | Opcoes | Default |
|--------|------|--------|---------|
| Empresa | Select | "Todas" + lista de tenants | Todas |
| Tipo | Select | Todos, Bug, Sugestao, Duvida | Todos |
| Status | Select | Todos, Aberto, Resolvido | Todos |
| Busca | Text input | Busca livre na descricao | Vazio |

**Layout da Barra de Filtros:**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ┌────────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Todas ▼        │  │ Todos ▼      │  │ Todos ▼      │  │🔍 Buscar...    │  │
│  │ Empresa        │  │ Tipo         │  │ Status       │  │                │  │
│  └────────────────┘  └──────────────┘  └──────────────┘  └────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Colunas da Tabela:**

| Coluna | Campo | Largura | Formato |
|--------|-------|---------|---------|
| Empresa | organizacao.nome | 150px | Texto |
| Usuario | usuario.nome | 120px | Texto |
| Tipo | tipo | 100px | Badge colorido |
| Data | criado_em | 120px | DD/MM HH:mm |
| Status | status | 100px | Badge colorido |

**Badges de Tipo:**

| Tipo | Background | Text | Icone |
|------|------------|------|-------|
| bug | #FEE2E2 | #991B1B | ⚙️ |
| sugestao | #EDE9FE | #5B21B6 | 💡 |
| duvida | #DBEAFE | #1E40AF | ❓ |

**Badges de Status:**

| Status | Background | Text |
|--------|------------|------|
| aberto | #FEF3C7 | #92400E |
| resolvido | #D1FAE5 | #065F46 |

**Ordenacao:**
- Padrao: criado_em DESC (mais recentes primeiro)
- Feedbacks com status "aberto" tem prioridade visual (pode ter indicador)

**Comportamento:**
- Filtros aplicam automaticamente ao selecionar
- Busca com debounce de 300ms
- Combinacao de filtros usa AND
- URL atualiza com query params para permitir compartilhamento
- Skeleton loading durante carregamento

**Criterios de Aceitacao:**
- [ ] Filtro de empresa lista todos os tenants ativos
- [ ] Filtro de tipo tem 4 opcoes (Todos + 3 tipos)
- [ ] Filtro de status tem 3 opcoes (Todos + 2 status)
- [ ] Busca funciona com debounce 300ms
- [ ] Filtros combinam corretamente (AND)
- [ ] Badges de tipo com cores e icones corretos
- [ ] Badges de status com cores corretas
- [ ] Hover na linha destaca visualmente
- [ ] Click na linha abre modal de detalhes

**Prioridade:** Must-have

---

### RF-005: Modal de Detalhes do Feedback

**User Story:**
Como Super Admin,
Quero visualizar detalhes completos do feedback,
Para entender o problema e decidir a acao apropriada.

**Descricao:**

Modal com todas as informacoes do feedback selecionado.

**Layout do Modal:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📋  Detalhes do Feedback                                              X    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Empresa                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ TechCorp Solucoes                                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Usuario                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Joao Silva                                                          │   │
│  │ joao@techcorp.com                                                   │   │
│  │ Role: Admin                                                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Tipo                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 🔴 Bug/Problema                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Data do Envio                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 03 de fevereiro de 2026 as 14:30                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Descricao                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Ao clicar no botao de salvar oportunidade, o sistema trava e       │   │
│  │ preciso recarregar a pagina. Isso acontece sempre que o valor do   │   │
│  │ negocio e maior que R$ 100.000.                                    │   │
│  │                                                                     │   │
│  │ Ja testei em Chrome e Firefox e o problema persiste.               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Status Atual                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 🟡 Aberto                                                       ▼   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐                      ┌─────────────────────────────────┐  │
│  │   Fechar    │                      │  ✅ Marcar como Resolvido       │  │
│  └─────────────┘                      └─────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Campos Exibidos:**

| Campo | Fonte | Formato |
|-------|-------|---------|
| Empresa | organizacao.nome | Texto |
| Usuario | usuario.nome + email + role | Texto multilinhas |
| Tipo | tipo | Badge com icone e cor |
| Data do Envio | criado_em | Formato extenso PT-BR |
| Descricao | descricao | Texto em area readonly |
| Status Atual | status | Dropdown editavel (se aberto) |

**Comportamento do Status:**
- Se status = "aberto": dropdown editavel + botao "Marcar como Resolvido"
- Se status = "resolvido": exibe texto fixo + info de quem resolveu + quando

**Se Ja Resolvido:**

```
  Status Atual
  ┌─────────────────────────────────────────────────────────────────────┐
  │ 🟢 Resolvido                                                        │
  │ Resolvido por: Super Admin em 04/02/2026 as 10:00                   │
  └─────────────────────────────────────────────────────────────────────┘
```

**Criterios de Aceitacao:**
- [ ] Modal abre ao clicar na linha da tabela
- [ ] Todos os campos exibidos corretamente
- [ ] Descricao em area de texto somente leitura (scrollable se grande)
- [ ] Dropdown de status editavel apenas se status = aberto
- [ ] Botao "Marcar como Resolvido" visivel apenas se aberto
- [ ] Exibe info de resolucao se ja resolvido
- [ ] Modal fecha ao clicar X, Fechar ou fora do modal
- [ ] ESC fecha o modal

**Prioridade:** Must-have

---

### RF-006: Marcar como Corrigido/Resolvido

**User Story:**
Como Super Admin,
Quero marcar um feedback como resolvido,
Para indicar que a questao foi tratada e notificar automaticamente o usuario.

**Descricao:**

Acao que atualiza status do feedback e dispara notificacao.

**Fluxo:**

```
┌──────────────────────────────┐
│ Super Admin visualiza        │
│ feedback com status "aberto" │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Clica em                     │
│ "Marcar como Resolvido"      │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Sistema atualiza:            │
│ - status = "resolvido"       │
│ - resolvido_em = now()       │
│ - resolvido_por = user_id    │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Sistema cria notificacao     │
│ para o usuario original      │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Toast: "Feedback marcado     │
│ como resolvido. Usuario      │
│ foi notificado."             │
└──────────────────────────────┘
```

**Notificacao Criada:**

| Campo | Valor |
|-------|-------|
| usuario_id | feedback.usuario_id (quem enviou o feedback) |
| tipo | "feedback_resolvido" |
| titulo | "Seu feedback foi resolvido" |
| mensagem | Primeiros 50 caracteres da descricao + "..." |
| referencia_tipo | "feedback" |
| referencia_id | feedback.id |

**Regras:**
- Apenas Super Admin pode marcar como resolvido
- Nao e possivel "desmarcar" (reverter para aberto)
- Registra mudanca em audit_log
- Feedback ja resolvido nao exibe botao

**Criterios de Aceitacao:**
- [ ] Botao "Marcar como Resolvido" funciona
- [ ] Status muda de "aberto" para "resolvido"
- [ ] Campos resolvido_em e resolvido_por preenchidos
- [ ] Notificacao criada para o usuario original
- [ ] Toast de confirmacao exibido
- [ ] Lista de feedbacks atualiza automaticamente
- [ ] Modal atualiza para exibir info de resolucao
- [ ] Audit log registra a acao

**Prioridade:** Must-have

---

### RF-007: Sistema de Notificacoes (Sino no Header)

**User Story:**
Como Admin ou Member,
Quero ser notificado quando meu feedback for resolvido,
Para saber que minha sugestao foi atendida pela equipe de produto.

**Descricao:**

Sistema de notificacoes com icone de sino no header do CRM.

**Layout do Sino no Header:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CRM Renove          Negocios  Contatos  Conversas  Config    [🔔 2]  👤 User│
└─────────────────────────────────────────────────────────────────────────────┘
                                                                    ↑
                                                            Sino com badge
                                                            vermelho se > 0
```

**Estados do Sino:**

| Estado | Visual |
|--------|--------|
| Sem notificacoes | Sino cinza, sem badge |
| Com notificacoes | Sino destacado, badge vermelho com numero |
| Maximo | Badge exibe "9+" se mais de 9 |

**Layout do Dropdown de Notificacoes:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Notificacoes                               [Marcar todas]      │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ✅  Seu feedback foi resolvido                   Hoje     │  │
│  │     "Ao clicar no botao de salvar..."           14:30     │  │
│  │     🔵 nao lida                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ✅  Seu feedback foi resolvido                   Ontem    │  │
│  │     "Sugestao de melhoria no relat..."          10:15     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [Ver todas as notificacoes]                                    │
└─────────────────────────────────────────────────────────────────┘
```

**Estrutura de Cada Notificacao:**

| Elemento | Descricao |
|----------|-----------|
| Icone | CheckCircle verde para feedback_resolvido |
| Titulo | "Seu feedback foi resolvido" |
| Mensagem | Trecho da descricao (max 40 chars) |
| Data | Formato relativo (Hoje, Ontem, DD/MM) |
| Hora | HH:mm |
| Indicador | Bolinha azul se nao lida |

**Comportamento:**
- Sino visivel no header para Admin e Member
- Click no sino abre dropdown
- Dropdown mostra ultimas 5 notificacoes
- Click em notificacao marca como lida
- "Marcar todas" marca todas como lidas
- "Ver todas" navega para pagina de notificacoes (futuro)
- Badge atualiza em tempo real (Supabase Realtime)

**Visibilidade por Role:**

| Role | Sino Visivel |
|------|--------------|
| Super Admin | NAO (usa painel admin) |
| Admin | SIM |
| Member | SIM |

**Criterios de Aceitacao:**
- [ ] Sino visivel no header para Admin e Member
- [ ] Sino NAO visivel para Super Admin
- [ ] Badge numerico vermelho com contagem de nao lidas
- [ ] Badge oculto se 0 notificacoes nao lidas
- [ ] Badge exibe "9+" se mais de 9
- [ ] Dropdown abre ao clicar no sino
- [ ] Notificacoes ordenadas por data DESC
- [ ] Click em notificacao marca como lida
- [ ] Indicador visual de nao lida (bolinha azul)
- [ ] "Marcar todas" marca todas como lidas e fecha dropdown
- [ ] Notificacao inclui trecho do feedback original
- [ ] Atualiza em tempo real ao receber nova notificacao

**Prioridade:** Must-have

---

## Requisitos Nao-Funcionais

### Performance

| Metrica | Requisito |
|---------|-----------|
| Tempo de abertura do popover | < 100ms |
| Tempo de envio do feedback | < 500ms |
| Carregamento da lista /evolucao | < 1s (100 feedbacks) |
| Atualizacao do badge de notificacoes | < 200ms (Realtime) |

### Seguranca

| Requisito | Implementacao |
|-----------|---------------|
| Isolamento de feedbacks | Super Admin ve todos, usuarios veem apenas proprios |
| Protecao da rota /evolucao | Middleware verifica role = super_admin |
| Validacao de entrada | Zod schema para tipo e descricao |
| Rate limiting | Max 10 feedbacks/hora por usuario |

### Usabilidade

| Requisito | Descricao |
|-----------|-----------|
| Responsividade | Popover adapta em mobile (fullscreen) |
| Acessibilidade | WCAG 2.1 AA - contraste, focus, labels |
| Feedback visual | Loading states, toasts de sucesso/erro |

### Sistema/Ambiente

| Requisito | Descricao |
|-----------|-----------|
| Navegadores | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ |
| Realtime | Supabase Realtime para notificacoes |
| Persistencia | PostgreSQL com RLS |

---

## Escopo

### O que ESTA no escopo

- Botao flutuante de feedback para Admin/Member
- Popover de envio com tipo e descricao
- Modulo /evolucao exclusivo para Super Admin
- Lista de feedbacks com filtros
- Modal de detalhes do feedback
- Acao de marcar como resolvido
- Sistema de notificacoes (sino no header)
- Notificacao automatica ao resolver

### O que NAO esta no escopo

- **Resposta textual ao feedback**: Super Admin apenas marca como resolvido
- **Anexos no feedback**: Apenas texto (screenshots futuro)
- **Categorias customizaveis**: Tipos fixos (bug, sugestao, duvida)
- **Atribuicao de feedback**: Nao ha workflow de atribuicao a pessoas
- **Chat/conversa**: Comunicacao unidirecional (usuario -> produto)
- **Pagina de historico para usuario**: Usuario ve apenas via notificacao

### Escopo Futuro (backlog)

- Anexar screenshots/videos ao feedback
- Super Admin pode responder ao feedback
- Dashboard de metricas de feedback
- Categorias customizaveis
- Integracao com ferramentas de issue tracking (Jira, Linear)
- Votacao em sugestoes de outros usuarios
- Pagina "Meus Feedbacks" para Admin/Member

---

## Modelo de Dados

### Tabela: feedbacks

```sql
CREATE TABLE feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),

  -- Conteudo
  tipo varchar(20) NOT NULL CHECK (tipo IN ('bug', 'sugestao', 'duvida')),
  descricao text NOT NULL,

  -- Status
  status varchar(20) NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'resolvido')),
  resolvido_em timestamptz,
  resolvido_por uuid REFERENCES usuarios(id),

  -- Padrao
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz
);

-- Indices
CREATE INDEX idx_feedbacks_org ON feedbacks(organizacao_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_feedbacks_status ON feedbacks(status, criado_em DESC) WHERE deletado_em IS NULL;
CREATE INDEX idx_feedbacks_usuario ON feedbacks(usuario_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_feedbacks_tipo ON feedbacks(tipo) WHERE deletado_em IS NULL;

-- RLS
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- Usuario ve apenas seus proprios feedbacks
CREATE POLICY "usuario_proprio_feedback" ON feedbacks
  FOR SELECT
  USING (usuario_id = current_setting('app.current_user')::uuid);

-- Usuario pode inserir feedback
CREATE POLICY "usuario_insere_feedback" ON feedbacks
  FOR INSERT
  WITH CHECK (
    usuario_id = current_setting('app.current_user')::uuid
    AND organizacao_id = current_setting('app.current_tenant')::uuid
  );

-- Super Admin acessa todos via service role (bypass RLS)
```

### Tabela: notificacoes

```sql
CREATE TABLE notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),

  -- Conteudo
  tipo varchar(50) NOT NULL,
  titulo varchar(255) NOT NULL,
  mensagem text,
  link varchar(500),

  -- Referencia (opcional)
  referencia_tipo varchar(50), -- 'feedback', 'tarefa', 'oportunidade', etc
  referencia_id uuid,

  -- Status
  lida boolean NOT NULL DEFAULT false,
  lida_em timestamptz,

  -- Padrao
  criado_em timestamptz NOT NULL DEFAULT now()
);

-- Indices
CREATE INDEX idx_notificacoes_usuario ON notificacoes(usuario_id, lida, criado_em DESC);
CREATE INDEX idx_notificacoes_nao_lidas ON notificacoes(usuario_id) WHERE lida = false;
CREATE INDEX idx_notificacoes_tipo ON notificacoes(tipo, criado_em DESC);

-- RLS
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

-- Usuario ve e modifica apenas suas notificacoes
CREATE POLICY "usuario_proprias_notificacoes" ON notificacoes
  FOR ALL
  USING (usuario_id = current_setting('app.current_user')::uuid);
```

---

## Endpoints de API

### Feedbacks (Admin/Member)

| Metodo | Endpoint | Descricao | Auth | Rate Limit |
|--------|----------|-----------|------|------------|
| POST | /api/v1/feedbacks | Enviar feedback | Admin/Member | 10/hora |

**Request POST /api/v1/feedbacks:**
```json
{
  "tipo": "bug",
  "descricao": "Ao clicar no botao de salvar..."
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "tipo": "bug",
  "descricao": "Ao clicar no botao de salvar...",
  "status": "aberto",
  "criado_em": "2026-02-03T14:30:00Z"
}
```

### Feedbacks (Super Admin)

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| GET | /api/v1/admin/feedbacks | Listar todos feedbacks | Super Admin |
| GET | /api/v1/admin/feedbacks/:id | Detalhes do feedback | Super Admin |
| PATCH | /api/v1/admin/feedbacks/:id/status | Alterar status | Super Admin |

**Request GET /api/v1/admin/feedbacks:**
```
?empresa_id=uuid
&tipo=bug
&status=aberto
&busca=texto
&page=1
&limit=10
```

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "organizacao": {
        "id": "uuid",
        "nome": "TechCorp"
      },
      "usuario": {
        "id": "uuid",
        "nome": "Joao Silva",
        "email": "joao@techcorp.com",
        "role": "admin"
      },
      "tipo": "bug",
      "descricao": "Ao clicar no botao...",
      "status": "aberto",
      "criado_em": "2026-02-03T14:30:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 10
}
```

**Request PATCH /api/v1/admin/feedbacks/:id/status:**
```json
{
  "status": "resolvido"
}
```

**Response 200:**
```json
{
  "id": "uuid",
  "status": "resolvido",
  "resolvido_em": "2026-02-04T10:00:00Z",
  "resolvido_por": "uuid"
}
```

### Notificacoes

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| GET | /api/v1/notificacoes | Listar notificacoes | Todos |
| GET | /api/v1/notificacoes/contagem | Contar nao lidas | Todos |
| PATCH | /api/v1/notificacoes/:id/lida | Marcar como lida | Todos |
| PATCH | /api/v1/notificacoes/marcar-todas | Marcar todas lidas | Todos |

**Response GET /api/v1/notificacoes:**
```json
{
  "data": [
    {
      "id": "uuid",
      "tipo": "feedback_resolvido",
      "titulo": "Seu feedback foi resolvido",
      "mensagem": "Ao clicar no botao de salvar...",
      "lida": false,
      "criado_em": "2026-02-04T10:00:00Z"
    }
  ],
  "total": 5
}
```

**Response GET /api/v1/notificacoes/contagem:**
```json
{
  "nao_lidas": 2
}
```

---

## Metricas de Sucesso

### KPIs Primarios

| Metrica | Baseline | Meta | Prazo |
|---------|----------|------|-------|
| Feedbacks enviados/mes | 0 | > 50 | 2 meses |
| Tempo medio de resolucao | N/A | < 72h | 3 meses |
| Taxa de uso do botao | 0% | > 30% usuarios ativos | 3 meses |

### KPIs Secundarios

- Taxa de resolucao de feedbacks
- Distribuicao por tipo (bug vs sugestao vs duvida)
- NPS pos-resolucao (futuro)
- Feedbacks por tenant ativo

### Criterios de Lancamento

- [ ] Botao flutuante visivel em todas as paginas
- [ ] Popover funciona corretamente (envio, validacao, toast)
- [ ] Modulo /evolucao acessivel apenas para Super Admin
- [ ] Lista com filtros e paginacao funcionais
- [ ] Modal de detalhes completo
- [ ] Acao de resolver cria notificacao
- [ ] Sino de notificacoes funcional com badge

---

## Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|---------------|---------|-----------|
| Spam de feedbacks | Media | Baixo | Rate limiting (10/hora por usuario) |
| Feedbacks nao vistos pelo Super Admin | Baixa | Alto | Badge de contagem + email diario (futuro) |
| Notificacoes perdidas | Baixa | Medio | Supabase Realtime + polling fallback |
| Botao flutuante sobrepoe conteudo | Media | Baixo | Z-index alto + ocultar em modais |
| Descricoes muito longas | Baixa | Baixo | Limite de 10.000 caracteres |

---

## Dependencias

### Dependencias Internas

| Dependencia | PRD | Status | Risco |
|-------------|-----|--------|-------|
| Multi-Tenant | PRD-02 | Aprovado | Baixo |
| Autenticacao | PRD-03 | Aprovado | Baixo |
| Database Schema | PRD-04 | Em desenvolvimento | Baixo |
| Painel Super Admin | PRD-14 | Em desenvolvimento | Baixo |

### Dependencias Externas

| Dependencia | Responsavel | Status | Risco |
|-------------|-------------|--------|-------|
| Supabase Database | Supabase | Operacional | Baixo |
| Supabase Realtime | Supabase | Operacional | Baixo |
| Lucide Icons | Open Source | Disponivel | Baixo |

---

## Time to Value (TTV)

### MVP (Minimo Viavel)

Funcionalidades essenciais para primeira versao:

- [ ] Botao flutuante de feedback
- [ ] Popover com formulario basico
- [ ] Modulo /evolucao com lista
- [ ] Marcar como resolvido
- [ ] Notificacao ao resolver

**TTV estimado:** 1 semana

### Fases de Entrega

| Fase | Escopo | TTV |
|------|--------|-----|
| MVP | Botao + Popover + Lista + Resolver + Notificacao | 1 semana |
| V1.1 | Filtros avancados + Busca | +3 dias |
| V1.2 | Realtime para notificacoes | +2 dias |
| V2.0 | Resposta ao feedback + Anexos | +2 semanas |

---

## Plano de Validacao

### Pre-Lancamento

| Item | Validacao | Responsavel |
|------|-----------|-------------|
| Teste de envio | Feedback chega ao Super Admin | QA |
| Teste de notificacao | Notificacao ao resolver | QA |
| Teste de isolamento | Feedbacks isolados por tenant | QA + Security |
| Teste de Realtime | Atualizacoes em tempo real | QA |
| Teste de permissoes | Roles corretos para cada acao | Security |

### Durante Lancamento

| Item | Validacao | Responsavel |
|------|-----------|-------------|
| Volume de feedbacks | Monitorar picos | DevOps |
| Taxa de resolucao | Feedbacks resolvidos vs total | Product |
| Latencia | Envio/recebimento < 1s | DevOps |
| Erros de permissao | 0 acessos indevidos | Security |

### Pos-Lancamento

| Item | Validacao | Frequencia |
|------|-----------|------------|
| Feedbacks por tenant | Volume medio | Semanal |
| Tempo de resolucao | SLA de resposta | Semanal |
| Tipos mais frequentes | Bug vs Sugestao | Mensal |
| Satisfacao do usuario | NPS pos-resolucao | Mensal |
| Tendencias | Padroes de feedback | Mensal |

---

## Historico de Versoes

| Versao | Data | Autor | Mudancas |
|--------|------|-------|----------|
| v1.0 | 2026-02-03 | Arquiteto de Produto | Versao inicial do PRD |
| v1.1 | 2026-02-03 | Arquiteto de Produto | Adicionada secao Plano de Validacao formal (Pre/Durante/Pos-Lancamento) conforme prdpadrao.md |

---

## Referencias

- Screenshots de referencia fornecidas pelo usuario
- [Lucide Icons](https://lucide.dev/) - Icones usados no modulo
- PRD-14-SUPER-ADMIN.md - Painel onde /evolucao sera adicionado
- prdpadrao.md - Formato seguido para este PRD
- arquitetodeproduto.md - Regras arquiteturais aplicadas
