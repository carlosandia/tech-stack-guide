
# Analise de Completude do Modulo /contatos (PRD-06)

## Resumo

O modulo de Contatos esta em bom estado de desenvolvimento, com a maioria dos requisitos funcionais implementados. No entanto, existem lacunas importantes que precisam ser corrigidas para considerar o modulo completo.

---

## Status por Requisito Funcional

### RF-001: Interface Principal `/contatos` -- COMPLETO
Todos os criterios atendidos: abas Pessoas/Empresas, contadores, URLs corretas, navegacao funcional.

### RF-002: Lista de Contatos com Colunas Fixas -- PARCIAL
**Faltando:**
1. **"Sem oportunidades +" na coluna Nome** -- Para pessoas sem oportunidades, deveria exibir "Rafael . Sem oportunidades +" com o "+" clicavel (depende do modulo de Negocios, PRD-07 -- postergar)
2. **Formato da coluna "Pessoa Vinculada" em Empresas** -- Atualmente mostra "X pessoa(s)". O PRD exige o formato "carlos (+N)" mostrando o nome da primeira pessoa
3. **Ordenacao por coluna clicando no header** -- Nao implementado

### RF-003: Busca -- QUASE COMPLETO
**Faltando:**
1. Busca nao inclui `cargo` para Pessoas nem `cnpj` para Empresas
2. Deveria ter minimo de 3 caracteres ou tecla Enter para disparar (atualmente dispara com qualquer caractere)

### RF-004: Filtros -- PARCIAL
**Faltando:**
1. **Filtro de Responsavel (Admin only)** -- Completamente ausente
2. **Filtro de Periodo de Criacao (date range)** -- Completamente ausente
3. **Regra de visibilidade**: Admin ve filtro de responsavel, Member nao

### RF-005: Toggle de Colunas -- COMPLETO

### RF-006: Sistema de Segmentacao -- COMPLETO

### RF-007: Deteccao de Duplicatas -- COMPLETO

### RF-008: Importacao CSV/XLSX -- PARCIAL
**Faltando:**
1. Limite hardcoded de 100 contatos na importacao (deveria ser 10.000)
2. XLSX nao e suportado (mostra erro ao usuario)
3. Nao registra historico na tabela `importacoes_contatos`
4. Duplicatas nao sao verificadas antes de inserir
5. Sem relatorio de erros para download

### RF-009: Exportacao de Contatos -- PARCIAL
**Faltando:**
1. **Modal de selecao de colunas** -- Exporta direto sem permitir selecionar quais colunas incluir
2. Nao respeita filtros aplicados na lista (usa parametros fixos)
3. Exportar selecionados ignora IDs (exporta tudo)

### RF-010: Modal de Novo Contato -- QUASE COMPLETO
**Faltando:**
1. **Multi-select de segmentos** no formulario de criacao -- O PRD preve campo para adicionar segmentos ja na criacao
2. Validacao de formato de Email (regex)
3. Validacao de formato de CNPJ

### RF-011: Criacao de Oportunidade a partir do Contato -- NAO IMPLEMENTADO
Depende do PRD-07 (Modulo de Negocios). Postergar para quando o modulo de Negocios for implementado.

### RF-012: Visibilidade por Role -- PARCIAL
**Faltando:**
1. Filtro de responsavel oculto para Member
2. Verificar se Member ve apenas seus proprios contatos (depende do RLS)
3. Botao de importar deveria ser oculto para Member (ja esta com `isAdmin`)

### RF-013: Modal de Visualizacao -- QUASE COMPLETO
**Faltando:**
1. **Datas de criacao e atualizacao** no rodape do modal (conforme layout do PRD)
2. Aba Historico e um stub -- mostra placeholder em vez de dados reais (aceitavel ate PRD-07)
3. "Sem oportunidades +" clicavel (postergar para PRD-07)

### RF-014: Exclusao com Confirmacao -- PARCIAL
**Faltando:**
1. **Verificacao de vinculos antes de excluir** -- O modal de bloqueio para Pessoas com oportunidades e Empresas com pessoas vinculadas nao existe
2. **Modal de bloqueio** com lista dos vinculos -- Nao implementado
3. O PRD define DELETE fisico, mas a implementacao faz soft delete (`deletado_em`) -- manter soft delete por seguranca, pois e mais robusto

### RF-015: Performance -- PARCIAL (aceitavel para MVP)
Paginacao offset-based em vez de cursor-based. Virtualizacao nao implementada. Aceitavel para volumes iniciais.

### RF-016: Selecao em Lote e Acoes em Massa -- QUASE COMPLETO
**Faltando:**
1. Exclusao em massa nao verifica vinculos
2. Modal de bloqueio para empresas com pessoas vinculadas na exclusao em massa

---

## Plano de Implementacao (Priorizado)

### Fase 1 -- Ajustes Criticos (Must-have)

**1. Filtro de Responsavel e Periodo (RF-004)**
- Adicionar select de Responsavel no painel de filtros (visivel apenas para Admin)
- Adicionar inputs de data inicio/fim para filtro de periodo
- Integrar com a query de listagem existente
- Arquivo: `ContatosPage.tsx`

