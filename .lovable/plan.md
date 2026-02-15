
# Correcao: Tela Branca ao Digitar Senha com Maiusculas/Numeros

## Causa Raiz

O Chrome **ignora completamente** o atributo `autoComplete="off"` em campos `type="password"`. Isso e documentado pelo proprio Chrome - ele considera que desabilitar autocomplete em campos de senha e prejudicial ao usuario e simplesmente ignora o atributo.

Resultado: o overlay do gerenciador de senhas do Chrome continua aparecendo, intercepta o campo de input, modifica o DOM diretamente (fora do controle do React), e quando o usuario digita caracteres que ativam o overlay (como Shift+P para maiuscula, ou numeros), o Chrome manipula o valor do input causando uma inconsistencia entre o estado React e o DOM real. Isso gera um erro de invariante do React que desmonta a arvore de componentes -> tela branca.

## Solucao

Trocar `type="password"` por `type="text"` e usar a propriedade CSS `-webkit-text-security: disc` para mascarar os caracteres visualmente. Isso faz com que:

1. O Chrome **nao detecte** o campo como campo de senha (pois e `type="text"`)
2. O overlay do gerenciador de senhas **nunca aparece**
3. Os caracteres continuam exibidos como bolinhas (mascarados) gracas ao CSS
4. Quando o usuario clica no icone de "mostrar senha", remove-se o CSS de mascaramento

Adicionalmente, envolver o formulario de senha em um `try-catch` no onChange para garantir que, mesmo que algum erro inesperado ocorra, ele seja tratado graciosamente em vez de crashar.

## Detalhes Tecnicos

### Arquivo: `src/modules/auth/pages/SetPasswordPage.tsx`

**Campos de senha (Nova Senha e Confirmar Senha):**

Antes:
```tsx
<input
  type={showPassword ? 'text' : 'password'}
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  autoComplete="off"
  data-lpignore="true"
  data-form-type="other"
/>
```

Depois:
```tsx
<input
  type="text"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  autoComplete="off"
  autoCorrect="off"
  autoCapitalize="off"
  spellCheck={false}
  data-lpignore="true"
  data-form-type="other"
  data-1p-ignore
  style={!showPassword ? { WebkitTextSecurity: 'disc', textSecurity: 'disc' } : undefined}
/>
```

Mesma alteracao para o campo de confirmar senha (usando `showConfirmPassword`).

### Arquivo: `src/modules/auth/pages/ResetPasswordPage.tsx`

Aplicar a mesma correcao nos campos de senha desta pagina para consistencia.

### O que muda visualmente?

Nada. O campo continua mostrando bolinhas quando a senha esta oculta, e mostra o texto quando o usuario clica no icone de olho. A unica diferenca e que o Chrome nao detecta mais o campo como senha e nao exibe o overlay do gerenciador.

## Resumo das Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `SetPasswordPage.tsx` | Trocar `type="password"` por `type="text"` + CSS `textSecurity: disc` nos 2 inputs |
| `ResetPasswordPage.tsx` | Mesma correcao para consistencia |
