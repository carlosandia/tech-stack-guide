# PRD-11: Caixa de Entrada de Email

| Campo | Valor |
|-------|-------|
| **Autor** | Arquiteto de Produto |
| **Data de criacao** | 2026-02-08 |
| **Ultima atualizacao** | 2026-02-08 |
| **Versao** | v1.0 |
| **Status** | Rascunho |
| **Dependencias** | PRD-04, PRD-05, PRD-06, PRD-08 |
| **Stakeholders** | Time de Produto, Engenharia, Vendas |
| **Revisor tecnico** | Tech Lead |

---

## Resumo Executivo

O **Modulo de Caixa de Entrada de Email** permite que usuarios do CRM Renove recebam, leiam e respondam emails diretamente na plataforma, utilizando conexoes previamente configuradas no PRD-08 (Gmail OAuth ou SMTP/IMAP). O objetivo e centralizar a comunicacao com contatos e oportunidades sem necessidade de alternar entre o CRM e cliente de email externo.

Este modulo complementa o PRD-08 (Conexoes) que ja define o fluxo de **envio** de emails. Agora adicionamos a capacidade de **receber** emails via IMAP ou Gmail API, organizados em uma interface inspirada em clientes de email modernos como Gmail, porem simplificada para o contexto de vendas.

**Impacto esperado:**
- Reducao de 60% no tempo alternando entre ferramentas
- Aumento de 25% na velocidade de resposta a leads
- Visao unificada de todas comunicacoes com contatos

---

## Contexto e Motivacao

### Problema

1. **Fragmentacao de comunicacao** - Vendedores alternam constantemente entre CRM e cliente de email
2. **Perda de contexto** - Emails importantes nao ficam vinculados ao historico do contato/oportunidade
3. **Demora na resposta** - Tempo perdido localizando emails e contexto do lead
4. **Falta de rastreabilidade** - Nao ha registro centralizado de todas interacoes por email
5. **Duplicidade de esforco** - Copiar informacoes do email para o CRM manualmente

### Oportunidade

- CRMs com email integrado tem **35% maior taxa de resposta** a leads
- Centralizacao de comunicacao reduz **tempo de fechamento em 20%**
- Historico unificado melhora **handoff entre vendedores** em 50%
- Integracao nativa elimina **necessidade de ferramentas externas** de email

### Alinhamento Estrategico

- **Objetivo:** Tornar o CRM Renove a unica ferramenta necessaria para vendas
- **Metrica de impacto:** Aumento no tempo de permanencia no CRM
- **ROI:** Reducao de licencas de ferramentas de email externas

---

## Usuarios e Personas

### Persona Primaria: Member (Vendedor)

**Role:** Member
**Contexto:** Recebe dezenas de emails diarios de leads e clientes
**Dores:**
- Perde tempo alternando entre Gmail e CRM
- Nao consegue ver historico de emails no contexto do lead
- Esquece de responder emails importantes
- Dificuldade em priorizar emails de leads quentes

**Objetivos:**
- Ver todos emails de trabalho em um so lugar
- Responder rapidamente sem sair do CRM
- Ter visao do lead/oportunidade ao lado do email

**Citacao:** "Preciso responder esse lead agora, mas onde esta o email dele? E qual era o contexto da negociacao?"

### Persona Secundaria: Admin (Gestor)

**Role:** Admin
**Contexto:** Supervisiona comunicacao da equipe de vendas
**Dores:**
- Nao consegue auditar comunicacao dos vendedores
- Dificuldade em identificar gargalos de resposta

**Objetivos:**
- Visibilidade sobre emails da equipe (quando permitido)
- Metricas de tempo de resposta

### Anti-Persona

**Super Admin** - NAO utiliza este modulo. Gerencia a plataforma, nao operacoes de vendas.

---

## Hierarquia de Requisitos

### Theme (Objetivo Estrategico)

> Centralizar toda comunicacao de vendas no CRM para eliminar fragmentacao e acelerar ciclo de vendas.

### Epic (Iniciativa)

> Caixa de Entrada de Email com recebimento via IMAP/Gmail API, leitura, resposta e vinculacao automatica a contatos.

---

## Requisitos Funcionais

### RF-001: Interface Principal `/emails`

**User Story:**
Como Member ou Admin,
Quero acessar uma caixa de entrada de emails centralizada,
Para gerenciar toda minha comunicacao de vendas em um so lugar.

**Descricao:**

Pagina principal com lista de emails e painel de leitura, similar ao Gmail mas simplificado.

