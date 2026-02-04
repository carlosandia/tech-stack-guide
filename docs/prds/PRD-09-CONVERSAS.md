# PRD-09: Modulo de Conversas - CRM Renove

| Campo | Valor |
|-------|-------|
| **Autor** | Arquiteto de Produto |
| **Data de criacao** | 2026-02-03 |
| **Ultima atualizacao** | 2026-02-03 |
| **Versao** | v1.1 |
| **Status** | Rascunho |
| **Stakeholders** | Product Owner, Tech Lead, Design Lead |
| **Revisor tecnico** | Tech Lead |
| **Dependencias** | PRD-06-CONTATOS, PRD-07-NEGOCIOS, PRD-08-CONEXOES |

---

## Resumo Executivo

O **Modulo de Conversas** e o centro de comunicacao do CRM Renove, permitindo que equipes de vendas conversem com clientes e prospects diretamente pela plataforma atraves de **WhatsApp (WAHA Plus)** e **Instagram Direct**. O modulo recebe mensagens em tempo real via webhooks das conexoes configuradas no PRD-08, oferecendo uma experiencia unificada de atendimento multicanal.

Este modulo integra-se diretamente com **Contatos (PRD-06)** para vinculacao automatica e criacao de novos contatos, e com **Negocios (PRD-07)** para criacao rapida de oportunidades durante a conversa. O sistema suporta todos os tipos de mensagem do WhatsApp (texto, imagem, video, audio, documento, localizacao, contato, enquete) e oferece recursos avancados como mensagens prontas (quick replies), notas privadas, agendamento de mensagens e status de atendimento.

**Impacto esperado**: Reducao de 60% no tempo de resposta ao cliente, aumento de 35% na taxa de conversao por comunicacao centralizada e melhoria significativa na rastreabilidade das interacoes comerciais.

---

## Contexto e Motivacao

### Problema

**Dor do usuario:**
- Vendedores alternam entre WhatsApp pessoal, Instagram e CRM, perdendo contexto
- Historico de conversas nao fica registrado no sistema
- Impossibilidade de rastrear qual vendedor atendeu qual cliente
- Clientes recebem respostas duplicadas ou contradictorias
- Gestores nao tem visibilidade sobre volume e qualidade de atendimento

**Impacto no negocio:**
- Leads frios por resposta lenta (alternar entre apps)
- Perda de informacoes importantes trocadas via mensagem
- Dificuldade em auditar atendimento de vendedores
- Clientes frustrados com falta de continuidade no atendimento
- Impossibilidade de medir metricas de atendimento (tempo de resposta, taxa de resolucao)

**Evidencias:**
- 78% das vendas B2C no Brasil passam pelo WhatsApp
- Tempo medio de resposta ideal e menor que 5 minutos
- Empresas com atendimento centralizado tem 45% mais retencao de clientes
- 67% dos consumidores preferem mensagens a ligacoes

### Oportunidade de Mercado

O mercado brasileiro de comunicacao empresarial via WhatsApp cresce 40% ao ano. CRMs que oferecem integracao nativa com WhatsApp e Instagram Direct se destacam na preferencia de PMEs, especialmente no setor de vendas e atendimento.

**Tendencias relevantes:**
- WhatsApp Business API cada vez mais acessivel
- Crescimento do Instagram Direct para vendas
- Demanda por omnichannel unificado
- Automacoes de atendimento (chatbots, respostas rapidas)

### Alinhamento Estrategico

**Conexao com objetivos:**
- Epic 4: Comunicacao Integrada
- Integracao com WhatsApp WAHA (PRD-08)
- Vinculacao com Contatos (PRD-06) e Negocios (PRD-07)

**Metricas de sucesso:**
- Tempo medio de primeira resposta: < 5 min
- Taxa de uso do modulo: > 80% dos vendedores
- Volume de mensagens pelo CRM vs. apps externos: > 90%

---

## Usuarios e Personas

### Admin (Gestor Comercial)

**Necessidades neste modulo:**
- Visualizar todas as conversas de todos os Members
- Monitorar tempo de resposta e qualidade de atendimento
- Criar mensagens prontas globais para a equipe
- Acompanhar metricas de atendimento

**Acoes permitidas:**
- CRUD completo de mensagens prontas globais
- Visualizar qualquer conversa do tenant
- Reatribuir conversas entre Members
- Gerar relatorios de atendimento

### Member (Vendedor)

**Necessidades neste modulo:**
- Conversar com seus contatos atribuidos
- Usar mensagens prontas para agilizar respostas
- Criar notas privadas sobre conversas
- Criar oportunidades a partir de conversas

**Restricoes CRITICAS:**
- **NAO pode** ver conversas de outros Members
- **NAO pode** criar mensagens prontas globais (apenas pessoais)
- **NAO pode** acessar metricas de atendimento global
- **NAO pode** reatribuir conversas

### Anti-Persona

**Super Admin** - NAO utiliza este modulo. Gerencia a plataforma, nao opera conversas com clientes dos tenants.

---

## Hierarquia de Requisitos

### Theme (Objetivo Estrategico)

> Centralizar toda comunicacao com clientes em uma interface unificada, aumentando produtividade e rastreabilidade.

### Epic (Iniciativa)

> Modulo de Conversas multicanal com WhatsApp e Instagram Direct, integrado a Contatos e Negocios.

---

## Requisitos Funcionais

### RF-001: Interface Principal `/conversas`

**User Story:**
Como Admin ou Member,
Quero acessar uma pagina centralizada de conversas,
Para visualizar e gerenciar todas as minhas comunicacoes com clientes.

**Descricao:**

Pagina principal com lista de conversas a esquerda e area de conversa a direita (layout split-view).

**Layout da Interface:**

```
+----------------------------------------------------------------------------------+
|  CRM Renove              Visao Geral  Negocios  Contatos  Conversas  Config      |
+----------------------------------------------------------------------------------+
|                                                                                  |
|  Conversas                                                                       |
|                                                                                  |
|  +--------------------------------+  +----------------------------------------+  |
|  | [+] Nova Conversa              |  |                                        |  |
|  |                                |  |  Selecione uma conversa                |  |
|  | [Buscar conversas...]          |  |  para comecar                          |  |
|  |                                |  |                                        |  |
|  | [Todas v] [WhatsApp v] [Insta] |  |                                        |  |
|  | [Status: Todas v]              |  |                                        |  |
|  |                                |  |                                        |  |
|  | +----------------------------+ |  |                                        |  |
|  | | [foto] Joao Silva          | |  |                                        |  |
|  | | Ola, gostaria de sab...    | |  |                                        |  |
|  | | [WA] 14:30        [Aberta] | |  |                                        |  |
|  | +----------------------------+ |  |                                        |  |
|  | | [foto] Maria Santos        | |  |                                        |  |
|  | | Obrigado pelo contato!     | |  |                                        |  |
|  | | [IG] Ontem         [Pend.] | |  |                                        |  |
|  | +----------------------------+ |  |                                        |  |
|  | | [foto] Tech Corp           | |  |                                        |  |
|  | | [audio] 0:32               | |  |                                        |  |
|  | | [WA] 25/01        [Fechada]| |  |                                        |  |
|  | +----------------------------+ |  |                                        |  |
|  |                                |  |                                        |  |
|  +--------------------------------+  +----------------------------------------+  |
|                                                                                  |
+----------------------------------------------------------------------------------+
```

**Componentes da Lista:**
- Foto do contato (ou inicial do nome)
- Nome do contato
- Preview da ultima mensagem (truncado)
- Badge de canal (WhatsApp, Instagram)
- Horario/data relativa da ultima mensagem
- Badge de status (Aberta, Pendente, Fechada)
- Indicador de nao lido (negrito + badge numerico)

**Filtros disponiveis:**
- Por canal: Todos, WhatsApp, Instagram
- Por status: Todas, Abertas, Pendentes, Fechadas
- Busca por nome ou numero

