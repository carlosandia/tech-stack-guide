
## Limpeza: Remover referências residuais a "endereço"

### Diagnóstico

- A entidade `endereco` **não existe** no banco de dados. As únicas entidades são: `pessoa`, `empresa`, `oportunidade`.
- A duplicação de "Pessoa" e "Empresa" já foi corrigida na edição anterior (remoção da lista hardcoded `CAMPOS_PADRAO_SISTEMA`).
- O único resíduo é na função `autoMapField` no final do arquivo `LeadAdsFormMappingModal.tsx`, que ainda mapeia `city` e `state` para `endereco:endereco_cidade` e `endereco:endereco_estado`.

### Alteração

**Arquivo:** `src/modules/configuracoes/components/integracoes/meta/LeadAdsFormMappingModal.tsx`

Na função `autoMapField`, remover as linhas `city` e `state` que apontam para `endereco:...`, pois essa entidade não existe.

Antes:
```typescript
city: 'endereco:endereco_cidade',
state: 'endereco:endereco_estado',
```

Depois: remover essas duas linhas (ou, se futuramente existirem campos de cidade/estado em pessoa ou empresa, apontar para o slug correto — mas hoje não existem, então o correto é remover).

### Sobre a duplicação (Pessoa/Empresa 2x)

A causa raiz já foi corrigida na edição anterior: existiam duas fontes de dados (lista hardcoded + banco). Agora o código usa **exclusivamente** o banco como fonte única. Não há mais risco de duplicação.
