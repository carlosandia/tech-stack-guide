# PRD: Performance e Otimizacao de Midia - Modulo de Conversas

| Campo | Valor |
|-------|-------|
| **Autor** | Equipe CRM Renove |
| **Data de criacao** | 2025-06-01 |
| **Ultima atualizacao** | 2026-02-23 |
| **Versao** | v1.3 |
| **Status** | Em desenvolvimento |
| **Stakeholders** | Produto, Engenharia, Infra |
| **Revisor tecnico** | Arquiteto Senior |

---

## 1. Resumo Executivo

O modulo de conversas do CRM Renove e um canal omnichannel que centraliza comunicacao via WhatsApp (atual) e Instagram (futuro). Com alto volume de mensagens e midia trocada diariamente, uploads sem compressao, sem limites e sem deduplicacao geram custos crescentes de storage e banda, alem de degradar a experiencia do usuario.

Este PRD documenta o pipeline completo de otimizacao de midia — o que ja foi implementado e o roadmap de escalabilidade — garantindo que o sistema suporte milhares de conversas simultaneas sem comprometer performance ou custo.

O impacto esperado e uma reducao de 40-60% no consumo de storage e banda, com melhoria perceptivel no tempo de carregamento das conversas.

---

## 2. Contexto e Motivacao

### 2.1 Problema

Antes das otimizacoes, o modulo apresentava os seguintes gargalos:

| Gargalo | Impacto |
|---------|---------|
| Imagens enviadas em resolucao original (ex: 4000x3000px, 5MB+) | Storage inflado, carregamento lento |
| Videos sem compressao (ex: 50MB por video de 30s em 1080p) | Custo de banda altissimo |
| Audios em MP3/WAV (300KB-2MB por mensagem de voz) | 3-5x maior que formato otimizado |
| PDFs sem otimizacao (fontes embutidas, imagens internas full-res) | Storage desnecessario |
| Sem limite de tamanho | Risco de uploads de 100MB+ travarem o sistema |
| Sem deduplicacao | Mesmo arquivo enviado N vezes = N copias no storage |
| Midia de conversas antigas acumulando indefinidamente | Custo de storage crescente sem controle |

### 2.2 Oportunidade de Mercado (Benchmark)

Grandes SaaS omnichannel adotam praticas maduras:

| Plataforma | Praticas |
|------------|----------|
| **Zendesk** | CDN global, lifecycle policy (90 dias em planos basicos), thumbnails server-side, rate limiting por conta |
| **Intercom** | Compressao automatica de imagens, lazy loading, cursor-based pagination, archival de conversas antigas |
| **Freshdesk** | Limite de 20MB por anexo, compressao de imagens, CDN com cache agressivo |
| **WhatsApp Business API** | Limites nativos (16MB imagem, 64MB video), compressao automatica, media proxy. Midia expira do servidor WhatsApp em 30 dias (arquivo ja esta no dispositivo do usuario) |

### 2.3 Alinhamento Estrategico

- **Reducao de custos**: Storage e banda representam custo variavel direto por tenant
- **Escalabilidade**: Preparar para Instagram (volume 2-3x maior que WhatsApp)
- **Experiencia**: Conversas carregam rapido mesmo com historico extenso
- **Multi-tenant**: Isolamento de custos e limites por organizacao

---

## 3. Usuarios e Personas

### 3.1 Persona Primaria

**Nome:** Vendedor / Atendente
**Role:** Member do CRM
**Contexto:** Envia e recebe dezenas de midias por dia via WhatsApp
**Dores:**
- Upload lento de arquivos grandes
- Chat travando ao carregar historico com muitas imagens
**Objetivos:**
- Enviar midias rapidamente sem se preocupar com formato/tamanho
- Navegar historico de conversas sem lag

### 3.2 Persona Secundaria

**Nome:** Admin / Gestor
**Role:** Admin do tenant
**Contexto:** Gerencia custos e performance do time
**Dores:**
- Custo de storage crescendo sem controle
- Sem visibilidade sobre consumo por usuario/conversa

### 3.3 Anti-personas

- Usuarios que precisam enviar arquivos em qualidade original sem perda (ex: fotografos profissionais) — o CRM nao e ferramenta de transferencia de arquivos

---

## 4. Requisitos Funcionais