**Criterios de Aceitacao:**
- [ ] Pagina acessivel via menu lateral em `/conversas`
- [ ] Lista de conversas ordenada por ultima mensagem (mais recente primeiro)
- [ ] Preview exibe tipo de mensagem (texto, audio, video, foto, documento)
- [ ] Badge de canal visivel em cada conversa
- [ ] Filtros funcionam combinados (AND)
- [ ] Member ve apenas suas conversas
- [ ] Admin ve todas as conversas do tenant
- [ ] Conversas nao lidas aparecem em negrito

**Prioridade:** Must-have

---

### RF-002: Lista de Conversas

**User Story:**
Como Admin ou Member,
Quero visualizar minhas conversas em uma lista com informacoes relevantes,
Para identificar rapidamente quais conversas precisam de atencao.

**Descricao:**

Cada item da lista exibe informacoes essenciais da conversa de forma compacta.

**Layout do Item:**

```
+----------------------------------------------------------+
| [foto]  Joao Silva                           14:30  [2]  |
|         Ola, gostaria de saber mais sobre...             |
|         [WhatsApp]                          [Aberta]     |
+----------------------------------------------------------+
```

**Campos exibidos:**
| Campo | Descricao |
|-------|-----------|
| Foto | Avatar do contato ou inicial do nome |
| Nome | Nome do contato vinculado |
| Preview | Ultimas 50 caracteres da mensagem ou tipo de midia |
| Canal | Badge WhatsApp (verde) ou Instagram (gradiente) |
| Horario | Formato relativo (Agora, 5 min, 14:30, Ontem, 25/01) |
| Status | Badge colorido (Aberta=verde, Pendente=amarelo, Fechada=cinza) |
| Nao lidos | Badge numerico azul com quantidade |

**Preview por tipo de mensagem:**
| Tipo | Preview |
|------|---------|
| Texto | Primeiros 50 caracteres |
| Imagem | "[foto] legenda..." ou "[foto]" |
| Video | "[video] legenda..." ou "[video]" |
| Audio | "[audio] 0:32" |
| Documento | "[documento] nome_arquivo.pdf" |
| Localizacao | "[localizacao]" |
| Contato | "[contato] Nome do contato" |
| Enquete | "[enquete] Pergunta..." |
| Sticker | "[sticker]" |

**Badge para Grupos/Canais WhatsApp:**
- Conversas de grupo exibem badge "[Grupo]" ao lado do nome
- Canais do WhatsApp exibem badge "[Canal]"
- Conversas individuais NAO exibem badge

**Indicador de Lido/Nao Lido:**
- **Nao lido:** Nome em negrito + preview em negrito + badge numerico
- **Lido:** Texto em peso normal

**Criterios de Aceitacao:**
- [ ] Lista atualiza em tempo real via Supabase Realtime
- [ ] Preview reflete tipo de mensagem corretamente
- [ ] Badge de grupo/canal exibido apenas quando aplicavel
- [ ] Ordenacao por ultima mensagem (DESC)
- [ ] Scroll infinito com paginacao (20 por vez)
- [ ] Click na conversa abre no painel direito

**Prioridade:** Must-have

---

### RF-003: Janela de Conversa

**User Story:**
Como Admin ou Member,
Quero visualizar e enviar mensagens em uma interface de chat,
Para conversar com meus clientes de forma natural.

**Descricao:**

Area principal de chat com header, area de mensagens e barra de entrada.

**Layout Completo:**

```
+------------------------------------------------------------------+
|  HEADER                                                          |
|  +------------------------------------------------------------+  |
|  | [foto] Joao Silva                         [Q] [+Opp] [...] |  |
|  |        Clique para info. do contato                        |  |
|  +------------------------------------------------------------+  |
|                                                                  |
|  AREA DE MENSAGENS                                               |
|  +------------------------------------------------------------+  |
|  |                                                            |  |
|  |                               +-------------------------+  |  |
|  |                               | Ola, tudo bem?          |  |  |
|  |                               | 14:30 [check check azul]|  |  |
|  |                               +-------------------------+  |  |
|  |                                                            |  |
|  |  +-------------------------+                               |  |
|  |  | Tudo sim! Gostaria de   |                               |  |
|  |  | saber sobre o produto X |                               |  |
|  |  | 14:32                   |                               |  |
|  |  +-------------------------+                               |  |
|  |                                                            |  |
|  |                               +-------------------------+  |  |
|  |                               | Claro! Vou te enviar    |  |  |
|  |                               | todas as informacoes    |  |  |
|  |                               | 14:35 [check check]     |  |  |
|  |                               +-------------------------+  |  |
|  |                                                            |  |
|  +------------------------------------------------------------+  |
|                                                                  |
|  BARRA DE ENTRADA                                                |
|  +------------------------------------------------------------+  |
|  | [Responder] [Nota Privada]                                 |  |
|  +------------------------------------------------------------+  |
|  | [emoji] [raio] [clip] [@] [pin] [mic]                      |  |
|  | +------------------------------------------------------+   |  |
|  | | Shift + Enter para nova linha...                     |   |  |
|  | +------------------------------------------------------+   |  |
|  |                                     [relogio] [Enviar] |   |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
```

**Componentes do Header:**
| Elemento | Funcao |
|----------|--------|
| Foto | Avatar do contato |
| Nome | Nome do contato (clicavel - abre drawer) |
| "Clique para info..." | Texto auxiliar (clicavel - abre drawer) |
| [Q] Busca | Buscar mensagens na conversa |
| [+Opp] | Criar nova oportunidade (PRD-07) |
| [...] Menu | Opcoes adicionais (marcar como, arquivar, etc) |

**Componentes da Area de Mensagens:**
- Mensagens enviadas: alinhadas a direita (fundo colorido do tema)
- Mensagens recebidas: alinhadas a esquerda (fundo neutro)
- Ticks de status: 1 check (enviado), 2 checks (entregue), 2 checks azuis (lido)
- Horario em cada mensagem
- Suporte a todos os tipos de mensagem (RF-007)

**Componentes da Barra de Entrada:**
| Elemento | Funcao |
|----------|--------|
| [Responder] | Aba para enviar mensagem ao contato |
| [Nota Privada] | Aba para adicionar nota interna (RF-010) |
| [emoji] | Emoji picker |
| [raio] | Mensagens prontas (RF-008) |
| [clip] | Menu de anexos (RF-006) |
| [@] | Mencionar contato |
| [pin] | Enviar localizacao |
| [mic] | Gravar audio (RF-009) |
| [relogio] | Agendar mensagem (RF-011) |
| [Enviar] | Botao de envio |

**Placeholder do Textarea:**
"Shift + Enter para nova linha..."

**Criterios de Aceitacao:**
- [ ] Header exibe foto, nome e acoes
- [ ] Clicar no header abre drawer lateral (RF-004)
- [ ] Mensagens exibem ticks de status corretos
- [ ] Scroll automatico para ultima mensagem ao abrir
- [ ] Scroll infinito para mensagens antigas (paginacao)
- [ ] Barra de entrada com todos os icones funcionais
- [ ] Textarea expande com multiplas linhas
- [ ] Shift+Enter insere nova linha
- [ ] Enter envia mensagem

**Prioridade:** Must-have

---

### RF-004: Drawer Lateral (Informacoes do Contato)

**User Story:**
Como Admin ou Member,
Quero acessar informacoes completas do contato durante a conversa,
Para ter contexto e realizar acoes sem sair da tela.

**Descricao:**

Drawer que desliza da direita ao clicar no header da conversa.

**Layout do Drawer:**