**Layout da Interface (Desktop):**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  HEADER                                                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│  TOOLBAR: Emails    Caixa de Entrada | Enviados | Rascunhos    [Escrever] [Sync]│
├───────────────────────────────┬─────────────────────────────────────────────────┤
│                               │                                                 │
│  LISTA DE EMAILS              │  PAINEL DE LEITURA                              │
│  ┌─────────────────────────┐  │  ┌─────────────────────────────────────────────┐│
│  │ ★ Maria Silva           │  │  │ De: Maria Silva <maria@empresa.com>         ││
│  │   Re: Proposta comerci..│  │  │ Para: eu@minhaempresa.com                   ││
│  │   Hoje, 14:30         ● │  │  │ Assunto: Re: Proposta comercial             ││
│  ├─────────────────────────┤  │  │ Data: 08/02/2026, 14:30                     ││
│  │   Joao Santos           │  │  ├─────────────────────────────────────────────┤│
│  │   Duvida sobre prazo    │  │  │                                             ││
│  │   Hoje, 11:15           │  │  │ Ola,                                        ││
│  ├─────────────────────────┤  │  │                                             ││
│  │   Ana Costa             │  │  │ Recebi a proposta e gostaria de agendar     ││
│  │   Orcamento solicitado  │  │  │ uma reuniao para discutir os detalhes.      ││
│  │   Ontem, 18:45          │  │  │                                             ││
│  └─────────────────────────┘  │  │ Pode ser amanha as 15h?                     ││
│                               │  │                                             ││
│  [Carregar mais...]           │  │ Atenciosamente,                             ││
│                               │  │ Maria Silva                                 ││
│                               │  │                                             ││
│                               │  ├─────────────────────────────────────────────┤│
│                               │  │ [Responder] [Responder Todos] [Encaminhar]  ││
│                               │  └─────────────────────────────────────────────┘│
│                               │                                                 │
│                               │  ┌─────────────────────────────────────────────┐│
│                               │  │ CONTEXTO DO CONTATO                         ││
│                               │  │ ─────────────────────────                   ││
│                               │  │ Maria Silva - Diretora Comercial            ││
│                               │  │ Empresa: TechCorp Ltda                      ││
│                               │  │ Oportunidade: Projeto CRM (R$ 50.000)       ││
│                               │  │ Etapa: Proposta Enviada                     ││
│                               │  │ [Ver Contato] [Ver Oportunidade]            ││
│                               │  └─────────────────────────────────────────────┘│
└───────────────────────────────┴─────────────────────────────────────────────────┘
```

**Criterios de Aceitacao:**

- [ ] Pagina acessivel via menu principal em `/emails`
- [ ] Layout responsivo com lista de emails a esquerda e leitura a direita
- [ ] Contador de emails nao lidos no menu
- [ ] Refresh manual e automatico (polling a cada 60s ou push via Realtime)
- [ ] Mobile: lista e leitura em telas separadas

**Prioridade:** Must-have

---

### RF-002: Pastas/Categorias de Email

**User Story:**
Como Member,
Quero organizar meus emails em pastas,
Para encontrar rapidamente o que preciso.

**Descricao:**

Sistema de pastas padrao similar ao Gmail:

| Pasta | Descricao | Icone |
|-------|-----------|-------|
| Caixa de Entrada | Emails recebidos nao arquivados | Inbox |
| Enviados | Emails enviados pelo CRM | Send |
| Rascunhos | Emails em composicao | File |
| Arquivados | Emails removidos da caixa de entrada | Archive |
| Lixeira | Emails deletados (30 dias) | Trash |

**Criterios de Aceitacao:**

- [ ] Navegacao entre pastas via tabs ou sidebar
- [ ] Contador de nao lidos por pasta
- [ ] Arquivar remove da Caixa de Entrada mas mantem acessivel
- [ ] Lixeira esvazia automaticamente apos 30 dias
- [ ] Emails enviados pelo CRM aparecem em "Enviados"

**Prioridade:** Must-have

---

### RF-003: Lista de Emails

**User Story:**
Como Member,
Quero ver uma lista de emails com informacoes essenciais,
Para identificar rapidamente quais emails preciso atender.

**Descricao:**

Lista de emails com as seguintes informacoes por item:

| Campo | Descricao |
|-------|-----------|
| Indicador nao lido | Bolinha azul ou texto em negrito |
| Favorito | Estrela para marcar importantes |
| Remetente | Nome (ou email se nome nao disponivel) |
| Assunto | Truncado em ~50 caracteres |
| Preview | Primeiras palavras do corpo (~30 caracteres) |
| Data/Hora | Relativa (Hoje, Ontem) ou data absoluta |
| Anexos | Icone de clip se houver anexos |
| Contato vinculado | Badge se remetente e contato do CRM |

**Layout do Item:**

```
┌─────────────────────────────────────────────────────────────────┐
│ ☆ │ ● Maria Silva                          │ Hoje, 14:30  📎 │
│   │   Re: Proposta comercial - Gostaria de agendar uma reu...  │
│   │   [Badge: Contato CRM]                                      │
└─────────────────────────────────────────────────────────────────┘
```

**Criterios de Aceitacao:**

- [ ] Lista ordenada por data (mais recente primeiro)
- [ ] Emails nao lidos destacados (negrito + indicador)
- [ ] Click abre email no painel de leitura
- [ ] Double-click abre em modal/fullscreen
- [ ] Selecao multipla com checkbox para acoes em lote
- [ ] Busca por remetente, assunto ou conteudo
- [ ] Paginacao infinita (carregar mais ao scroll)

**Prioridade:** Must-have

---

### RF-004: Visualizacao de Email

**User Story:**
Como Member,
Quero ler o conteudo completo de um email,
Para entender a mensagem e tomar uma acao.

**Descricao:**

Painel de leitura com:

| Secao | Conteudo |
|-------|----------|
| Cabecalho | De, Para, Cc, Assunto, Data |
| Corpo | HTML renderizado ou texto plano |
| Anexos | Lista de anexos com download |
| Acoes | Responder, Responder Todos, Encaminhar, Arquivar, Deletar |
| Contexto | Card do contato/oportunidade vinculado |

**Renderizacao de HTML:**

- Sanitizar HTML para prevenir XSS
- Suportar formatacao basica (negrito, italico, listas)
- Imagens inline com lazy loading
- Links abrem em nova aba

**Criterios de Aceitacao:**

- [ ] Exibir cabecalho completo (De, Para, Cc, Data)
- [ ] Renderizar HTML de forma segura
- [ ] Listar anexos com nome, tamanho e botao de download
- [ ] Botoes de acao visiveis e acessiveis
- [ ] Marcar como lido automaticamente apos 3 segundos de visualizacao
- [ ] Opcao de marcar como nao lido

**Prioridade:** Must-have

---

### RF-005: Responder Email

**User Story:**
Como Member,
Quero responder um email diretamente no CRM,
Para manter a conversa sem sair da plataforma.

**Descricao:**

Formulario de resposta inline ou em modal:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Responder a: Maria Silva <maria@empresa.com>                               [X]  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Para: maria@empresa.com                                         [+ Cc] [+ Bcc]│
│                                                                                 │
│  Assunto: Re: Proposta comercial                                               │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ [B] [I] [U] [Link] [Lista] [Imagem]                                     │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                         │   │
│  │ Ola Maria,                                                              │   │
│  │                                                                         │   │
│  │ Claro! Amanha as 15h esta perfeito.                                    │   │
│  │ Vou enviar o convite do calendario.                                     │   │
│  │                                                                         │   │
│  │ Atenciosamente,                                                         │   │
│  │ Joao                                                                    │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  [📎 Anexar]  [ ] Rastrear abertura                                            │
│                                                                                 │
│  ─────────── Email original ───────────                                        │
│  De: Maria Silva <maria@empresa.com>                                           │
│  Data: 08/02/2026, 14:30                                                       │
│  > Ola, Recebi a proposta e gostaria de agendar...                             │
│                                                                                 │
│                                              [Salvar Rascunho] [Enviar]        │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Funcionalidades:**

| Funcionalidade | Descricao |
|----------------|-----------|
| Responder | Para o remetente apenas |
| Responder Todos | Para remetente + todos em Cc |
| Encaminhar | Para novo destinatario |
| Cc/Bcc | Adicionar destinatarios em copia |
| Formatacao | Editor rich text basico (negrito, italico, links, listas) |
| Anexos | Upload de arquivos (max 25MB total) |
| Assinatura | Assinatura automatica do usuario |
| Rascunho | Salvar automaticamente a cada 30s |
| Email original | Citacao do email sendo respondido |

**Criterios de Aceitacao:**

- [ ] Pre-preencher destinatario e assunto (com Re: ou Fwd:)
- [ ] Editor rich text com formatacao basica
- [ ] Upload de anexos com progresso
- [ ] Validacao de destinatarios (formato email)
- [ ] Assinatura configuravel por usuario
- [ ] Auto-save de rascunho
- [ ] Envio via conexao configurada (Gmail API ou SMTP)
- [ ] Feedback de sucesso/erro no envio
- [ ] Registrar email enviado no historico do contato

**Prioridade:** Must-have

---

### RF-006: Compor Novo Email

**User Story:**
Como Member,
Quero compor um novo email do zero,
Para iniciar conversas com contatos.

**Descricao:**

Modal de composicao similar a resposta, mas com campos vazios:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Novo Email                                                                 [X]  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Para: [                                                   ]   [+ Cc] [+ Bcc]  │
│        └─> Autocomplete com contatos do CRM                                    │
│                                                                                 │
│  Assunto: [                                                              ]     │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ [B] [I] [U] [Link] [Lista] [Imagem]                                     │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                         │   │
│  │                                                                         │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  [📎 Anexar]  [ ] Rastrear abertura                                            │
│                                                                                 │
│                                              [Salvar Rascunho] [Enviar]        │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Autocomplete de Destinatarios:**

- Buscar em contatos do CRM (pessoas e empresas)
- Exibir nome + email
- Permitir digitar email nao cadastrado
- Sugerir contatos recentes

**Criterios de Aceitacao:**

- [ ] Botao "Escrever" abre modal de composicao
- [ ] Autocomplete busca em contatos do CRM
- [ ] Permitir multiplos destinatarios (Para, Cc, Bcc)
- [ ] Campos Cc e Bcc ocultos por padrao (revelar com click)
- [ ] Validar formato de email antes de enviar
- [ ] Vincular email ao contato automaticamente se destinatario for contato CRM

**Prioridade:** Must-have

---

### RF-007: Vinculacao Automatica com Contatos

**User Story:**
Como Member,
Quero que emails sejam automaticamente vinculados aos contatos,
Para ter historico completo de comunicacao.

**Descricao:**

O sistema deve identificar automaticamente contatos do CRM pelo endereco de email:

**Regras de Vinculacao:**

| Cenario | Acao |
|---------|------|
| Remetente e contato CRM | Vincular email ao contato |
| Remetente NAO e contato | Exibir opcao "Criar Contato" |
| Destinatario e contato CRM | Vincular email enviado ao contato |
| Multiplos contatos na thread | Vincular ao contato principal (remetente) |

**Exibicao do Vinculo:**

```
┌─────────────────────────────────────────────────────────────────┐
│ CONTATO VINCULADO                                               │
│ ─────────────────────                                           │
│ [Avatar] Maria Silva                                            │
│          Diretora Comercial                                     │
│          TechCorp Ltda                                          │
│                                                                 │
│ Oportunidades:                                                  │
│ • Projeto CRM - R$ 50.000 (Proposta)                           │
│ • Consultoria TI - R$ 15.000 (Ganha)                           │
│                                                                 │
│ [Ver Contato] [Ver Oportunidade] [Criar Tarefa]                │
└─────────────────────────────────────────────────────────────────┘
```

**Criterios de Aceitacao:**

- [ ] Identificar contato pelo email do remetente
- [ ] Exibir card do contato no painel de leitura
- [ ] Listar oportunidades vinculadas ao contato
- [ ] Botao para criar contato se nao existir
- [ ] Botao para criar tarefa a partir do email
- [ ] Registrar email no historico/timeline do contato

**Prioridade:** Must-have

---

### RF-008: Sincronizacao de Emails (IMAP/Gmail API)

**User Story:**
Como sistema,
Quero sincronizar emails do servidor de email do usuario,
Para exibir emails recebidos na caixa de entrada do CRM.

**Descricao:**

**Metodos de Sincronizacao:**

| Metodo | Provedor | Protocolo | Caracteristicas |
|--------|----------|-----------|-----------------|
| Gmail API | Gmail | REST API | Push notifications, eficiente, requer OAuth |
| IMAP | Qualquer | IMAP | Polling, universal, requer credenciais |

**Fluxo de Sincronizacao (Gmail API):**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         SINCRONIZACAO GMAIL API                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  1. Usuario conecta Gmail OAuth (PRD-08)                                        │
│     └─> Scopes adicionais: gmail.readonly, gmail.modify                         │
│                                                                                 │
│  2. Sync inicial (background job)                                               │
│     └─> GET /gmail/v1/users/me/messages?maxResults=100                          │
│     └─> Para cada mensagem: GET /gmail/v1/users/me/messages/{id}                │
│     └─> Salvar em tabela emails_recebidos                                       │
│     └─> Processar vinculacao com contatos                                       │
│                                                                                 │
│  3. Sync incremental (a cada 60s ou push)                                       │
│     └─> GET /gmail/v1/users/me/history?startHistoryId={last_id}                 │
│     └─> Buscar apenas mensagens novas                                           │
│     └─> Atualizar status (lido/nao lido)                                        │
│                                                                                 │
│  4. Push notifications (opcional - requer webhook)                              │
│     └─> Google Cloud Pub/Sub notifica novos emails                              │
│     └─> CRM busca email imediatamente                                           │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Fluxo de Sincronizacao (IMAP):**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         SINCRONIZACAO IMAP                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  1. Usuario configura SMTP + IMAP (PRD-08 estendido)                            │
│     └─> Email, senha, servidor IMAP, porta                                      │
│     └─> Auto-deteccao de configuracoes IMAP                                     │
│                                                                                 │
│  2. Sync inicial (background job)                                               │
│     └─> Conectar via IMAP                                                       │
│     └─> SELECT INBOX                                                            │
│     └─> FETCH ultimos 100 emails                                                │
│     └─> Salvar em tabela emails_recebidos                                       │
│                                                                                 │
│  3. Sync incremental (polling a cada 60s)                                       │
│     └─> Conectar via IMAP                                                       │
│     └─> SEARCH SINCE {last_sync_date}                                           │
│     └─> FETCH novos emails                                                      │
│     └─> Sincronizar flags (lido/nao lido)                                       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Auto-deteccao IMAP:**

| Provedor | Servidor IMAP | Porta | SSL |
|----------|---------------|-------|-----|
| Gmail | imap.gmail.com | 993 | Sim |
| Outlook | outlook.office365.com | 993 | Sim |
| Yahoo | imap.mail.yahoo.com | 993 | Sim |
| iCloud | imap.mail.me.com | 993 | Sim |
| Zoho | imap.zoho.com | 993 | Sim |
| UOL | imap.uol.com.br | 993 | Sim |

**Criterios de Aceitacao:**

- [ ] Suportar Gmail API para contas Gmail OAuth
- [ ] Suportar IMAP para contas SMTP manual
- [ ] Sincronizacao inicial dos ultimos 100 emails
- [ ] Sync incremental a cada 60 segundos
- [ ] Sincronizar status lido/nao lido bidirecionalmente
- [ ] Nao duplicar emails ja sincronizados (deduplicacao por Message-ID)
- [ ] Timeout e retry em caso de falha de conexao
- [ ] Log de sincronizacao para debug

**Prioridade:** Must-have

---

### RF-009: Busca e Filtros

**User Story:**
Como Member,
Quero buscar e filtrar emails,
Para encontrar rapidamente o que preciso.

**Descricao:**

**Busca:**

- Campo de busca no topo da lista
- Buscar por: remetente, destinatario, assunto, conteudo
- Resultados em tempo real (debounce 300ms)

**Filtros rapidos:**

| Filtro | Descricao |
|--------|-----------|
| Nao lidos | Apenas emails nao lidos |
| Com anexos | Apenas emails com anexos |
| Favoritos | Apenas emails marcados com estrela |
| De contatos | Apenas de remetentes que sao contatos CRM |
| Periodo | Hoje, Ultimos 7 dias, Ultimos 30 dias, Personalizado |

**Interface de Filtros:**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [🔍 Buscar emails...]                                                           │
│ [Nao lidos] [Com anexos] [Favoritos] [De contatos] [Periodo ▼]                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Criterios de Aceitacao:**

- [ ] Campo de busca com resultados em tempo real
- [ ] Filtros combinaveis (AND logico)
- [ ] Filtro de periodo com datepicker
- [ ] Limpar filtros com um click
- [ ] Contador de resultados filtrados

**Prioridade:** Should-have

---

### RF-010: Acoes em Lote

**User Story:**
Como Member,
Quero realizar acoes em multiplos emails de uma vez,
Para gerenciar minha caixa de entrada mais rapidamente.

**Descricao:**

| Acao | Descricao |
|------|-----------|
| Marcar como lido | Marcar selecionados como lidos |
| Marcar como nao lido | Marcar selecionados como nao lidos |
| Arquivar | Mover selecionados para Arquivados |
| Deletar | Mover selecionados para Lixeira |
| Favoritar | Marcar selecionados como favoritos |

**Interface:**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [✓] 5 selecionados    [Marcar lido] [Arquivar] [Deletar] [⋯]                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Criterios de Aceitacao:**

- [ ] Checkbox para selecionar emails individuais
- [ ] Checkbox master para selecionar todos visiveis
- [ ] Barra de acoes aparece quando ha selecao
- [ ] Confirmar acoes destrutivas (deletar)
- [ ] Feedback de sucesso apos acao
- [ ] Undo para arquivar/deletar (5 segundos)

**Prioridade:** Should-have

---

### RF-011: Notificacoes de Novos Emails

**User Story:**
Como Member,
Quero ser notificado quando receber novos emails,
Para responder rapidamente a leads importantes.

**Descricao:**

| Tipo | Descricao |
|------|-----------|
| Badge no menu | Contador de nao lidos no icone de Emails |
| Toast notification | Popup quando novo email chega (se usuario na pagina) |
| Push browser | Notificacao do navegador (com permissao) |

**Regras de Notificacao:**

- Notificar apenas emails de contatos CRM (opcional)
- Agrupar notificacoes se muitos emails chegarem juntos
- Respeitar configuracao de notificacoes do usuario

**Criterios de Aceitacao:**

- [ ] Badge com contador no menu principal
- [ ] Toast ao receber novo email (se na pagina)
- [ ] Click na notificacao abre o email
- [ ] Configuracao para ativar/desativar notificacoes
- [ ] Configuracao para notificar apenas de contatos CRM

**Prioridade:** Should-have

---

### RF-012: Assinatura de Email

**User Story:**
Como Member,
Quero configurar minha assinatura de email,
Para que seja adicionada automaticamente em novos emails.

**Descricao:**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Configuracoes > Email > Assinatura                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Assinatura de Email                                                            │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ [B] [I] [U] [Link] [Imagem]                                             │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                         │   │
│  │ --                                                                      │   │
│  │ Joao Silva                                                              │   │
│  │ Consultor de Vendas                                                     │   │
│  │ Renove Digital                                                          │   │
│  │ Tel: (11) 99999-9999                                                    │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  [ ] Incluir assinatura em respostas                                           │
│  [x] Incluir assinatura em novos emails                                        │
│                                                                                 │
│                                                        [Cancelar] [Salvar]     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Criterios de Aceitacao:**

- [ ] Editor rich text para assinatura
- [ ] Suporte a imagem (logo)
- [ ] Opcao de incluir em respostas
- [ ] Opcao de incluir em novos emails
- [ ] Preview da assinatura
- [ ] Assinatura salva por usuario

**Prioridade:** Should-have

---

### RF-013: Rastreamento de Abertura

**User Story:**
Como Member,
Quero saber quando o destinatario abriu meu email,
Para entender o engajamento e fazer follow-up no momento certo.

**Descricao:**

Pixel de rastreamento invisivel inserido no email:

**Fluxo:**

1. Usuario marca "Rastrear abertura" ao enviar
2. Sistema insere pixel 1x1 transparente no HTML
3. Quando destinatario abre email, navegador carrega pixel
4. Servidor registra abertura com timestamp e IP
5. CRM exibe indicador de "Lido" no email enviado

**Indicadores:**

| Status | Icone | Descricao |
|--------|-------|-----------|
| Enviado | ✓ | Email enviado com sucesso |
| Entregue | ✓✓ | Servidor destino recebeu (se disponivel) |
| Lido | ✓✓ (azul) | Destinatario abriu o email |

**Criterios de Aceitacao:**

- [ ] Checkbox "Rastrear abertura" ao compor email
- [ ] Inserir pixel de tracking no HTML
- [ ] Registrar abertura com timestamp
- [ ] Exibir indicador de leitura na lista de enviados
- [ ] Exibir detalhes (quando, quantas vezes) no email
- [ ] Respeitar privacidade (nao rastrear por padrao)

**Prioridade:** Could-have

---

### RF-014: Integracao com Timeline do Contato

**User Story:**
Como Member,
Quero ver emails na timeline do contato,
Para ter historico completo de interacoes.

**Descricao:**

Emails enviados e recebidos aparecem na timeline do contato:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Contato: Maria Silva                                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ TIMELINE                                                                        │
│                                                                                 │
│ 08/02/2026, 15:30 - Email enviado                                              │
│ [Email icon] Re: Proposta comercial                                            │
│ "Ola Maria, Claro! Amanha as 15h esta perfeito..."                             │
│ [Ver email completo]                                                            │
│                                                                                 │
│ 08/02/2026, 14:30 - Email recebido                                             │
│ [Email icon] Re: Proposta comercial                                            │
│ "Recebi a proposta e gostaria de agendar uma reuniao..."                       │
│ [Ver email completo]                                                            │
│                                                                                 │
│ 07/02/2026, 10:00 - Proposta enviada                                           │
│ [Doc icon] Proposta comercial - R$ 50.000                                      │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Criterios de Aceitacao:**

- [ ] Emails recebidos aparecem na timeline do contato
- [ ] Emails enviados aparecem na timeline do contato
- [ ] Preview do assunto e inicio do conteudo
- [ ] Click abre email completo em modal
- [ ] Filtrar timeline por tipo (emails, tarefas, notas, etc)

**Prioridade:** Must-have

---

## Requisitos Nao-Funcionais

### RNF-001: Performance

| Metrica | Valor |
|---------|-------|
| Tempo de carregamento da lista | < 1s para 50 emails |
| Tempo de sincronizacao incremental | < 5s |
| Tempo de envio de email | < 3s |
| Tempo de busca | < 500ms |

### RNF-002: Seguranca

| Requisito | Implementacao |
|-----------|---------------|
| Credenciais IMAP | Criptografadas com AES-256 no banco |
| Tokens OAuth | Criptografados, refresh automatico |
| Conteudo de emails | Armazenado apenas no servidor do usuario (nao cacheamos corpo) |
| Anexos | Nao armazenados no CRM, buscados sob demanda |
| XSS | HTML de emails sanitizado antes de renderizar |

### RNF-003: Privacidade e Compliance

| Requisito | Descricao |
|-----------|-----------|
| LGPD | Usuario pode deletar todos seus emails do CRM |
| Retencao | Emails sincronizados por no maximo 90 dias |
| Audit | Log de acesso a emails para compliance |
| Consentimento | Usuario opta por conectar email (opt-in explicito) |

### RNF-004: Usabilidade

| Requisito | Descricao |
|-----------|-----------|
| Responsivo | Funcionar em desktop, tablet e mobile |
| Acessibilidade | WCAG 2.1 AA (navegacao por teclado, screen readers) |
| Offline | Exibir emails ja carregados mesmo offline |

---

## Modelo de Dados

### Tabelas Necessarias

```sql
-- Emails sincronizados/recebidos
CREATE TABLE emails_recebidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),
  conexao_email_id uuid NOT NULL REFERENCES conexoes_email(id),

  -- Identificadores externos
  message_id varchar(255) NOT NULL, -- Message-ID do email (RFC 5322)
  thread_id varchar(255), -- Thread ID (Gmail) ou References (IMAP)
  provider_id varchar(255), -- ID no provedor (Gmail: message id)

  -- Cabecalho
  de_email varchar(255) NOT NULL,
  de_nome varchar(255),
  para_email text NOT NULL, -- JSON array de destinatarios
  cc_email text, -- JSON array
  bcc_email text, -- JSON array
  assunto varchar(500),

  -- Conteudo
  preview varchar(200), -- Primeiros caracteres do corpo
  corpo_texto text, -- Texto plano
  corpo_html text, -- HTML
  tem_anexos boolean DEFAULT false,
  anexos_info jsonb, -- [{nome, tamanho, mime_type, provider_id}]

  -- Status
  pasta varchar(50) DEFAULT 'inbox', -- inbox, sent, drafts, archived, trash
  lido boolean DEFAULT false,
  favorito boolean DEFAULT false,

  -- Vinculacao com CRM
  contato_id uuid REFERENCES contatos(id),
  oportunidade_id uuid REFERENCES oportunidades(id),

  -- Timestamps
  data_email timestamptz NOT NULL, -- Data original do email
  sincronizado_em timestamptz DEFAULT now(),
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now(),
  deletado_em timestamptz,

  -- Constraints
  UNIQUE(organizacao_id, usuario_id, message_id)
);