### 4.1 Implementados (Fases 1 e 2)

| ID | Requisito | Prioridade | Status | Detalhes |
|----|-----------|------------|--------|----------|
| RF-001 | Limite de tamanho por tipo de arquivo | Must | ✅ Implementado | Imagem: 10MB, Video: 30MB, Audio: 10MB, Documento: 15MB |
| RF-002 | Compressao de imagem client-side | Must | ✅ Implementado | Canvas API, max 1920px, JPEG 0.8. Skip se < 500KB e ja em <= 1920px |
| RF-003 | Compressao de video client-side | Must | ✅ Implementado | 720p, WebM VP9>VP8, 1Mbps via MediaRecorder. Skip se < 2MB **E** <= 720p. Limite: videos > 2min enviados sem compressao (evitar travar UI). Safari: sem suporte a WebM — fallback para arquivo original |
| RF-004 | Compressao de audio client-side | Must | ✅ Implementado | OGG/Opus 64kbps via AudioContext+MediaRecorder. Skip se < 200KB ou ja OGG/Opus |
| RF-005 | Compressao de PDF server-side | Should | ✅ Implementado | Edge Function `compress-pdf`, pdf-lib, fire-and-forget. **Limitacao:** pdf-lib faz otimizacao estrutural (metadados, object streams) — PDFs de scan/imagens escaneadas terao economia < 3% e nao serao substituidos |
| RF-006 | Deduplicacao por hash SHA-256 | Should | ✅ Implementado | Verifica duplicata antes do upload, reutiliza URL. **Escopo:** deduplicacao por conversa (path inclui `conversa_id`) — o mesmo arquivo em duas conversas diferentes gera duas copias. Deduplicacao global e evolucao futura |

### 4.2 Backlog (Fases 3 e 4)

| ID | Requisito | Prioridade | Status | Detalhes |
|----|-----------|------------|--------|----------|
| RF-007 | CDN/Cache para midia | Must | ✅ Implementado | bucket `chat-media` publico (UUID-path security) + `cacheControl: '31536000'` (hash) / `86400` (timestamp). CDN Cloudflare ativo no Supabase Pro. Fallback `createSignedUrl()` removido |
| RF-008 | Lifecycle policy de midia por plano | Should | 🔲 Backlog | TTL configuravel por plano no painel Super Admin (campo `ttl_midia_dias`). Padroes: Trial=30d, Basico=60d, Pro=90d, Enterprise=365d. Apenas arquivos no bucket `chat-media`. Texto de mensagens retido indefinidamente. Notificacao ao usuario 7 dias antes da expiracao |
| RF-009 | Thumbnails server-side | Should | 🔲 Backlog | Gerar versao 300px no upload, servir thumbnail na lista |
| RF-010 | Paginacao cursor-based em mensagens | Must | 🔲 Backlog | Substituir offset por cursor composto `(criado_em, id)` — ver secao 8.4 |
| RF-011 | Rate limiting de uploads por organizacao | Should | 🔲 Backlog | Max 30 uploads/min por tenant, 10 simultaneos |
| RF-012 | Archival de historico antigo | Could | 🔲 Backlog | Mover mensagens > 18 meses para tabela fria |
| RF-013 | WebCodecs progressive enhancement para video | Should | 🔲 Backlog | WebCodecs VideoEncoder (VP9) no Chrome 94+ + fallback MediaRecorder nos demais. Melhoria esperada: 20-40% mais compressao vs MediaRecorder no Chrome. Browser support: Chrome 94+ OK, Firefox 130+ parcial (VP9 OK, H264 bugs), Safari sem VideoEncoder |

---

## 5. Requisitos Nao-Funcionais

### 5.1 Performance

- Compressao de imagem: < 500ms para arquivos ate 10MB
- Compressao de video: proporcional a duracao (1x tempo real), apenas videos <= 2min
- Compressao de audio: proporcional a duracao (1x tempo real)
- Carregamento de historico (50 mensagens): < 300ms no P95
- Upload de midia comprimida: < 2s para arquivos ate 5MB

### 5.2 Seguranca

- Todos os arquivos isolados por `organizacao_id` no storage
- RLS no bucket `chat-media` garantindo isolamento multi-tenant
- Hash SHA-256 calculado client-side (Web Crypto API)
- Sem execucao de scripts em arquivos uploadados