```
+----------------------------------------+
|  X                                     |
|                                        |
|          +----------+                  |
|          |  [FOTO]  |                  |
|          +----------+                  |
|          Joao Silva                    |
|          joao@email.com                |
|          +55 11 99999-9999             |
|          Tech Corp                     |
|                                        |
|  [msg] [tarefa] [+opp] [lixeira]       |
|                                        |
+----------------------------------------+
|  v Notas do Contato                    |
|  +------------------------------------+|
|  | Nota 1: Cliente interessado em... ||
|  | 25/01/2026 por Maria               ||
|  +------------------------------------+|
|  | Nota 2: Retornar em fevereiro     ||
|  | 28/01/2026 por Carlos              ||
|  +------------------------------------+|
|  [+ Adicionar nota]                    |
|                                        |
+----------------------------------------+
|  v Mensagens Prontas                   |
|  +------------------------------------+|
|  | /ola - Saudacao inicial            ||
|  | /preco - Tabela de precos          ||
|  | /horario - Horario de atendimento  ||
|  +------------------------------------+|
|  [+ Nova mensagem pronta]              |
|                                        |
+----------------------------------------+
|  v Informacoes da Conversa             |
|  +------------------------------------+|
|  | Status: [Aberta]                   ||
|  | Canal: WhatsApp                    ||
|  | Ultima mensagem: Hoje, 14:35       ||
|  | Total de mensagens: 127            ||
|  | Conversa iniciada: 20/01/2026      ||
|  +------------------------------------+|
|                                        |
+----------------------------------------+
```

**Secoes do Drawer:**

**1. Contato (sempre visivel):**
- Foto grande (80x80px)
- Nome
- Email
- Telefone
- Empresa vinculada (se houver)
- Icones de acao: nova conversa, nova tarefa, nova oportunidade, excluir

**2. Notas do Contato (expansivel):**
- Lista de notas vinculadas ao contato
- Cada nota: texto, data, autor
- Botao [+ Adicionar nota]

**3. Mensagens Prontas (expansivel):**
- Lista de templates disponiveis
- Formato: /atalho - descricao
- Botao [+ Nova mensagem pronta]

**4. Informacoes da Conversa (expansivel):**
- Status atual (badge colorido)
- Canal (WhatsApp/Instagram)
- Ultima mensagem (data/hora)
- Total de mensagens
- Data de inicio da conversa

**Criterios de Aceitacao:**
- [ ] Drawer abre ao clicar no header
- [ ] Drawer fecha ao clicar no X ou fora
- [ ] Secoes expansiveis/retrativeis
- [ ] Botao nova oportunidade abre modal PRD-07
- [ ] Botao nova tarefa abre modal PRD-10
- [ ] Notas podem ser adicionadas inline
- [ ] Mensagens prontas clicaveis inserem no textarea

**Prioridade:** Must-have

---

### RF-005: Nova Conversa (WhatsApp)

**User Story:**
Como Admin ou Member,
Quero iniciar uma nova conversa pelo WhatsApp,
Para entrar em contato com leads ou clientes.

**Descricao:**

Modal para iniciar conversa com numero nao cadastrado ou buscar contato existente.

**Layout do Modal:**

```
+------------------------------------------------------------------+
|  +  Nova Conversa                                            X   |
+------------------------------------------------------------------+
|                                                                  |
|  Numero de WhatsApp *                                            |
|  +------------------------------------------------------------+  |
|  | [BR +55 v] | (11) 99999-9999                               |  |
|  +------------------------------------------------------------+  |
|  Informe o numero com codigo do pais e DDD                       |
|                                                                  |
|  -- ou --                                                        |
|                                                                  |
|  Buscar Contato Existente                                        |
|  +------------------------------------------------------------+  |
|  | [Buscar por nome, email ou telefone...]                    |  |
|  +------------------------------------------------------------+  |
|  +------------------------------------------------------------+  |
|  | [foto] Joao Silva - (11) 99999-9999                        |  |
|  | [foto] Maria Santos - (21) 88888-8888                      |  |
|  +------------------------------------------------------------+  |
|                                                                  |
|  Mensagem Inicial *                                              |
|  +------------------------------------------------------------+  |
|  | Ola! Tudo bem?                                             |  |
|  | Sou da Renove e gostaria de...                             |  |
|  |                                                            |  |
|  +------------------------------------------------------------+  |
|                                                                  |
|  [Cancelar]                              [Iniciar Conversa]      |
|                                                                  |
+------------------------------------------------------------------+
```

**Campos:**
| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| Numero | Phone input | Sim* | Codigo pais + DDD + numero |
| Contato | Busca | Sim* | Busca contato existente |
| Mensagem | Textarea | Sim | Primeira mensagem |

*Um dos dois e obrigatorio

**Regras:**
- Se numero novo: cria contato automaticamente ao enviar
- Se contato existente: usa dados do contato
- Numero formatado automaticamente
- Validacao de formato de numero brasileiro

**Criterios de Aceitacao:**
- [ ] Modal acessivel via botao [+] na lista
- [ ] Campo de telefone com mascara e codigo de pais
- [ ] Busca de contato com debounce 300ms
- [ ] Validacao de numero antes de enviar
- [ ] Ao enviar, abre conversa e envia mensagem
- [ ] Contato criado automaticamente se nao existir

**Prioridade:** Must-have

---

### RF-006: Menu de Anexos

**User Story:**
Como Admin ou Member,
Quero anexar diferentes tipos de arquivo nas mensagens,
Para compartilhar documentos, imagens, videos e outros conteudos.

**Descricao:**

Menu popup ao clicar no icone de clip com opcoes de anexo.

**Layout do Menu:**

```
+------------------------------------+
|  [doc]    Documento                |
|  [img]    Fotos e Videos           |
|  [cam]    Camera                   |
|  [mic]    Audio                    |
|  [user]   Contato                  |
|  [poll]   Enquete                  |
|  [cal]    Evento                   |
|  [bolt]   Resposta Rapida          |
|  [pix]    Pix                      |
+------------------------------------+
```

**Opcoes de Anexo:**

| Opcao | Icone | Descricao | Tipos aceitos |
|-------|-------|-----------|---------------|
| Documento | doc | Enviar arquivo | PDF, DOC, XLS, PPT, ZIP (max 100MB) |
| Fotos e Videos | img | Enviar midia da galeria | JPG, PNG, GIF, MP4, MOV (max 16MB/64MB) |
| Camera | cam | Tirar foto/gravar video | - |
| Audio | mic | Gravar audio | OGG, MP3 |
| Contato | user | Compartilhar vCard | - |
| Enquete | poll | Criar enquete | - |
| Evento | cal | Criar evento de calendario | - |
| Resposta Rapida | bolt | Selecionar template | - |
| Pix | pix | Gerar QR Code Pix | - |

**Modal de Enquete:**

```
+------------------------------------------------------------------+
|  Criar Enquete                                                X  |
+------------------------------------------------------------------+
|                                                                  |
|  Pergunta *                                                      |
|  +------------------------------------------------------------+  |
|  | Qual horario funciona melhor para voce?                    |  |
|  +------------------------------------------------------------+  |
|                                                                  |
|  Opcoes *                                                        |
|  +------------------------------------------------------------+  |
|  | Manha (8h-12h)                                        [X]  |  |
|  +------------------------------------------------------------+  |
|  +------------------------------------------------------------+  |
|  | Tarde (13h-18h)                                       [X]  |  |
|  +------------------------------------------------------------+  |
|  +------------------------------------------------------------+  |
|  | Noite (19h-22h)                                       [X]  |  |
|  +------------------------------------------------------------+  |
|  [+ Adicionar opcao]                                             |
|                                                                  |
|  [ ] Permitir multiplas respostas                                |
|                                                                  |
|  [Cancelar]                                    [Enviar Enquete]  |
|                                                                  |
+------------------------------------------------------------------+
```

**Criterios de Aceitacao:**
- [ ] Menu abre ao clicar no clip
- [ ] Upload de documento funciona com progress bar
- [ ] Galeria de fotos/videos abre seletor do sistema
- [ ] Camera solicita permissao do navegador
- [ ] Enquete valida minimo 2 opcoes
- [ ] Contato abre busca de contatos do CRM
- [ ] Limites de tamanho respeitados

**Prioridade:** Must-have

---

### RF-007: Tipos de Mensagem Suportados

**User Story:**
Como Admin ou Member,
Quero enviar e receber diversos tipos de mensagem,
Para ter comunicacao rica e completa com meus clientes.

