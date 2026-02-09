
# Correcoes: Pipelines, Salvamento de Estilos, CSS e Pos-Envio

## Problemas Identificados

### 1. Pipelines nao encontradas
O codigo atual busca `user?.user_metadata?.tenant_id` para obter o `organizacao_id`, mas o restante do sistema usa a tabela `usuarios` com `auth_id` para buscar `organizacao_id`. Os pipelines existem (Vendas 2026, Locacao 2026), mas a query falha porque `tenant_id` do metadata esta indefinido.

### 2. Estilos nao salvam (botao Salvar nao visivel / nao persiste)
Quando o usuario altera largura, altura, fonte etc. no painel do botao, as mudancas sao feitas via `onChangeEstilo` que atualiza o state local `botao` no `FormularioEditorPage`. Porem, o botao "Salvar Estilos" esta na toolbar do preview e so aparece no modo "Visualizar Final". As alteracoes de estilo feitas no painel lateral nao tem um botao proprio de salvar - o usuario precisa clicar em "Salvar Estilos" na toolbar superior, o que nao e obvio. Alem disso, na aba "Estilo" do BotaoConfigPanel nao existe nenhum botao de salvar (diferente das abas Config e Pos-Envio que tem).

### 3. CSS Customizado
O CSS customizado e injetado via `<style dangerouslySetInnerHTML>` no preview final. Funciona, mas so se o usuario aplicar classes corretas (ex: `.form-container`). Preciso verificar se as classes estao sendo aplicadas no container.

### 4. Pos-Envio - Redirecionar apenas para Enviar
A aba Pos-Envio mostra opcao de redirecionar URL para todos os casos, mas deveria ser apenas para o botao Enviar. O botao WhatsApp redireciona para o WhatsApp com a mensagem formatada.

---

## Solucao

### Arquivo: `BotaoConfigPanel.tsx`

**Pipeline fix** - Substituir a busca de `tenant_id` do user_metadata por query na tabela `usuarios`:
```
const { data: usr } = await supabase
  .from('usuarios')
  .select('organizacao_id')
  .eq('auth_id', user.id)
  .maybeSingle()
if (!usr?.organizacao_id) return
// usar usr.organizacao_id no lugar de tenantId
```

**Botao Salvar na aba Estilo** - Adicionar um botao "Salvar Estilos" no final da aba Estilo que chama `onSaveEstilos` (nova prop). Isso garante que alteracoes de largura, altura, fonte etc. sejam persistidas sem o usuario precisar procurar o botao na toolbar.

**Nova prop `onSaveEstilos`** - Receber callback do `FormularioEditorPage` para disparar o `handleSaveEstilos`.

**Pos-Envio ajustado** - Adicionar texto explicativo na aba Pos-Envio: "Estas configuracoes se aplicam ao botao Enviar. O botao WhatsApp redireciona automaticamente para o WhatsApp." Manter a opcao de URL de redirecionamento apenas no contexto do botao Enviar.

### Arquivo: `FormularioEditorPage.tsx`

- Passar `onSaveEstilos={handleSaveEstilos}` e `isSavingEstilos={salvarEstilos.isPending}` para o `BotaoConfigPanel`.

### Arquivo: `FormPreview.tsx`

- Garantir que o container do formulario no preview final tenha `className="form-container"` para que o CSS customizado funcione corretamente com seletores como `.form-container { ... }`.

---

## Detalhes Tecnicos

### Mudancas por arquivo:

1. **`src/modules/formularios/components/config/BotaoConfigPanel.tsx`**:
   - Corrigir `loadFunis`: trocar `user_metadata.tenant_id` por query em `usuarios` com `auth_id`
   - Corrigir `loadSmtp`: mesma correcao
   - Adicionar props `onSaveEstilos` e `isSavingEstilos`
   - Adicionar botao "Salvar Estilos" ao final da aba `estilo`
   - Ajustar aba `pos_envio` com nota sobre WhatsApp

2. **`src/modules/formularios/pages/FormularioEditorPage.tsx`**:
   - Passar `onSaveEstilos` e `isSavingEstilos` para `BotaoConfigPanel`

3. **`src/modules/formularios/components/editor/FormPreview.tsx`**:
   - Adicionar `className="form-container"` ao div do formulario no preview final para CSS customizado
