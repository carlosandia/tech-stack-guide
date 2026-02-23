# PRD: Performance e Otimizacao de Midia - Modulo de Conversas

| Campo | Valor |
|-------|-------|
| **Autor** | Equipe CRM Renove |
| **Data de criacao** | 2025-06-01 |
| **Ultima atualizacao** | 2026-02-23 |
| **Versao** | v1.2 |
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

### 2.2 Oportunidade de Mercado (Benchmark)

Grandes SaaS omnichannel adotam praticas maduras:

| Plataforma | Praticas |
|------------|----------|
| **Zendesk** | CDN global, lifecycle policy (90 dias em planos basicos), thumbnails server-side, rate limiting por conta |
| **Intercom** | Compressao automatica de imagens, lazy loading, cursor-based pagination, archival de conversas antigas |
| **Freshdesk** | Limite de 20MB por anexo, compressao de imagens, CDN com cache agressivo |
| **WhatsApp Business API** | Limites nativos (16MB imagem, 64MB video), compressao automatica, media proxy |

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
| RF-002 | Compressao de imagem client-side | Must | ✅ Implementado | Canvas API, max 1920px, JPEG 0.8 |
| RF-003 | Compressao de video client-side | Must | ✅ Implementado | 720p, WebM VP8, 1Mbps via MediaRecorder |
| RF-004 | Compressao de audio client-side | Must | ✅ Implementado | OGG/Opus 64kbps via AudioContext |
| RF-005 | Compressao de PDF server-side | Should | ✅ Implementado | Edge Function `compress-pdf`, pdf-lib, fire-and-forget |
| RF-006 | Deduplicacao por hash SHA-256 | Should | ✅ Implementado | Verifica duplicata antes do upload, reutiliza URL |

### 4.2 Backlog (Fases 3 e 4)

| ID | Requisito | Prioridade | Status | Detalhes |
|----|-----------|------------|--------|----------|
| RF-007 | CDN/Cache para midia | Must | 🔲 Backlog | Media proxy com cache headers, Cloudflare ou Supabase CDN |
| RF-008 | Lifecycle policy para midia antiga | Should | 🔲 Backlog | TTL 12 meses para conversas fechadas, via pg_cron |
| RF-009 | Thumbnails server-side | Should | 🔲 Backlog | Gerar versao 300px no upload, servir thumbnail na lista |
| RF-010 | Paginacao cursor-based em mensagens | Must | 🔲 Backlog | Substituir offset por cursor (criado_em) para escalar |
| RF-011 | Rate limiting de uploads por organizacao | Should | 🔲 Backlog | Max 30 uploads/min por tenant, 10 simultaneos |
| RF-012 | Archival de historico antigo | Could | 🔲 Backlog | Mover mensagens > 18 meses para tabela fria |

---

## 5. Requisitos Nao-Funcionais

### 5.1 Performance

- Compressao de imagem: < 500ms para arquivos ate 10MB
- Compressao de video: proporcional a duracao (1x tempo real)
- Compressao de audio: proporcional a duracao (1x tempo real)
- Carregamento de historico (50 mensagens): < 300ms no P95
- Upload de midia comprimida: < 2s para arquivos ate 5MB

### 5.2 Seguranca

- Todos os arquivos isolados por `organizacao_id` no storage
- RLS no bucket `chat-media` garantindo isolamento multi-tenant
- Hash SHA-256 calculado client-side (Web Crypto API)
- Sem execucao de scripts em arquivos uploadados

### 5.3 Compatibilidade

- Canvas API: todos os browsers modernos (Chrome 4+, Firefox 3.6+, Safari 4+)
- MediaRecorder: Chrome 47+, Firefox 25+, Safari 14.1+
- AudioContext: Chrome 35+, Firefox 25+, Safari 14.1+
- Fallback: se API nao suportada, enviar arquivo original sem compressao

---

## 6. Escopo

### 6.1 No escopo

- Pipeline completo de compressao client-side (imagem, video, audio)
- Compressao server-side de PDF via Edge Function
- Deduplicacao por SHA-256 antes do upload
- Validacao de limites de tamanho por tipo
- Documentacao de boas praticas para fases futuras

### 6.2 Fora do escopo

- Transcodificacao server-side de video (custo computacional alto, requer worker dedicado)
- Compressao de arquivos ZIP/RAR
- Preview de documentos Office (Word, Excel) no chat
- Streaming de video/audio em tempo real

### 6.3 Escopo futuro

- CDN com cache para midia (RF-007)
- Lifecycle policy automatizada (RF-008)
- Thumbnails server-side (RF-009)
- Cursor-based pagination (RF-010)

---

## 7. Detalhes Tecnicos

### 7.1 Arquivos Criados

| Arquivo | Descricao |
|---------|-----------|
| `src/shared/utils/compressVideo.ts` | Compressao de video via Canvas + MediaRecorder (720p, 1Mbps WebM VP8) |
| `src/shared/utils/compressAudio.ts` | Conversao de MP3/WAV/M4A para OGG/Opus 64kbps via AudioContext |
| `src/shared/utils/fileHash.ts` | Calculo de SHA-256 via Web Crypto API para deduplicacao |

### 7.2 Arquivos Modificados

| Arquivo | Modificacao |
|---------|-------------|
| `src/shared/utils/compressMedia.ts` | Adicionada funcao `validateFileSize` com limites por tipo |
| `src/modules/conversas/components/ChatWindow.tsx` | Integrado: validacao → compressao → deduplicacao → upload → compress-pdf async |
| `supabase/functions/compress-pdf/index.ts` | Parametro `bucket` dinamico (default: `documentos-oportunidades`, suporta `chat-media`) |