**Descricao:**

O sistema deve suportar todos os principais tipos de mensagem do WhatsApp e Instagram.

**Matriz de Suporte:**

| Tipo | Enviar | Receber | Descricao |
|------|--------|---------|-----------|
| text | SIM | SIM | Texto simples com formatacao (*negrito*, _italico_) |
| image | SIM | SIM | Imagens (jpg, png, webp) com legenda opcional |
| video | SIM | SIM | Videos (mp4) com legenda opcional |
| audio | SIM | SIM | Audio/voz (ogg, mp3) com duracao |
| document | SIM | SIM | Documentos (pdf, doc, xls) com nome do arquivo |
| sticker | NAO | SIM | Figurinhas (apenas visualizacao) |
| location | SIM | SIM | Localizacao com mapa preview |
| contact | SIM | SIM | vCard com dados do contato |
| poll | SIM | SIM | Enquetes com opcoes e votos |
| reaction | SIM | SIM | Emojis de reacao em mensagens |

**Renderizacao por Tipo:**

**Texto:**
```
+----------------------------------+
| Ola, tudo bem?                   |
| Como posso ajudar hoje?          |
|                         14:30 vv |
+----------------------------------+
```

**Imagem:**
```
+----------------------------------+
| +----------------------------+   |
| |                            |   |
| |       [IMAGEM]             |   |
| |                            |   |
| +----------------------------+   |
| Confira nosso catalogo!          |
|                         14:31 vv |
+----------------------------------+
```

**Audio:**
```
+----------------------------------+
| [play] ===|========== 0:00/0:45  |
|                         14:32 vv |
+----------------------------------+
```

**Documento:**
```
+----------------------------------+
| [PDF] proposta_comercial.pdf     |
|       125 KB                     |
|       [Baixar]                   |
|                         14:33 vv |
+----------------------------------+
```

**Localizacao:**
```
+----------------------------------+
| +----------------------------+   |
| |      [MAPA PREVIEW]        |   |
| |      Av. Paulista, 1000    |   |
| +----------------------------+   |
|                         14:34 vv |
+----------------------------------+
```

**Enquete:**
```
+----------------------------------+
| Qual horario funciona melhor?    |
|                                  |
| [ ] Manha (8h-12h)         2     |
| [x] Tarde (13h-18h)        5     |
| [ ] Noite (19h-22h)        1     |
|                                  |
| 8 votos                          |
|                         14:35 vv |
+----------------------------------+
```

**Criterios de Aceitacao:**
- [ ] Todos os tipos renderizam corretamente
- [ ] Imagens abrem em lightbox ao clicar
- [ ] Videos reproduzem inline com controles
- [ ] Audios reproduzem com player customizado
- [ ] Documentos tem botao de download
- [ ] Localizacao abre em nova aba (Google Maps)
- [ ] Enquetes mostram votos em tempo real

**Prioridade:** Must-have

---

### RF-008: Mensagens Prontas (Quick Replies)

**User Story:**
Como Admin ou Member,
Quero usar templates de mensagem pre-definidos,
Para responder rapidamente com mensagens padronizadas.

**Descricao:**

Sistema de templates com atalho /comando que podem ser pessoais ou globais.

**Acionamento:**
1. Digitar "/" no textarea abre popover com lista
2. Clicar no icone de raio na barra de entrada

**Layout do Popover:**

```
+------------------------------------------+
| Mensagens Prontas                    X   |
+------------------------------------------+
| [Buscar mensagem pronta...]              |
|                                          |
| -- Minhas Mensagens --                   |
| +--------------------------------------+ |
| | /ola                                 | |
| | Saudacao inicial personalizada       | |
| +--------------------------------------+ |
| | /followup                            | |
| | Mensagem de follow-up                | |
| +--------------------------------------+ |
|                                          |
| -- Mensagens da Equipe --                |
| +--------------------------------------+ |
| | /preco                               | |
| | Tabela de precos atualizada          | |
| +--------------------------------------+ |
| | /horario                             | |
| | Horarios de atendimento              | |
| +--------------------------------------+ |
| | /endereco                            | |
| | Endereco completo da empresa         | |
| +--------------------------------------+ |
|                                          |
| [+ Nova mensagem pronta]                 |
+------------------------------------------+
```

**Estrutura do Template:**
| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| atalho | string | Sim | Comando sem barra (ex: "ola") |
| titulo | string | Sim | Descricao curta |
| conteudo | text | Sim | Texto da mensagem |
| tipo | enum | Sim | "pessoal" ou "global" |
| ativo | boolean | Sim | Se esta habilitado |

**Regras de Escopo:**
| Tipo | Quem cria | Quem ve |
|------|-----------|---------|
| Pessoal | Member | Apenas o proprio Member |
| Global | Admin | Todos do tenant |

**Modal de Criacao:**

```
+------------------------------------------------------------------+
|  +  Nova Mensagem Pronta                                     X   |
+------------------------------------------------------------------+
|                                                                  |
|  Atalho *                                                        |
|  +------------------------------------------------------------+  |
|  | / [ola_______________________________________________]     |  |
|  +------------------------------------------------------------+  |
|  Sem espacos ou caracteres especiais                             |
|                                                                  |
|  Titulo *                                                        |
|  +------------------------------------------------------------+  |
|  | Saudacao inicial para novos contatos                       |  |
|  +------------------------------------------------------------+  |
|                                                                  |
|  Conteudo da Mensagem *                                          |
|  +------------------------------------------------------------+  |
|  | Ola! Tudo bem?                                             |  |
|  | Sou [NOME] da Renove e estou entrando em contato           |  |
|  | para entender melhor suas necessidades.                    |  |
|  |                                                            |  |
|  | Como posso ajudar?                                         |  |
|  +------------------------------------------------------------+  |
|                                                                  |
|  Tipo                                         [APENAS ADMIN]     |
|  ( ) Apenas para mim (pessoal)                                   |
|  ( ) Para toda a equipe (global)                                 |
|                                                                  |
|  [Cancelar]                                [Salvar Mensagem]     |
|                                                                  |
+------------------------------------------------------------------+
```

**Variaveis Dinamicas (futuro):**
- `[NOME]` - Nome do usuario logado
- `[CONTATO]` - Nome do contato
- `[EMPRESA]` - Nome da empresa do contato

**Criterios de Aceitacao:**
- [ ] Digitar "/" abre popover automaticamente
- [ ] Filtro funciona com debounce 200ms
- [ ] Clicar no template insere conteudo no textarea
- [ ] Admin pode criar templates globais
- [ ] Member pode criar apenas templates pessoais
- [ ] Templates globais aparecem para todos
- [ ] Atalho unico por escopo (pessoal/global)

**Prioridade:** Must-have

---

### RF-009: Gravacao de Audio

**User Story:**
Como Admin ou Member,
Quero gravar e enviar mensagens de audio,
Para comunicar de forma mais pessoal e rapida.

**Descricao:**

Funcionalidade de gravacao de audio com controles de pausar, continuar e enviar.

**Estados da Gravacao:**

**1. Inicial (clique no mic):**
```
+--------------------------------------------------+
| [mic] | Clique para gravar                       |
+--------------------------------------------------+
```

**2. Gravando:**
```
+--------------------------------------------------+
| [pausar] | 00:15 [================    ] [enviar] |
| [cancelar]                                       |
+--------------------------------------------------+
```

**3. Pausado:**
```
+--------------------------------------------------+
| [continuar] | 00:15 [===============  ] [enviar] |
| [cancelar]                                       |
+--------------------------------------------------+
```

**Controles:**
| Botao | Funcao |
|-------|--------|
| [mic] | Inicia gravacao |
| [pausar] | Pausa gravacao |
| [continuar] | Retoma gravacao |
| [cancelar] | Descarta audio |
| [enviar] | Envia audio |

**Regras:**
- Duracao maxima: 15 minutos
- Formato de saida: OGG Opus
- Preview de onda sonora durante gravacao
- Tempo decorrido visivel
- Permissao do microfone solicitada no primeiro uso