### 5.3 Compatibilidade de Browser

| API / Funcao | Chrome | Firefox | Safari | Observacao |
|--------------|--------|---------|--------|-----------|
| Canvas API (compressImage) | ✅ 4+ | ✅ 3.6+ | ✅ 4+ | Suporte universal |
| MediaRecorder audio (OGG/Opus) | ✅ 47+ | ✅ 25+ | ✅ 14.1+ | Suporte amplo |
| MediaRecorder video/webm VP9 | ✅ | ✅ | ❌ | Safari nao suporta WebM |
| MediaRecorder video/webm VP8 | ✅ | ✅ | ❌ | Idem |
| WebCodecs VideoEncoder | ✅ 94+ | ⚠️ 130+ | ❌ | Safari sem VideoEncoder (maio/2025) |
| Canvas captureStream iOS Safari | ⚠️ Buggy | - | ⚠️ | WebKit Bug 181663 |
| Web Crypto API (SHA-256) | ✅ | ✅ | ✅ | Suporte universal |

**Conclusao pratica para video:** Safari e iOS nunca comprimem video (fallback para arquivo original). Compressao de audio funciona normalmente em todos os browsers. WebCodecs e progressive enhancement — apenas Chrome 94+ se beneficia.

**Fallback obrigatorio:** toda funcao de compressao retorna o arquivo original em caso de erro ou API nao suportada. O usuario nunca fica bloqueado.

---

## 6. Escopo

### 6.1 No escopo

- Pipeline completo de compressao client-side (imagem, video, audio)
- Compressao server-side de PDF via Edge Function
- Deduplicacao por SHA-256 antes do upload (escopo: por conversa)
- Validacao de limites de tamanho por tipo
- TTL de midia configuravel por plano (campo `ttl_midia_dias`)
- Documentacao de boas praticas para fases futuras

### 6.2 Fora do escopo

- Transcodificacao server-side de video (custo computacional alto, requer worker dedicado)
- Compressao de arquivos ZIP/RAR
- Preview de documentos Office (Word, Excel) no chat
- Streaming de video/audio em tempo real
- Deduplicacao global entre conversas

### 6.3 Escopo futuro

- CDN com cache para midia (RF-007)
- Lifecycle policy automatizada via pg_cron (RF-008)
- Thumbnails server-side (RF-009)
- Cursor-based pagination (RF-010)
- WebCodecs progressive enhancement (RF-013)

---

## 7. Detalhes Tecnicos

### 7.1 Arquivos Criados

| Arquivo | Descricao |
|---------|-----------|
| `src/shared/utils/compressVideo.ts` | Compressao de video via WebCodecs (Chrome 94+) com fallback Canvas+MediaRecorder VP9>VP8 (720p, 1Mbps). Limite: videos > 2min enviados sem compressao |
| `src/shared/utils/compressAudio.ts` | Conversao de MP3/WAV/M4A para OGG/Opus 64kbps via AudioContext+MediaRecorder |
| `src/shared/utils/fileHash.ts` | Calculo de SHA-256 via Web Crypto API para deduplicacao por conversa |

### 7.2 Arquivos Modificados

| Arquivo | Modificacao |
|---------|-------------|
| `src/shared/utils/compressMedia.ts` | Adicionada funcao `validateFileSize` com limites por tipo |
| `src/modules/conversas/components/ChatWindow.tsx` | Integrado: validacao → compressao → deduplicacao → upload → compress-pdf async |
| `supabase/functions/compress-pdf/index.ts` | Parametro `bucket` dinamico. Substituicao via `upsert: true` (elimina risco de data loss do remove+upload anterior) |

### 7.3 Fluxo de Upload de Midia

