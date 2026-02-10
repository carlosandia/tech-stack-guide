
# Plano: Correcoes de Botao e Notificacoes

## 3 Problemas Identificados e Solucoes

### 1. Botao nao ocupa largura total no preview

**Causa**: O `<button>` dentro de `RenderBotoes` tem `width: 100%` via style, mas o `div` wrapper (`relative group/botao-enviar` e `relative group/botao-whatsapp`) nao tem `w-full`, limitando a largura do botao ao conteudo.

**Solucao**: Adicionar `w-full` no `div` wrapper de ambos os botoes (linhas ~618 e ~663 de `FormPreview.tsx`).

### 2. SMTP nao esta sendo encontrado (mostra "Nenhum e-mail SMTP configurado")

**Causa**: O codigo em `BotaoConfigPanel.tsx` (linha 144) consulta `conexoes_email` filtrando por `.eq('status', 'conectado')`, porem o valor real armazenado no banco e `'ativo'` (confirmado via query direta).

**Solucao**: Alterar o filtro na linha 144 de `BotaoConfigPanel.tsx` para aceitar ambos os status:
```
.in('status', ['conectado', 'ativo'])
```

### 3. Implementar "Notificar por WhatsApp"

**Causa**: Atualmente a aba Configuracao do botao WhatsApp nao tem opcao de "Notificar por WhatsApp" (apenas "Notificar por e-mail"). O usuario quer que, ao ativar essa opcao, o sistema puxe a conexao WAHA existente (tabela `sessoes_whatsapp`).

**Solucao**:
- Adicionar campos `enviar_notifica_whatsapp`, `enviar_whatsapp_destino`, `whatsapp_notifica_whatsapp` e `whatsapp_whatsapp_destino` na interface `ConfigBotoes`
- No `BotaoConfigPanel.tsx`:
  - Carregar sessao WhatsApp conectada da tabela `sessoes_whatsapp` (filtro `status = 'connected'`)
  - Adicionar Switch "Notificar por WhatsApp" em ambas as secoes (Enviar e WhatsApp)
  - Quando ativo, mostrar input do numero de destino e info da conexao WAHA (numero conectado)
  - Exibir aviso se nao houver conexao WhatsApp ativa
- Atualizar `ConfigBotoesEnvioForm.tsx` para incluir os novos campos no tipo e valores padrao

## Arquivos Alterados

| Arquivo | Alteracao |
|---------|-----------|
| `src/modules/formularios/components/editor/FormPreview.tsx` | Adicionar `w-full` nos wrappers dos botoes |
| `src/modules/formularios/components/config/BotaoConfigPanel.tsx` | Corrigir filtro SMTP (`ativo`), adicionar notificacao WhatsApp com busca de sessao WAHA |
| `src/modules/formularios/components/config/ConfigBotoesEnvioForm.tsx` | Adicionar campos de notificacao WhatsApp no tipo `ConfigBotoes` |

## Detalhes Tecnicos

- Tabela `sessoes_whatsapp`: filtrar por `status = 'connected'` e mesma `organizacao_id`
- Exibir numero conectado (`phone_number`) e nome (`phone_name`) como info da conexao
- Mesmo padrao visual do SMTP info (icone + texto "Enviando via: numero")