**Criterios de Aceitacao:**
- [ ] Solicita permissao de microfone
- [ ] Gravacao inicia ao clicar no mic
- [ ] Pause/continue funcionam corretamente
- [ ] Timer mostra tempo decorrido
- [ ] Cancelar descarta sem enviar
- [ ] Enviar converte para OGG e envia
- [ ] Audio aparece na conversa apos envio

**Prioridade:** Must-have

---

### RF-010: Notas Privadas

**User Story:**
Como Admin ou Member,
Quero adicionar notas internas sobre a conversa,
Para registrar informacoes que nao devem ser enviadas ao cliente.

**Descricao:**

Aba secundaria na barra de entrada para adicionar notas vinculadas ao contato.

**Layout da Aba Nota Privada:**

```
+------------------------------------------------------------------+
| [Responder] [Nota Privada]                                       |
+------------------------------------------------------------------+
|                                                                  |
| +--------------------------------------------------------------+ |
| | Esta nota e interna e nao sera enviada ao contato.           | |
| |                                                              | |
| | Digite sua nota aqui...                                      | |
| |                                                              | |
| +--------------------------------------------------------------+ |
|                                                                  |
|                                              [Salvar Nota]       |
+------------------------------------------------------------------+
```

**Caracteristicas:**
- Fundo diferenciado (amarelo claro) para indicar que e interna
- Mensagem de aviso "Esta nota e interna..."
- Notas ficam vinculadas ao contato (tabela notas_contato)
- Visiveis no drawer lateral e na tela de detalhes do contato

**Estrutura da Nota:**
| Campo | Tipo | Descricao |
|-------|------|-----------|
| contato_id | uuid | Vinculo com contato |
| usuario_id | uuid | Quem criou |
| conteudo | text | Texto da nota |
| conversa_id | uuid | Conversa de origem (opcional) |
| criado_em | timestamp | Data de criacao |

**Criterios de Aceitacao:**
- [ ] Aba "Nota Privada" alterna interface
- [ ] Visual diferenciado (fundo amarelo claro)
- [ ] Mensagem de aviso visivel
- [ ] Ao salvar, nota aparece no drawer
- [ ] Nota vinculada ao contato, nao a conversa
- [ ] Autor e data registrados

**Prioridade:** Should-have

---

### RF-011: Agendar Mensagem

**User Story:**
Como Admin ou Member,
Quero agendar o envio de mensagens para data/hora futura,
Para planejar follow-ups e comunicacoes.

**Descricao:**

Modal para definir data e hora de envio de mensagem.

**Layout do Modal:**

```
+------------------------------------------------------------------+
|  Agendar Mensagem                                            X   |
+------------------------------------------------------------------+
|                                                                  |
|  Mensagem *                                                      |
|  +------------------------------------------------------------+  |
|  | Ola! Passando para lembrar da nossa reuniao amanha.        |  |
|  | Confirma sua presenca?                                     |  |
|  +------------------------------------------------------------+  |
|                                                                  |
|  Data *                           Hora *                         |
|  +-------------------------+      +-------------------------+    |
|  | [calendario] 15/02/2026 |      | [relogio] 09:00         |    |
|  +-------------------------+      +-------------------------+    |
|                                                                  |
|  Agendado para: Sabado, 15 de fevereiro de 2026 as 09:00         |
|                                                                  |
|  [Cancelar]                              [Agendar Mensagem]      |
|                                                                  |
+------------------------------------------------------------------+
```

**Campos:**
| Campo | Tipo | Obrigatorio | Validacao |
|-------|------|-------------|-----------|
| Mensagem | Textarea | Sim | Min 1 caractere |
| Data | Date picker | Sim | >= hoje |
| Hora | Time picker | Sim | Se hoje, >= agora |

**Regras:**
- Data minima: hoje
- Hora minima: se hoje, hora atual + 5 min
- Fuso horario: America/Sao_Paulo
- Mensagens agendadas aparecem em lista dedicada
- Pode cancelar antes do envio

**Criterios de Aceitacao:**
- [ ] Modal abre ao clicar no icone de relogio
- [ ] Date picker nao permite datas passadas
- [ ] Time picker valida hora se data = hoje
- [ ] Preview do agendamento visivel
- [ ] Mensagem agendada salva no banco
- [ ] Cron job envia no horario programado
- [ ] Lista de mensagens agendadas acessivel

**Prioridade:** Should-have

---

### RF-012: Status de Atendimento

**User Story:**
Como Admin ou Member,
Quero categorizar conversas por status de atendimento,
Para organizar e priorizar meu trabalho.

**Descricao:**

Sistema de status para categorizar conversas e gerar metricas.

**Status Disponiveis:**

| Status | Cor | Descricao | Quando usar |
|--------|-----|-----------|-------------|
| `aberta` | Verde | Nova conversa ou cliente iniciou contato | Automatico ao receber mensagem |
| `pendente` | Amarelo | Aguardando resposta do cliente | Apos responder e aguardar retorno |
| `fechada` | Cinza | Atendimento concluido | Quando conversa finalizada |

**Fluxo de Status:**

```
[Nova mensagem recebida]
        |
        v
   +--------+
   | ABERTA |  <-- Status inicial
   +--------+
        |
        | (usuario responde)
        v
   +----------+
   | PENDENTE |  <-- Aguardando cliente
   +----------+
        |
        | (cliente responde)
        v
   +--------+
   | ABERTA |  <-- Reaberta
   +--------+
        |
        | (usuario fecha manualmente)
        v
   +---------+
   | FECHADA |  <-- Atendimento concluido
   +---------+
```

**Mudanca de Status:**
- **Automatica:** Nova mensagem recebida → Aberta
- **Manual:** Usuario seleciona via menu ou botao
- **Semi-automatica:** Ao responder, sugere mudar para Pendente

**Menu de Status na Conversa:**

```
+----------------------------------+
| Alterar Status                   |
| +------------------------------+ |
| | [x] Aberta                   | |
| | [ ] Pendente                 | |
| | [ ] Fechada                  | |
| +------------------------------+ |
+----------------------------------+
```

**Criterios de Aceitacao:**
- [ ] Badge de status visivel na lista
- [ ] Status muda automaticamente ao receber mensagem
- [ ] Usuario pode alterar manualmente via menu
- [ ] Filtro por status funciona na lista
- [ ] Historico de mudancas registrado

**Prioridade:** Must-have

---

### RF-013: Integracao com Contatos (PRD-06)

**User Story:**
Como Admin ou Member,
Quero vincular conversas a contatos do CRM,
Para manter historico e dados centralizados.

**Descricao:**

Toda conversa deve estar vinculada a um contato do CRM.

**Fluxo de Vinculacao:**

```
[Mensagem recebida de numero novo]
               |
               v
    +------------------------+
    | Numero existe no CRM?  |
    +------------------------+
           |         |
          SIM       NAO
           |         |
           v         v
    +----------+  +--------------------+
    | Vincula  |  | Cria contato novo  |
    | contato  |  | automaticamente    |
    | existente|  +--------------------+
    +----------+          |
           |              |
           v              v
    +---------------------------+
    | Conversa criada/atualizada |
    +---------------------------+
```

**Regras de Vinculacao:**
1. Busca contato por numero de telefone (normalizado)
2. Se encontrar: vincula `contato_id`
3. Se nao encontrar: cria contato com nome do perfil WhatsApp

**Acoes Disponiveis:**
- Ver detalhes do contato (drawer)
- Editar contato (modal)
- Criar oportunidade para o contato (PRD-07)
- Criar tarefa para o contato (PRD-10)
- Adicionar nota ao contato

**Criterios de Aceitacao:**
- [ ] Toda conversa tem `contato_id` preenchido
- [ ] Contato criado automaticamente se novo
- [ ] Nome do perfil WhatsApp usado como nome inicial
- [ ] Drawer exibe dados completos do contato
- [ ] Link para tela de detalhes do contato

