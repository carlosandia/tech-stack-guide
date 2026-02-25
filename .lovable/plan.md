
# Formatacao WhatsApp no Chat Input

## Resumo

Adicionar botoes de formatacao de texto no estilo WhatsApp (Negrito, Italico, Riscado, Monoespaco) na barra de input de mensagens. Os botoes envolvem o texto selecionado com os caracteres de formatacao do WhatsApp. Funcionalidade disponivel apenas para conversas WhatsApp (desabilitada para Instagram).

## Formatacoes WhatsApp suportadas

| Formato | Sintaxe | Botao |
|---------|---------|-------|
| **Negrito** | `*texto*` | **B** |
| *Italico* | `_texto_` | *I* |
| ~~Riscado~~ | `~texto~` | ~~S~~ |
| `Monoespaco` | `` ```texto``` `` | `<>` |

## Alteracoes

### 1. `src/modules/conversas/components/ChatInput.tsx`

**Adicionar prop `canal`** na interface `ChatInputProps`:
- `canal?: 'whatsapp' | 'instagram'`

**Criar barra de formatacao** entre o `SugestaoCorrecao` e o textarea:
- Exibida apenas quando `canal === 'whatsapp'` e tab === 'responder'
- 4 botoes pequenos inline: **B**, *I*, ~~S~~, `<>`
- Cada botao envolve o texto selecionado no textarea com os caracteres correspondentes
- Se nao houver selecao, insere os caracteres e posiciona o cursor entre eles
- Estilo: botoes `text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded px-1.5 py-0.5` alinhados a esquerda
- Barra com `border-b border-border/30 px-2 py-1 flex gap-1`

**Logica de formatacao** (funcao `wrapSelection`):
1. Pega `selectionStart` e `selectionEnd` do textarea
2. Se ha selecao: envolve o trecho com o marcador (ex: `*selecao*`)
3. Se nao ha selecao: insere `**` e posiciona cursor entre eles
4. Atualiza o state (`setTexto`) e reposiciona o cursor

### 2. `src/modules/conversas/components/ChatWindow.tsx`

**Passar prop `canal`** para o `ChatInput`:
- Adicionar `canal={conversa.canal}` na linha ~665

## Detalhes Tecnicos

- Nenhuma dependencia nova
- A barra de formatacao usa apenas HTML/CSS simples com classes Tailwind
- Posicionamento: logo acima do textarea, dentro do container do input
- Os botoes nao sao focaveis via Tab para nao interferir no fluxo de digitacao (`tabIndex={-1}`)
- `mouseDown` com `preventDefault` para manter o foco/selecao no textarea
