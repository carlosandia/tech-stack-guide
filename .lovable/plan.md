
# Plano: Correção do Drag-and-Drop e Revisão das Tabs Avançadas

## 1. Problema do Drag-and-Drop

### Diagnóstico
O bug de posicionamento incorreto tem **duas causas raiz**:

**Causa A - Reorder com offset errado:** Em `handleReorderCampo` (FormularioEditorPage.tsx), ao fazer `splice(dragIdx, 1)` seguido de `splice(dropIdx, 0, moved)`, os indices mudam apos o primeiro splice. Se `dragIdx < dropIdx`, o `dropIdx` deveria ser decrementado em 1, pois a remoção do item anterior desloca os indices.

**Causa B - Drop zone usa ID do campo errado:** Em `FormPreview.tsx`, o `handleDrop` usa `campos[index]` para identificar o alvo, mas os drop zones estao numerados de 0 a N (onde N = campos.length). O drop zone `index + 1` (apos campo[index]) tenta acessar `campos[index]` como alvo, mas semanticamente deveria inserir APOS esse campo. Para novos campos da paleta, `onDropNewCampo(e, index)` passa o index correto, mas para reorder, a logica de mapeamento index-para-campo esta incorreta.

### Correção
- Reescrever `handleReorderCampo` para considerar o deslocamento de indices apos o splice
- Alterar `handleDrop` no FormPreview para calcular a posicao de inserção correta baseada no indice do drop zone (inserir na posição `index`, não no campo `campos[index]`)
- Mudar a assinatura de `onReorderCampo` para receber `(dragId: string, targetIndex: number)` em vez de `(dragId: string, dropId: string)`, eliminando a ambiguidade

## 2. Revisão das Tabs Avançadas

### Tab Logica Condicional - Status: Funcional
- CRUD completo de regras com condições E/OU
- Formulario usa `<select>` nativo (evita conflitos z-index)
- Tipos de ação: mostrar, ocultar, pular_etapa, redirecionar, definir_valor
- Sem problemas identificados

### Tab Integracoes (Webhooks) - Status: Funcional
- Mostra status da integração com Pipeline (baseado em `funil_id`)
- CRUD de webhooks com suporte a POST/PUT/PATCH, retry e metadados
- Logs de execução por webhook expandivel
- Sem problemas identificados

### Tab Analytics - Status: Funcional (dados dependem de eventos reais)
- Metricas: visualizações, submissões, taxa conversão, inicios, abandonos
- Funil de conversão: Visualização -> Inicio -> Submissão
- Desempenho por campo: interações, erros, tempo medio
- Os dados vem das tabelas `eventos_analytics_formularios` e `formularios` - funcionara corretamente quando houver dados reais

### Tab A/B Testing - Status: Funcional
- Ciclo de vida: rascunho -> em_andamento -> pausado/concluido
- Criação de variantes com distribuição de trafego
- Ao concluir, seleciona variante vencedora pela maior `taxa_conversao`
- Atualiza flag `ab_testing_ativo` no formulario
- Sem problemas identificados

## 3. Detalhes Tecnicos da Correção

### Arquivo: `src/modules/formularios/pages/FormularioEditorPage.tsx`
- Alterar `handleReorderCampo` para receber `(dragId: string, targetIndex: number)`
- Calcular corretamente a posição de inserção considerando o deslocamento do splice
- Logica: remover item do indice original, inserir no `targetIndex` (ajustando se `dragIdx < targetIndex`)

### Arquivo: `src/modules/formularios/components/editor/FormPreview.tsx`
- Alterar `onReorderCampo` na interface Props para `(dragId: string, targetIndex: number) => void`
- No `handleDrop`, passar `index` diretamente como posição de destino em vez de `campos[index].id`
- Remover logica de fallback para "dropped at end" que causa comportamento inesperado
- Nos handlers de drop do `CampoItem`, calcular o index correto baseado na posição do campo

### Arquivo: `src/modules/formularios/components/campos/CampoItem.tsx`
- Atualizar prop `onDrop` para trabalhar com o novo sistema de indices