**Prioridade:** Must-have

---

### RF-014: Integracao com Negocios (PRD-07)

**User Story:**
Como Admin ou Member,
Quero criar oportunidades diretamente de uma conversa,
Para converter conversas em negocios rastreados.

**Descricao:**

Botao no header da conversa para criar oportunidade usando o mesmo modal do PRD-07.

**Botao no Header:**
```
+------------------------------------------------------------------+
| [foto] Joao Silva                            [Q] [+Opp] [...]    |
+------------------------------------------------------------------+
```

**Ao Clicar [+Opp]:**
- Abre modal de criacao de oportunidade (PRD-07 RF-10)
- Contato ja pre-selecionado
- Telefone/email pre-preenchidos

**Dados Pre-Preenchidos:**
| Campo | Valor |
|-------|-------|
| Tipo de Contato | Detectado automaticamente |
| Nome | Nome do contato |
| Email | Email do contato (se houver) |
| Telefone | Numero da conversa |

**Criterios de Aceitacao:**
- [ ] Botao [+Opp] visivel no header
- [ ] Modal abre com contato pre-selecionado
- [ ] Campos pre-preenchidos com dados do contato
- [ ] Apos criar, link para oportunidade disponivel
- [ ] Historico de oportunidades visivel no drawer

**Prioridade:** Must-have

---

### RF-015: Webhooks WAHA Plus

**User Story:**
Como Sistema,
Preciso processar eventos do WAHA em tempo real,
Para manter as conversas sincronizadas.

**Descricao:**

Endpoint para receber e processar webhooks do WAHA Plus.

**Eventos Suportados:**

**1. message (Mensagem Recebida)**
```json
{
  "event": "message",
  "session": "wpp-{org_id}-{user_id}",
  "payload": {
    "id": "true_11111111111@c.us_AAAA",
    "timestamp": 1706456700,
    "from": "5511999999999@c.us",
    "fromMe": false,
    "to": "5511888888888@c.us",
    "body": "Ola, gostaria de saber mais sobre...",
    "hasMedia": false,
    "type": "chat"
  }
}
```

**2. message.ack (Status de Entrega)**
```json
{
  "event": "message.ack",
  "session": "wpp-{org_id}-{user_id}",
  "payload": {
    "id": "true_11111111111@c.us_AAAA",
    "from": "11111111111@c.us",
    "fromMe": true,
    "ack": 3,
    "ackName": "READ"
  }
}
```

**Valores de ACK:**
| Valor | Nome | Descricao |
|-------|------|-----------|
| 0 | ERROR | Erro no envio |
| 1 | PENDING | Aguardando |
| 2 | SENT | Enviado (1 check) |
| 3 | RECEIVED | Entregue (2 checks) |
| 4 | READ | Lido (2 checks azuis) |
| 5 | PLAYED | Audio reproduzido |

**3. message.reaction (Reacao)**
```json
{
  "event": "message.reaction",
  "session": "wpp-{org_id}-{user_id}",
  "payload": {
    "id": "false_79111111@c.us_11111111",
    "from": "79111111@c.us",
    "reaction": {
      "text": "thumbsup",
      "messageId": "true_79111111@c.us_11111111"
    }
  }
}
```

**4. session.status (Status da Sessao)**
```json
{
  "event": "session.status",
  "session": "wpp-{org_id}-{user_id}",
  "payload": {
    "status": "WORKING",
    "statuses": [
      {"status": "STOPPED", "timestamp": 1700000001000},
      {"status": "STARTING", "timestamp": 1700000002000},
      {"status": "WORKING", "timestamp": 1700000003000}
    ]
  }
}
```

**Valores de Status:**
| Status | Descricao |
|--------|-----------|
| STOPPED | Sessao parada |
| STARTING | Iniciando |
| SCAN_QR_CODE | Aguardando QR |
| WORKING | Conectado e operacional |
| FAILED | Falha na conexao |

**Processamento:**

```
[Webhook WAHA]
      |
      v
+-------------------+
| Validar assinatura|
+-------------------+
      |
      v
+-------------------+
| Extrair session   |
| (org_id, user_id) |
+-------------------+
      |
      v
+-------------------+
| Processar evento  |
| por tipo          |
+-------------------+
      |
      +-- message --> Criar/atualizar mensagem
      |
      +-- message.ack --> Atualizar status
      |
      +-- message.reaction --> Adicionar reacao
      |
      +-- session.status --> Atualizar sessao
```

**Criterios de Aceitacao:**
- [ ] Endpoint `/webhooks/waha/:tenant_id` funcional
- [ ] Validacao de assinatura do webhook
- [ ] Processamento de todos os eventos listados
- [ ] Criacao automatica de conversa se nova
- [ ] Atualizacao de status de mensagem
- [ ] Notificacao via Realtime para frontend
- [ ] Log de todos os eventos recebidos

**Prioridade:** Must-have

---

## Requisitos Nao-Funcionais

### Performance

| Metrica | Requisito |
|---------|-----------|
| Tempo de carregamento da lista | < 500ms |
| Tempo de carregamento de conversa | < 300ms |
| Tempo de envio de mensagem | < 1s |
| Processamento de webhook | < 200ms |
| Scroll infinito | 20 itens por pagina |

### Seguranca

| Requisito | Implementacao |
|-----------|---------------|
| Isolamento multi-tenant | RLS por `organizacao_id` |
| Isolamento por usuario | Member ve apenas suas conversas |
| Criptografia | Mensagens em transito (HTTPS), tokens criptografados |
| Validacao de webhook | Assinatura HMAC |
| Rate limiting | 100 req/min por usuario |

### Usabilidade

| Requisito | Descricao |
|-----------|-----------|
| Responsividade | Mobile-first, funciona em telas >= 320px |
| Acessibilidade | WCAG 2.1 AA |
| Offline | Mensagens em fila quando offline |
| Notificacoes | Push notification para novas mensagens |

### Sistema/Ambiente

| Requisito | Descricao |
|-----------|-----------|
| Navegadores | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ |
| Mobile | PWA com notificacoes |
| Realtime | Supabase Realtime para atualizacoes |
| Storage | Supabase Storage para midias |

---

## Escopo

### O que ESTA no escopo

- Interface de conversas (lista + chat)
- Integracao WhatsApp via WAHA Plus
- Integracao Instagram Direct
- Todos os tipos de mensagem suportados
- Mensagens prontas (quick replies)
- Notas privadas
- Status de atendimento
- Gravacao de audio
- Agendamento de mensagens
- Vinculacao com Contatos
- Criacao de oportunidades
- Webhooks WAHA

### O que NAO esta no escopo

- **Chatbot/IA:** Respostas automaticas inteligentes (futuro)
- **Integracao Telegram:** Apenas WhatsApp e Instagram na v1
- **WhatsApp Business API Oficial:** Usa WAHA (nao-oficial) na v1
- **Multiplas sessoes por usuario:** 1 sessao WhatsApp por usuario
- **Historico de ligacoes:** Apenas mensagens
- **Videochamadas:** Nao suportado

### Escopo Futuro (backlog)

- Chatbot com IA generativa
- Integracao com WhatsApp Business API Cloud
- Integracao com Telegram
- Campanhas em massa (broadcast)
- Relatorios de atendimento detalhados
- Integracao com telefonia VoIP

---

## Modelo de Dados

### Tabelas Principais

