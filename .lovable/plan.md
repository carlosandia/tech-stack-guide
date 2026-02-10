

# Plano: Correções na Aba Configurações + Remoção do Tipo Landing Page

## Problemas Identificados

### 1. Aba "Geral" mostra ConfigEtapasForm para TODOS os tipos
Na linha 88-90 do `EditorTabsConfig.tsx`, a seção "Geral" renderiza `<ConfigEtapasForm>` independentemente do tipo do formulário. Isso faz com que formulários inline, newsletter e popup exibam o CRUD de etapas na aba "Geral" — conteúdo que só faz sentido para multi-step.

### 2. Redundância entre "Geral" e "Etapas" no multi-step
No multi-step, tanto "Geral" quanto "Etapas" mostram o mesmo componente `ConfigEtapasForm`, tornando as duas abas idênticas.

### 3. Tipo "Landing Page" — deve ser removido
Após pesquisa, HubSpot e RD Station **não possuem** um tipo de formulário específico para landing pages. Landing pages são uma funcionalidade separada (page builder) que **incorpora** formulários comuns (inline, popup, etc.). Manter "landing_page" como tipo de formulário é redundante e confuso — qualquer formulário inline já pode ser embutido em uma landing page externa.

## Solução

### A) Corrigir a aba "Geral" — conteúdo adequado por tipo
A aba "Geral" deve exibir configurações realmente gerais do formulário (nome, descrição, status), **não** o ConfigEtapasForm. O ConfigEtapasForm deve aparecer **apenas** na aba "Etapas" e **somente** para `multi_step`.

Conteúdo da aba "Geral" para todos os tipos:
- Placeholder com texto informativo ou configurações gerais do formulário (nome, descrição, status, etc.)
- Nenhuma referência a etapas

### B) Remover tipo "landing_page"
- Remover `landing_page` das opções em `formulario.schema.ts` (`TipoFormularioOptions` e `criarFormularioSchema`)
- Remover do backend se houver referência

## Arquivos Alterados

| Arquivo | Alteração |
|---------|-----------|
| `EditorTabsConfig.tsx` (linhas 87-91) | Substituir `ConfigEtapasForm` na seção "Geral" por conteúdo de configurações gerais (ex: informações básicas do formulário) |
| `formulario.schema.ts` (linhas 8-14, 24) | Remover `landing_page` das opções e do enum Zod |

## Detalhes Técnicos

### EditorTabsConfig.tsx — seção "Geral"
Antes:
```text
activeSection === 'geral' → <ConfigEtapasForm />  (ERRADO)
```
Depois:
```text
activeSection === 'geral' → Conteúdo de configurações gerais (info do formulário)
activeSection === 'etapas' → <ConfigEtapasForm /> (só aparece para multi_step, já correto na sidebar)
```

### formulario.schema.ts
Remover:
```text
{ value: 'landing_page', label: 'Landing Page' }
```
E remover `'landing_page'` do `z.enum(...)`.

