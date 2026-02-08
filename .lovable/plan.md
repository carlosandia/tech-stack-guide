
# Plano: Corrigir Menu "Excluir" + Implementar Historico Completo

## Problema 1: Texto "Excluir oportunidade" em duas linhas

O dropdown de acoes tem `min-w-[180px]` que nao e suficiente para o texto "Excluir oportunidade" em uma unica linha.

**Correcao:** Adicionar `whitespace-nowrap` ao botao para forcar uma linha. O `min-w-[180px]` pode ser removido ja que o `whitespace-nowrap` determinara a largura natural.

**Arquivo:** `src/modules/negocios/components/detalhes/DetalhesHeader.tsx` (linha 117)

---

## Problema 2: Historico vazio - nenhum evento sendo registrado

### Diagnostico

O componente `DetalhesHistorico` busca dados da tabela `audit_log` filtrando por `entidade_id = oportunidadeId`. Porem, **nada esta escrevendo nessa tabela** - nao existem triggers nem chamadas ao `log_audit()`. A tabela esta sempre vazia.

### Solucao: Triggers automaticos no banco de dados

Criar triggers que disparam automaticamente ao inserir/atualizar/deletar registros nas tabelas relacionadas a oportunidade. Isso garante rastreamento completo sem depender de chamadas no frontend.

### Tabelas que receberao triggers

| Tabela | Eventos | O que registra |
|--------|---------|----------------|
| `oportunidades` | INSERT, UPDATE | Criacao, movimentacao de etapa, alteracao de campos (valor, responsavel, previsao, etc.), fechamento |
| `anotacoes_oportunidades` | INSERT, UPDATE | Anotacao adicionada, editada, excluida (soft delete) |
| `tarefas` | INSERT, UPDATE | Tarefa criada, concluida, editada, excluida |
| `documentos_oportunidades` | INSERT, UPDATE | Documento anexado, removido |
| `emails_oportunidades` | INSERT, UPDATE | E-mail criado, enviado |
| `reunioes_oportunidades` | INSERT, UPDATE | Reuniao agendada, realizada, cancelada, no-show, reagendada |
| `contatos` | UPDATE | Alteracao de dados do contato (nome, email, telefone, empresa) |

### Logica dos triggers

Cada trigger chamara uma funcao que:
1. Determina a `oportunidade_id` (para tabelas filhas, usa a coluna `oportunidade_id`; para `oportunidades` usa o proprio `id`)
2. Busca o `organizacao_id` do registro
3. Identifica o usuario via `auth.uid()` e busca o `usuario_id` correspondente
4. Compara `OLD` vs `NEW` para gerar detalhes legivel (ex: "Moveu de 'Qualificacao' para 'Proposta'")
5. Insere no `audit_log` com `entidade_id = oportunidade_id`

### Detalhes inteligentes nos eventos

Os triggers gerarao detalhes contextuais no campo `detalhes` (JSONB):

- **Movimentacao de etapa:** `{"etapa_anterior_id": "...", "etapa_nova_id": "..."}`
- **Alteracao de valor:** `{"campo": "valor", "de": 5000, "para": 8000}`
- **Tarefa concluida:** `{"tarefa_titulo": "Enviar proposta"}`
- **Documento:** `{"nome_arquivo": "contrato.pdf"}`
- **Reuniao:** `{"titulo": "Call com cliente", "status": "cancelada"}`

### Tratamento especial: Contatos

A tabela `contatos` nao possui `oportunidade_id`. O trigger de contato precisara buscar todas as oportunidades ativas vinculadas ao contato e inserir um registro de audit para cada uma.

### Melhorias no componente DetalhesHistorico

O componente sera atualizado para:
- Exibir labels mais ricos usando os `detalhes` do JSONB (ex: "Moveu para Proposta" em vez de "Oportunidade atualizada")
- Mostrar o nome do usuario que realizou a acao
- Adicionar icones especificos para reuniao, audio, empresa
- Tratar eventos de contato (ex: "Contato atualizado: email alterado")

---

## Secao Tecnica

### Migracao SQL

Uma unica migracao criara:
1. Funcao generica `audit_trigger_fn()` que identifica a entidade e registra no `audit_log`
2. Funcoes especializadas por tabela para extrair `oportunidade_id` e `detalhes` corretamente
3. Triggers em cada tabela

```text
Estrutura dos triggers:

oportunidades        -> AFTER INSERT OR UPDATE -> audit_oportunidades_fn()
anotacoes_oportunidades -> AFTER INSERT OR UPDATE -> audit_anotacoes_fn()
tarefas              -> AFTER INSERT OR UPDATE -> audit_tarefas_fn()
documentos_oportunidades -> AFTER INSERT OR UPDATE -> audit_documentos_fn()
emails_oportunidades -> AFTER INSERT OR UPDATE -> audit_emails_fn()
reunioes_oportunidades -> AFTER INSERT OR UPDATE -> audit_reunioes_fn()
contatos             -> AFTER UPDATE           -> audit_contatos_oportunidades_fn()
```

### Funcao principal para oportunidades (exemplo)

A funcao de trigger para `oportunidades` detectara mudancas especificas:
- Se `etapa_id` mudou: registra "movimentacao" com IDs das etapas
- Se `valor` mudou: registra "alteracao_valor" com antes/depois
- Se `usuario_responsavel_id` mudou: registra "alteracao_responsavel"
- Se `fechado_em` foi preenchido: registra "fechamento"
- Se `deletado_em` foi preenchido: registra "exclusao"
- INSERT: registra "criacao"

### Busca de usuario

Os triggers usarao `auth.uid()` para identificar quem fez a acao. Se nulo (evento de sistema), `usuario_id` ficara null.

### Atualizacao do componente DetalhesHistorico

O componente `DetalhesHistorico.tsx` sera atualizado para:
- Buscar nome do usuario junto com os eventos
- Exibir detalhes ricos baseados no campo `detalhes` JSONB
- Adicionar mais mapeamentos de icones (Calendario, Mic, Building, etc.)

### Atualizacao da query listarHistorico

A funcao `listarHistorico` em `negocios.api.ts` sera expandida para enriquecer os eventos com nomes de usuarios.

### Arquivos a alterar

| Arquivo | Acao |
|---------|------|
| `supabase/migrations/xxx.sql` | Funcoes de trigger + triggers em 7 tabelas |
| `src/modules/negocios/components/detalhes/DetalhesHeader.tsx` | Adicionar `whitespace-nowrap` no menu |
| `src/modules/negocios/components/detalhes/DetalhesHistorico.tsx` | Labels ricos, icones, nome do usuario |
| `src/modules/negocios/services/negocios.api.ts` | Enriquecer `listarHistorico` com usuarios |
