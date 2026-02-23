
# Completar Implementacao do Teste A/B de Formularios

## Situacao Atual

O sistema tem apenas o "esqueleto" do A/B Testing:
- CRUD de testes e variantes funciona (criar, listar, iniciar, pausar, concluir)
- Tabela `variantes_ab_formularios` tem coluna `alteracoes` (JSONB) mas nunca e preenchida
- Nao existe UI para configurar O QUE muda em cada variante
- O formulario publico ignora completamente o teste A/B
- Visualizacoes e submissoes por variante nao sao rastreadas

## O Que Falta Implementar

### 1. Editor de Alteracoes por Variante

Ao criar/editar uma variante, o usuario precisa poder configurar o que muda. As alteracoes mais comuns sao:

- **Cor do botao** (ex: verde vs azul)
- **Texto do botao** (ex: "Enviar" vs "Quero receber")
- **Titulo do formulario**
- **Descricao do formulario**
- **Estilos do container** (cor de fundo, borda)

A UI sera um painel que aparece ao clicar numa variante, com campos para cada propriedade alteravel. O JSON `alteracoes` sera estruturado assim:

```text
{
  "botao": { "cor_fundo": "#22c55e", "texto": "Quero receber" },
  "cabecalho": { "titulo": "Oferta Especial" },
  "container": { "cor_fundo": "#f0f9ff" }
}
```

### 2. Logica de Sorteio no Formulario Publico

Quando `ab_testing_ativo === true` no formulario:
- Buscar variantes do teste ativo
- Sortear uma variante com base na `porcentagem_trafego`
- Aplicar as `alteracoes` da variante sobre os estilos padrao
- Salvar no localStorage qual variante foi exibida (para consistencia)
- Registrar a visualizacao (incrementar `contagem_visualizacoes`)

### 3. Tracking de Conversao

Ao submeter o formulario publico:
- Se havia variante ativa, incrementar `contagem_submissoes` daquela variante
- Recalcular `taxa_conversao`

### 4. Redistribuicao de Trafego

Ao adicionar/remover variantes, recalcular automaticamente a `porcentagem_trafego` de forma equilibrada (ex: 2 variantes = 50/50, 3 variantes = 33/33/34).

## Arquivos a Criar/Alterar

### Criar: `src/modules/formularios/components/ab/VarianteEditor.tsx`
Painel com campos editaveis para configurar as alteracoes de cada variante:
- Color picker para cor do botao
- Input para texto do botao
- Input para titulo alternativo
- Input para descricao alternativa
- Preview visual lado a lado

### Alterar: `src/modules/formularios/components/ab/VariantesList.tsx`
- Adicionar botao "Configurar" em cada variante para abrir o editor
- Exibir indicador visual de quantas alteracoes estao configuradas

### Alterar: `src/modules/formularios/services/formularios.api.ts`
- Criar funcao `atualizarVarianteAB()` para salvar alteracoes
- Criar funcao `registrarVisualizacaoAB()` para tracking
- Criar funcao `registrarConversaoAB()` para tracking
- Criar funcao `buscarVarianteAtiva()` para sorteio no publico

### Alterar: `src/modules/formularios/hooks/useFormularioAB.ts`
- Adicionar hooks para as novas funcoes da API

### Alterar: `src/modules/formularios/pages/FormularioPublicoPage.tsx`
- Verificar se formulario tem A/B ativo
- Sortear variante e aplicar alteracoes visuais
- Registrar visualizacao e conversao

### Alterar: `src/modules/formularios/components/ab/TesteABForm.tsx`
- Melhorar UX com selecao de metricas
- Adicionar explicacao contextual

## Fluxo do Usuario

```text
1. Usuario cria teste A/B (ex: "Teste cor do botao")
2. Adiciona variante A "Botao Verde" -> clica "Configurar" -> muda cor do botao para verde
3. Adiciona variante B "Botao Azul" -> clica "Configurar" -> muda cor do botao para azul  
4. Clica "Iniciar" -> formulario publico comeca a sortear variantes
5. Visitantes veem versoes diferentes -> sistema rastreia views e conversoes
6. Apos minimo de submissoes, usuario clica "Concluir" -> sistema mostra vencedora
```

## Resultado

- Usuario consegue configurar visualmente o que muda em cada variante
- Formulario publico exibe variantes diferentes automaticamente
- Metricas de conversao sao rastreadas por variante
- Ao concluir o teste, a variante vencedora e identificada com dados reais
