

## Tornar Nome e Qualificacao configuraveis no Card Kanban

### Situacao Atual
No header do card Kanban, o **nome da oportunidade** ("Negocio Exemplo") e o **badge de qualificacao** (MQL/SQL) sao sempre exibidos, sem possibilidade de o usuario desativa-los na pagina de personalizacao de cards.

### O que muda
Ambos passam a ser **campos configuraveis** na lista de "Campos Visiveis no Card", com toggle para exibir ou ocultar:

- **Nome da Oportunidade**: quando desativado, o card nao exibe o titulo (cenario raro, mas o usuario tem a opcao)
- **Qualificacao**: quando desativado, o badge MQL/SQL/Lead desaparece do header

Ambos virao **habilitados por padrao** para manter o comportamento atual.

### Detalhes Tecnicos

**1. `ConfigCardPage.tsx`** - Adicionar 2 novos campos em `CAMPOS_PADRAO`

```
{ key: 'titulo', label: 'Nome da Oportunidade', descricao: 'Titulo/nome do negocio', icon: FileText, cor: '...' }
{ key: 'qualificacao', label: 'Qualificacao', descricao: 'Badge de qualificacao (Lead/MQL/SQL)', icon: Award, cor: '...' }
```

Adicionar `'titulo'` e `'qualificacao'` ao array `CAMPOS_DEFAULT_VISIVEIS`.

**2. `KanbanCard.tsx`** - Condicionar exibicao no header

Linha ~379 (titulo):
```
{camposVisiveis.includes('titulo') && (
  <p className="text-sm font-medium ...">{oportunidade.titulo}</p>
)}
```

Linha ~382 (qualificacao):
```
{camposVisiveis.includes('qualificacao') && (
  <span className="text-[10px] ...">{qualificacao.label}</span>
)}
```

Quando ambos estiverem ocultos, o header continua existindo (para manter checkbox de selecao e tarefas), apenas sem texto/badge.

**3. `KanbanCardPreview.tsx`** - Condicionar no preview

Linha ~155 (titulo):
```
{camposVisiveis.includes('titulo') && (
  <span className="text-sm font-semibold ...">Negocio Exemplo</span>
)}
```

Linha ~159 (qualificacao):
```
{camposVisiveis.includes('qualificacao') && (
  <span className="text-[10px] ...">MQL</span>
)}
```

### Arquivos modificados
- **`src/modules/configuracoes/pages/ConfigCardPage.tsx`** - 2 novos campos em CAMPOS_PADRAO e CAMPOS_DEFAULT_VISIVEIS
- **`src/modules/negocios/components/kanban/KanbanCard.tsx`** - condicionar titulo e badge no header
- **`src/modules/configuracoes/components/cards/KanbanCardPreview.tsx`** - condicionar titulo e badge no preview

### Comportamento padrao
Usuarios existentes continuarao vendo tudo normalmente pois `titulo` e `qualificacao` serao adicionados ao `CAMPOS_DEFAULT_VISIVEIS`. Somente se o usuario explicitamente remover esses campos eles deixarao de aparecer.

