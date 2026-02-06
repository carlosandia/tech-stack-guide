
# Plano: Reestruturar Campos para Pessoas, Empresas e Oportunidades (3 Tabs)

**STATUS: ✅ IMPLEMENTADO**

## Resumo das alterações realizadas

1. **Migration SQL** - Função `criar_campos_sistema` atualizada para criar 14 campos (6 pessoa + 8 empresa) sem entidade `contato`
2. **Backend** - `EntidadeEnum` em `backend/src/schemas/campos.ts` agora aceita apenas `pessoa`, `empresa`, `oportunidade`
3. **Frontend** - Removida entidade `contato` de:
   - `campos.schema.ts` (entidadeOptions e enum Zod)
   - `CamposPage.tsx` (estado inicial agora é `'pessoa'`)
   - `CampoFormModal.tsx` (label mapping)
   - `configuracoes.api.ts` (tipo `Entidade`)
   - `RegraFormModal.tsx` (referência a `'contato'` corrigida para `'pessoa'`)
