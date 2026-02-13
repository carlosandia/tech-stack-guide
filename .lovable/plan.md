
# Correcao do Modal de Ligacao e Integracao Real com API4COM

## Problemas identificados

### 1. Botoes de Microfone e Volume nao funcionam
- O botao de **mute** apenas altera um estado local (`muted`), mas como nao existe uma conexao WebRTC/SIP real, ele nao tem efeito pratico algum -- apenas muda o icone visualmente
- O botao de **volume** nao tem nenhum `onClick` sequer -- e completamente inativo
- Atualmente a "chamada" e apenas uma simulacao de som (AudioContext com tom de 425Hz), sem conexao real com a API4COM

### 2. Falta de integracao real com click-to-call da API4COM
- A funcao `handleLigar()` apenas toca um som simulado e nao dispara nenhuma chamada real
- A API4COM possui endpoints REST para iniciar chamadas (click-to-call), consultar saldo/creditos e verificar status

### 3. Falta de feedback sobre creditos/status da chamada
- O usuario nao sabe se tem creditos suficientes para ligar
- Nao ha feedback real sobre o status da chamada (discando, atendeu, ocupado, etc.)

---

## Plano de implementacao

### Passo 1: Edge Function -- nova action `make-call`
Adicionar ao `supabase/functions/api4com-proxy/index.ts`:
- **Action `make-call`**: Chama o endpoint de click-to-call da API4COM passando o numero de destino e o ramal do usuario
- **Action `get-balance`**: Consulta o saldo/creditos da conta na API4COM (se o endpoint existir na API)
- Ambas as actions buscam o token salvo no banco (`conexoes_api4com`) e fazem o request para `api.api4com.com`

**Nota importante**: Como nao foi possivel identificar o endpoint exato de click-to-call na documentacao (o site usa renderizacao JavaScript), sera implementado com os endpoints mais provaveis (`POST /api/v1/calls` ou `POST /api/v1/calls/make`). Caso retorne 404, os logs mostrarao a resposta correta e ajustaremos.

### Passo 2: Corrigir `LigacaoModal.tsx`
- **Botao Ligar**: Ao clicar, chama a Edge Function com action `make-call` ao inves de apenas tocar som
- **Status da chamada**: Mostrar estados reais: "Iniciando...", "Chamando...", "Conectada", "Encerrada", "Erro" com base na resposta da API
- **Botao Mute**: Desabilitar visualmente com tooltip explicando que mute so funciona com WebPhone (ou remover se nao aplicavel)
- **Botao Volume**: Remover ou substituir por botao de "Alto-falante" com tooltip explicativo
- **Feedback de erro**: Se a API retornar erro (creditos insuficientes, ramal nao configurado, etc.), exibir mensagem clara para o usuario
- **Timer de duracao**: Adicionar cronometro que conta o tempo da chamada

### Passo 3: Verificacao de creditos antes de ligar
- Ao abrir o modal, alem de verificar se a API4COM esta conectada, consultar o saldo disponivel
- Exibir aviso se creditos estiverem baixos ou zerados
- Bloquear o botao de ligar se nao houver creditos

---

## Detalhes tecnicos

### Edge Function -- novas actions

```text
Action: make-call
  - Busca token da conexao API4COM do tenant
  - Busca ramal do usuario (tabela ramais_voip)
  - POST para API4COM com numero destino + ramal origem
  - Retorna: { success, call_id, status, message }

Action: get-balance  
  - Busca token da conexao
  - GET para endpoint de saldo/creditos da API4COM
  - Retorna: { balance, currency, has_credits }
```

### Arquivos modificados
- `supabase/functions/api4com-proxy/index.ts` -- adicionar actions make-call e get-balance
- `src/modules/negocios/components/modals/LigacaoModal.tsx` -- reescrever logica de chamada e controles

### Fluxo do usuario apos implementacao
1. Usuario clica no telefone no card da oportunidade
2. Modal abre e verifica: conexao API4COM ativa? Ramal configurado? Creditos disponiveis?
3. Se tudo ok, botao "Ligar" fica verde e habilitado
4. Ao clicar "Ligar", Edge Function chama API4COM click-to-call
5. Modal mostra status real retornado pela API (discando, atendido, etc.)
6. Botao "Desligar" encerra a chamada
7. Se erro (sem creditos, ramal invalido), mostra mensagem explicativa
