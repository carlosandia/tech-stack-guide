
# Plano: Corrigir Mensagens de Erro em Português

## Problema Identificado

O schema combinado `CriarOrganizacaoSchema` no arquivo `organizacao.schema.ts` está usando validações do Zod **sem mensagens customizadas** nas linhas 148-155:

```typescript
admin_nome: z.string().min(2),        // Usa mensagem padrão do Zod em inglês
admin_sobrenome: z.string().min(2),   // Usa mensagem padrão do Zod em inglês  
admin_email: z.string().email(),      // Usa mensagem padrão do Zod em inglês
```

Por isso as mensagens aparecem como:
- "String must contain at least 2 character(s)"
- "Invalid email"

## Solução

Corrigir o schema combinado para usar as mesmas mensagens em português que já existem no `Step3AdminSchema`:

```typescript
admin_nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
admin_sobrenome: z.string().min(2, 'Sobrenome deve ter no mínimo 2 caracteres'),
admin_email: z.string().email('Email inválido'),
```

## Arquivo a Modificar

`src/modules/admin/schemas/organizacao.schema.ts`

## Mudança Específica

Alterar linhas 148-155 de:
```typescript
.merge(
  z.object({
    admin_nome: z.string().min(2),
    admin_sobrenome: z.string().min(2),
    admin_email: z.string().email(),
    admin_telefone: z.string().optional(),
    enviar_convite: z.boolean().default(true),
    senha_inicial: z.string().optional(),
  })
)
```

Para:
```typescript
.merge(
  z.object({
    admin_nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    admin_sobrenome: z.string().min(2, 'Sobrenome deve ter no mínimo 2 caracteres'),
    admin_email: z.string().email('Email inválido'),
    admin_telefone: z.string().optional(),
    enviar_convite: z.boolean().default(true),
    senha_inicial: z.string().optional(),
  })
)
```

## Resultado Esperado

Todas as mensagens de validação aparecerão em português brasileiro, consistentes com o resto da aplicação.
