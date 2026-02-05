
# Plano: Corrigir Criacao de Organizacao - Erros de Validacao e Banco

## Problemas Identificados

### 1. Erro 400 - Constraint de Status Incompativel

**Causa Raiz**: A constraint `chk_status` no banco aceita apenas:
- `'ativo'`, `'suspenso'`, `'cancelado'`

Mas o codigo em `admin.api.ts` envia:
- `'trial'` ou `'ativa'` ← **Valores invalidos!**

```typescript
// Linha 315 de admin.api.ts
status: isTrial ? 'trial' : 'ativa',  // ERRADO
```

**Solucao**: Corrigir para enviar `'ativo'` (singular) em vez de `'ativa'` ou `'trial'`.

---

### 2. Validacoes Prematuras na Etapa Admin

**Causa Raiz**: Quando o formulario carrega, React Hook Form valida todos os campos. Como `admin_nome`, `admin_sobrenome` e `admin_email` iniciam vazios, os erros aparecem imediatamente.

**Solucao**: O modal ja usa `mode: 'onBlur'`, que deveria evitar isso. O problema e que o Zod valida campos obrigatorios mesmo sem interacao. Precisamos:
1. Mudar para `mode: 'onChange'` ou manter `onBlur`
2. Ajustar campos com valores default validos ou usar `criteriaMode: 'firstError'`

Analise detalhada: O formulario ja tem `mode: 'onBlur'` (linha 57), entao os erros so deveriam aparecer apos blur. **O problema real** e que quando navegamos para a Etapa 3, pode haver revalidacao automatica. Vou verificar se ha `trigger()` sendo chamado incorretamente.

Na verdade, revisando o codigo: nao ha trigger da etapa 3 ate clicar em "Criar Empresa". O problema pode ser causado pela montagem do componente com valores vazios + algum efeito de re-render.

---

### 3. Constraint de Plano vs Nome Real

**Constraint aceita**: `'trial'`, `'starter'`, `'pro'`, `'enterprise'`
**Planos no banco**: `Trial`, `Starter`, `Pro`, `Enterprise` (com maiuscula)

O codigo converte para lowercase na linha 301:
```typescript
const planoNome = plano.nome.toLowerCase()  // 'Trial' -> 'trial'
```

Isso esta correto, mas `'starter'` precisa ser verificado.

---

## Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `admin.api.ts` | Corrigir status para `'ativo'` |
| `NovaOrganizacaoModal.tsx` | Evitar validacao prematura - usar `reValidateMode: 'onSubmit'` |

---

## Mudancas Detalhadas

### 1. `src/modules/admin/services/admin.api.ts`

**Linha 315**: Alterar de:
```typescript
status: isTrial ? 'trial' : 'ativa',
```

Para:
```typescript
status: 'ativo',  // Constraint aceita: ativo, suspenso, cancelado
```

**Nota**: O status `trial` e `ativa` nao existem na constraint. Todas as organizacoes iniciam como `'ativo'`. O conceito de "trial" deve ser gerenciado pela tabela `assinaturas` ou por outra logica, nao pelo status da organizacao.

---

### 2. `src/modules/admin/components/NovaOrganizacaoModal.tsx`

Ajustar configuracao do formulario para evitar validacao prematura:

**Linha 40-58**: Alterar de:
```typescript
const methods = useForm<CriarOrganizacaoData>({
  resolver: zodResolver(CriarOrganizacaoSchema),
  defaultValues: { ... },
  mode: 'onBlur',
})
```

Para:
```typescript
const methods = useForm<CriarOrganizacaoData>({
  resolver: zodResolver(CriarOrganizacaoSchema),
  defaultValues: { ... },
  mode: 'onBlur',
  reValidateMode: 'onBlur',  // Evita revalidar ao renderizar
  criteriaMode: 'firstError', // Mostra apenas primeiro erro
})
```

**Alternativa mais efetiva**: Se ainda aparecer erros, usar `shouldUnregister: true` para limpar campos ao desmontar steps.

---

### 3. Opcao B: Atualizar Constraint do Banco (Mais Abrangente)

Se for desejavel manter os valores `'trial'` e `'ativa'` no codigo, a alternativa e atualizar a constraint:

```sql
ALTER TABLE organizacoes_saas 
DROP CONSTRAINT chk_status;

ALTER TABLE organizacoes_saas
ADD CONSTRAINT chk_status CHECK (
  status IN ('ativo', 'ativa', 'suspenso', 'suspensa', 'cancelado', 'cancelada', 'trial')
);
```

**Recomendacao**: Prefiro a Opcao 1 (corrigir o codigo) pois mantem a constraint original limpa.

---

## Resumo da Correcao

1. **Status**: Mudar `'ativa'`/`'trial'` → `'ativo'` no insert
2. **Validacao**: Adicionar `reValidateMode: 'onBlur'` no formulario
3. **Testar**: Criar organizacao completa com todos os passos

---

## Sequencia de Implementacao

1. Corrigir status em `admin.api.ts`
2. Ajustar configuracao do form em `NovaOrganizacaoModal.tsx`
3. Testar fluxo completo de criacao

---

## Resultado Esperado

| Antes | Depois |
|-------|--------|
| Erro 400 ao criar | Insert bem-sucedido |
| Validacoes aparecem ao entrar na aba Admin | Validacoes so aparecem apos interacao |
| Status invalido `'ativa'` | Status valido `'ativo'` |
