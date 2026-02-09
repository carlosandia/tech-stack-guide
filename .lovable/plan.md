
# Plano: Botoes de Envio (Comum + WhatsApp) e Notificacoes Pos-Envio

## Resumo

Duas implementacoes principais:

1. **Botoes de envio configuravel**: O usuario podera escolher entre botao "Enviar" comum, botao "WhatsApp" ou ambos. Cada um com comportamentos distintos de criacao de oportunidade, notificacao por e-mail e redirecionamento WhatsApp.

2. **Notificacoes e redirecionamento pos-envio**: Configurar mensagens de sucesso/erro e redirecionar para uma pagina especifica apos o envio (ex: pagina de obrigado).

---

## 1. Configuracao dos Botoes de Envio

### Modelo de dados

Adicionar novos campos ao formulario (tabela `formularios`) ou ao estilo (`estilos_formularios`):

```text
config_botoes: {
  tipo_botao: 'enviar' | 'whatsapp' | 'ambos'

  // Botao Enviar (comum)
  enviar_cria_oportunidade: boolean (default true)
  enviar_notifica_email: boolean (default false)
  enviar_email_destino: string (email para notificacao)

  // Botao WhatsApp
  whatsapp_numero: string (numero completo com DDI, ex: 5511999999999)
  whatsapp_cria_oportunidade: boolean (default false)
  whatsapp_notifica_email: boolean (default false)
  whatsapp_email_destino: string
  whatsapp_mensagem_template: string (template da mensagem, default auto-gerado)
}
```

Esses campos serao armazenados como JSON na coluna `config_botoes` (tipo `jsonb`) na tabela `formularios`.

### Interface de configuracao

Dentro da aba **Configuracoes > Configuracoes Gerais**, adicionar uma secao "Botoes de Envio" com:

- **Seletor de tipo**: Radio/Select entre "Apenas Enviar", "Apenas WhatsApp", "Ambos"
- **Painel "Enviar" (se ativo)**:
  - Toggle: Criar oportunidade automaticamente
  - Toggle: Notificar por e-mail
  - Campo: E-mail de destino (visivel se notificar ativo)
- **Painel "WhatsApp" (se ativo)**:
  - Campo: Numero de WhatsApp destino (com seletor de pais/DDI)
  - Toggle: Criar oportunidade automaticamente
  - Toggle: Notificar por e-mail
  - Campo: E-mail de destino
  - Textarea: Template da mensagem (com variaveis {{campo_nome}})

### Preview e renderizacao

No `FormPreview.tsx`, a area de botoes sera atualizada para renderizar:

- **Apenas Enviar**: Botao unico com estilo atual
- **Apenas WhatsApp**: Botao verde com icone WhatsApp
- **Ambos**: Dois botoes lado a lado (Enviar + WhatsApp)

O botao WhatsApp, ao ser clicado no formulario publico, ira:
1. Coletar todos os dados dos campos preenchidos
2. Formatar uma mensagem com "Label: Resposta" para cada campo
3. Abrir `https://wa.me/{numero}?text={mensagem_codificada}` em nova aba

### Componentes novos

- `ConfigBotoesEnvioForm.tsx` - Formulario de configuracao dos botoes dentro da aba Config
- Atualizar `FormPreview.tsx` - Renderizar o(s) botao(oes) conforme configuracao
- Atualizar `EstiloBotaoForm.tsx` - Adicionar opcoes de estilo para botao WhatsApp (cor, texto)

---

## 2. Notificacoes e Redirecionamento Pos-Envio

### Modelo de dados

Adicionar ao JSON `config_botoes` ou campos diretos no formulario:

```text
config_pos_envio: {
  mensagem_sucesso: string (ja existe no modelo atual)
  mensagem_erro: string (nova)
  tipo_acao_sucesso: 'mensagem' | 'redirecionar' | 'ambos'
  url_redirecionamento: string (ja existe parcialmente)
  tempo_redirecionamento: number (segundos antes de redirecionar, default 3)
}
```

### Interface de configuracao

Na mesma secao de "Configuracoes Gerais", adicionar sub-secao "Pos-Envio":

- **Mensagem de sucesso**: Textarea (ja existe, reaproveitar)
- **Mensagem de erro**: Textarea
- **Acao apos envio**: Select entre "Mostrar mensagem", "Redirecionar", "Mensagem + Redirecionar"
- **URL de redirecionamento**: Campo texto (visivel se redirecionar ativo)
- **Tempo de espera**: Input numerico em segundos (visivel se "ambos")

---

## Detalhes Tecnicos

### Arquivos a criar:
1. `src/modules/formularios/components/config/ConfigBotoesEnvioForm.tsx` - Configuracao dos botoes
2. `src/modules/formularios/components/config/ConfigPosEnvioForm.tsx` - Configuracao de notificacoes e redirecionamento

### Arquivos a modificar:
1. **`formularios.api.ts`** - Adicionar tipo `ConfigBotoes` e `ConfigPosEnvio` na interface `Formulario`; atualizar CRUD para incluir esses campos
2. **`EditorTabsConfig.tsx`** - Incluir as novas secoes dentro de "Configuracoes Gerais"
3. **`FormPreview.tsx`** - Renderizar botoes conforme config (WhatsApp com icone verde, ambos lado a lado)
4. **`EstiloBotaoForm.tsx`** - Opcoes adicionais para personalizar o botao WhatsApp

### Banco de dados (migracao):
- Adicionar coluna `config_botoes jsonb default '{}'` na tabela `formularios`
- Adicionar coluna `config_pos_envio jsonb default '{}'` na tabela `formularios`
- Ou reutilizar `mensagem_sucesso` e `url_redirecionamento` que ja existem, adicionando apenas `mensagem_erro`, `tipo_acao_sucesso` e `tempo_redirecionamento`

### Logica do WhatsApp (formulario publico):
A formatacao da mensagem seguira o padrao:
```text
*Nome do Formulario*

*Nome:* Joao Silva
*Email:* joao@email.com
*Telefone:* (11) 99999-9999
*Mensagem:* Gostaria de mais informacoes
```

Sera codificada via `encodeURIComponent` e aberta com `window.open('https://wa.me/...')`.

### Fluxo do botao comum (enviar):
1. Submete dados via API (cria submissao)
2. Se `cria_oportunidade` ativo, integra com pipeline (ja existe)
3. Se `notifica_email` ativo, dispara edge function de notificacao com dados formatados
4. Exibe mensagem de sucesso e/ou redireciona conforme configurado

### Funcoes relevantes adicionais:
- **Edge Function de notificacao por e-mail**: Sera necessaria uma edge function para enviar e-mail de notificacao ao responsavel quando uma nova submissao ocorrer, contendo os dados formatados do formulario. Pode reutilizar a arquitetura SMTP ja existente no sistema (`send-email`).