-- Indices
CREATE INDEX idx_emails_tenant_user_pasta ON emails_recebidos(organizacao_id, usuario_id, pasta, data_email DESC);
CREATE INDEX idx_emails_tenant_user_lido ON emails_recebidos(organizacao_id, usuario_id, lido);
CREATE INDEX idx_emails_contato ON emails_recebidos(contato_id);
CREATE INDEX idx_emails_message_id ON emails_recebidos(message_id);
CREATE INDEX idx_emails_busca ON emails_recebidos USING gin(to_tsvector('portuguese', assunto || ' ' || COALESCE(corpo_texto, '')));

-- RLS
ALTER TABLE emails_recebidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_user_isolation" ON emails_recebidos
  USING (organizacao_id = current_setting('app.current_tenant')::uuid
         AND usuario_id = current_setting('app.current_user')::uuid);


-- Rascunhos de email
CREATE TABLE emails_rascunhos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),

  -- Tipo de acao
  tipo varchar(20) NOT NULL, -- 'novo', 'resposta', 'encaminhar'
  email_original_id uuid REFERENCES emails_recebidos(id), -- Se resposta/encaminhar

  -- Conteudo
  para_email text, -- JSON array
  cc_email text,
  bcc_email text,
  assunto varchar(500),
  corpo_html text,
  anexos_temp jsonb, -- Anexos em upload temporario

  -- Timestamps
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now(),

  -- Constraint
  UNIQUE(organizacao_id, usuario_id, id)
);


