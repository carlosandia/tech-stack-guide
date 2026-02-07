
# Auditoria Criteriosa: PRD-07 Modulo de Negocios

## Resumo da Analise

Apos leitura integral do PRD-07 (2.799 linhas) e verificacao de cada arquivo de implementacao, identifiquei que o modulo esta **parcialmente implementado**. A estrutura principal do Kanban esta funcional, mas existem **lacunas significativas** em funcionalidades criticas que foram declaradas como "completas" mas na verdade sao placeholders ou estao totalmente ausentes.

---

## Status Detalhado por Requisito Funcional

### IMPLEMENTADOS CORRETAMENTE

| RF | Descricao | Status | Observacoes |
|----|-----------|--------|-------------|
| RF-01 | Interface Kanban (drag and drop, colunas, cards) | Implementado | Cards com titulo, contato, valor, responsavel, tempo, badges |
| RF-02 | Criacao de Pipeline (modal com nome e membros) | Implementado | NovaPipelineModal funcional |
| RF-03 | Configuracao de Pipeline (6 abas) | Implementado | PipelineConfigPage com sidebar + tabs |
| RF-04 | Aba Etapas (crud, drag reorder, tipos fixos) | Implementado | ConfigEtapas com protecao de sistema |
| RF-09 | Aba Motivos (ganho/perda com modal) | Implementado | FecharOportunidadeModal com motivos do funil |
| RF-10 | Criacao de Oportunidade (3 secoes) | Implementado | Contato, Oportunidade, Produtos |
| RF-12 | Barra de acoes (busca, filtros, periodo) | Implementado | NegociosToolbar com Progressive Disclosure |
| RF-13 | Painel de Metricas (13 KPIs) | Implementado | Calculo correto, toggle, localStorage |
| RF-14.1 | Header do modal (stepper clicavel) | Implementado | Etapas clicaveis com cor semantica |
| RF-14.2 | Bloco Campos (edicao inline) | Parcial | Ver lacunas abaixo |
| RF-14.4 | Historico/Timeline | Parcial | Funcional mas depende de audit_log |
| RF-15.1 | Dropdown Pipeline (editar/arquivar/excluir) | Implementado | PipelineSelector completo |
| RF-15.2 | Toggle Produtos vs Manual | Implementado | No modal de criacao |
| RF-15.3 | Campos UTM | Implementado | Secao colapsavel no modal |
| RF-15.4 | Filtrar Metricas Visiveis | Implementado | FiltrarMetricasPopover + localStorage |
| RF-15.5 | Popover Tarefas no card | Implementado | TarefasPopover |

### NAO IMPLEMENTADOS OU APENAS PLACEHOLDERS

| RF | Descricao | Status | Impacto |
|----|-----------|--------|---------|
| **RF-11** | Pre-Oportunidades (WhatsApp) | **NAO IMPLEMENTADO** | Critico - Feature 3 inteira ausente |
| **RF-14.3 Tab 2** | Aba Tarefas (CRUD) | **PLACEHOLDER** | Alto - Apenas texto estatico, sem funcionalidade |
| **RF-14.3 Tab 3** | Aba Documentos (upload) | **PLACEHOLDER** | Alto - Apenas texto estatico, sem upload |
| **RF-14.3 Tab 4** | Aba E-mail (envio) | **PLACEHOLDER** | Medio - Apenas link para configuracoes |
| **RF-14.3 Tab 5** | Aba Agenda (reunioes) | **PLACEHOLDER** | Medio - Apenas link para configuracoes |
| **RF-15.6** | Engrenagem na secao Contato (modal criacao) | **NAO IMPLEMENTADO** | Baixo |
| **RF-14.2** | Popover show/hide campos (engrenagem) | **NAO IMPLEMENTADO** | Medio - Sem icone de engrenagem no modal de detalhes |

---

## Lacunas Criticas de Arquitetura e Seguranca

### 1. Isolamento Member vs Admin -- NAO IMPLEMENTADO

O PRD define como **CRITICO** que Members so vejam suas proprias oportunidades. A implementacao atual:

- `carregarKanban()` busca TODAS oportunidades do funil sem filtrar por `usuario_responsavel_id`
- Nenhuma verificacao de role (admin/member) no frontend para restringir dados
- O filtro de responsavel so funciona manualmente via FiltrosPopover (admin escolhe quem ver)
- **Members veem TODOS os cards de todos os vendedores** -- violacao direta do PRD

O PRD especifica:
- "Member NAO pode ver oportunidades de outros Members"
- "Member NAO pode ver contatos de outros Members"
- "Member NAO pode ver metricas globais (apenas proprias)"

### 2. Supabase Realtime -- NAO IMPLEMENTADO

O PRD especifica como criterio de aceite:
- "Atualizacao em tempo real via Supabase Realtime"
- "Mover card atualiza banco e notifica outros usuarios"
- "Metricas atualizam automaticamente ao mover card"

Nenhum canal Realtime foi implementado. As atualizacoes dependem de `refetchOnWindowFocus` e invalidacao manual de queries.

### 3. Paginacao/Virtualizacao -- NAO IMPLEMENTADO

O PRD menciona:
- "Paginacao de cards por etapa"
- "Virtualizacao para pipelines com 500+ cards"
- "Renderizacao de 100+ cards < 2s"

O `carregarKanban()` busca todos os cards sem paginacao, o que pode causar problemas de performance com muitos dados (e atingir o limite de 1000 rows do Supabase).

