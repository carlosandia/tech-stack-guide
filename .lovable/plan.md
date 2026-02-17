
# Criacao de Oportunidades em Massa a partir de Contatos

## Resumo

Adicionar um botao "Criar Oportunidade" na barra flutuante de acoes em massa (bulk actions) do modulo de Contatos. Ao clicar, abre um modal dedicado onde o usuario seleciona a pipeline e opcionalmente distribui as oportunidades entre membros da equipe (round-robin ou manual).

---

## Fluxo do Usuario

1. Na listagem de contatos, selecionar multiplos contatos (ex: 38 selecionados)
2. Na barra flutuante inferior, clicar no novo botao **"Criar Oportunidade"** (icone `Target`)
3. Abre o modal **"Criar Oportunidades em Massa"** com:
   - **Step 1: Pipeline** -- Selecionar em qual pipeline criar (lista de pipelines ativas com cor)
   - **Step 2: Distribuicao** -- Opcoes de distribuicao:
     - **Nao distribuir** -- todas ficam sem responsavel (ou atribuidas ao criador)
     - **Rodizio automatico** -- distribui igualmente entre membros do funil (usa `funis_membros`)
     - **Escolher membros manualmente** -- checkboxes para selecionar quais membros participam da distribuicao
   - **Resumo** -- Exibe: "40 oportunidades serao criadas na pipeline X, distribuidas entre 4 membros (10 cada)"
4. Confirmar e processar em lote

---

## Recomendacoes Estrategicas

- **Titulo automatico**: Cada oportunidade usa o nome do contato como titulo (ex: "Eddie", "Beatriz")
- **Etapa de entrada**: Todas as oportunidades sao criadas na etapa de entrada da pipeline selecionada
- **Preview da distribuicao**: Mostrar visualmente quantas oportunidades cada membro recebera antes de confirmar
- **Progresso visual**: Barra de progresso durante a criacao para lotes grandes (>20)
- **Contatos ja com oportunidade**: Filtrar e avisar quantos dos selecionados ja possuem oportunidade nessa pipeline, com opcao de pular ou criar duplicada
- **Limite de seguranca**: Maximo de 100 oportunidades por lote para evitar sobrecarga

---

## Detalhes Tecnicos

### 1. API -- `contatos.api.ts`
Nova funcao `criarOportunidadesLote`:
```typescript
criarOportunidadesLote: async (payload: {
  contato_ids: string[]
  funil_id: string
  distribuicao: 'nenhuma' | 'rodizio' | 'manual'
  membro_ids?: string[]  // para distribuicao manual
}) => Promise<{ criadas: number; erros: number; detalhes: string[] }>
```

Internamente:
- Busca etapa de entrada da pipeline
- Para cada contato, cria uma oportunidade com titulo = nome do contato
- Se distribuicao = 'rodizio', busca `funis_membros` e distribui round-robin
- Se distribuicao = 'manual', distribui entre os `membro_ids` fornecidos
- Atualiza `posicao_rodizio` na `configuracoes_distribuicao` se aplicavel

### 2. Hook -- `useContatos.ts`
Novo hook `useCriarOportunidadesLote` com mutation padrao, invalidando queries `['contatos']` e `['kanban']`.

### 3. Componente -- `CriarOportunidadeLoteModal.tsx`
Modal multi-step com:
- Lista de pipelines ativas (reutiliza dados de `useFunis`)
- Opcoes de distribuicao com radio buttons
- Se "manual", exibe lista de membros do funil selecionado (via `funis_membros`)
- Resumo com calculo de distribuicao (ex: "10 por membro")
- Barra de progresso durante execucao

### 4. Barra Flutuante -- `ContatoBulkActions.tsx`
Adicionar botao `Target` + "Oportunidade" na barra, visivel apenas para tipo `pessoa` e `isAdmin`.
Ao clicar, abre `CriarOportunidadeLoteModal` passando `selectedIds`.

### 5. Arquivos a criar/modificar

| Arquivo | Acao |
|---------|------|
| `src/modules/contatos/components/CriarOportunidadeLoteModal.tsx` | Criar (modal multi-step) |
| `src/modules/contatos/services/contatos.api.ts` | Adicionar `criarOportunidadesLote` |
| `src/modules/contatos/hooks/useContatos.ts` | Adicionar `useCriarOportunidadesLote` |
| `src/modules/contatos/components/ContatoBulkActions.tsx` | Adicionar botao "Oportunidade" |
| `src/modules/contatos/pages/ContatosPage.tsx` | Integrar modal e estado |
