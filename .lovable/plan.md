

# Correção: Clique nas etiquetas não deve abrir sidebar de info do contato

## Problema

No `ChatHeader.tsx`, a área de etiquetas (`LabelsPopover`) está renderizada **dentro** de um `<button onClick={onOpenDrawer}>` que engloba todo o avatar + nome + etiquetas (linhas 197-248). Quando o usuário clica nas etiquetas, o evento de clique "sobe" (bubble) até o botão pai, abrindo o sidebar de info do contato ao mesmo tempo.

## Solução

Separar a estrutura do header em duas partes clicáveis independentes:

1. **Avatar + Nome + Ícone do canal** -- continua abrindo o drawer (onClick={onOpenDrawer})
2. **Linha de etiquetas** -- fica fora do botão, não propaga clique para o drawer

### Alteração no arquivo `src/modules/conversas/components/ChatHeader.tsx`

Reestruturar o bloco do botão (linhas 197-248) para que:
- O `<button onClick={onOpenDrawer}>` contenha apenas o avatar, nome e ícone do canal
- A linha de etiquetas (`<p>` com `LabelsPopover`) fique **fora** do botão, como um elemento irmão

```
Antes (simplificado):
<button onClick={onOpenDrawer}>        <-- abre drawer
  <Avatar />
  <div>
    <Nome + Ícone Canal />
    <Etiquetas / LabelsPopover />       <-- clique sobe pro button
  </div>
</button>

Depois (simplificado):
<div className="flex items-center gap-2">
  <button onClick={onOpenDrawer}>      <-- abre drawer
    <Avatar />
    <div>
      <Nome + Ícone Canal />
    </div>
  </button>
  <Etiquetas / LabelsPopover />         <-- independente, não abre drawer
</div>
```

Nenhum outro arquivo precisa ser alterado. A correção é pontual e não afeta o restante do comportamento do header.

