
# Plano: Corrigir DOCX como PDF + Upload Multiplo Simultaneo

## Problema 1: DOCX chegando como PDF no WhatsApp

**Causa raiz identificada:** O browser pode retornar `file.type` vazio ou incorreto para arquivos `.docx`. Quando isso acontece, o fallback `'application/octet-stream'` e usado no upload ao Storage, e o WAHA interpreta o arquivo como PDF baseado no conteudo binario.

**Solucao:** Criar um mapeamento de extensao para MIME type correto, garantindo que o mimetype seja sempre o correto independentemente do que o browser reporta. Esse mapeamento sera usado tanto no upload ao Storage quanto no envio ao WAHA.

### Arquivos alterados:
- **`src/modules/conversas/components/ChatWindow.tsx`** - Adicionar funcao `getMimeTypeFromExtension(filename)` que mapeia extensoes comuns (docx, xlsx, pdf, etc.) para o MIME type correto. Usar esse valor no `contentType` do upload E no campo `mimetype` do `enviarMedia`.

```
Mapeamento:
.docx -> application/vnd.openxmlformats-officedocument.wordprocessingml.document
.doc  -> application/msword
.xlsx -> application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
.xls  -> application/vnd.ms-excel
.csv  -> text/csv
.pdf  -> application/pdf
.txt  -> text/plain
.zip  -> application/zip
.rar  -> application/x-rar-compressed
```

Logica: usar `file.type` se nao estiver vazio, senao inferir da extensao.

---

## Problema 2: Upload de multiplos arquivos simultaneos

**Estado atual:** O file input aceita apenas 1 arquivo (`files?.[0]`), e o state de progresso e um unico objeto.

### Alteracoes:

#### `src/modules/conversas/components/AnexosMenu.tsx`
- Adicionar atributo `multiple` nos inputs de arquivo (documento e midia)
- Alterar `handleFileChange` para iterar sobre todos os arquivos de `e.target.files` e chamar `onFileSelected` para cada um

#### `src/modules/conversas/components/ChatInput.tsx`
- Alterar a prop `onFileSelected` para tambem aceitar multiplos arquivos no paste (iterar `clipboardData.files`)

#### `src/modules/conversas/components/ChatWindow.tsx`
- Trocar o state `uploadProgress` de objeto unico para um **Map/array** de uploads simultaneos:
  ```
  uploadProgress: { id: string; filename: string; progress: number }[]
  ```
- Cada chamada de `handleFileSelected` gera um ID unico e adiciona ao array
- O progresso de cada arquivo e atualizado independentemente
- A UI renderiza todos os uploads ativos empilhados acima do input

#### UI de progresso multiplo:
- Cada item de upload mostra: icone do tipo (baseado na extensao), nome truncado, barra de progresso, percentual
- Itens completados (100%) desaparecem apos 600ms com animacao fade-out
- Maximo visual de ~4 itens empilhados com scroll se necessario

---

## Detalhes Tecnicos

### Funcao `getMimeTypeFromExtension`:
```typescript
function getMimeTypeFromExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
    pdf: 'application/pdf',
    csv: 'text/csv',
    txt: 'text/plain',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
  }
  return map[ext || ''] || ''
}
```

### Fluxo do upload corrigido:
1. Arquivo selecionado -> detectar mimetype correto (file.type ou extensao)
2. Upload ao Storage com contentType correto
3. Enviar ao WAHA com mimetype correto
4. WhatsApp identifica o tipo corretamente

### Fluxo multiplo:
1. Usuario seleciona N arquivos
2. Para cada arquivo, `handleFileSelected` e chamado (sem await entre eles - paralelo)
3. Cada upload tem seu proprio item de progresso na UI
4. Todos rodam simultaneamente
