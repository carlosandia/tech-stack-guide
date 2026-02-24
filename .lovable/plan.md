

## Correção: Ordenação das Etapas no Kanban

### Problema Raiz

Existem **dois problemas** causando a desordem:

1. **`criarEtapa`** busca a maior `ordem` de TODAS as etapas (incluindo Ganho e Perda) e adiciona +1. Resultado: novas etapas personalizadas ficam com `ordem` MAIOR que Ganho/Perda no banco.

2. **O Kanban** renderiza as etapas puramente por `ordem` ascendente (`.order('ordem', { ascending: true })`), sem aplicar a regra de negócio: Entrada → Personalizados → Ganho → Perda.

A tela de configuração "esconde" esse bug porque aplica um `useMemo` que reordena visualmente por tipo. Mas no Kanban, as colunas aparecem na ordem errada do banco.

### Solução (2 correções)

#### 1. `pipeline-config.api.ts` — Corrigir `criarEtapa`

Ao criar uma nova etapa, buscar a maior `ordem` apenas das etapas do tipo `normal` e `entrada` (excluindo `ganho` e `perda`). Depois, incrementar a `ordem` de Ganho e Perda para que fiquem sempre no final.

```text
Antes:  Entrada(0), Ganho(1), Perda(2) → Nova etapa recebe ordem 3
Depois: Entrada(0), Nova(1), Ganho(2), Perda(3) → Ganho e Perda são empurrados
```

#### 2. `negocios.api.ts` — Ordenação segura no `carregarKanban`

Após buscar as etapas do banco, aplicar a mesma lógica de ordenação da ConfigEtapas como "safety net":

```text
Entrada → Normal (por ordem) → Ganho → Perda
```

Isso garante que mesmo com dados legados com `ordem` inconsistente, o Kanban sempre exibe na sequência correta.

### Arquivos modificados

- `src/modules/negocios/services/pipeline-config.api.ts` — Ajustar `criarEtapa` para inserir antes de ganho/perda
- `src/modules/negocios/services/negocios.api.ts` — Adicionar sort por tipo após buscar etapas no `carregarKanban`

