
# Plano: Anotacoes com Audio + Agenda de Reunioes Completa

## Resumo

Tres grandes melhorias serao implementadas:

1. **Anotacoes com audio** - O usuario pode gravar audio (via microfone) e envia-lo junto com texto. Audios sao comprimidos antes do upload.
2. **Agenda de Reunioes completa** - Formulario inspirado no Google Calendar com titulo, datas, horarios, local/link, participantes/convidados, geracao de link Google Meet (quando conectado), e descricao.
3. **Pos-reuniao** - Marcar como Realizada, No-Show (com motivo), Cancelar (com motivo) e Reagendar (cria nova reuniao vinculada).

---

## Parte 1: Anotacoes com Audio

### O que muda

O campo de anotacao atual (textarea puro) sera expandido para incluir:

- Botao de gravacao de audio (icone de microfone) ao lado do textarea
- Gravacao via `MediaRecorder API` do navegador
- Indicador visual de gravacao (duracao em tempo real, botao parar)
- Player de audio inline na anotacao apos gravada
- Compressao do audio antes do upload (converter para WebM/Opus com bitrate baixo)
- O usuario pode enviar texto + audio juntos, ou apenas um dos dois

### Banco de dados

A tabela `anotacoes_oportunidades` ja possui as colunas necessarias:
- `tipo` (varchar) - `'texto'`, `'audio'`, `'texto_audio'`
- `audio_url` (text) - URL do audio no Storage
- `audio_duracao_segundos` (integer) - Duracao em segundos

### Storage

Sera criado um novo bucket `anotacoes-audio` via migracao SQL para armazenar os arquivos de audio.

### Arquivos a alterar/criar

| Arquivo | Acao |
|---------|------|
| `supabase/migrations/xxx.sql` | Criar bucket `anotacoes-audio` |
| `src/modules/negocios/components/detalhes/AbaAnotacoes.tsx` | Adicionar gravacao de audio, player inline, suporte a tipos mixtos |
| `src/modules/negocios/services/negocios.api.ts` | Adicionar `criarAnotacaoComAudio()` - upload do audio + insert no banco |
| `src/modules/negocios/hooks/useOportunidadeDetalhes.ts` | Adicionar hook `useCriarAnotacaoAudio` |

### Fluxo de gravacao

1. Usuario clica no icone de microfone
2. Solicita permissao do navegador (`navigator.mediaDevices.getUserMedia`)
3. Inicia gravacao com `MediaRecorder` (codec: `audio/webm;codecs=opus`)
4. Mostra timer e botao "Parar"
5. Ao parar, gera Blob de audio
6. Se Blob > 100KB, ja esta comprimido pelo codec Opus
7. Ao clicar "Salvar", faz upload do audio para `anotacoes-audio/{org_id}/{uuid}.webm`
8. Salva no banco com `tipo = 'audio'` ou `'texto_audio'` (se texto tambem preenchido)

### Exibicao na listagem

- Anotacoes do tipo `audio` ou `texto_audio` mostram um mini player (botao play/pause + barra de progresso + duracao)
- Anotacoes com texto continuam exibindo o conteudo de texto normalmente
- Anotacoes mistas mostram texto + player

---

## Parte 2: Agenda de Reunioes Completa

### O que muda no formulario

O formulario atual de nova reuniao sera expandido para incluir campos inspirados no Google Calendar:

- **Titulo** (obrigatorio)
- **Data inicio + Hora inicio** (obrigatorio)
- **Data fim + Hora fim** (obrigatorio)
- **Tipo** - Presencial / Video / Telefone (select)
- **Participantes/Convidados** - Campo para adicionar emails de participantes
- **Google Meet** - Botao "Adicionar videoconferencia do Google Meet" (se Google Calendar conectado)
- **Local/Link** - Endereco fisico ou link de video personalizado
- **Notificacao** - Lembrete (15min, 30min, 1h antes)
- **Descricao** - Textarea para notas da reuniao

### Integracao Google Calendar

Quando o usuario tiver conexao com Google Calendar ativa (`conexoes_google` com status `active`):
- Aparece botao "Adicionar videoconferencia do Google Meet"
- Ao agendar, o sistema chama a API do backend (`/v1/conexoes/google/eventos`) para criar o evento no Google Calendar
- O link do Meet retornado pela API e salvo no campo `local` da reuniao
- O `google_event_id` e salvo para referencia

Quando nao tiver conexao:
- Botao do Meet nao aparece
- Campo local continua editavel manualmente

### Migracao SQL

Adicionar colunas faltantes na tabela `reunioes_oportunidades`:

```sql
ALTER TABLE reunioes_oportunidades
ADD COLUMN IF NOT EXISTS tipo varchar DEFAULT 'video',
ADD COLUMN IF NOT EXISTS participantes jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS google_meet_link text,
ADD COLUMN IF NOT EXISTS notificacao_minutos integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS motivo_cancelamento text,
ADD COLUMN IF NOT EXISTS realizada_em timestamptz,
ADD COLUMN IF NOT EXISTS cancelada_em timestamptz;
```

### Arquivos a alterar/criar

| Arquivo | Acao |
|---------|------|
| `supabase/migrations/xxx.sql` | Adicionar colunas e bucket de audio |
| `src/modules/negocios/components/detalhes/AbaAgenda.tsx` | Reescrever formulario completo, exibicao de reunioes, acoes pos-reuniao |
| `src/modules/negocios/services/detalhes.api.ts` | Expandir `criarReuniao`, `atualizarReuniao`, `reagendarReuniao`, verificar conexao Google |
| `src/modules/negocios/hooks/useDetalhes.ts` | Adicionar `useConexaoGoogle`, `useReagendarReuniao` |

### Card de Reuniao (apos criada)

Cada reuniao listada mostrara:

- Icone de status (colorido: azul=agendada, verde=realizada, amber=noshow, red=cancelada, roxo=reagendada)
- Titulo
- Data e hora (inicio - fim)
- Tipo (Presencial/Video/Telefone)
- Local ou Link do Meet (clicavel)
- Participantes (avatars/emails)
- Botoes de acao (Realizada / No-Show / Cancelar / Reagendar)

### Acoes Pos-Reuniao

**Marcar como Realizada:**
- Muda status para `realizada`
- Campo opcional de observacoes
- Salva `realizada_em`

**No-Show:**
- Modal com motivos pre-cadastrados (ja existe `motivos_noshow`)
- Campo texto alternativo
- Registra motivo

**Cancelar:**
- Modal pedindo motivo do cancelamento (obrigatorio)
- Salva `motivo_cancelamento` e `cancelada_em`

**Reagendar:**
- Muda status da reuniao atual para `reagendada`
- Abre formulario pre-preenchido com dados da reuniao original
- Nova reuniao criada com referencia a anterior (`reuniao_reagendada_id`)

---

## Secao Tecnica

### 1. Gravacao de Audio (AbaAnotacoes.tsx)

```typescript
// Logica simplificada
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: 'audio/webm;codecs=opus',
  audioBitsPerSecond: 32000, // 32kbps - boa qualidade, arquivo pequeno
})
```

O codec Opus ja comprime nativamente. Nao precisa de compressao adicional.

### 2. Upload de Audio (negocios.api.ts)

Nova funcao `criarAnotacaoComAudio`:
1. Upload do blob para `anotacoes-audio/{org_id}/{uuid}.webm`
2. Gera signed URL
3. Insert no banco com `tipo`, `audio_url`, `audio_duracao_segundos`

### 3. Verificacao Google Calendar (detalhes.api.ts)

Nova funcao `verificarConexaoGoogle`:
```typescript
const { data } = await supabase
  .from('conexoes_google')
  .select('id, status, calendar_id, criar_google_meet')
  .eq('status', 'active')
  .maybeSingle()
```

### 4. Criar Reuniao Expandida (detalhes.api.ts)

O payload de `criarReuniao` sera expandido para incluir `tipo`, `participantes`, `google_meet_link`, `notificacao_minutos`, e flag `sincronizar_google`.

Se `sincronizar_google = true` e Google Calendar conectado:
- Chama backend via `api.post('/v1/conexoes/google/eventos', ...)` para criar evento no Google
- Salva `google_event_id` e `google_meet_link` retornados

### 5. Reagendar Reuniao (detalhes.api.ts)

Nova funcao `reagendarReuniao`:
1. Atualiza status da reuniao original para `reagendada`
2. Cria nova reuniao com `reuniao_reagendada_id` apontando para a original
3. Retorna o ID da nova reuniao

### 6. Cancelar Reuniao (detalhes.api.ts)

Expandir `atualizarStatusReuniao` para aceitar `motivo_cancelamento` nos extras:
```typescript
if (status === 'cancelada') {
  updateData.cancelada_em = new Date().toISOString()
  updateData.motivo_cancelamento = extras.motivo_cancelamento
}
```

### 7. Ordem de implementacao

1. Migracao SQL (novas colunas + bucket audio)
2. Audio nas anotacoes (API + hook + componente)
3. Formulario de reuniao expandido (API + componente)
4. Integracao Google Calendar na reuniao
5. Acoes pos-reuniao (Cancelar com motivo, Reagendar)
