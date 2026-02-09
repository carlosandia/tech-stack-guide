

# Plano: Informacoes Explicativas nas 4 Tabs + Correcao do Drag-and-Drop

## 1. Problema do Drag-and-Drop (Causa Raiz)

O `handleDropNewCampo` cria o campo com `ordem: index`, porem **nao reordena os campos existentes** para abrir espaco. Exemplo: se existem campos com ordem 0,1,2,3,4,5,6,7 e voce cria um novo com `ordem=1`, agora existem **dois campos com ordem=1**. O banco retorna o novo por ultimo (por `created_at`), fazendo-o aparecer no final.

### Correcao

**Arquivo: `src/modules/formularios/pages/FormularioEditorPage.tsx`**

Alterar `handleDropNewCampo` para:
1. Criar o campo novo com `ordem: index`
2. Apos a criacao (onSuccess), chamar `reordenarCampos.mutate()` com todos os campos reindexados
3. Alternativa mais simples: antes de criar, reordenar os campos existentes deslocando os que tem `ordem >= index` em +1, e depois criar o novo campo

Logica proposta:
```
handleDropNewCampo(e, index):
  1. Desloca campos existentes: para cada campo com ordem >= index, incrementa ordem em +1
  2. Cria o novo campo com ordem = index
  3. Invalida a query para refletir a nova ordem
```

Na pratica, isso sera feito com uma sequencia: primeiro `reordenarCampos.mutate()` com os indices ajustados, depois `criarCampo.mutate()` com o indice correto. Ou, mais eficiente: criar o campo e na callback onSuccess reordenar tudo.

**Abordagem escolhida (mais robusta):** Criar o campo, e no `onSuccess` do `criarCampo`, chamar `reordenarCampos` passando todos os campos na ordem desejada (inserindo o novo no indice correto).

Tambem corrigir o `CampoItem.onDrop` para aceitar drops de novos campos da paleta (tipo `application/campo-tipo`), nao apenas reorder.

---

## 2. Informacoes Explicativas nas 4 Tabs

Adicionar um bloco informativo compacto no topo de cada uma das 4 tabs (Logica, Integracoes, Analytics, A/B Testing) com icone de informacao (Info), titulo do objetivo e exemplos de uso.

### Tab Logica Condicional
**Arquivo: `src/modules/formularios/components/editor/EditorTabsLogica.tsx`**

Substituir o paragrafo simples existente por um bloco informativo com:
- **Objetivo:** Controlar dinamicamente o formulario com base nas respostas do usuario
- **Exemplos:** "Se o campo 'Tipo' = Empresa, mostrar campo CNPJ", "Se cidade = Sao Paulo, pular para etapa 3"
- Icone `Info` com fundo suave

### Tab Integracoes
**Arquivo: `src/modules/formularios/components/editor/EditorTabsIntegracoes.tsx`**

Adicionar bloco informativo no topo (antes do Pipeline info) com:
- **Objetivo:** Conectar o formulario a sistemas externos e ao pipeline de vendas
- **Exemplos:** "Enviar dados para Slack ao receber submissao", "Criar oportunidade automaticamente no pipeline", "Sincronizar leads com ferramenta de email marketing"

### Tab Analytics
**Arquivo: `src/modules/formularios/components/editor/EditorTabsAnalytics.tsx`**

Adicionar bloco informativo no topo com:
- **Objetivo:** Acompanhar o desempenho do formulario e identificar pontos de melhoria
- **Exemplos:** "Ver quantas pessoas abandonam no campo 'Telefone'", "Comparar taxa de conversao ao longo do tempo", "Identificar campos com mais erros de preenchimento"

### Tab A/B Testing
**Arquivo: `src/modules/formularios/components/editor/EditorTabsAB.tsx`**

Adicionar bloco informativo no topo (antes do TesteABForm) com:
- **Objetivo:** Testar variacoes do formulario para descobrir qual converte mais
- **Exemplos:** "Testar botao verde vs azul", "Comparar formulario curto vs longo", "Testar titulo diferente e medir impacto na conversao"

### Estilo do Bloco Informativo (padrao para as 4 tabs)
- Container com `border border-blue-200 bg-blue-50/50 rounded-lg p-3`
- Icone `Info` com cor `text-blue-500`
- Titulo em `text-xs font-semibold`
- Exemplos em lista com marcadores, `text-xs text-muted-foreground`
- Botao colapsavel opcional (pode iniciar aberto e o usuario fecha se quiser)

---

## Detalhes Tecnicos

### Arquivos a editar:
1. `src/modules/formularios/pages/FormularioEditorPage.tsx` - Correcao do `handleDropNewCampo`
2. `src/modules/formularios/components/editor/FormPreview.tsx` - CampoItem onDrop para aceitar novos campos
3. `src/modules/formularios/components/editor/EditorTabsLogica.tsx` - Bloco informativo
4. `src/modules/formularios/components/editor/EditorTabsIntegracoes.tsx` - Bloco informativo
5. `src/modules/formularios/components/editor/EditorTabsAnalytics.tsx` - Bloco informativo
6. `src/modules/formularios/components/editor/EditorTabsAB.tsx` - Bloco informativo

### Sequencia de implementacao:
1. Corrigir o drag-and-drop no `handleDropNewCampo` (prioridade alta)
2. Adicionar blocos informativos nas 4 tabs (paralelo)

