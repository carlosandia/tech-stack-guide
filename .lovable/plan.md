
# Correcao: Mensagem indo para conversa errada (fuzzy match muito agressivo)

## Causa Raiz

A busca fuzzy de contatos na **Tentativa 2** do webhook (`waha-webhook/index.ts`, linhas 1700-1718) usa apenas os **ultimos 8 digitos** do telefone para encontrar contatos. Isso causa falsos positivos com numeros brasileiros:

```text
Numero real destino:  5535984723836   (55 35 9 8472-3836 - com o 9)
Contato encontrado:   553584723836   (55 35   8472-3836 - sem o 9, Keven)
Ultimos 8 digitos:              84723836  (iguais!)
```

O sistema assumiu que eram a mesma pessoa, encontrou a conversa do Keven via `contato_id` (Tentativa 1c, linha 1967), e inseriu a mensagem la. Porem, sao pessoas diferentes.

## Solucao

Tornar a busca fuzzy mais restritiva para evitar falsos positivos:

1. **Aumentar o minimo de digitos para match fuzzy**: de 8 para 11 digitos (para cobrir DDI+DDD+numero completo brasileiro)
2. **Adicionar validacao extra**: quando o fuzzy match encontrar um contato, verificar se a diferenca entre os numeros e apenas o "9" do celular brasileiro (nesse caso pode ser a mesma pessoa) ou se sao numeros realmente diferentes
3. **Prioridade para match exato**: so usar fuzzy quando realmente necessario (resolucao de @lid)

## Detalhes Tecnicos

### Arquivo: `supabase/functions/waha-webhook/index.ts`

**Alteracao 1 - Restringir fuzzy match (linhas 1700-1718)**

Substituir a logica atual de 8 digitos por uma validacao mais inteligente:

- Aumentar para **10 digitos** minimos no match fuzzy
- Adicionar validacao: se o numero encontrado difere do buscado em mais do que o "9" de celular brasileiro, rejeitar o match
- A logica de validacao compara os numeros normalizados: se `found = "553584723836"` e `search = "5535984723836"`, a unica diferenca e o "9" inserido - mas isso muda o numero completamente (fixo vs celular), entao deve ser rejeitado

Logica proposta:
```text
// Fuzzy match: usar 10 digitos ao inves de 8
const lastDigits = phoneNumber.slice(-10);

// Apos encontrar candidato, validar:
// Se ambos tem DDI 55 (Brasil), verificar se a diferenca e APENAS o 9o digito
// Numeros como 553584723836 vs 5535984723836 NAO sao a mesma pessoa
if (candidato.telefone.length !== phoneNumber.length) {
  // Comprimentos diferentes = provavelmente numeros diferentes
  // So aceitar se for resolucao @lid (originalLidChatId != null)
  if (!originalLidChatId) {
    candidato = null; // Rejeitar match
  }
}
```

**Alteracao 2 - Proteger Tentativa 1c (linhas 1967-1992)**

Adicionar condicao extra: so buscar conversa por `contato_id` quando o `chatId` atual ainda contem `@lid` OU quando o contato foi encontrado por match exato (nao fuzzy). Adicionar uma flag `contactFoundByFuzzy` para rastrear isso.

### Dados a corrigir manualmente

A mensagem ja inserida erroneamente (id `94fb8641-852c-4df3-ad38-e1af52f7b777`) na conversa do Keven precisa ser removida ou movida. Isso pode ser feito via SQL apos a correcao do codigo.