```
Arquivo selecionado pelo usuario
        │
        ▼
  Validar tamanho maximo ──► [Excedeu] ──► Toast erro, abortar
        │
        ▼
  Tipo = imagem? ──► compressImage (Canvas, 1920px, JPEG 0.8)
  Tipo = video?  ──► compressVideo:
                       1. WebCodecs VP9 (Chrome 94+)
                       2. Fallback: Canvas+MediaRecorder VP9>VP8
                       3. Fallback: arquivo original (Safari, erro, > 2min)
  Tipo = audio?  ──► compressAudio (OGG/Opus 64kbps, se MP3/WAV/M4A)
  Tipo = outro?  ──► manter original
        │
        ▼
  Calcular SHA-256 (Web Crypto API)
        │
        ▼
  Verificar duplicata no storage (escopo: mesma conversa) ──► [Duplicado] ──► Reutilizar URL
        │
        ▼
  Upload ao Storage (bucket: chat-media)
        │
        ▼
  Tipo = PDF? ──► Disparar compress-pdf (fire-and-forget, upsert:true)
        │
        ▼
  Adicionar a fila de envio (MediaQueue)
```

### 7.4 Parametros dos Compressores

| Compressor | Parametro | Valor |
|------------|-----------|-------|
| **compressImage** | Dimensao maxima | 1920px |
| | Qualidade JPEG | 0.8 |
| | Skip se < 500KB e <= 1920px | Sim |
| **compressVideo** | Resolucao maxima | 1280x720 (720p) |
| | Bitrate | 1 Mbps |
| | Formato preferido | WebM VP9 (WebCodecs ou MediaRecorder) |
| | Formato fallback | WebM VP8 |
| | Skip se < 2MB **E** <= 720p | Sim (AND, nao OR) |
| | Skip se > 2min | Sim (evitar travar UI) |
| | Dimensoes pares (requisito codec) | Sim |
| | Safari/iOS | Sempre fallback para original |
| **compressAudio** | Bitrate | 64 kbps |
| | Formato | OGG/Opus (fallback: WebM/Opus) |
| | Skip se < 200KB | Sim |
| | Skip se ja OGG/Opus | Sim |
| | Tipos comprimiveis | MP3, WAV, M4A, AAC, FLAC |
| **compress-pdf** | Engine | pdf-lib (server-side) |
| | Trigger | Fire-and-forget apos upload |
| | Substituicao | upsert: true (atomico, sem data loss) |
| | Buckets suportados | `documentos-oportunidades`, `chat-media` |
| | Eficaz para | PDFs de texto e formularios |
| | Limitado para | PDFs de scan/imagens (economia < 3%) |

---

## 8. Boas Praticas para Escalabilidade

### 8.1 CDN / Media Proxy com Cache (RF-007)

**Problema:** Cada visualizacao de midia gera uma request direta ao Supabase Storage, sem cache.

**Solucao:**
- Configurar Cloudflare ou Supabase CDN na frente do storage
- Headers `Cache-Control: public, max-age=31536000, immutable` para midias (conteudo imutavel por hash)
- Media proxy que redimensiona on-the-fly para diferentes viewports

**Impacto:** Reducao de 70-80% nas requests ao storage. Latencia < 50ms para midias cacheadas.

**Referencia:** Zendesk usa CDN com cache de 1 ano para anexos. Intercom usa Cloudflare com transformacao de imagens on-the-fly.

**Nota sobre cache e substituicao de arquivos:** ao substituir um arquivo no mesmo path (ex: apos compress-pdf), o CDN pode demorar ate 60s para invalidar o cache. Para arquivos de chat com hash no path, isso nao e problema (hash muda a cada upload novo). Para PDFs reprocessados in-place, e esperado que o cache possa servir a versao anterior brevemente.

### 8.2 Lifecycle Policy com pg_cron (RF-008)

**Politica de retencao por plano:**

| Plano | `ttl_midia_dias` | Periodo de retencao |
|-------|-----------------|---------------------|
| Trial | 30 | 30 dias |
| Basico | 60 | 60 dias |
| Pro | 90 | 90 dias (padrao de mercado — Zendesk basic) |
| Enterprise | 365 | 1 ano |

**Regra critica:** TTL se aplica **somente a arquivos binarios** no bucket `chat-media`.
O texto das mensagens (tabela `mensagens`) e retido indefinidamente — e o registro do negocio.

**Implementacao pg_cron** (usa `ttl_midia_dias` do plano da organizacao):
```sql
SELECT cron.schedule('cleanup-media-ttl', '0 3 * * *', $$
  UPDATE mensagens_midia mm
  SET lifecycle_status = 'pendente_delecao'
  FROM conversas c
  JOIN organizacoes_saas o ON c.organizacao_id = o.id
  JOIN planos p ON o.plano = p.id
  WHERE mm.conversa_id = c.id
    AND mm.lifecycle_status = 'ativo'
    AND mm.criado_em < NOW() - (p.ttl_midia_dias || ' days')::interval;
$$);
```