```sql
-- Conversas (thread de mensagens)
CREATE TABLE conversas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),

  -- Vinculacoes
  contato_id uuid NOT NULL REFERENCES contatos(id),
  usuario_id uuid NOT NULL REFERENCES usuarios(id), -- responsavel
  sessao_whatsapp_id uuid REFERENCES sessoes_whatsapp(id),

  -- Identificacao do chat
  chat_id varchar(100) NOT NULL, -- Ex: 5511999999999@c.us
  canal varchar(20) NOT NULL CHECK (canal IN ('whatsapp', 'instagram')),
  tipo varchar(20) NOT NULL DEFAULT 'individual' CHECK (tipo IN ('individual', 'grupo', 'canal')),

  -- Dados do chat
  nome varchar(255), -- Nome do grupo/canal (se aplicavel)
  foto_url text,

  -- Status de atendimento
  status varchar(20) NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'pendente', 'fechada')),

  -- Contadores
  total_mensagens integer DEFAULT 0,
  mensagens_nao_lidas integer DEFAULT 0,

  -- Timestamps
  ultima_mensagem_em timestamptz,
  primeira_mensagem_em timestamptz,
  status_alterado_em timestamptz,

  -- Padrao
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz,

  -- Constraints
  UNIQUE(organizacao_id, chat_id, sessao_whatsapp_id)
);

-- Indices
CREATE INDEX idx_conversas_org ON conversas(organizacao_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_conversas_usuario ON conversas(organizacao_id, usuario_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_conversas_status ON conversas(organizacao_id, status) WHERE deletado_em IS NULL;
CREATE INDEX idx_conversas_ultima ON conversas(organizacao_id, ultima_mensagem_em DESC) WHERE deletado_em IS NULL;
CREATE INDEX idx_conversas_contato ON conversas(contato_id);
CREATE INDEX idx_conversas_chat ON conversas(chat_id);

-- RLS
ALTER TABLE conversas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON conversas
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY "member_own_conversations" ON conversas
  FOR SELECT
  USING (
    organizacao_id = current_setting('app.current_tenant')::uuid
    AND (
      current_setting('app.current_role') = 'admin'
      OR usuario_id = current_setting('app.current_user')::uuid
    )
  );
```

```sql
-- Mensagens individuais
CREATE TABLE mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  conversa_id uuid NOT NULL REFERENCES conversas(id) ON DELETE CASCADE,

  -- Identificacao da mensagem
  message_id varchar(200) NOT NULL, -- ID do WhatsApp/Instagram

  -- Direcao
  from_me boolean NOT NULL DEFAULT false,

  -- Remetente/Destinatario
  from_number varchar(50),
  to_number varchar(50),
  participant varchar(50), -- Para grupos

  -- Conteudo
  tipo varchar(30) NOT NULL CHECK (tipo IN (
    'text', 'image', 'video', 'audio', 'document',
    'sticker', 'location', 'contact', 'poll', 'reaction'
  )),
  body text, -- Texto da mensagem
  caption text, -- Legenda de midia

  -- Midia (se aplicavel)
  has_media boolean DEFAULT false,
  media_url text, -- URL do Storage
  media_mimetype varchar(100),
  media_filename varchar(255),
  media_size integer, -- bytes
  media_duration integer, -- segundos (audio/video)

  -- Localizacao (se tipo = location)
  location_latitude decimal(10, 8),
  location_longitude decimal(11, 8),
  location_name varchar(255),
  location_address text,

  -- Contato compartilhado (se tipo = contact)
  vcard text,

  -- Enquete (se tipo = poll)
  poll_question text,
  poll_options jsonb, -- [{text: "Opcao 1", votes: 5}, ...]
  poll_allow_multiple boolean,

  -- Reacao (se tipo = reaction)
  reaction_emoji varchar(10),
  reaction_message_id varchar(200), -- Mensagem reagida

  -- Reply (resposta a outra mensagem)
  reply_to_message_id varchar(200),

  -- Status de entrega
  ack integer DEFAULT 0, -- 0=error, 1=pending, 2=sent, 3=delivered, 4=read, 5=played
  ack_name varchar(20),

  -- Metadados
  timestamp_whatsapp bigint, -- Timestamp original do WhatsApp
  raw_data jsonb, -- Payload completo original

  -- Padrao
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz,

  -- Constraints
  UNIQUE(organizacao_id, message_id)
);

-- Indices
CREATE INDEX idx_mensagens_conversa ON mensagens(conversa_id, criado_em DESC);
CREATE INDEX idx_mensagens_org ON mensagens(organizacao_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_mensagens_message ON mensagens(message_id);
CREATE INDEX idx_mensagens_tipo ON mensagens(conversa_id, tipo);

-- RLS
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON mensagens
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

```sql
-- Mensagens prontas (quick replies)
CREATE TABLE mensagens_prontas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  usuario_id uuid REFERENCES usuarios(id), -- NULL = global

  -- Identificacao
  atalho varchar(50) NOT NULL, -- sem barra
  titulo varchar(100) NOT NULL,
  conteudo text NOT NULL,

  -- Tipo
  tipo varchar(20) NOT NULL CHECK (tipo IN ('pessoal', 'global')),

  -- Status
  ativo boolean DEFAULT true,

  -- Estatisticas
  vezes_usado integer DEFAULT 0,

  -- Padrao
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz,

  -- Constraints
  UNIQUE(organizacao_id, atalho, usuario_id)
);

-- Indices
CREATE INDEX idx_mensagens_prontas_org ON mensagens_prontas(organizacao_id) WHERE deletado_em IS NULL AND ativo = true;
CREATE INDEX idx_mensagens_prontas_usuario ON mensagens_prontas(organizacao_id, usuario_id) WHERE deletado_em IS NULL;
CREATE INDEX idx_mensagens_prontas_atalho ON mensagens_prontas(organizacao_id, atalho);

-- RLS
ALTER TABLE mensagens_prontas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON mensagens_prontas
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

