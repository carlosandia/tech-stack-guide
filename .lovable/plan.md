

## Otimizacao de Midia em Grupos WhatsApp

### Contexto e Pesquisa

Apos pesquisa na documentacao do WAHA e WhatsApp:

- **Disponibilidade de midia no WhatsApp**: Midias nao expiram em 24h como se acreditava. O WhatsApp mantem midias disponiveis por **dias a semanas** para sessoes ativas. O tempo exato varia e nao e documentado oficialmente, mas enquanto a sessao WAHA estiver conectada, a API `GET /api/{session}/chats/{chatId}/messages/{messageId}?downloadMedia=true` consegue baixar a midia sob demanda.

- **WAHA GOWS**: O parametro `WHATSAPP_FILES_LIFETIME=180` (padrao 3 minutos) controla quanto tempo o arquivo fica no disco do WAHA apos download. Mas as configuracoes `WHATSAPP_FILES_MIMETYPES` e `WHATSAPP_DOWNLOAD_MEDIA` sao **globais por sessao** -- nao diferenciam grupo de individual.

- **Conclusao**: A filtragem grupo vs individual precisa ser feita no **nosso webhook handler** (backend), nao no WAHA.

### Estrategia proposta

Para grupos (`@g.us`), ao receber mensagem com midia:
- **Texto**: salvar normalmente (ja funciona)
- **Audio/PTT**: salvar normalmente no storage (conforme sua escolha)
- **Imagem, Video, Documento, Sticker**: **NAO salvar** no banco/storage. Salvar apenas os metadados (tipo, mimetype, filename, tamanho) e o `message_id` para consulta futura via API WAHA

No frontend, ao renderizar midia de grupo:
- Se `media_url` existe: exibir normalmente (audio salvo, ou midia individual)
- Se `media_url` e null e `has_media` e true e conversa e grupo: exibir placeholder com botao "Visualizar" que tenta buscar via API on-demand
- Se a busca falhar (midia expirada): exibir "Midia nao disponivel"

### Alteracoes

**Arquivo 1: `backend/src/services/waha.service.ts`** (webhook handler)

Na funcao que processa mensagens recebidas (~linha 634-663), adicionar logica condicional:

```text
SE chatId contem "@g.us" (grupo)
  E tipo da midia e image, video, document ou sticker (NAO audio/ptt)
ENTAO
  - Salvar mensagem com has_media=true mas media_url=null
  - Manter metadados (mimetype, filename, size, duration)
  - Adicionar campo "media_origem" = "waha_ondemand" nos metadados
SENAO
  - Comportamento atual (salvar tudo)
```

**Arquivo 2: `backend/src/services/waha.service.ts`** (novo metodo)

Adicionar metodo `buscarMidiaOnDemand(sessionName, chatId, messageId)` que:
1. Chama `GET /api/{session}/chats/{chatId}/messages/{messageId}?downloadMedia=true`
2. Se `media.url` retornar, faz proxy da URL do WAHA e retorna ao frontend
3. Se falhar, retorna `{ disponivel: false }`

**Arquivo 3: Nova rota `backend/src/routes/conexoes/whatsapp.ts`**

Adicionar endpoint:
```
GET /api/v1/conexoes/whatsapp/media/:messageId?chatId=xxx
```
Que chama o `buscarMidiaOnDemand` e retorna a midia proxied ou erro.

**Arquivo 4: Edge Function ou proxy existente**

Reaproveitar o `waha-proxy` existente (que ja faz proxy de midias WAHA) para suportar o novo fluxo de busca on-demand.

**Arquivo 5: Frontend - Componente de midia no chat**

Nos componentes de renderizacao de mensagens (`ChatMessages.tsx` ou similar), detectar quando `has_media=true` e `media_url=null`:
- Exibir placeholder visual (icone de imagem/video/documento com texto "Midia de grupo")
- Botao "Visualizar" que dispara a busca on-demand
- Estados: "Carregando...", "Midia nao disponivel" (se expirou)

### Impacto no armazenamento

**Economia estimada**: Em grupos ativos com dezenas de fotos/videos/documentos por dia, essa abordagem elimina o armazenamento dessas midias no Supabase Storage. Apenas audio (que voce escolheu manter) e salvo. Para uma organizacao com 5-10 grupos ativos, isso pode representar economia de **500MB-2GB/dia** de storage.

### Riscos e mitigacoes

| Risco | Mitigacao |
|-------|-----------|
| Midia expira antes do usuario visualizar | Placeholder claro "Midia nao disponivel" com data da mensagem |
| Sessao WAHA desconectada impede busca | Verificar status da sessao antes de tentar, mostrar "Sessao desconectada" |
| Latencia na busca on-demand | Skeleton/loading state no frontend; a busca via WAHA e rapida (~1-3s) |
| Audio grande em grupos sobrecarrega storage | Audio ja tem compressao OGG/Opus a 64kbps no pipeline existente |

### Arquivos modificados

| Arquivo | Alteracao |
|---------|-----------|
| `backend/src/services/waha.service.ts` | Filtro de midia para grupos + metodo buscarMidiaOnDemand |
| `backend/src/routes/conexoes/whatsapp.ts` | Nova rota GET /media/:messageId |
| `supabase/functions/waha-proxy/index.ts` | Suporte a busca on-demand |
| `src/modules/conversas/components/` | Placeholder de midia + botao visualizar on-demand |