-- Tracking de abertura
CREATE TABLE emails_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  email_id uuid NOT NULL, -- ID do email enviado (pode ser externo)
  message_id varchar(255) NOT NULL,

  -- Eventos
  tipo varchar(20) NOT NULL, -- 'enviado', 'entregue', 'aberto', 'clicado'
  contador int DEFAULT 1, -- Quantas vezes abriu

  -- Metadata
  ip inet,
  user_agent text,

  -- Timestamps
  primeira_vez timestamptz DEFAULT now(),
  ultima_vez timestamptz DEFAULT now()
);

CREATE INDEX idx_tracking_message ON emails_tracking(message_id);


-- Configuracao de assinatura por usuario
CREATE TABLE emails_assinaturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),

  assinatura_html text NOT NULL,
  incluir_em_respostas boolean DEFAULT false,
  incluir_em_novos boolean DEFAULT true,

  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now(),

  UNIQUE(organizacao_id, usuario_id)
);


-- Estado de sincronizacao
CREATE TABLE emails_sync_estado (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),
  conexao_email_id uuid NOT NULL REFERENCES conexoes_email(id),

  -- Estado do sync
  ultimo_sync timestamptz,
  ultimo_history_id varchar(100), -- Para Gmail API
  ultimo_uid_validity int, -- Para IMAP
  ultimo_uid int, -- Para IMAP

  -- Status
  status varchar(20) DEFAULT 'pendente', -- pendente, sincronizando, ok, erro
  erro_mensagem text,
  tentativas_erro int DEFAULT 0,

  atualizado_em timestamptz DEFAULT now(),

  UNIQUE(organizacao_id, usuario_id, conexao_email_id)
);
```

---

## Endpoints da API

### Emails Recebidos

| Metodo | Endpoint | Descricao | Role |
|--------|----------|-----------|------|
| GET | /api/v1/emails | Listar emails (com filtros e paginacao) | Admin/Member |
| GET | /api/v1/emails/:id | Detalhe de um email | Admin/Member |
| PATCH | /api/v1/emails/:id | Atualizar status (lido, favorito, pasta) | Admin/Member |
| DELETE | /api/v1/emails/:id | Mover para lixeira | Admin/Member |
| POST | /api/v1/emails/lote | Acao em lote | Admin/Member |

### Composicao e Envio

| Metodo | Endpoint | Descricao | Role |
|--------|----------|-----------|------|
| POST | /api/v1/emails/enviar | Enviar novo email | Admin/Member |
| POST | /api/v1/emails/:id/responder | Responder email | Admin/Member |
| POST | /api/v1/emails/:id/encaminhar | Encaminhar email | Admin/Member |
| GET | /api/v1/emails/rascunhos | Listar rascunhos | Admin/Member |
| POST | /api/v1/emails/rascunhos | Criar/atualizar rascunho | Admin/Member |
| DELETE | /api/v1/emails/rascunhos/:id | Deletar rascunho | Admin/Member |

### Sincronizacao

| Metodo | Endpoint | Descricao | Role |
|--------|----------|-----------|------|
| POST | /api/v1/emails/sync | Forcar sincronizacao | Admin/Member |
| GET | /api/v1/emails/sync/status | Status da sincronizacao | Admin/Member |

### Anexos

| Metodo | Endpoint | Descricao | Role |
|--------|----------|-----------|------|
| GET | /api/v1/emails/:id/anexos/:anexoId | Download de anexo | Admin/Member |
| POST | /api/v1/emails/upload | Upload de anexo para envio | Admin/Member |

### Assinatura

| Metodo | Endpoint | Descricao | Role |
|--------|----------|-----------|------|
| GET | /api/v1/emails/assinatura | Obter assinatura do usuario | Admin/Member |
| PUT | /api/v1/emails/assinatura | Salvar assinatura | Admin/Member |

### Tracking

| Metodo | Endpoint | Descricao | Role |
|--------|----------|-----------|------|
| GET | /api/v1/emails/tracking/:messageId | Status de tracking | Admin/Member |
| GET | /t/:trackingId.gif | Pixel de tracking (publico) | Publico |

---

## Escopo

### O que ESTA no escopo (MVP)

- [x] Receber e listar emails via IMAP ou Gmail API
- [x] Visualizar conteudo de email com HTML seguro
- [x] Responder, responder todos, encaminhar
- [x] Compor novo email com autocomplete de contatos
- [x] Pastas: Inbox, Enviados, Rascunhos, Arquivados, Lixeira
- [x] Vinculacao automatica com contatos do CRM
- [x] Busca basica por remetente, assunto, conteudo
- [x] Marcar como lido/nao lido, favorito
- [x] Acoes em lote
- [x] Anexos (visualizar e download)
- [x] Assinatura de email

### O que NAO esta no escopo (v1.0)

- Labels/tags customizados (complexidade de sync)
- Filtros/regras automaticas (similar a Gmail filters)
- Integracao com outros provedores alem de IMAP/Gmail
- Email marketing em massa (usar ferramenta dedicada)
- Templates de email (ja existe em mensagens prontas PRD-16)
- Calendario de envio agendado (futuro)
- Criptografia end-to-end (PGP/S/MIME)

### Escopo futuro (backlog)

- Labels customizados
- Regras automaticas de organizacao
- Envio agendado
- Analytics de emails (taxa de resposta, tempo medio)
- Integracao com Microsoft 365 (OAuth)

---

## Dependencias

| Dependencia | Responsavel | Status | Risco |
|-------------|-------------|--------|-------|
| PRD-08 - Conexoes Email | Engenharia | Parcial (envio OK) | Baixo |
| PRD-06 - Contatos | Engenharia | Pendente | Medio |
| Google API Console | DevOps | Configurado | Baixo |
| Biblioteca IMAP (node-imap) | Engenharia | Disponivel | Baixo |
| Biblioteca Gmail API | Engenharia | Disponivel | Baixo |

---

## Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|---------------|---------|-----------|
| Rate limit Gmail API | Media | Alto | Implementar backoff, cache, batch requests |
| Timeout IMAP em conexoes lentas | Media | Medio | Timeout configuravel, retry, conexao persistente |
| HTML malicioso em emails | Alta | Alto | Sanitizacao rigorosa com DOMPurify |
| Sincronizacao fora de ordem | Media | Medio | Usar Message-ID para deduplicacao |
| Credenciais IMAP invalidas | Alta | Medio | Teste de conexao, alertas, reconexao automatica |
| Volume alto de emails | Media | Alto | Paginacao, lazy loading, limite de sync |

---

## Metricas de Sucesso

### KPIs Primarios

| Metrica | Baseline | Meta | Prazo |
|---------|----------|------|-------|
| Emails respondidos via CRM | 0% | 70% dos usuarios ativos | 3 meses |
| Tempo medio de resposta a leads | N/A | Reducao de 30% | 3 meses |
| Adocao do modulo | 0% | 50% dos usuarios conectam email | 2 meses |

### KPIs Secundarios

| Metrica | Descricao |
|---------|-----------|
| Emails sincronizados/dia | Volume de uso |
| Taxa de erro de sincronizacao | Qualidade da integracao |
| Tempo na pagina de emails | Engajamento |

---

## Time to Value

### MVP (v1.0)

| Funcionalidade | Prioridade |
|----------------|------------|
| Sincronizacao IMAP/Gmail | Must |
| Lista de emails com pasta Inbox | Must |
| Visualizacao de email | Must |
| Responder email | Must |
| Vinculacao com contatos | Must |

**TTV estimado:** 4-6 semanas

### v1.1

| Funcionalidade | Prioridade |
|----------------|------------|
| Compor novo email | Must |
| Todas as pastas | Should |
| Busca e filtros | Should |
| Acoes em lote | Should |
| Assinatura | Should |

**TTV estimado:** 2-3 semanas

### v1.2

| Funcionalidade | Prioridade |
|----------------|------------|
| Tracking de abertura | Could |
| Notificacoes push | Could |
| Analytics basico | Could |

**TTV estimado:** 2 semanas

---

## Checklist de Implementacao

### Backend

- [ ] Criar tabelas (emails_recebidos, emails_rascunhos, etc)
- [ ] Service de sincronizacao Gmail API
- [ ] Service de sincronizacao IMAP
- [ ] Job de sync incremental (cron)
- [ ] Routes para CRUD de emails
- [ ] Route para envio (usar service existente do PRD-08)
- [ ] Service de vinculacao com contatos
- [ ] Sanitizacao de HTML
- [ ] Endpoint de tracking pixel
- [ ] Service de assinatura

### Frontend

- [ ] Pagina /emails com layout split-view
- [ ] Componente de lista de emails
- [ ] Componente de visualizacao de email
- [ ] Modal de composicao/resposta
- [ ] Componente de card do contato vinculado
- [ ] Busca e filtros
- [ ] Acoes em lote
- [ ] Configuracao de assinatura
- [ ] Badge de nao lidos no menu
- [ ] Toast de novo email

### Integracao

- [ ] Adicionar scopes de leitura no OAuth Gmail (PRD-08)
- [ ] Adicionar configuracao IMAP no modal de conexao (PRD-08)
- [ ] Emails na timeline do contato (PRD-06)
- [ ] Atalho "Enviar email" na oportunidade (PRD-07)

---

## Historico de Versoes

| Versao | Data | Autor | Mudancas |
|--------|------|-------|----------|
| v1.0 | 2026-02-08 | Arquiteto de Produto | Versao inicial do PRD |

---

## Anexos

### Wireframe Mobile

```
┌─────────────────────────────────────┐
│ HEADER                              │
├─────────────────────────────────────┤
│ TOOLBAR: Emails    [Pastas▼] [Sync] │
├─────────────────────────────────────┤
│                                     │
│  ★ Maria Silva          Hoje 14:30 │
│    Re: Proposta comercial        ● │
│    Recebi a proposta e gostaria... │
│  ─────────────────────────────────  │
│    Joao Santos          Hoje 11:15 │
│    Duvida sobre prazo              │
│    Ola, gostaria de saber...       │
│  ─────────────────────────────────  │
│    Ana Costa            Ontem      │
│    Orcamento solicitado            │
│    Conforme conversamos...         │
│                                     │
│  [Carregar mais...]                 │
│                                     │
├─────────────────────────────────────┤
│ BOTTOM NAV                    [+]   │
└─────────────────────────────────────┘
```

### Wireframe Visualizacao Mobile

```
┌─────────────────────────────────────┐
│ [←] Re: Proposta comercial    [⋯]  │
├─────────────────────────────────────┤
│                                     │
│  Maria Silva                        │
│  maria@empresa.com                  │
│  Hoje, 14:30                        │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Ola,                               │
│                                     │
│  Recebi a proposta e gostaria de   │
│  agendar uma reuniao para          │
│  discutir os detalhes.             │
│                                     │
│  Pode ser amanha as 15h?           │
│                                     │
│  Atenciosamente,                    │
│  Maria Silva                        │
│                                     │
│  ─────────────────────────────────  │
│  CONTATO VINCULADO                  │
│  Maria Silva - TechCorp             │
│  [Ver Contato] [Ver Oportunidade]   │
│                                     │
├─────────────────────────────────────┤
│ [Responder]  [Resp.Todos]  [Fwd]   │
└─────────────────────────────────────┘
```
