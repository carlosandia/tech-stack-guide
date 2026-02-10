

# Plano de Melhorias no Editor de Formularios e Modal de Notificacoes

## 1. Centralizar Modal de Notificacoes na tela

O modal `NotificacaoDetalhesModal.tsx` ja usa `items-center justify-center` no container flex, mas pela screenshot aparece deslocado ao topo. Vamos garantir que o modal esteja corretamente centralizado verticalmente, removendo qualquer interferencia de posicionamento.

## 2. Renomear tipos de formulario para portugues

Alterar os labels exibidos em toda a interface:

| Valor interno (sem alterar) | Label atual | Novo label |
|---|---|---|
| `inline` | Inline / Inline (Embutido) | Padrao |
| `multi_step` | Multi-step | Por Etapas |

Arquivos afetados:
- `src/modules/formularios/schemas/formulario.schema.ts` - `TipoFormularioOptions`
- `src/modules/formularios/components/FormularioTipoBadge.tsx` - `tipoConfig`

Os valores internos (`inline`, `multi_step`) no banco permanecem inalterados.

## 3. Configuracoes avancadas para campo "Titulo" (layout)

Quando um campo do tipo `titulo` for selecionado no editor, o `CampoConfigPanel` exibira controles adicionais:
- **Alinhamento**: esquerda / centro / direita (salvo no campo `texto_ajuda` ou em um campo JSON existente, reutilizando `valor_padrao` como JSON com as configs extras)
- **Cor do texto**: input de cor hex
- **Tamanho da fonte**: input numerico (px)

Esses valores serao armazenados em um JSON no campo `valor_padrao` do campo titulo (ex: `{"alinhamento":"center","cor":"#333","tamanho":"24px"}`).

Arquivos afetados:
- `CampoConfigPanel.tsx` - adicionar secao condicional para `tipo === 'titulo'`
- `FormPreview.tsx` - aplicar estilos do JSON no render do titulo
- `EstiloPreviewInterativo.tsx` - mesmo ajuste no preview interativo
- `FormularioPublicoPage.tsx` - aplicar na pagina publica
- `CampoItem.tsx` - aplicar no item da paleta/preview

## 4. Auto-save no CampoConfigPanel (sem botao "Salvar")

Remover o botao "Salvar Alteracoes" e implementar salvamento automatico com debounce:
- Cada alteracao de campo (label, placeholder, obrigatorio, largura, mapeamento, opcoes, etc.) dispara um `onUpdate` automatico apos ~800ms de inatividade
- Utilizar `useEffect` com debounce sobre o estado `form` para chamar `onUpdate` automaticamente
- O `handleUpdateCampo` ja faz `atualizarCampo.mutate()` diretamente, entao basta remover o botao e disparar automaticamente
- Remover o toast "Alteracoes salvas" a cada keystroke (feedback visual sutil opcional)

Arquivo afetado:
- `CampoConfigPanel.tsx` - adicionar debounce + remover botao

---

## Detalhes tecnicos

### Debounce no CampoConfigPanel
```text
form state changes -> useEffect com setTimeout(800ms) -> onUpdate(payload)
```
Cada mudanca reinicia o timer. Ao desmontar o componente ou trocar de campo, faz flush imediato do debounce pendente.

### JSON do campo Titulo em `valor_padrao`
```text
{
  "alinhamento": "left" | "center" | "right",
  "cor": "#374151",
  "tamanho": "18"
}
```
Parsing seguro com fallback para valores padrao caso o JSON seja invalido ou vazio.

### Sequencia de implementacao
1. Modal de notificacoes (correcao simples de CSS)
2. Renomear labels dos tipos (2 arquivos, mudanca de strings)
3. Campo titulo com alinhamento/cor/tamanho (4-5 arquivos)
4. Auto-save com debounce no CampoConfigPanel (1 arquivo)

