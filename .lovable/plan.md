
# Origens Dinâmicas com Pré-Cadastro em Configurações

## Resumo

Criar uma tabela `origens` no banco para pré-cadastro pelo admin, substituir os selects hardcoded por um combobox que permite selecionar origens existentes ou criar uma nova inline. Isso unifica Contatos e Oportunidades sob a mesma lista e melhora a precisão dos relatórios.

## 1. Banco de Dados — Nova tabela `origens`

Criar via SQL no Supabase:

```text
origens
  id             uuid PK
  organizacao_id uuid FK -> organizacoes
  nome           text (ex: "WhatsApp", "Instagram", "Indicação")
  slug           text UNIQUE per org (ex: "whatsapp", "instagram") -- usado em relatórios
  cor            text nullable (para badges futuros)
  padrao_sistema boolean default false (origens built-in não deletáveis)
  ativo          boolean default true
  criado_em      timestamptz
```

Inserir registros padrão (padrao_sistema=true): Manual, WhatsApp, Instagram, Indicação, Site, Formulário, Importação, Evento.

## 2. Página de Configurações — "Origens" (nova page)

- Nova rota: `/configuracoes/origens`
- Adicionar link no menu lateral de configurações
- CRUD simples: listar, criar, editar nome, ativar/desativar, excluir (apenas as não-sistema)
- Layout segue o padrão das páginas existentes (MotivosPage, ProdutosPage)

## 3. Hook Compartilhado — `useOrigens`

- Query: `supabase.from('origens').select('*').eq('ativo', true).order('nome')`
- Cache: queryKey `['origens']`, staleTime 10min
- Mutations: criar, atualizar, excluir com invalidação
- Exportado de um local compartilhado para uso em Contatos e Negócios

## 4. Combobox de Origem (componente reutilizável)

Substituir o select atual por um combobox com:
- Input de busca/filtro sobre as origens cadastradas
- Lista dropdown com as origens ativas
- Opção "+ Criar nova origem" no final da lista (abre input inline ou cria direto)
- Se o usuário não selecionar nada, salva como "manual" (fallback)
- Tooltip (i) mantido: "Define o canal de aquisição. Aparece no relatório Por Canal de Origem."

Usado em:
- `NovaOportunidadeModal.tsx` (campo Origem)
- `ContatoFormModal.tsx` (campo Origem)
- Futuramente em Conversas

## 5. Migração dos hardcoded

- Remover `ORIGENS_OPTIONS` de `NovaOportunidadeModal.tsx`
- Remover `OrigemContatoOptions` de `contatos.schema.ts` (substituir por dados do hook)
- Atualizar `ContatosList.tsx`, `ContatoViewModal.tsx`, `ContatosPage.tsx` para usar o hook
- Manter compatibilidade: valores antigos ("manual", "whatsapp", etc.) são os slugs dos registros padrão

## 6. Relatório — compatibilidade

A função `fn_breakdown_canal_funil` usa `COALESCE(utm_source, origem, 'direto')`. O campo `origem` da tabela `oportunidades` continuará recebendo o slug da origem selecionada. Nenhuma mudança na função SQL é necessária.

## Sequência de implementação

1. Criar tabela `origens` + seed dos padrões + RLS
2. Criar service `origens.api.ts` + hook `useOrigens.ts`
3. Criar página `OrigensPage.tsx` em configurações + rota
4. Criar componente `OrigemCombobox.tsx` reutilizável
5. Integrar no `NovaOportunidadeModal.tsx` (substituir select)
6. Integrar no `ContatoFormModal.tsx` e demais componentes de contatos
7. Remover constantes hardcoded

## Arquivos impactados

| Arquivo | Acao |
|---------|------|
| SQL (Supabase) | Criar tabela `origens` + seed + RLS |
| `src/modules/configuracoes/services/origens.api.ts` | Novo — CRUD |
| `src/modules/configuracoes/hooks/useOrigens.ts` | Novo — hook compartilhado |
| `src/modules/configuracoes/pages/OrigensPage.tsx` | Nova página de gestão |
| `src/shared/components/OrigemCombobox.tsx` | Novo — combobox reutilizável |
| `src/modules/negocios/components/modals/NovaOportunidadeModal.tsx` | Substituir select por OrigemCombobox |
| `src/modules/contatos/schemas/contatos.schema.ts` | Remover OrigemContatoOptions |
| `src/modules/contatos/components/ContatoFormModal.tsx` | Usar OrigemCombobox |
| `src/modules/contatos/components/ContatosList.tsx` | Usar hook useOrigens para labels |
| `src/modules/contatos/components/ContatoViewModal.tsx` | Usar hook useOrigens para labels |
| `src/modules/contatos/pages/ContatosPage.tsx` | Filtro de origens dinâmico |
| Rotas/menu de configurações | Adicionar link "Origens" |
