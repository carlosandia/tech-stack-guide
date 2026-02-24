

# Ocultar campo "Origem" no modal de criacao manual

## Problema

Quando o usuario cria um contato manualmente pelo modal "Nova Pessoa" ou "Nova Empresa", o campo "Origem" aparece com valor "Manual" selecionavel. Isso e redundante — se o cadastro e manual, a origem sera sempre "manual".

## Solucao

Ocultar o campo "Origem" no modo de **criacao** (quando `contato` e null). O valor `'manual'` ja e definido como default no schema, entao sera enviado automaticamente sem precisar de input do usuario.

No modo de **edicao** (quando `contato` existe), o campo continua visivel — pois a origem pode ter sido outra (importacao, formulario, etc.) e o admin pode querer consulta-la ou altera-la.

## Detalhes tecnicos

### Arquivo: `src/modules/contatos/components/ContatoFormModal.tsx`

**Linha ~524-531** — Condicionar a exibicao do campo Origem:

- Se `contato` existe (edicao): exibir Status e Origem lado a lado (grid 2 colunas)
- Se `contato` nao existe (criacao): exibir apenas Status (grid 1 coluna), Origem omitido e enviado como `'manual'` pelo default do schema

A logica ja define `defaults.origem = 'manual'` na inicializacao do formulario, entao nenhuma mudanca adicional e necessaria no envio dos dados.

