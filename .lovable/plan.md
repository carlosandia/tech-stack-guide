

# Criar documento `docs/performance-conversas.md`

## Objetivo

Criar um PRD seguindo o padrao oficial (`docs/prdpadrao.md`) que documenta todas as otimizacoes de midia do modulo de conversas -- tanto o que ja foi implementado quanto as boas praticas para implementacao futura.

## Estrutura do Documento

O documento seguira o template completo do PRD padrao com as seguintes secoes:

### Cabecalho e Metadados
- Titulo: "Performance e Otimizacao de Midia - Modulo de Conversas"
- Status: "Em desenvolvimento" (parte implementada, parte backlog)

### Resumo Executivo
- Modulo omnichannel (WhatsApp + Instagram futuro) com alto volume de midia
- Problema: uploads sem compressao, sem limites, sem deduplicacao
- Solucao: pipeline de otimizacao client-side + server-side

### Contexto e Motivacao
- Diagnostico atual (o que ja estava implementado vs gargalos)
- Benchmarks de grandes SaaS omnichannel (Zendesk, Intercom, Freshdesk)
- Impacto em custos de storage e banda

### Requisitos Funcionais
Documentar as 6 otimizacoes do plano:

| ID | Requisito | Status |
|----|-----------|--------|
| RF-001 | Limite de tamanho por tipo (10/30/10/15 MB) | Implementado |
| RF-002 | Compressao de imagem (Canvas, 1920px, JPEG 0.8) | Implementado |
| RF-003 | Compressao de video (720p, WebM VP8, 1Mbps) | Implementado |
| RF-004 | Compressao de audio (OGG/Opus 64kbps) | Implementado |
| RF-005 | Compressao de PDF (pdf-lib, server-side async) | Implementado |
| RF-006 | Deduplicacao SHA-256 | Implementado |
| RF-007 | CDN/Cache para midia | Backlog |
| RF-008 | Lifecycle policy (TTL 12 meses) | Backlog |
| RF-009 | Thumbnails server-side (300px) | Backlog |
| RF-010 | Paginacao cursor-based em mensagens | Backlog |
| RF-011 | Rate limiting de uploads | Backlog |
| RF-012 | Archival de historico antigo | Backlog |

### Boas Praticas para Escalabilidade (secao dedicada)
- CDN/Media Proxy com cache
- Lifecycle policy com pg_cron
- Thumbnails server-side
- Cursor-based pagination
- Rate limiting por organizacao
- Archival de mensagens antigas
- Lazy loading de midia (ja implementado)

### Detalhes Tecnicos
- Arquivos criados e modificados (com descricao da logica)
- Fluxo completo do upload de midia (diagrama texto)
- Logica do compressVideo, compressAudio, compress-pdf
- Parametros e thresholds de cada compressor

### Fases de Entrega
| Fase | Status |
|------|--------|
| Fase 1: Compressao client-side (img/video/audio) + limites | Concluida |
| Fase 2: PDF server-side + deduplicacao SHA-256 | Concluida |
| Fase 3: CDN + Thumbnails + Lifecycle | Backlog |
| Fase 4: Cursor pagination + Rate limiting + Archival | Backlog |

### Riscos e Mitigacoes
- Compressao de video longo trava browser
- MediaRecorder sem suporte em browsers antigos
- Custo de storage crescente com Instagram

## Arquivo a criar

- **`docs/performance-conversas.md`** -- PRD completo seguindo o padrao oficial

