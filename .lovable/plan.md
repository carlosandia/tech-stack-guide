

# Plano: Config Geral - Ajustes de Layout + Widget WhatsApp para Website

## Resumo

Tres alteracoes na pagina Config Geral (`/app/configuracoes/config-geral`):

1. **Manter secao Automacao** - A pagina inteira ja e restrita a `role === 'admin'`, entao a secao de automacao so aparece para gestores. Nenhuma alteracao necessaria.

2. **Expandir para 100% do width** - Remover a restricao `max-w-2xl` que limita o conteudo a metade da tela.

3. **Nova secao: Widget WhatsApp para Website** - Configuracao completa para gerar um script/embed de botao flutuante de WhatsApp no site do usuario.

---

## Detalhes da Nova Secao: Widget WhatsApp

### Campos de Configuracao

| Campo | Tipo | Descricao |
|-------|------|-----------|
| Ativar Widget | Toggle | Liga/desliga o widget |
| Numero WhatsApp | Texto | Numero para onde direcionar (com DDI) |
| Posicao do Botao | Select | `Direita inferior` ou `Esquerda inferior` |
| Usar Pre-Formulario | Toggle | Se ativado, exibe formulario antes de redirecionar |
| Campos do Formulario | Multi-select | Campos vindos de `/app/configuracoes/campos` (entidade pessoa) para montar o formulario |
| Nome do Atendente | Texto | Nome exibido no header do widget (ex: "Maria") |
| Foto do Atendente | Upload imagem | Foto exibida no header simulando conversa WhatsApp |
| Mensagem de Boas-vindas | Texto | Mensagem inicial no estilo bolha WhatsApp |
| Cor do Botao | Color picker | Cor de fundo do botao flutuante (padrao: verde WhatsApp #25D366) |

### Fluxo do Widget no Site do Usuario

```text
[Visitante ve botao flutuante]
        |
        v
[Clica no botao] --> (Sem formulario?) --> [Abre wa.me/numero]
        |
        v (Com formulario?)
[Abre mini-chat com header do atendente]
        |
        v
[Preenche campos selecionados pelo admin]
        |
        v
[Clica "Iniciar Conversa"]
        |
        v
[Redireciona para wa.me/numero?text=dados_preenchidos]
```

### Geracao do Script Embed

- Gera um `<script>` tag que o usuario copia e cola no HTML do seu site
- O script cria o botao flutuante + mini-formulario com os estilos configurados
- Visual inspirado no WhatsApp (verde, bolhas, avatar do atendente)
- Script auto-contido (sem dependencias externas), inline CSS + JS vanilla
- Botao com textarea para copiar o codigo gerado

### Preview ao Vivo

- Uma previa visual do widget sera renderizada ao lado das configuracoes
- Mostra como ficara o botao e o formulario no site do usuario

---

## Detalhes Tecnicos

### Arquivos a Criar/Modificar

1. **`src/modules/configuracoes/pages/ConfigGeralPage.tsx`**
   - Remover `max-w-2xl` do container principal
   - Adicionar nova secao "WhatsApp no Website" com todos os campos
   - Incluir botao "Copiar Script" que gera o embed
   - Incluir preview visual do widget

2. **`src/modules/configuracoes/components/whatsapp-widget/WidgetWhatsAppConfig.tsx`** (novo)
   - Componente da secao de configuracao com todos os campos
   - Busca campos personalizados de "pessoa" para popular o multi-select
   - Upload de foto do atendente para o Supabase Storage
   - Geracao do script embed auto-contido

3. **`src/modules/configuracoes/components/whatsapp-widget/WidgetWhatsAppPreview.tsx`** (novo)
   - Preview visual do widget (botao flutuante + formulario aberto)
   - Atualiza em tempo real conforme usuario muda configuracoes

4. **`src/modules/configuracoes/components/whatsapp-widget/generateWidgetScript.ts`** (novo)
   - Funcao utilitaria que recebe as configuracoes e retorna o HTML/JS/CSS do script embed

5. **`src/modules/configuracoes/hooks/useConfigTenant.ts`**
   - Ja existente, sera usado para salvar as configs do widget na tabela `config_tenant`

### Persistencia

- As configuracoes do widget serao salvas na tabela `config_tenant` existente, adicionando campos como `widget_whatsapp_ativo`, `widget_whatsapp_config` (JSONB) via o mesmo fluxo de `useAtualizarConfigTenant`

### Sugestao de Melhoria Adicional

Para aparecer tambem na secao de Conexoes WhatsApp: adicionar um link/atalho na pagina `/app/configuracoes/conexoes` no card do WhatsApp com "Configurar Widget para Website" que leva para a secao correspondente em Config Geral. Isso pode ser feito como passo adicional.

