
# Correcao: Tela Branca ao Digitar Senha na Pagina de Convite

## Diagnostico

Identifiquei **duas causas** para a tela branca ao pressionar Shift+P no campo de senha:

### Causa 1: Conflito entre Chrome Password Manager e React
Quando o Chrome exibe a sugestao de senha forte ("O gerenciador do Google criou uma senha forte para..."), ele intercepta o campo `<input>` com `autoComplete="new-password"`. Ao interagir com o overlay do Chrome (clicar "Entrar com a sua") e depois digitar no campo, o Chrome pode modificar o valor do DOM diretamente, causando uma inconsistencia entre o estado React (`password`) e o valor real do input. Isso pode gerar um erro nao tratado no React, que **desmonta toda a arvore de componentes** resultando em tela branca.

### Causa 2: Ausencia total de Error Boundary
A aplicacao **nao possui nenhum Error Boundary**. Qualquer erro JavaScript nao capturado (seja do conflito do Chrome, de uma re-renderizacao do AuthProvider, ou qualquer outro) faz o React desmontar tudo, mostrando uma pagina completamente branca sem nenhuma mensagem de erro.

### Causa 3: Re-renderizacao do AuthProvider
Quando o `SetPasswordPage` chama `setSession()`, o `AuthProvider` detecta a mudanca via `onAuthStateChange`, marca o usuario como autenticado e dispara re-renders. Se isso coincide com o overlay do Chrome manipulando o DOM do input, pode causar um crash.

## Solucao

### 1. Desabilitar sugestao de senha forte do Chrome
Nos campos de senha da `SetPasswordPage`, trocar `autoComplete="new-password"` por `autoComplete="off"` e adicionar atributos extras que impedem o Chrome de exibir o gerenciador de senhas:

```
autoComplete="off"
data-lpignore="true"        // LastPass
data-form-type="other"      // Chrome
```

### 2. Criar um Error Boundary global
Criar um componente `ErrorBoundary` que envolve o `<App />` no `main.tsx`. Assim, qualquer erro nao tratado mostra uma tela de fallback com opcao de recarregar, em vez de uma tela branca total.

### 3. Adicionar Error Boundary especifico na SetPasswordPage
Envolver o formulario de senha em um Error Boundary local que captura erros especificos dessa pagina e mostra uma mensagem amigavel com botao para tentar novamente.

## Detalhes Tecnicos

### Arquivo: `src/components/ErrorBoundary.tsx` (NOVO)
Criar componente class-based (Error Boundaries requerem classes em React 18):
- Captura erros via `componentDidCatch`
- Exibe tela de fallback com mensagem e botao "Recarregar pagina"
- Log do erro no console para debug

### Arquivo: `src/main.tsx`
Envolver `<App />` com o `<ErrorBoundary>` global.

### Arquivo: `src/modules/auth/pages/SetPasswordPage.tsx`
- Trocar `autoComplete="new-password"` por `autoComplete="off"` nos dois inputs de senha
- Adicionar atributos `data-lpignore="true"` e `data-form-type="other"` para desabilitar gerenciadores de senha de terceiros
- Envolver o formulario com um Error Boundary local para seguranca extra

### Arquivo: `src/modules/auth/pages/ResetPasswordPage.tsx`
- Aplicar a mesma correcao de `autoComplete` nos campos de senha desta pagina tambem, para consistencia

## Resumo das Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/ErrorBoundary.tsx` | Novo componente Error Boundary global |
| `src/main.tsx` | Envolver App com ErrorBoundary |
| `SetPasswordPage.tsx` | Desabilitar Chrome password manager + Error Boundary local |
| `ResetPasswordPage.tsx` | Desabilitar Chrome password manager para consistencia |
