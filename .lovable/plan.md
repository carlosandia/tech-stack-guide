
# Substituir UTM por Origem Inteligente na Criacao Manual

## Contexto

Atualmente o modal "Nova Oportunidade" exibe 5 campos UTM (source, campaign, medium, term, content) que nao fazem sentido para criacao manual. O relatorio "Por Canal de Origem" usa a logica `COALESCE(utm_source, origem, 'direto')` na funcao `fn_breakdown_canal_funil`, entao o campo `origem` da tabela `oportunidades` ja e o fallback principal.

A API `criarOportunidade` hardcoda `origem: 'manual'` independente de onde a oportunidade e criada (Kanban, Contatos ou Conversas).

## O que muda

### 1. Modal "Nova Oportunidade" - Substituir UTM por campo "Origem"

Remover a secao colapsavel "Rastreamento UTM" com 5 inputs e substituir por um unico select "Origem" com opcoes pre-definidas:

- Manual (default para criacao via Kanban/Contatos)
- WhatsApp Conversas (default quando vindo de /conversas com canal whatsapp)
- Instagram (default quando vindo de /conversas com canal instagram)
- Indicacao
- Site / Landing Page
- Evento
- Outro

Ao lado do label "Origem", incluir um icone (i) com tooltip:
> "Define o canal de aquisicao deste lead. Aparece no relatorio 'Por Canal de Origem' do Dashboard."

### 2. Prop `origemDefault` no modal

Adicionar prop opcional `origemDefault?: string` ao `NovaOportunidadeModal` para que cada modulo passe a origem correta automaticamente:

- **Kanban** (`NegociosPage`): nao passa nada, default = `manual`
- **Contatos** (`ContatosPage`): nao passa nada, default = `manual`
- **Conversas** (`ConversasPage` e `ChatWindow`): passa o canal da conversa ativa (`whatsapp_conversas` ou `instagram`)

### 3. API `criarOportunidade` - aceitar `origem` dinamico

Alterar de `origem: 'manual'` hardcoded para `origem: payload.origem || 'manual'`.

## Secao Tecnica

### Arquivos e mudancas

| Arquivo | Acao |
|---------|------|
| `NovaOportunidadeModal.tsx` | Remover 5 states UTM + secao UTM. Adicionar state `origem` + select com tooltip. Aceitar prop `origemDefault`. Passar `origem` ao `criarOportunidade`. |
| `negocios.api.ts` | Adicionar `origem?: string` ao payload de `criarOportunidade`. Usar `payload.origem \|\| 'manual'` no insert. Remover UTMs do payload (manter no insert apenas se presentes). |
| `ConversasPage.tsx` | Passar `origemDefault={conversaAtiva.canal}` ao `NovaOportunidadeModal` (ex: `whatsapp_conversas`) |
| `ChatWindow.tsx` | Passar `origemDefault={conversa.canal}` ao `NovaOportunidadeModal` |

### Interface do campo Origem no modal

```text
Origem (i)              [tooltip ao hover no (i)]
[  Manual           v]  -- select com opcoes pre-definidas
```

Posicao: abaixo de Responsavel/Previsao, no lugar da secao UTM colapsavel.

### Mapeamento de valores

O valor salvo em `oportunidades.origem` sera exatamente o value do select, que ja e reconhecido pela funcao SQL `fn_breakdown_canal_funil` como fallback quando `utm_source` esta vazio. Nenhuma mudanca no banco e necessaria.
