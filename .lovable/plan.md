

# Correção: Redirecionamento pós-OAuth e exibição do card

## Problema

Após autenticação Google/Gmail com sucesso, o `OAuthGoogleCallbackPage.tsx` redireciona para `/app/configuracoes/conexoes`, mas essa rota **não existe**. A rota correta é `/configuracoes/conexoes` (sem prefixo `/app`). O React Router não encontra a rota e cai no fallback, levando o usuário ao `/dashboard`.

Como o usuário nunca chega na página de conexões com o parâmetro `?success=google`, o `refetch` das integrações não é executado, e o card não atualiza para mostrar "conectado".

A conexão no banco está correta (tabela `conexoes_google`, status `conectado`).

## Alteração

### Arquivo: `src/pages/OAuthGoogleCallbackPage.tsx`

Corrigir todas as 5 ocorrências de `/app/configuracoes/conexoes` para `/configuracoes/conexoes`:

- Linha 24: erro OAuth
- Linha 29: params faltando
- Linha 44: erro no exchange
- Linha 48: sucesso
- Linha 50: catch

## Resultado esperado

1. Após autenticação Google, o usuário retorna para `/configuracoes/conexoes?success=google`
2. O toast de sucesso aparece
3. O `refetch` executa e o card do Google mostra como "conectado"

