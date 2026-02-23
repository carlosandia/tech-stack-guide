

## Ajuste no campo "Codigo do Parceiro" no PreCadastroModal

### Problema
O campo "Codigo do Parceiro" quando certificado (readOnly) esta com fundo muito claro, quase invisivel, e posicionado no meio do formulario sem destaque.

### Proposta

**1. Posicionamento: Mover para o TOPO do formulario (primeiro campo)**

Recomendo colocar o campo de parceiro como **primeiro elemento** do formulario, antes do nome. Motivos:
- Quando o usuario vem de um link de parceiro, o codigo certificado e a informacao mais relevante de contexto -- confirma que ele esta no fluxo correto
- Funciona como um "selo de confianca" logo de cara, reforçando que as condicoes exclusivas estao aplicadas
- Campos de dados pessoais (nome, email, telefone) ficam agrupados em sequencia logica abaixo

**2. Estilo visual: Fundo escuro + borda sutil de destaque**

Quando o codigo estiver certificado (readOnly):
- Fundo `bg-muted/80` (cinza mais visivel)
- Borda com tom de primary sutil: `border-primary/30`
- Remover `opacity-70` para nao parecer desabilitado/apagado
- Manter `cursor-not-allowed` e `readOnly`

Quando nao certificado (editavel), manter o estilo padrao atual.

### Detalhes tecnicos

**Arquivo:** `src/modules/public/components/PreCadastroModal.tsx`

- Recortar o bloco do campo "Codigo do Parceiro" (linhas 196-223) e movê-lo para antes do campo "Nome completo" (antes da linha 139)
- Atualizar as classes do Input de `bg-muted cursor-not-allowed opacity-70` para `bg-muted/80 border-primary/30 cursor-not-allowed` quando certificado