### 7.3 Fluxo de Upload de Midia

```
Arquivo selecionado pelo usuario
        │
        ▼
  Validar tamanho maximo ──► [Excedeu] ──► Toast erro, abortar
        │
        ▼
  Tipo = imagem? ──► compressImage (Canvas, 1920px, JPEG 0.8)
  Tipo = video?  ──► compressVideo (720p, 1Mbps, WebM VP8)
  Tipo = audio?  ──► compressAudio (OGG/Opus 64kbps, se MP3/WAV)
  Tipo = outro?  ──► manter original
        │
        ▼
  Calcular SHA-256 (Web Crypto API)
        │
        ▼
  Verificar duplicata no storage ──► [Duplicado] ──► Reutilizar URL
        │
        ▼
  Upload ao Storage (bucket: chat-media)
        │
        ▼
  Tipo = PDF? ──► Disparar compress-pdf (fire-and-forget)
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
| | Formato | WebM VP8 |
| | Skip se < 2MB e <= 720p | Sim |
| | Dimensoes pares (requisito codec) | Sim |
| **compressAudio** | Bitrate | 64 kbps |
| | Formato | OGG/Opus (fallback: WebM/Opus) |
| | Skip se < 200KB | Sim |
| | Skip se ja OGG/Opus | Sim |
| | Tipos comprimiveis | MP3, WAV, M4A, AAC, FLAC |
| **compress-pdf** | Engine | pdf-lib (server-side) |
| | Trigger | Fire-and-forget apos upload |
| | Buckets suportados | `documentos-oportunidades`, `chat-media` |

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

### 8.2 Lifecycle Policy com pg_cron (RF-008)

**Problema:** Midia de conversas encerradas ha meses continua ocupando storage premium.

**Solucao:**
```sql
-- Executar diariamente via pg_cron
SELECT cron.schedule('cleanup-media-antiga', '0 3 * * *', $$
  -- Marcar para delecao midias de conversas fechadas ha > 12 meses
  UPDATE mensagens_midia
  SET lifecycle_status = 'pendente_delecao'
  WHERE conversa_id IN (
    SELECT id FROM conversas
    WHERE status = 'fechada'
    AND atualizado_em < NOW() - INTERVAL '12 months'
  )
  AND lifecycle_status = 'ativo';
$$);
```

**Politica sugerida:**
| Periodo | Acao |
|---------|------|
| 0-6 meses | Midia completa disponivel |
| 6-12 meses | Manter apenas thumbnails, midia original sob demanda |
| 12+ meses | Mover para cold storage ou deletar (com notificacao) |

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

**Solucao:**
```sql
-- Cursor-based (escalavel)
SELECT * FROM mensagens
WHERE conversa_id = $1
  AND criado_em < $cursor_timestamp
ORDER BY criado_em DESC
LIMIT 50;
```

**Vantagens:**
- Performance constante independente do volume (usa indice)
- Sem "pular" mensagens quando novas chegam durante paginacao
- Compativel com scroll infinito bidirecional

**Indice necessario:**
```sql
CREATE INDEX idx_mensagens_conversa_cursor
  ON mensagens(conversa_id, criado_em DESC);
```

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

---

## 9. Fases de Entrega

| Fase | Escopo | Status | TTV |
|------|--------|--------|-----|
| **Fase 1** | Compressao client-side (imagem, video, audio) + limites de tamanho | ✅ Concluida | - |
| **Fase 2** | Compressao PDF server-side + deduplicacao SHA-256 | ✅ Concluida | - |
| **Fase 3** | CDN/Cache + Thumbnails server-side + Lifecycle policy | 🔲 Backlog | 3-4 semanas |
| **Fase 4** | Cursor-based pagination + Rate limiting + Archival | 🔲 Backlog | 4-6 semanas |

---

## 10. Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|---------------|---------|-----------|
| Compressao de video longo (> 2min) trava o browser | Media | Alto | Limitar compressao a videos < 2min; acima, aplicar apenas limite de tamanho |
| MediaRecorder sem suporte em browsers antigos | Baixa | Medio | Fallback: enviar arquivo original sem compressao |
| Custo de storage crescente com adicao do Instagram | Alta | Alto | Implementar lifecycle policy (Fase 3) antes do lancamento do Instagram |
| Deduplicacao por hash falha em arquivos levemente diferentes | Baixa | Baixo | SHA-256 e deterministico; arquivos diferentes sempre geram hashes diferentes |
| pg_cron indisponivel no plano Supabase | Media | Medio | Alternativa: Edge Function agendada via cron externo (GitHub Actions, Render Cron) |
| Thumbnails server-side aumentam tempo de upload | Baixa | Baixo | Gerar thumbnail async (fire-and-forget), nao bloquear o envio |

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

### 11.2 KPIs Secundarios

- Custo mensal de storage por tenant
- Taxa de falha de compressao (fallback para original)
- Percentual de browsers sem suporte a MediaRecorder

---

## 12. Historico de Versoes

| Versao | Data | Autor | Mudancas |
|--------|------|-------|----------|
| v1.0 | 2025-06-01 | Equipe CRM | Versao inicial — diagnostico e plano |
| v1.1 | 2025-06-15 | Equipe CRM | Fases 1 e 2 implementadas, detalhes tecnicos adicionados |
| v1.2 | 2026-02-23 | Equipe CRM | Boas praticas de escalabilidade detalhadas, benchmarks de mercado, metricas de sucesso |
