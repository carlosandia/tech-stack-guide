
# Plano: Melhorias em Conexoes, Card VoIP e Modal de Detalhes

## Resumo

4 frentes de trabalho: (1) cards de conexao com info minima + modal de configuracao avancada, (2) validacao end-to-end da API4COM, (3) icone de ligacao no Kanban abrindo modal VoIP, (4) acoes de ligar/WhatsApp no campo telefone do modal de detalhes.

---

## 1. Cards de Conexao - Info Minima + Modal de Configuracao

**Problema atual:** Quando conectado, o card do WhatsApp mostra tudo inline (pipeline config, toggle, etc). Para API4COM conectado, mostra pouca info. O usuario quer um card compacto com info basica e um clique para abrir modal com configuracoes avancadas.

**Solucao:**

### 1.1 ConexaoCard.tsx - Simplificar para info minima
- Card conectado mostra: icone, nome, status badge, descricao, detalhes basicos (telefone, email, etc), ultimo sync
- Remover o `WhatsAppPipelineConfig` inline do card
- Adicionar botao "Configurar" (icone Settings2) ao lado de Sincronizar/Desconectar
- Ao clicar "Configurar", abre modal especifico da plataforma

### 1.2 Criar Api4comConfigModal.tsx - Modal de configuracao avancada
- Usa `ModalBase` do design system
- Conteudo:
  - Status da conexao (conectado/erro)
  - URL da API configurada
  - Data de conexao
  - Toggle "Criar solicitacoes automaticamente" (mesmo padrao do WhatsApp)
  - Selector de pipeline de destino
  - Botao "Testar Conexao" para validar token salvo
  - Botao "Desconectar"

### 1.3 Criar WhatsAppConfigModal.tsx - Modal de configuracao avancada
- Move o conteudo de `WhatsAppPipelineConfig` para dentro de um modal
- Toggle de criar solicitacoes automaticamente + pipeline selector
- Info da sessao (telefone, nome da sessao)

### 1.4 Criar EmailConfigModal.tsx - Modal de configuracao
- Mostra tipo (Gmail OAuth / SMTP Manual), email configurado, status

---

## 2. Validacao da API4COM End-to-End

**Verificacoes:**
- Edge Function `api4com-proxy` ja existe com actions: validate, save, validate-extension, save-extension, get-extension, get-status
- Tabela `conexoes_api4com` ja existe no schema
- Fluxo: Admin clica "Conectar API4COM" -> Modal pede token -> Testa via edge function -> Salva no banco
- No novo modal de config, adicionar botao "Testar Conexao" que chama action `get-status` + `validate` com token salvo

**Ajuste necessario:**
- A edge function `api4com-proxy` no action `validate` recebe o token no body. Para testar uma conexao JA salva, criar nova action `test-saved` que busca o token do banco e valida.

---

## 3. Icone de Ligacao no KanbanCard -> Modal VoIP

**Problema atual:** O icone de telefone no card faz `window.open('tel:...')` - comportamento basico do navegador.

**Solucao:**

### 3.1 Criar LigacaoModal.tsx
- Modal flutuante com:
  - Numero de destino (pre-preenchido do contato)
  - Botao "Ligar" (futuro: integracao WebRTC real)
  - Area para gravacao (futuro: player de audio)
  - Placeholder para "Insights de IA" (futuro)
- Por enquanto, sem integracao WebRTC real - serve como estrutura visual

### 3.2 Atualizar KanbanCard.tsx
- No `handleAcaoRapida`, case `telefone`: abrir `LigacaoModal` em vez de `window.open('tel:...')`

---

## 4. Acoes no Campo Telefone do Modal de Detalhes

**Problema atual:** O campo Telefone em `DetalhesCampos.tsx` usa o componente `FieldRow` generico - clique edita o valor. Nao tem acao para ligar ou abrir WhatsApp.

**Solucao:**

### 4.1 Atualizar FieldRow para telefone
- Quando o campo for do tipo `telefone` e tiver valor preenchido, exibir icones de acao ao lado:
  - Icone de telefone (Phone) -> abre `LigacaoModal`
  - Icone de WhatsApp -> abre WhatsApp (link direto ou modal de conversa)
- O clique no texto continua editando inline normalmente
- Os icones aparecem como botoes pequenos a direita do valor

---

## Detalhes Tecnicos

### Arquivos a criar:
1. `src/modules/configuracoes/components/integracoes/Api4comConfigModal.tsx`
2. `src/modules/configuracoes/components/integracoes/WhatsAppConfigModal.tsx`
3. `src/modules/negocios/components/modals/LigacaoModal.tsx`

### Arquivos a editar:
1. `ConexaoCard.tsx` - Simplificar card, adicionar botao "Configurar", remover WhatsAppPipelineConfig inline
2. `KanbanCard.tsx` - Mudar acao telefone para abrir LigacaoModal
3. `DetalhesCampos.tsx` - Adicionar icones de acao no campo telefone
4. `api4com-proxy/index.ts` - Adicionar action `test-saved` para validar token ja salvo

### Padrao do Design System seguido:
- Modal usa `ModalBase` (z-[400]/[401], shadow-lg, rounded-lg)
- Botoes text-xs font-medium rounded-md
- Cores semanticas (success-muted, destructive, primary)
- Icones Lucide 16px (w-4 h-4) ou 14px (w-3.5 h-3.5)
- Espacamento p-6 para conteudo, gap-3 para grupos
