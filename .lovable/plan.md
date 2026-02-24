

# Correcao: Modal "Assinar Pro" com header e footer fixos

## Problema

O modal `PreCadastroModal` usa o componente `DialogContent` padrao que aplica `overflow-y-auto` no container inteiro. Isso faz com que header (titulo), corpo do formulario e botao de submit rolem juntos — quando o conteudo excede a altura da tela, o botao "Continuar para o pagamento" some e o usuario precisa rolar ate o final.

## Solucao

Reestruturar o conteudo interno do `DialogContent` em 3 secoes com layout flex-col:

1. **Header** (fixo no topo) — titulo + descricao
2. **Corpo** (unica area com scroll) — campos do formulario
3. **Footer** (fixo embaixo) — checkbox de termos + botao submit

### Arquivo: `src/modules/public/components/PreCadastroModal.tsx`

Mudancas:

- Remover o `overflow-y-auto` padrao do `DialogContent` adicionando classes para transformar em flex-col sem scroll proprio
- Envolver o conteudo em estrutura flex com:
  - Header: `flex-shrink-0`
  - Corpo do form: `flex-1 overflow-y-auto min-h-0` com padding proprio
  - Footer (termos + botao): `flex-shrink-0 border-t border-border`

### Arquivo: `src/components/ui/dialog.tsx`

Nenhuma alteracao necessaria — o `DialogContent` ja aceita `className` customizado, entao basta sobrescrever as classes no componente `PreCadastroModal`.

## Estrutura resultante

```text
DialogContent (flex flex-col, sem overflow proprio)
  +-- DialogHeader (flex-shrink-0)
  |     Titulo + descricao
  +-- div.form-body (flex-1 overflow-y-auto)
  |     Codigo parceiro, nome, email, telefone, empresa, segmento
  +-- div.form-footer (flex-shrink-0 border-t)
        Checkbox termos + botao submit
```

## Detalhes tecnicos

1. Adicionar `className="sm:max-w-[480px] flex flex-col overflow-hidden"` no `DialogContent` — o `overflow-hidden` impede o scroll global do container e o `flex flex-col` permite que os filhos controlem o layout
2. Mover o `DialogHeader` para fora do `form`, mantendo-o como primeiro filho direto do `DialogContent`
3. O `form` recebe `className="flex flex-col flex-1 min-h-0"` 
4. O corpo dos campos fica em `div.flex-1.overflow-y-auto.min-h-0.px-6.py-4.space-y-4`
5. O aceite de termos e o botao de submit ficam num `div.flex-shrink-0.px-6.py-4.border-t.border-border`
