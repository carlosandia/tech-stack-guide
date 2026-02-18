
# Correção: Tipo de conexão Email exibindo "SMTP Manual" em vez de "Gmail OAuth"

## Problema

O banco de dados salva o tipo da conexão como `"gmail"`, mas o frontend verifica se o valor é `"gmail_oauth"`. Como `"gmail" !== "gmail_oauth"`, a condição falha e o fallback exibe "SMTP Manual".

## Alterações

### 1. `src/modules/configuracoes/components/integracoes/ConexaoCard.tsx`

Linha 215: Alterar a condição para aceitar ambos os valores:

```
// DE:
integracao.tipo_email === 'gmail_oauth' ? 'Gmail OAuth' : 'SMTP Manual'

// PARA:
['gmail_oauth', 'gmail'].includes(integracao.tipo_email || '') ? 'Gmail OAuth' : 'SMTP Manual'
```

### 2. `src/modules/configuracoes/components/integracoes/EmailConfigModal.tsx`

Linha 78: Mesma correção:

```
// DE:
integracao.tipo_email === 'gmail_oauth' ? 'Gmail OAuth' : 'SMTP Manual'

// PARA:
['gmail_oauth', 'gmail'].includes(integracao.tipo_email || '') ? 'Gmail OAuth' : 'SMTP Manual'
```

## Resultado

O card e o modal de Email exibirão corretamente "Gmail OAuth" para conexões feitas via autenticação Google.