**Alternativa se pg_cron indisponivel no plano Supabase:** Edge Function agendada via GitHub Actions cron ou Render Cron.

### 8.3 Thumbnails Server-side (RF-009)

**Problema:** Lista de conversas carrega imagens full-size so para exibir preview 48x48px.

**Solucao:**
- No upload, gerar thumbnail 300px via Edge Function (Sharp ou Canvas)
- Salvar como `{hash}_thumb.jpg` no mesmo bucket
- Na lista de conversas, carregar apenas thumbnail
- No viewer full-screen, carregar imagem original

**Impacto:** Reducao de 90% no payload da lista de conversas.

### 8.4 Paginacao Cursor-based (RF-010)

**Problema:** Paginacao offset-based (`LIMIT 50 OFFSET 500`) degrada com volume (scan sequencial).

**Solucao com cursor composto `(criado_em, id)`:**
```sql
-- CORRETO: cursor composto evita saltar mensagens com mesmo timestamp
SELECT * FROM mensagens
WHERE conversa_id = $1
  AND (criado_em < $cursor_ts
       OR (criado_em = $cursor_ts AND id < $cursor_id))
ORDER BY criado_em DESC, id DESC
LIMIT 50;
```

**Por que cursor composto e obrigatorio:** se duas mensagens tem o mesmo `criado_em` (milissegundo identico — comum em inserts rapidos ou importacao), usar apenas timestamp como cursor pula essas mensagens permanentemente.

**Indice necessario (inclui `id` para cursor composto):**
```sql
-- CORRETO
CREATE INDEX idx_mensagens_conversa_cursor
  ON mensagens(conversa_id, criado_em DESC, id DESC);

-- INCORRETO (nao suporta cursor composto)
-- CREATE INDEX ... ON mensagens(conversa_id, criado_em DESC);
```

**Vantagens:**
- Performance constante independente do volume (usa indice)
- Sem "pular" mensagens quando novas chegam durante paginacao
- Compativel com scroll infinito bidirecional

### 8.5 Rate Limiting de Uploads (RF-011)

**Problema:** Um usuario pode disparar dezenas de uploads simultaneos, sobrecarregando storage e banda.

**Solucao:**
| Limite | Valor |
|--------|-------|
| Uploads simultaneos por usuario | 3 |
| Uploads por minuto por organizacao | 30 |
| Tamanho total por minuto por organizacao | 100 MB |

**Implementacao:** Fila client-side (ja existe `MediaQueue`) + rate limit server-side via Edge Function ou middleware.

### 8.6 Archival de Historico Antigo (RF-012)

**Problema:** Tabela `mensagens` cresce indefinidamente, degradando queries.

**Solucao:**
- Mensagens > 18 meses movidas para `mensagens_arquivo` (mesma estrutura)
- Compressao do conteudo em JSONB (batch de 100 mensagens por registro)
- Na UI, exibir botao "Carregar historico antigo" que consulta tabela fria
- Manter contadores e resumo na tabela principal

**Referencia:** Slack arquiva mensagens em planos gratuitos apos 90 dias. Intercom move para cold storage apos 2 anos.

### 8.7 WebCodecs Progressive Enhancement (RF-013)

**Problema:** MediaRecorder com VP8/VP9 tem qualidade de compressao limitada e nao suporta Safari para video.

**Solucao:** Usar WebCodecs API com feature detection + fallback:
```
1. typeof VideoEncoder !== 'undefined' (Chrome 94+)
   → WebCodecs VP9: melhor compressao, sem overhead de Canvas
2. Else: Canvas + MediaRecorder VP9 > VP8 > WebM
3. Else: arquivo original (Safari, erro)
```

**Biblioteca:** `webm-muxer` (~12KB gzip, zero deps, TypeScript) para empacotar frames VP9 em WebM.

**Melhoria esperada no Chrome:** 20-40% menos bytes vs MediaRecorder para o mesmo conteudo.

---

## 9. Fases de Entrega

