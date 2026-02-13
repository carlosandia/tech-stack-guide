

# Plano: Enquete estilo WhatsApp + Loading de audio + Correcoes

## Prioridade 1: UI da Enquete (PollContent) estilo WhatsApp

**Estado atual:** A enquete mostra opcoes como linhas simples com texto e numero de votos, sem estilizacao.

**Redesign baseado na referencia do WhatsApp (imagem enviada):**

Arquivo: `src/modules/conversas/components/ChatMessageBubble.tsx` (funcao `PollContent`, linhas 340-383)

Novo layout:
- Titulo da pergunta em negrito (font-semibold, text-sm)
- Subtitulo "Selecione uma opcao" com icone de check verde (ou "Permitir multiplas respostas" se aplicavel)
- Cada opcao com:
  - Circulo vazio (radio button visual) a esquerda
  - Texto da opcao
  - Contagem de votos a direita
  - Barra de progresso sutil abaixo (proporcional ao total de votos, cor `primary/20`)
- Separador fino entre opcoes
- Rodape "Mostrar votos" como botao com borda superior, alinhado ao centro
- Botao de refresh (RefreshCw) no canto superior direito do card

Cores: fundo `bg-muted/30`, bordas `border-border/50`, barra de progresso `bg-primary/20`, texto principal `text-foreground`, votos `text-muted-foreground`

---

## Prioridade 2: Loading visual ao enviar audio

**Estado atual:** Apos gravar e clicar em enviar, nao ha nenhum feedback visual. O usuario nao sabe se esta enviando.

Arquivo: `src/modules/conversas/components/ChatWindow.tsx` (funcao `handleAudioSend`, linhas 264-295)

Alteracoes:
- Adicionar estado `audioSending: boolean` no ChatWindow
- Antes do upload, setar `audioSending = true`
- Apos conclusao (sucesso ou erro), setar `audioSending = false`
- Passar `audioSending` para o `ChatInput` como prop

Arquivo: `src/modules/conversas/components/ChatInput.tsx`
- Receber prop `audioSending?: boolean`
- Quando `audioSending` for true e nao estiver gravando, mostrar um indicador sutil no lugar do botao de microfone:
  - Spinner pequeno animado (animate-spin) com texto "Enviando..." em cor muted
  - Ou uma barra de progresso minimalista acima do input

---

## Prioridade 3: Audio via webhook (ja funcionando)

**Analise dos logs:** O audio JA esta sendo enviado via WAHA com sucesso (status 201, `sendVoice`). O request retornou `message_id` valido e o WhatsApp recebeu o audio conforme confirmado nos logs do edge function.

Possivel causa da percepcao do usuario: a falta de feedback visual (prioridade 2) fez parecer que nao estava funcionando. Nenhuma alteracao de codigo necessaria aqui.

---

## Detalhes Tecnicos

### PollContent redesenhado (pseudo-estrutura):
```text
+------------------------------------------+
| Pergunta da enquete?            [refresh] |
| (check) Selecione uma opcao              |
|                                          |
| (o) opcao 1                          0   |
| [========                           ]    |
| ---------------------------------------- |
| (o) opcao 2                          0   |
| [========                           ]    |
| ---------------------------------------- |
|          Mostrar votos                   |
+------------------------------------------+
```

### Estado de loading do audio:
```text
Estado normal:     [mic icon]
Enviando audio:    [spinner] Enviando...
```

### Arquivos modificados:
1. `src/modules/conversas/components/ChatMessageBubble.tsx` - Redesign completo do PollContent
2. `src/modules/conversas/components/ChatWindow.tsx` - Estado `audioSending` + passagem para ChatInput
3. `src/modules/conversas/components/ChatInput.tsx` - Receber e exibir estado de envio de audio

