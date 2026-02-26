

# Correção: Upload de imagem na assinatura + compressão

## Problema Raiz

A política RLS do bucket `assinaturas` valida:
```
(storage.foldername(name))[1] IN (SELECT organizacao_id::text FROM usuarios WHERE auth_id = auth.uid())
```

O código atual faz upload com path `assinaturas/{fileName}` — o primeiro segmento é `assinaturas`, não o `organizacao_id`. Por isso o RLS bloqueia com "new row violates row-level security policy".

## Solucao

### 1. Corrigir path de upload no EditorToolbar (assinatura de mensagem)

**Arquivo:** `src/modules/configuracoes/components/editor/EditorToolbar.tsx`

- Importar `compressImage` de `@/shared/utils/compressMedia` (já existe no projeto)
- Buscar `organizacao_id` do usuário logado via Supabase Auth
- Alterar o path de upload de `assinaturas/{fileName}` para `{organizacao_id}/assinaturas/{fileName}`
- Comprimir a imagem antes do upload usando `compressImage()`
- Aumentar limite visual para 2MB (mantido), mas comprimir antes de enviar

### 2. Corrigir path de upload no EmailRichEditor (composicao de emails)

**Arquivo:** `src/modules/emails/components/EmailRichEditor.tsx`

- Mesmo problema: path `email-images/{fileName}` nao comeca com `organizacao_id`
- Importar `compressImage` de `@/shared/utils/compressMedia`
- Buscar `organizacao_id` do usuario logado
- Alterar path para `{organizacao_id}/email-images/{fileName}`
- Comprimir imagem antes do upload

## Detalhes Tecnicos

### EditorToolbar - Alteracoes

```typescript
import { compressImage } from '@/shared/utils/compressMedia'

// Dentro de handleImageUpload, antes do upload:
// 1. Buscar organizacao_id
const { data: { user } } = await supabase.auth.getUser()
const orgRes = await supabase
  .from('usuarios')
  .select('organizacao_id')
  .eq('auth_id', user?.id)
  .maybeSingle()
const orgId = orgRes.data?.organizacao_id
if (!orgId) { toast.error('Organização não encontrada'); return }

// 2. Comprimir imagem
const compressed = await compressImage(file, file.name)

// 3. Path correto com organizacao_id como primeiro segmento
const filePath = `${orgId}/assinaturas/${fileName}`

// 4. Upload com arquivo comprimido
await supabase.storage.from('assinaturas').upload(filePath, compressed, { contentType: 'image/jpeg' })
```

### EmailRichEditor - Alteracoes

```typescript
import { compressImage } from '@/shared/utils/compressMedia'

// Mesmo padrao: buscar orgId, comprimir, path com orgId
const path = `${orgId}/email-images/${timestamp}.jpg`
```

## Arquivos alterados

| Arquivo | Alteracao |
|---------|-----------|
| `src/modules/configuracoes/components/editor/EditorToolbar.tsx` | Path com orgId + compressao de imagem |
| `src/modules/emails/components/EmailRichEditor.tsx` | Path com orgId + compressao de imagem |

