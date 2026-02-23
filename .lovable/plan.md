

# Otimizacao de Midia no Modulo de Conversas

## Diagnostico Atual

O modulo de conversas (`ChatWindow.tsx`) atualmente:
- **Imagens**: Comprime via Canvas API (max 1920px, JPEG 0.8) -- OK
- **Videos**: Upload RAW sem compressao -- GARGALO
- **Audio**: Upload RAW sem compressao -- GARGALO
- **Documentos**: Upload RAW sem compressao -- GARGALO
- **Sem limite de tamanho** por arquivo -- RISCO
- **Sem deduplicacao** -- DESPERDICIO

## Plano de Otimizacao

### 1. Limite de Tamanho por Tipo (Client-side)

Bloquear uploads que excedam limites razoaveis antes de consumir banda:

| Tipo | Limite |
|------|--------|
| Imagem | 10 MB (antes da compressao) |
| Video | 30 MB |
| Audio | 10 MB |
| Documento | 15 MB |

Se exceder, exibir toast de erro com o limite.

### 2. Compressao de Video (Client-side)

Usar a **Canvas API + MediaRecorder** para re-encodar videos no browser:
- Resolucao max: 720p (1280x720)
- Bitrate: 1 Mbps
- Formato: WebM (VP8)
- Videos menores que 2MB ou ja em 720p sao ignorados

Limitacao: Funciona bem para videos curtos (ate ~2min). Videos longos podem travar o browser. Para esses, aplicar apenas o limite de tamanho.

### 3. Compressao de Audio (Client-side)

O audio ja chega em OGG/Opus (gravado pelo AudioRecorder), que ja e um formato otimizado. Para audios recebidos como MP3/WAV (importados via arquivo):
- Converter para OGG/Opus via AudioContext + MediaRecorder
- Bitrate: 64kbps (suficiente para voz)
- Audios menores que 200KB sao ignorados

### 4. Compressao de PDF (Server-side, async)

Reaproveitar a Edge Function `compress-pdf` ja criada no modulo de negocios:
- Apos upload de PDF ao bucket `chat-media`, disparar `compress-pdf` em fire-and-forget
- A funcao baixa, otimiza com pdf-lib e substitui o arquivo no storage

### 5. Deduplicacao por Hash SHA-256

Antes de subir qualquer arquivo ao storage:
- Calcular hash SHA-256 do arquivo (usando `calculateFileHash` ja existente)
- Verificar se ja existe um arquivo identico no mesmo bucket/org
- Se existir, reutilizar a URL publica sem re-upload

### 6. Boas Praticas para Escalabilidade

- **Lifecycle policy**: Configurar TTL no bucket `chat-media` para conversas fechadas ha mais de 12 meses (futuro, via Supabase Dashboard)
- **Lazy loading de midia**: Ja implementado nas bolhas de chat
- **Thumbnails**: Imagens ja geram thumbnail local para preview na fila

---

## Detalhes Tecnicos

### Arquivos a criar:

1. **`src/shared/utils/compressVideo.ts`** -- Compressao de video via Canvas + MediaRecorder (720p, 1Mbps WebM)
2. **`src/shared/utils/compressAudio.ts`** -- Conversao de MP3/WAV para OGG/Opus 64kbps via AudioContext

### Arquivos a modificar:

3. **`src/shared/utils/compressMedia.ts`** -- Adicionar funcao `validateFileSize` com limites por tipo
4. **`src/modules/conversas/components/ChatWindow.tsx`** -- Integrar validacao de tamanho, compressao de video/audio, deduplicacao e trigger do compress-pdf
5. **`supabase/functions/compress-pdf/index.ts`** -- Ajustar para aceitar bucket `chat-media` alem do `documentos-oportunidades`

### Fluxo atualizado do upload de midia no chat:

```text
Arquivo selecionado pelo usuario
        |
  Validar tamanho maximo --> [Excedeu] --> Toast erro, abortar
        |
  Tipo = imagem? --> compressImage (Canvas, 1920px, JPEG 0.8)
  Tipo = video?  --> compressVideo (720p, 1Mbps, WebM)
  Tipo = audio?  --> compressAudio (OGG/Opus 64kbps, se MP3/WAV)
  Tipo = outro?  --> manter original
        |
  Calcular SHA-256
        |
  Verificar duplicata no storage --> [Duplicado] --> Reutilizar URL, pular upload
        |
  Upload ao Storage (chat-media)
        |
  Tipo = PDF? --> Disparar compress-pdf (fire-and-forget)
        |
  Adicionar a fila de envio (MediaQueue)
```

### compressVideo.ts (logica):

```text
1. Criar elemento <video> com o arquivo
2. Ler dimensoes originais
3. Se <= 720p e tamanho < 2MB, retornar original
4. Criar Canvas com resolucao alvo (720p)
5. Iniciar MediaRecorder com canvas.captureStream()
6. Desenhar frames do video no canvas via requestAnimationFrame
7. Coletar chunks e montar Blob final
8. Se resultado >= original, retornar original
```

### compressAudio.ts (logica):

```text
1. Verificar se tipo e MP3, WAV ou M4A (OGG ja e otimizado)
2. Decodificar via AudioContext.decodeAudioData
3. Criar MediaStreamDestination
4. Iniciar MediaRecorder com mimeType 'audio/ogg; codecs=opus'
5. Reproduzir AudioBuffer no destination em tempo real
6. Coletar chunks e montar Blob final
7. Se resultado >= original, retornar original
```

### Ajuste no compress-pdf Edge Function:

Adicionar parametro `bucket` no body da request, com default `documentos-oportunidades`. No ChatWindow, enviar `bucket: 'chat-media'`.

