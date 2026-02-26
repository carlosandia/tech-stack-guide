

# Plano: Melhorias no Componente de Visualizacoes Salvas

## Problemas Identificados

1. **Posicao**: O botao "Visualizacoes" esta antes de "Investimento" e "Exibicao", mas deveria estar imediatamente antes de "Exportar"
2. **UX de criacao**: Ao salvar, o usuario nao ve quais configuracoes estao sendo salvas (periodo, funil, seções ativas)
3. **Sem edicao**: So pode excluir, nao editar nome ou configuracoes de uma visualizacao existente

---

## 1. Reordenar botoes no header (DashboardPage.tsx)

Nova ordem dos botoes:
```text
[Investimento] [Exibicao] [Visualizacoes] [Exportar] [Fullscreen]
```

Mover o `DashboardVisualizacoes` para ficar entre `DashboardDisplayConfig` e `ExportarRelatorioPDF`.

---

## 2. Melhorar UX de criacao (DashboardVisualizacoes.tsx)

Ao clicar em "Salvar visualizacao atual", expandir um formulario que mostra:

- **Input** para o nome
- **Resumo das configuracoes sendo salvas** (somente leitura, informativo):
  - Periodo: "Ultimos 30 dias" ou "Personalizado: 01/01 - 31/01"
  - Funil: nome do funil ou "Todos os funis"
  - Secoes ativas: lista das secoes visiveis (ex: "Metas, Funil, KPIs")
- Botoes "Cancelar" e "Salvar"

Isso deixa claro **o que** esta sendo salvo antes de confirmar.

### Props adicionais necessarias

Adicionar `funis` (lista de funis) ao componente para poder exibir o nome do funil selecionado no resumo.

---

## 3. Adicionar edicao de visualizacoes

### Hook (useDashboardVisualizacoes.ts)

Adicionar mutation `editar(id, params)` que faz `UPDATE` na tabela `visualizacoes_dashboard` com novo nome, filtros e/ou config_exibicao.

### UI - Modo edicao

Cada item na lista tera dois botoes no hover:
- **Editar** (icone `Pencil`): Abre o formulario de edicao inline (mesmo layout do formulario de criacao), pre-preenchido com nome e mostrando as configuracoes salvas. O usuario pode:
  - Renomear a visualizacao
  - Atualizar filtros/config para os valores atuais do dashboard (botao "Atualizar com configuracoes atuais")
- **Excluir** (icone `Trash2`): Comportamento atual mantido

---

## 4. Melhorar a lista de visualizacoes salvas

Cada item na lista exibira:
- Nome da visualizacao (truncado)
- Subtexto discreto: periodo resumido (ex: "30d" ou "7d - Funil X")
- Botoes de acao no hover: Editar | Excluir

---

## Arquivos a editar

| Arquivo | Acao |
|---------|------|
| `src/modules/app/hooks/useDashboardVisualizacoes.ts` | Adicionar mutation `editar` |
| `src/modules/app/components/dashboard/DashboardVisualizacoes.tsx` | Reescrever: resumo na criacao, edicao inline, layout melhorado |
| `src/modules/app/pages/DashboardPage.tsx` | Reordenar botoes + passar prop `funis` ao componente |

---

## Secao Tecnica

### Mutation de edicao no hook

```typescript
editarMutation = useMutation({
  mutationFn: async (params: { id: string; nome?: string; filtros?: VisualizacaoFiltros; config_exibicao?: Partial<DashboardDisplayConfig> }) => {
    const updates: Record<string, any> = {}
    if (params.nome) updates.nome = params.nome
    if (params.filtros) updates.filtros = params.filtros
    if (params.config_exibicao) updates.config_exibicao = params.config_exibicao
    await supabase.from('visualizacoes_dashboard').update(updates).eq('id', params.id)
  }
})
```

### Resumo de configuracoes (helper)

Funcao que traduz `VisualizacaoFiltros + DashboardDisplayConfig` em labels legíveis:
- `periodo`: "Ultimos 7 dias", "Ultimos 30 dias", etc.
- `funil_id`: busca nome no array `funis` ou "Todos os funis"
- `config_exibicao`: lista secoes ativas separadas por virgula

### Popover expandido

Largura aumentada para `w-80` (320px) para acomodar o resumo das configuracoes sem ficar apertado.