**2. Verificacao de Vinculos na Exclusao (RF-014)**
- Antes de excluir Pessoa: verificar se tem oportunidades vinculadas
- Antes de excluir Empresa: verificar se tem pessoas vinculadas
- Criar modal de bloqueio exibindo a lista de vinculos
- Aplicar tanto na exclusao individual quanto na exclusao em massa
- Arquivos: `ConfirmarExclusaoModal.tsx`, `ContatosPage.tsx`, `contatos.api.ts`

**3. Formato "Pessoa Vinculada" em Empresas (RF-002)**
- Alterar de "X pessoa(s)" para "carlos (+N)" mostrando o nome da primeira pessoa
- Arquivo: `ContatosList.tsx` (CellPessoaVinculada)

**4. Ordenacao por Coluna (RF-002)**
- Adicionar clique no header para ordenar por qualquer coluna
- Indicador visual de direcao (asc/desc)
- Integrar com parametros da query
- Arquivos: `ContatosList.tsx`, `ContatosPage.tsx`

### Fase 2 -- Melhorias Importantes (Should-have)

**5. Modal de Exportacao com Selecao de Colunas (RF-009)**
- Criar componente `ExportarContatosModal` com checkboxes de colunas
- Respeitar filtros ativos na lista
- Quando ha IDs selecionados, exportar apenas esses
- Arquivos: novo `ExportarContatosModal.tsx`, `ContatosPage.tsx`

**6. Multi-select de Segmentos no Form de Criacao (RF-010)**
- Adicionar campo de segmentos na secao "Atribuicao" do formulario
- Apos criar contato, vincular segmentos selecionados
- Arquivo: `ContatoFormModal.tsx`

**7. Datas no Modal de Visualizacao (RF-013)**
- Adicionar "Criado em DD/MM/YYYY" e "Atualizado em DD/MM/YYYY" no rodape do modal
- Arquivo: `ContatoViewModal.tsx`

**8. Busca: minimo 3 caracteres + campos adicionais (RF-003)**
- Disparar busca somente com 3+ caracteres ou Enter
- Incluir `cargo` e `cnpj` na busca
- Arquivos: `ContatosPage.tsx`, `contatos.api.ts`

### Fase 3 -- Nice-to-have (postergar se necessario)

**9. Melhoria na Importacao (RF-008)**
- Verificar duplicatas antes de inserir (por email/telefone)
- Remover limite hardcoded de 100
- Registrar historico em `importacoes_contatos`

**10. Validacoes de formato (RF-010)**
- Validacao regex de Email
- Validacao de CNPJ (digitos verificadores)

---

## Detalhes Tecnicos

### Filtro de Responsavel (RF-004)
```text
Arquivo: ContatosPage.tsx
- Adicionar estado `responsavelFilter`
- No painel de filtros, renderizar select com usuarios quando `isAdmin`
- Passar `owner_id` nos params da query
- O servico `contatos.api.ts` ja suporta o parametro `owner_id`
```

### Verificacao de Vinculos (RF-014)
```text
Arquivo: contatos.api.ts
- Criar funcao `verificarVinculos(id)` que consulta:
  - Para Pessoas: contar oportunidades vinculadas
  - Para Empresas: contar pessoas vinculadas
- Retornar { temVinculos: boolean, detalhes: [...] }

Arquivo: ConfirmarExclusaoModal.tsx
- Receber props para tipo de bloqueio
- Exibir modal diferente quando ha vinculos (lista dos vinculos)
- Botao "Entendi" em vez de "Excluir"
```

### Formato Pessoa Vinculada (RF-002)
```text
Arquivo: ContatosList.tsx (CellPessoaVinculada)
- Se 0 pessoas: "---"
- Se 1 pessoa: "carlos"
- Se 2+ pessoas: "carlos (+1)" ou "carlos (+2)"
- Usar contato.pessoas[0].nome para o primeiro nome
```

### Ordenacao por Coluna (RF-002)
```text
Arquivo: ContatosList.tsx
- Header clicavel com icone de seta
- Props: onSort(column, direction)

Arquivo: ContatosPage.tsx  
- Estado: ordenarPor, ordem
- Passar para params da query
```

### Notas sobre RF-011 (Criar Oportunidade)
Este RF depende do modulo de Negocios (PRD-07) que ainda nao foi implementado. Deve ser postergado e implementado junto com o PRD-07. Inclui:
- Icone de raio na coluna Acoes
- "Sem oportunidades +" na coluna Nome
- Modal de selecao de Pipeline

---

## Estimativa de Esforco

| Fase | Itens | Complexidade |
|------|-------|-------------|
| Fase 1 | 4 itens (Filtros, Vinculos, Pessoa Vinculada, Ordenacao) | Media-Alta |
| Fase 2 | 4 itens (Exportacao, Segmentos Form, Datas, Busca) | Media |
| Fase 3 | 2 itens (Importacao, Validacoes) | Baixa-Media |

Recomendo implementar Fase 1 e Fase 2 para considerar o modulo completo. Fase 3 pode ser backlog.
