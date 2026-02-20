

# Correção do Bug no Mapeamento de Campos do Meta Lead Ads

## Contexto

Ao receber um lead do Meta, a Edge Function `meta-leadgen-webhook` aplica o mapeamento configurado pelo usuário. O mapeamento salvo no banco possui chaves prefixadas (ex: `pessoa:nome`, `pessoa:email`, `pessoa:telefone`, `custom:uuid`), mas a função que cria o contato e a oportunidade espera chaves simples (`nome`, `email`, `telefone`).

Isso faz com que TODOS os dados do lead sejam perdidos, mesmo que o webhook funcione.

## O que será corrigido

### Arquivo: `supabase/functions/meta-leadgen-webhook/index.ts`

### 1. Normalizar chaves do mapeamento na função `aplicarMapeamento`

Após aplicar o mapeamento configurado, converter as chaves prefixadas para chaves simples:
- `pessoa:nome` -> `nome`
- `pessoa:email` -> `email`
- `pessoa:telefone` -> `telefone`
- `pessoa:cargo` -> `cargo`
- `pessoa:sobrenome` -> `sobrenome`
- `empresa:nome_fantasia` -> `empresa`
- Chaves `custom:*` -> armazenadas separadamente para uso futuro

Isso garante compatibilidade com a função `criarOuAtualizarContato` que espera chaves simples.

### 2. Adicionar logs de diagnóstico

Adicionar logs extras no fluxo para facilitar depuração futura:
- Log dos dados brutos recebidos do mapeamento
- Log dos dados normalizados que serão usados para criar o contato

## Detalhes Técnicos

Na função `aplicarMapeamento`, após o loop de mapeamento configurado (linha ~273), adicionar lógica de normalização:

```typescript
// Normalizar chaves prefixadas (pessoa:nome -> nome, pessoa:email -> email, etc.)
const normalizado: Record<string, string> = {};
for (const [key, value] of Object.entries(resultado)) {
  if (key.startsWith("pessoa:")) {
    normalizado[key.replace("pessoa:", "")] = value;
  } else if (key.startsWith("empresa:")) {
    normalizado[key.replace("empresa:", "")] = value;
  } else if (key.startsWith("oportunidade:")) {
    normalizado[key.replace("oportunidade:", "")] = value;
  } else if (!key.startsWith("custom:")) {
    normalizado[key] = value;
  }
}
// Manter campos custom no resultado para uso futuro
for (const [key, value] of Object.entries(resultado)) {
  if (key.startsWith("custom:")) {
    normalizado[key] = value;
  }
}
return normalizado;
```

## Sobre o Problema do Meta (configuração externa)

O webhook não está sendo chamado porque a página não está associada ao app no Meta. Isso precisa ser resolvido no Meta Developer Portal:
1. Ir em **Configurações > Básico** do seu App
2. Na seção "Página do App", selecionar "Carlos Andia"
3. Salvar

Sem essa associação, o Meta não envia notificações de leads para o webhook, independentemente do código estar correto.