| Fase | Escopo | Status | TTV |
|------|--------|--------|-----|
| **Fase 1** | Compressao client-side (imagem, video, audio) + limites de tamanho | ✅ Concluida | - |
| **Fase 2** | Compressao PDF server-side + deduplicacao SHA-256 | ✅ Concluida | - |
| **Fase 3** | CDN/Cache ✅ + WebCodecs ✅ + Thumbnails server-side + Lifecycle policy por plano | 🔶 Em andamento | - |
| **Fase 4** | Cursor-based pagination + Rate limiting + Archival | 🔲 Backlog | 4-6 semanas |

---

## 10. Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|---------------|---------|-----------|
| Compressao de video longo (> 2min) trava o browser | Media | Alto | Implementado: skip automatico para videos > 2min |
| MediaRecorder sem suporte em browsers antigos | Baixa | Medio | Fallback: enviar arquivo original sem compressao |
| Safari nao comprime video (WebM nao suportado) | Certeza | Medio | Aceito: fallback para original. Safari comprime audio normalmente |
| WebCodecs sem suporte em Firefox/Safari | Alta | Baixo | Progressive enhancement: Chrome usa WebCodecs, demais usam MediaRecorder |
| compress-pdf: data loss em falha de upload apos remove | Media | Alto | **Corrigido:** substituir por `upsert: true` (atomico, sem delete previo) |
| Custo de storage crescente com adicao do Instagram | Alta | Alto | Implementar lifecycle policy (RF-008) antes do lancamento do Instagram |
| Deduplicacao por hash falha em arquivos levemente diferentes | Baixa | Baixo | SHA-256 e deterministico; arquivos diferentes sempre geram hashes diferentes |
| pg_cron indisponivel no plano Supabase | Media | Medio | Alternativa: Edge Function agendada via cron externo (GitHub Actions, Render Cron) |
| Thumbnails server-side aumentam tempo de upload | Baixa | Baixo | Gerar thumbnail async (fire-and-forget), nao bloquear o envio |
| pdf-lib ineficaz para PDFs de imagem escaneada | Alta | Baixo | Aceito: economia < 3% → threshold de substituicao nao atingido, arquivo original mantido |
| TTL apaga midia que cliente ainda precisa | Media | Alto | Notificacao 7 dias antes da expiracao + botao "Renovar" (evolucao futura) |

---

## 11. Metricas de Sucesso

### 11.1 KPIs Primarios

| Metrica | Baseline (antes) | Meta (apos Fase 2) | Meta (apos Fase 4) |
|---------|-------------------|---------------------|---------------------|
| Tamanho medio de imagem no storage | ~3 MB | < 500 KB | < 500 KB |
| Tamanho medio de video no storage | ~25 MB | < 5 MB | < 5 MB |
| Tamanho medio de audio no storage | ~800 KB | < 150 KB | < 150 KB |
| Duplicatas no storage | ~15% | < 1% | < 1% |
| Tempo de carregamento (50 msgs) | ~1.2s | < 500ms | < 200ms |
| Custo storage por tenant apos 90 dias | n/a | Controlado por TTL | Controlado por TTL |

### 11.2 KPIs Secundarios

- Custo mensal de storage por tenant
- Taxa de fallback de compressao (original enviado sem compressao)
- Percentual de browsers sem suporte a MediaRecorder video (expectativa: ~15% Safari)
- Percentual de uploads usando WebCodecs vs MediaRecorder

---

## 12. Historico de Versoes

| Versao | Data | Autor | Mudancas |
|--------|------|-------|----------|
| v1.0 | 2025-06-01 | Equipe CRM | Versao inicial — diagnostico e plano |
| v1.1 | 2025-06-15 | Equipe CRM | Fases 1 e 2 implementadas, detalhes tecnicos adicionados |
| v1.2 | 2026-02-23 | Equipe CRM | Boas praticas de escalabilidade detalhadas, benchmarks de mercado, metricas de sucesso |
| v1.3 | 2026-02-23 | Equipe CRM | Correcoes pos-analise: compatibilidade Safari corrigida, bug skip 720p documentado, bug cursor-based pagination corrigido (cursor composto), escopo deduplicacao documentado, risco compress-pdf data loss e mitigacao, limitacao pdf-lib para PDFs de imagem, TTL de midia por plano (RF-008 reescrito), RF-013 WebCodecs adicionado |