```sql
-- Notas privadas dos contatos
CREATE TABLE notas_contato (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  contato_id uuid NOT NULL REFERENCES contatos(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES usuarios(id),

  -- Conteudo
  conteudo text NOT NULL,

  -- Origem (opcional)
  conversa_id uuid REFERENCES conversas(id),

  -- Padrao
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  deletado_em timestamptz
);

-- Indices
CREATE INDEX idx_notas_contato ON notas_contato(contato_id, criado_em DESC);
CREATE INDEX idx_notas_org ON notas_contato(organizacao_id) WHERE deletado_em IS NULL;

-- RLS
ALTER TABLE notas_contato ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON notas_contato
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

```sql
-- Mensagens agendadas
CREATE TABLE mensagens_agendadas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  conversa_id uuid NOT NULL REFERENCES conversas(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES usuarios(id),

  -- Conteudo
  tipo varchar(30) NOT NULL DEFAULT 'text',
  conteudo text NOT NULL,
  media_url text,

  -- Agendamento
  agendado_para timestamptz NOT NULL,
  timezone varchar(50) NOT NULL DEFAULT 'America/Sao_Paulo',

  -- Status
  status varchar(20) NOT NULL DEFAULT 'agendada' CHECK (status IN ('agendada', 'enviada', 'cancelada', 'falha')),
  enviada_em timestamptz,
  erro text,

  -- Padrao
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

-- Indices
CREATE INDEX idx_msg_agendadas_envio ON mensagens_agendadas(agendado_para) WHERE status = 'agendada';
CREATE INDEX idx_msg_agendadas_usuario ON mensagens_agendadas(organizacao_id, usuario_id);

-- RLS
ALTER TABLE mensagens_agendadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON mensagens_agendadas
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

```sql
-- Log de webhooks (para debug)
CREATE TABLE log_webhooks_conversas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid,

  -- Evento
  evento varchar(50) NOT NULL,
  sessao varchar(100),
  payload jsonb NOT NULL,

  -- Processamento
  processado boolean DEFAULT false,
  processado_em timestamptz,
  erro text,

  -- Padrao
  criado_em timestamptz NOT NULL DEFAULT now()
);

-- Indices (particionar por data se necessario)
CREATE INDEX idx_log_webhooks_org ON log_webhooks_conversas(organizacao_id, criado_em DESC);
CREATE INDEX idx_log_webhooks_evento ON log_webhooks_conversas(evento, criado_em DESC);
CREATE INDEX idx_log_webhooks_pendente ON log_webhooks_conversas(processado, criado_em) WHERE processado = false;
```

---

## Endpoints de API

### Conversas

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| GET | /api/v1/conversas | Listar conversas | Admin/Member |
| GET | /api/v1/conversas/:id | Detalhes da conversa | Admin/Member |
| POST | /api/v1/conversas | Iniciar nova conversa | Admin/Member |
| PATCH | /api/v1/conversas/:id/status | Alterar status | Admin/Member |
| DELETE | /api/v1/conversas/:id | Arquivar conversa | Admin/Member |

### Mensagens

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| GET | /api/v1/conversas/:id/mensagens | Listar mensagens | Admin/Member |
| POST | /api/v1/conversas/:id/mensagens | Enviar mensagem | Admin/Member |
| POST | /api/v1/conversas/:id/mensagens/texto | Enviar texto | Admin/Member |
| POST | /api/v1/conversas/:id/mensagens/imagem | Enviar imagem | Admin/Member |
| POST | /api/v1/conversas/:id/mensagens/video | Enviar video | Admin/Member |
| POST | /api/v1/conversas/:id/mensagens/audio | Enviar audio | Admin/Member |
| POST | /api/v1/conversas/:id/mensagens/documento | Enviar documento | Admin/Member |
| POST | /api/v1/conversas/:id/mensagens/localizacao | Enviar localizacao | Admin/Member |
| POST | /api/v1/conversas/:id/mensagens/contato | Enviar contato | Admin/Member |
| POST | /api/v1/conversas/:id/mensagens/enquete | Enviar enquete | Admin/Member |

### Mensagens Prontas

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| GET | /api/v1/mensagens-prontas | Listar templates | Admin/Member |
| POST | /api/v1/mensagens-prontas | Criar template | Admin/Member |
| GET | /api/v1/mensagens-prontas/:id | Detalhes do template | Admin/Member |
| PATCH | /api/v1/mensagens-prontas/:id | Atualizar template | Admin/Member |
| DELETE | /api/v1/mensagens-prontas/:id | Excluir template | Admin/Member |

### Notas

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| GET | /api/v1/contatos/:id/notas | Listar notas | Admin/Member |
| POST | /api/v1/contatos/:id/notas | Criar nota | Admin/Member |
| PATCH | /api/v1/notas/:id | Atualizar nota | Admin/Member |
| DELETE | /api/v1/notas/:id | Excluir nota | Admin/Member |

### Agendamento

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| GET | /api/v1/mensagens-agendadas | Listar agendadas | Admin/Member |
| POST | /api/v1/mensagens-agendadas | Agendar mensagem | Admin/Member |
| DELETE | /api/v1/mensagens-agendadas/:id | Cancelar agendada | Admin/Member |

### Webhooks

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| POST | /webhooks/waha/:tenant_id | Receber eventos WAHA | WAHA (assinatura) |
| POST | /webhooks/instagram/:tenant_id | Receber eventos Instagram | Meta (assinatura) |

---

## Metricas de Sucesso

### KPIs Primarios

| Metrica | Baseline | Meta | Prazo |
|---------|----------|------|-------|
| Tempo medio primeira resposta | N/A (novo) | < 5 min | 3 meses |
| % mensagens pelo CRM vs externos | 0% | > 80% | 3 meses |
| Taxa de adocao do modulo | 0% | > 90% | 2 meses |
| Conversas por vendedor/dia | N/A | > 20 | 3 meses |

### KPIs Secundarios

- Mensagens enviadas por dia
- Tempo medio de resolucao (status fechada)
- Taxa de uso de mensagens prontas
- Satisfacao do usuario (NPS interno)

### Criterios de Lancamento

- [ ] Integracao WAHA funcional com todos os eventos
- [ ] Envio/recebimento de todos os tipos de mensagem
- [ ] Performance dentro dos requisitos
- [ ] Testes de carga validados (1000 msgs/min)
- [ ] Zero vulnerabilidades de seguranca criticas

---

## Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|---------------|---------|-----------|
| WAHA instavel/offline | Media | Alto | Implementar health check, alertas, e fila de retry |
| WhatsApp banir numero | Media | Alto | Documentar boas praticas, limite de mensagens/dia |
| Volume alto de webhooks | Media | Medio | Implementar fila (Redis) para processamento assincrono |
| Midia pesada sobrecarrega storage | Baixa | Medio | Limites de tamanho, compressao, CDN |
| Mensagens perdidas | Baixa | Alto | Log de todos os eventos, reconciliacao periodica |
| Instagram API instavel | Media | Medio | Tratamento de erros, retry com backoff |

---

## Dependencias

### Dependencias Internas

| Dependencia | PRD | Status | Risco |
|-------------|-----|--------|-------|
| Conexoes WAHA | PRD-08 | Em desenvolvimento | Baixo |
| Contatos | PRD-06 | Aprovado | Baixo |
| Negocios (modal) | PRD-07 | Em desenvolvimento | Baixo |
| Autenticacao | PRD-03 | Aprovado | Baixo |

### Dependencias Externas

| Dependencia | Responsavel | Status | Risco |
|-------------|-------------|--------|-------|
| WAHA Plus | DevLikeAPro | Contratado | Medio |
| Supabase Storage | Supabase | Operacional | Baixo |
| Supabase Realtime | Supabase | Operacional | Baixo |

---

## Time to Value (TTV)

### MVP (Minimo Viavel)

Funcionalidades essenciais para primeira versao:

- [ ] Lista de conversas (WhatsApp)
- [ ] Janela de chat basica
- [ ] Envio/recebimento de texto
- [ ] Envio/recebimento de imagem
- [ ] Webhooks WAHA (message, message.ack)
- [ ] Vinculacao com contatos
- [ ] Status de atendimento

**TTV estimado:** 3 semanas

### Fases de Entrega

| Fase | Escopo | TTV |
|------|--------|-----|
| MVP | Chat basico WhatsApp | 3 semanas |
| V1.1 | Todos os tipos de mensagem, audio | +2 semanas |
| V1.2 | Mensagens prontas, notas | +1 semana |
| V1.3 | Instagram Direct | +2 semanas |
| V1.4 | Agendamento, enquetes | +1 semana |
| V2.0 | Metricas, relatorios | +3 semanas |

---

## Plano de Validacao

### Pre-Lancamento

| Item | Validacao | Responsavel |
|------|-----------|-------------|
| Teste de webhook WAHA | Mensagens recebidas em < 1s | QA |
| Teste de envio | Texto, imagem, audio, documento | QA |
| Teste de isolamento | Conversas isoladas por usuario | QA + Security |
| Teste de Realtime | Supabase Realtime funcionando | DevOps |
| Teste de vinculacao | Contatos vinculados automaticamente | QA |

### Durante Lancamento

| Item | Validacao | Responsavel |
|------|-----------|-------------|
| Latencia de mensagens | < 2s end-to-end | DevOps |
| Taxa de entrega | >= 99% webhooks processados | DevOps |
| Logs de conversa | Auditoria completa | Security |
| Reconexao WAHA | Recuperacao automatica | DevOps |

### Pos-Lancamento

| Item | Validacao | Frequencia |
|------|-----------|------------|
| Volume de mensagens | Mensagens por tenant/dia | Diario |
| Tempo de resposta | Media por vendedor | Semanal |
| Taxa de conversao | Conversas → Oportunidades | Semanal |
| Feedback de usuarios | NPS do chat | Mensal |
| Performance storage | Tamanho de midias | Mensal |

---

## Historico de Versoes

| Versao | Data | Autor | Mudancas |
|--------|------|-------|----------|
| v1.0 | 2026-02-03 | Arquiteto de Produto | Versao inicial do PRD |
| v1.1 | 2026-02-03 | Arquiteto de Produto | Adicionada secao Plano de Validacao formal (Pre/Durante/Pos-Lancamento) conforme prdpadrao.md |

---

## Referencias

- [WAHA Plus Documentation](https://waha.devlike.pro/docs/)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Instagram Messaging API](https://developers.facebook.com/docs/messenger-platform/instagram)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- PRD-06-CONTATOS.md
- PRD-07-NEGOCIOS.md
- PRD-08-CONEXOES.md