### 4. Preferencias de Metricas via Banco -- IMPLEMENTADO PARCIALMENTE

O PRD define a tabela `preferencias_metricas` para persistir no banco. A implementacao usa `localStorage` ao inves do banco, o que significa que as preferencias se perdem ao trocar de navegador/dispositivo.

---

## Detalhamento das 4 Abas Placeholder

### Aba Tarefas (AbaTarefas.tsx)
**PRD exige:**
- Listar tarefas automaticas da etapa atual
- Listar tarefas manuais criadas pelo usuario
- Criar nova tarefa manual
- Marcar tarefa como concluida
- Separacao visual "Pendentes" / "Concluidas"

**Implementado:** Apenas um texto estatico dizendo "As tarefas automaticas serao habilitadas apos configurar as atividades da pipeline."

### Aba Documentos (AbaDocumentos.tsx)
**PRD exige:**
- Upload drag and drop para Supabase Storage
- Preview de imagens/PDFs
- Download de documentos
- Exclusao (soft delete)
- Lista com nome, tamanho, data, autor

**Implementado:** Apenas um texto estatico dizendo "Upload de documentos sera disponibilizado em breve."

### Aba E-mail (AbaEmail.tsx)
**PRD exige:**
- Verificar se conexao de email esta configurada
- Formulario de envio (destinatario, assunto, corpo, anexos)
- Historico de emails enviados
- Status: enviado/falhou/rascunho

**Implementado:** Apenas um botao "Ir para Configuracoes" sem nenhuma funcionalidade de email.

### Aba Agenda (AbaAgenda.tsx)
**PRD exige:**
- Criar reuniao (titulo, data, horario, local, descricao)
- Listar reunioes agendadas/realizadas
- Marcar como Realizada / No-Show / Cancelada / Reagendada
- Modal de No-Show com motivos e opcao de reagendar
- Integracao Google Calendar (se configurado)

**Implementado:** Apenas um botao "Ir para Configuracoes" sem nenhuma funcionalidade de agenda.

---

## Tabelas do Banco de Dados

Todas as 17 tabelas previstas no PRD existem no banco:

| Tabela | Existe | Sendo usada no frontend |
|--------|--------|------------------------|
| funis | Sim | Sim |
| etapas_funil | Sim | Sim |
| oportunidades | Sim | Sim |
| oportunidades_produtos | Sim | Sim |
| funis_membros | Sim | Sim (criacao de pipeline) |
| funis_campos | Sim | Parcial (config apenas) |
| funis_regras_qualificacao | Sim | Parcial (config apenas) |
| funis_motivos | Sim | Sim (FecharModal) |
| etapas_tarefas | Sim | Nao (aba tarefas e placeholder) |
| configuracoes_distribuicao | Sim | Parcial (config apenas) |
| pre_oportunidades | Sim | Nao (feature ausente) |
| anotacoes_oportunidades | Sim | Sim |
| documentos_oportunidades | Sim | Nao (aba placeholder) |
| emails_oportunidades | Sim | Nao (aba placeholder) |
| reunioes_oportunidades | Sim | Nao (aba placeholder) |
| motivos_noshow | Sim | Nao (aba placeholder) |
| preferencias_metricas | Sim | Nao (usa localStorage) |

---

## Plano de Implementacao Proposto

### Prioridade 1 -- Seguranca (Urgente)
1. **Isolamento Member/Admin no Kanban**: Filtrar oportunidades por `usuario_responsavel_id` quando role === 'member'
2. **Filtro de metricas por role**: Members devem ver apenas suas proprias metricas

### Prioridade 2 -- Abas Funcionais (Alto Impacto)
3. **Aba Tarefas**: CRUD completo com listagem de tarefas automaticas + manuais, marcar concluida
4. **Aba Documentos**: Upload para Supabase Storage, preview, download, exclusao
5. **Aba E-mail**: Envio de email via conexao configurada, historico
6. **Aba Agenda**: CRUD reunioes, status management, modal No-Show

### Prioridade 3 -- Features Ausentes (Medio Impacto)
7. **Pre-Oportunidades (RF-11)**: Tela/aba de solicitacoes WhatsApp com aceitar/rejeitar
8. **Engrenagem show/hide campos** no modal de detalhes (RF-14.2)
9. **Engrenagem contato** no modal de criacao (RF-15.6)
10. **Persistencia de preferencias no banco** ao inves de localStorage

### Prioridade 4 -- Otimizacoes (Desejavel)
11. **Supabase Realtime** para atualizacoes em tempo real do Kanban
12. **Paginacao por etapa** para evitar limite de 1000 rows
13. **Virtualizacao** para pipelines com muitos cards

---

## Conclusao

O modulo de Negocios esta **aproximadamente 55-60% implementado** em relacao ao PRD-07 completo. A estrutura principal (Kanban, pipelines, cards, filtros, metricas, modal de detalhes com anotacoes) esta funcional, mas:

- **4 das 5 abas do modal de detalhes sao placeholders** (apenas Anotacoes funciona)
- **O isolamento de dados Member/Admin esta ausente** (vulnerabilidade de seguranca)
- **Pre-Oportunidades (Feature 3 inteira) nao foi implementada**
- **Supabase Realtime nao foi implementado**
- **Nenhuma das integrações avancadas** (Google Calendar, Email SMTP) esta funcional

Recomendo priorizar o **isolamento de seguranca** antes de qualquer outra feature, e depois implementar as abas funcionais em ordem de impacto.
