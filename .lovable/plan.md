
## Adicionar Bandeira do Pais na Coluna de Telefone

### O que muda
Na listagem de contatos, a coluna "Telefone" passara a exibir a bandeira (emoji) do pais antes do numero, permitindo identificacao visual imediata de qual pais e aquele telefone.

Exemplo visual:
- Antes: `(27) 99809-5977`
- Depois: `🇧🇷 (27) 99809-5977`
- Antes: `+5513988506995`
- Depois: `🇧🇷 +5513988506995`
- Telefone internacional: `🇺🇸 (305) 555-1234`

### Abordagem

Criar um componente `CellTelefone` dentro de `ContatosList.tsx` que:

1. Recebe o valor do telefone (string)
2. Detecta o pais pelo DDI usando a mesma lista de paises ja existente no projeto (`PhoneInputField.tsx`)
3. Exibe a bandeira emoji seguida do numero formatado

### Detalhes Tecnicos

**1. Extrair lista de paises para arquivo compartilhado**

Criar `src/shared/utils/countries.ts` com a lista `COUNTRIES` (extraida de `PhoneInputField.tsx`) e uma funcao utilitaria `detectCountryByPhone(phone: string)` que retorna o pais correspondente.

A deteccao funciona assim:
- Remove caracteres nao-numericos do telefone
- Testa os DDIs em ordem decrescente de tamanho (ex: `+351` antes de `+3`) para evitar falsos positivos
- Retorna o pais correspondente ou `null` se nao encontrar
- Padrao: se comecar com `55`, assume Brasil

**2. Novo componente `CellTelefone` em `ContatosList.tsx`**

```
CellTelefone({ value })
  -> detectCountryByPhone(value)
  -> renderiza: [bandeira emoji] [numero formatado]
```

Layout inline com `flex items-center gap-1.5`, bandeira em tamanho de texto normal, numero em `text-sm`.

**3. Atualizar `PhoneInputField.tsx`**

Importar `COUNTRIES` do arquivo compartilhado ao inves de definir localmente, eliminando duplicacao.

**4. Substituir no `ContatosList.tsx`**

No case `'telefone'`, trocar `CellSimpleText` por `CellTelefone`.

### Arquivos modificados
- **Novo**: `src/shared/utils/countries.ts` - lista de paises e funcao de deteccao
- **Editado**: `src/modules/contatos/components/ContatosList.tsx` - novo `CellTelefone` + uso no case telefone
- **Editado**: `src/modules/contatos/components/PhoneInputField.tsx` - importar COUNTRIES do shared
