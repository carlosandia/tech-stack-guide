
## Corrigir filtros e colunas na pagina de Organizacoes

### Problema
O filtro "Todos os status" nao inclui os pre-cadastros (leads pendentes). Eles so aparecem quando "Pendentes (Leads)" e selecionado explicitamente. O usuario espera que "Todos" mostre tudo.

### Solucao

**Arquivo:** `src/modules/admin/pages/OrganizacoesPage.tsx`

### 1. Habilitar query de pre-cadastros para "Todos os status"

Alterar a condicao `enabled` da query de pre-cadastros de:
```
enabled: isPendentes
```
Para:
```
enabled: isPendentes || statusFilter === 'todas'
```

Isso garante que ao selecionar "Todos os status", ambas as queries (organizacoes + pre-cadastros) rodem em paralelo.

### 2. Renderizar pre-cadastros na visao "Todos os status"

Quando o filtro for "todas" e houver pre-cadastros nao convertidos, renderizar linhas extras na mesma tabela, apos as organizacoes reais. Cada linha de pre-cadastro tera:

- **Empresa**: nome_empresa com inicial no avatar
- **Administrador**: nome_contato + email + telefone
- **Segmento**: segmento
- **Plano**: plano desejado + badge laranja "Pendente" ou amarelo "Checkout iniciado"
- **Criado em**: data do pre-cadastro
- **Acoes**: sem menu de acoes (apenas informativo)

As linhas de pre-cadastro nao serao clicaveis (nao ha pagina de detalhe para elas).

### 3. Mesma logica para mobile cards

Adicionar cards de pre-cadastro abaixo dos cards de organizacao na visao mobile quando filtro for "todas", com badge de status visual diferenciado.

### 4. Filtros individuais permanecem iguais

- "Ativas", "Em Trial", "Suspensas", "Canceladas" continuam filtrando apenas `organizacoes_saas`
- "Pendentes (Leads)" continua mostrando apenas `pre_cadastros_saas`
- "Todos os status" agora mostra ambos

### Secao Tecnica

Alteracoes em um unico arquivo: `src/modules/admin/pages/OrganizacoesPage.tsx`

1. Linha 89: `enabled: isPendentes` muda para `enabled: isPendentes || statusFilter === 'todas'`
2. Apos o `{data.organizacoes.map(...)}` no tbody (linha ~287), adicionar um segundo map para `preCadastrosData?.pre_cadastros` renderizando `<tr>` com as mesmas colunas, porem com badge de status "Pendente"/"Checkout iniciado" na coluna Plano e sem coluna Acoes (celula vazia)
3. Mesma logica no bloco mobile cards (linha ~303): adicionar cards de pre-cadastro apos os cards de organizacao
