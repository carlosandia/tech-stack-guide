
# Plano: Integracao VoIP com API4COM

## Resumo

Implementar ligacoes telefonicas direto do CRM via API4COM usando WebRTC/SIP. Sem configuracao global do Super Admin -- cada tenant configura suas proprias credenciais.

## Arquitetura de Configuracao

```text
Nivel 1: Admin do Tenant (/conexoes)
  -> Token API4COM da organizacao
  -> Salvo na tabela "integracoes" (plataforma = 'api4com')

Nivel 2: Cada Usuario (config pessoal)
  -> Ramal SIP (extension + senha)
  -> Salvo na tabela "ramais_voip"
```

Nao ha nivel de Super Admin porque cada organizacao contrata e paga diretamente a API4COM.

## Etapas de Implementacao

### Etapa 1 -- Banco de Dados

**Adicionar 'api4com' como plataforma valida** nas integracoes existentes (schema + enum).

**Nova tabela `ramais_voip`:**
- `id` UUID PK
- `organizacao_id` UUID FK
- `usuario_id` UUID FK
- `extension` TEXT (ramal SIP)
- `password_encrypted` TEXT (senha SIP)
- `sip_server` TEXT (servidor SIP)
- `nome_exibicao` TEXT (nome para identificar o ramal)
- `status` ENUM ('ativo', 'inativo')
- `criado_em`, `atualizado_em`
- RLS: usuario so ve/edita o proprio ramal

**Nova tabela `ligacoes`:**
- `id` UUID PK
- `organizacao_id` UUID FK
- `usuario_id` UUID FK (quem ligou)
- `oportunidade_id` UUID FK nullable
- `contato_id` UUID FK nullable
- `numero_destino` TEXT
- `numero_origem` TEXT (ramal)
- `direcao` ENUM ('saida') -- fase 1 apenas saida
- `status` ENUM ('atendida', 'nao_atendida', 'ocupado', 'cancelada', 'em_andamento')
- `duracao_segundos` INTEGER
- `inicio_em` TIMESTAMPTZ
- `fim_em` TIMESTAMPTZ nullable
- `gravacao_url` TEXT nullable
- `notas` TEXT nullable
- `metadata` JSONB
- `criado_em` TIMESTAMPTZ
- RLS: filtro por tenant

### Etapa 2 -- Card de Conexao API4COM em /conexoes

Novo card na pagina de Conexoes do admin do tenant:
- Titulo: "API4COM - Telefonia VoIP"
- Icone: Phone
- Modal de conexao com campos:
  - Token da API4COM (obrigatorio)
  - URL base da API (preenchido com default da API4COM)
- Botao "Testar Conexao" para validar o token
- Salvar na tabela `integracoes` com plataforma='api4com'

### Etapa 3 -- Configuracao de Ramal Individual

Nova secao nas configuracoes pessoais do usuario (ou modal acessivel):
- Extension (ramal SIP)
- Senha SIP
- Servidor SIP (preenchido automaticamente via API4COM)
- Botao "Testar Ramal"
- Salvar na tabela `ramais_voip`

### Etapa 4 -- Edge Function `api4com-proxy`

Proxy seguro para interagir com a API da API4COM:
- Validacao JWT + verificacao de tenant
- Busca o token API4COM da tabela `integracoes`
- Endpoints:
  - `POST /validate` -- validar token do admin
  - `GET /recordings/:id` -- buscar gravacao
  - `POST /validate-extension` -- testar ramal SIP

### Etapa 5 -- Hook `useWebphone` + libwebphone.js

Hook React que encapsula a biblioteca SIP/WebRTC da API4COM (Kazoo Webphone):
- Conexao SIP com credenciais do ramal do usuario
- Originar chamadas (`call(numero)`)
- Controles: mute, hold, hangup
- Eventos: ringing, connected, ended
- Estado: registrado, em chamada, desconectado

### Etapa 6 -- Modal de Ligacao (`LigacaoModal`)

Modal flutuante compacto para chamadas ativas:
- Exibe: nome do contato, numero, cronometro
- Controles: Ligar, Desligar, Mudo, Hold
- Campo de notas pos-ligacao
- Ao finalizar: salva registro na tabela `ligacoes` + audit_log
- Pontos de ativacao: icone de telefone no card Kanban, modal de detalhes, qualquer telefone clicavel

### Etapa 7 -- Aba "Ligacoes" no Modal de Detalhes

Nova aba no modal de detalhes da oportunidade:
- Lista de ligacoes vinculadas (ordenadas por data)
- Cada item: data/hora, duracao, status, quem ligou
- Player de audio para gravacoes (quando disponivel)
- Notas da ligacao
- Ligacoes tambem aparecem na timeline via audit_log

## Detalhes Tecnicos

- **Gravacao**: Usar gravacao nativa da API4COM e buscar URL via proxy. Possibilita futura transcricao com IA (Fase 2).
- **Seguranca**: Token API4COM fica na tabela `integracoes` (campo access_token). Senha SIP criptografada na `ramais_voip`. Proxy via edge function para nunca expor credenciais no frontend.
- **Design System**: Todos os componentes seguem o designsystem.md.
- **Plataforma**: Adicionar 'api4com' ao enum `PlataformaEnum` nos schemas de integracoes.

## Fora do Escopo (Fase 2)

- Transcricao de ligacoes com IA
- Insights comerciais automaticos
- Chamadas de entrada (inbound)
- Dashboard de metricas de ligacoes
