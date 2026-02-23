
# Melhorias no Upload de Documentos

## Visao Geral

Implementar 3 melhorias no sistema de upload de documentos das oportunidades, seguindo boas praticas de grandes SaaS:

1. **Verificacao de cota de storage** - Bloquear uploads quando o plano exceder o limite
2. **Deduplicacao por hash SHA-256** - Evitar arquivos duplicados no storage
3. **Barra de progresso visual** - Feedback de upload para o usuario

---

## 1. Verificacao de Cota de Storage

Antes de cada upload, consultar o uso atual de storage da organizacao e comparar com o limite do plano. Se exceder, bloquear o upload com mensagem clara.

**Logica:**
- Chamar `calcular_storage_organizacao(org_id)` (ja existe no banco)
- Comparar com o limite do plano da organizacao (tabela `assinaturas` ou `planos`)
- Se uso + tamanho do novo arquivo > limite, exibir toast de erro e abortar

---

## 2. Deduplicacao por Hash SHA-256

Antes de subir o arquivo, calcular o hash SHA-256 no client-side usando a Web Crypto API. Verificar se ja existe um documento com o mesmo hash na organizacao.

**Logica:**
- Calcular `SHA-256` do arquivo via `crypto.subtle.digest`
- Consultar `documentos_oportunidades` onde `hash_arquivo = <hash>` e `deletado_em IS NULL`
- Se encontrar duplicata: reutilizar o `storage_path` existente e criar apenas o registro no banco (sem re-upload)
- Se nao encontrar: fazer upload normalmente e salvar o hash

**Migracao SQL necessaria:**
- Adicionar coluna `hash_arquivo TEXT` na tabela `documentos_oportunidades`
- Criar indice para buscas rapidas por hash

---

## 3. Barra de Progresso Visual

Substituir o texto "Enviando..." por uma barra de progresso real usando `XMLHttpRequest` (o SDK do Supabase nao expoe progresso nativamente).

**Alternativa mais simples:** Usar um progresso simulado (indeterminado) com animacao, ja que o Supabase SDK nao suporta `onUploadProgress`. Exibir:
- Nome do arquivo sendo enviado
- Barra animada de progresso indeterminado
- Porcentagem simulada baseada no tamanho do arquivo

---

## Detalhes Tecnicos

### Arquivos a modificar:

1. **`src/shared/utils/fileHash.ts`** (novo) - Funcao utilitaria para calcular SHA-256
2. **`src/modules/negocios/services/detalhes.api.ts`** - Adicionar verificacao de cota e deduplicacao no `uploadDocumento`
3. **`src/modules/negocios/components/detalhes/AbaDocumentos.tsx`** - Adicionar barra de progresso e feedback visual
4. **Migracao SQL** - Adicionar coluna `hash_arquivo` em `documentos_oportunidades`

### Fluxo do upload atualizado:

```text
Arquivo selecionado
       |
  Comprimir (se imagem)
       |
  Calcular SHA-256
       |
  Verificar cota de storage --> [Excedeu] --> Toast erro, abortar
       |
  Verificar hash duplicado --> [Duplicado] --> Reutilizar path, criar registro
       |
  Upload ao Storage (com progresso visual)
       |
  Salvar registro no banco (com hash)
       |
  Toast sucesso
```

### Migracao SQL:

```sql
ALTER TABLE documentos_oportunidades
ADD COLUMN IF NOT EXISTS hash_arquivo TEXT;

CREATE INDEX IF NOT EXISTS idx_docs_hash_org
ON documentos_oportunidades (organizacao_id, hash_arquivo)
WHERE deletado_em IS NULL;
```

### Utilitario fileHash.ts:

Funcao pura que recebe um `File | Blob` e retorna o hash SHA-256 como string hex usando `crypto.subtle.digest`.

### UI da barra de progresso:

- Dentro da zona de drag-and-drop, mostrar uma barra com animacao `animate-pulse` durante o upload
- Exibir o nome do arquivo sendo enviado
- Seguir o design system (cores `primary`, border-radius `rounded-md`, espacamentos padrao)
