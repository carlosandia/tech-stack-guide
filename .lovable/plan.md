

# Plano: Blocos Informativos nas 4 Tabs + Correcao do Drag-and-Drop

## Problema Confirmado
Os arquivos estao inalterados - as edicoes anteriores nao foram persistidas. Nenhum bloco informativo existe e o `handleDropNewCampo` nao desloca campos existentes antes de inserir o novo.

---

## 1. Correcao do Drag-and-Drop

### Causa Raiz
`handleDropNewCampo` cria o campo com `ordem: index`, mas nao desloca os campos existentes com `ordem >= index`. Resultado: dois campos com a mesma ordem, e o banco retorna o novo por ultimo.

### Correcao em `FormularioEditorPage.tsx`

Alterar `handleDropNewCampo` para:
1. Primeiro, deslocar os campos existentes com `ordem >= index` incrementando +1 via `reordenarCampos.mutate()`
2. No `onSuccess` da reordenacao, criar o novo campo com `ordem: index`

```
handleDropNewCampo(e, index):
  shifted = campos.map(c => ({
    id: c.id,
    ordem: c.ordem >= index ? c.ordem + 1 : c.ordem
  }))
  reordenarCampos.mutate(shifted, {
    onSuccess: () => criarCampo.mutate({ ..., ordem: index })
  })
```

---

## 2. Blocos Informativos nas 4 Tabs

Cada tab recebera um bloco informativo no topo com icone `Info`, objetivo e exemplos de uso. Estilo padrao: `border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800 rounded-lg p-3`.

### Tab Logica (`EditorTabsLogica.tsx`)
- Substituir o paragrafo simples (linha 84-86) pelo bloco informativo
- Objetivo: Controlar dinamicamente o formulario com base nas respostas
- Exemplos: "Se Tipo = Empresa, mostrar CNPJ", "Se cidade = SP, pular etapa"

### Tab Integracoes (`EditorTabsIntegracoes.tsx`)
- Inserir bloco antes do "Pipeline info" (antes da linha 42)
- Objetivo: Conectar formulario a sistemas externos e pipeline
- Exemplos: "Enviar dados para Slack", "Criar oportunidade no pipeline", "Sincronizar leads"

### Tab Analytics (`EditorTabsAnalytics.tsx`)
- Inserir bloco no inicio do return (antes dos cards de metricas, linha 34)
- Objetivo: Acompanhar desempenho e identificar melhorias
- Exemplos: "Ver abandonos por campo", "Comparar taxa de conversao", "Identificar erros de preenchimento"

### Tab A/B Testing (`EditorTabsAB.tsx`)
- Inserir bloco antes do `TesteABForm` (antes da linha 61)
- Objetivo: Testar variacoes para descobrir qual converte mais
- Exemplos: "Testar botao verde vs azul", "Comparar formulario curto vs longo", "Testar titulo diferente"

---

## Arquivos a editar

1. `src/modules/formularios/pages/FormularioEditorPage.tsx` - Correcao do handleDropNewCampo
2. `src/modules/formularios/components/editor/EditorTabsLogica.tsx` - Bloco informativo
3. `src/modules/formularios/components/editor/EditorTabsIntegracoes.tsx` - Bloco informativo
4. `src/modules/formularios/components/editor/EditorTabsAnalytics.tsx` - Bloco informativo
5. `src/modules/formularios/components/editor/EditorTabsAB.tsx` - Bloco informativo

