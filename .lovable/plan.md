
# Plano: Blocos/Colunas na Newsletter + LGPD Global + Email de Boas-Vindas + Popup Avancado

## Escopo Resumido

Sao 4 frentes de trabalho:

1. **Sistema de blocos com colunas para Newsletter** - permitir organizar campos em colunas (1, 2 ou 3) como RD Station/HubSpot
2. **Campo LGPD disponivel para todos os tipos de formulario** (nao so newsletter)
3. **Email automatico de boas-vindas** ao submeter newsletter (usando SMTP ja configurado)
4. **Popup: acoes avancadas de marketing** - frequencia de exibicao, paginas especificas, segmentacao por UTM, botao de fechar customizado

---

## 1. Sistema de Blocos com Colunas (Newsletter)

### Conceito
Em vez de campos empilhados verticalmente, o usuario pode agrupar campos em "linhas" com 1 a 3 colunas. Cada linha (bloco) define quantas colunas tem, e os campos sao distribuidos dentro dela.

### Implementacao

**Nova propriedade no campo**: Adicionar `coluna_config` (JSONB) na tabela `campos_formularios` com:
- `bloco_id`: identificador do bloco/linha (string, ex: "bloco_1")
- `coluna`: numero da coluna dentro do bloco (1, 2 ou 3)
- `total_colunas`: quantas colunas o bloco tem (1, 2 ou 3)

**Migracao SQL**:
```
ALTER TABLE campos_formularios ADD COLUMN IF NOT EXISTS coluna_config jsonb DEFAULT null;
```

**Componente `BlocoColumnSelector`**: Pequeno controle no `CampoConfigPanel` que permite ao usuario:
- Definir se o campo pertence a um bloco
- Escolher 1, 2 ou 3 colunas para o bloco
- Posicionar o campo na coluna desejada

**Renderizacao no Preview**: O `FormPreview` agrupa campos pelo `bloco_id` e renderiza cada grupo como um `flex` row com `gap`, distribuindo os campos nas colunas corretas.

**Renderizacao no Preview Final e Pagina Publica**: Mesma logica de agrupamento.

### Alternativa mais simples (recomendada para V1)
Em vez de blocos complexos, utilizar a propriedade `largura` ja existente nos campos. Hoje o campo tem `largura: 'full'`, mas podemos expandir para `'full' | '1/2' | '1/3' | '2/3'`. O preview renderiza campos em sequencia usando `flex-wrap`, e campos com larguras fracionarias ficam lado a lado automaticamente.

Isso e mais intuitivo e nao requer nova estrutura de dados - basta atualizar o `CampoConfigPanel` para oferecer as opcoes de largura e ajustar o `FormPreview` para renderizar com `flex-wrap`.

---

## 2. Campo LGPD para Todos os Formularios

### Situacao Atual
- Ja existe o tipo `checkbox_termos` na paleta de campos (categoria "Especiais")
- A newsletter ja tem config de consentimento LGPD no `ConfigNewsletterForm`
- Porem, formularios inline, popup e landing page nao tem acesso facil a isso

### Implementacao
- Adicionar uma secao "LGPD / Consentimento" nas **Configuracoes Gerais** (`EditorTabsConfig`) para **todos os tipos** de formulario (nao so newsletter)
- Criar campos na tabela `formularios` (ou uma tabela de config generica):
  - `lgpd_ativo` (boolean)
  - `lgpd_texto_consentimento` (text)
  - `lgpd_url_politica` (text)
  - `lgpd_checkbox_obrigatorio` (boolean)
- No `FormPreview`, quando `lgpd_ativo = true`, renderizar automaticamente um checkbox de consentimento antes do botao de enviar (sem precisar adicionar manualmente o campo)
- Na pagina publica, validar que o checkbox foi marcado antes de permitir submissao

---

## 3. Email Automatico de Boas-Vindas (Newsletter)

### Contexto
O sistema ja possui a Edge Function `send-email` que envia emails via SMTP configurado pelo usuario. O `ConfigNewsletterForm` ja tem campos para double opt-in e assunto do email.

### Implementacao
- Adicionar campo `email_boas_vindas_ativo` (boolean) e `template_boas_vindas` (text/html) na tabela `config_newsletter_formularios`
- No `ConfigNewsletterForm`, adicionar secao "Email de Boas-Vindas":
  - Toggle para ativar/desativar
  - Campo de assunto do email
  - Editor de texto rico (TipTap, ja disponivel no projeto) para o corpo do email
  - Botao "Enviar teste" para o proprio email do usuario
- Quando uma submissao de newsletter e recebida, a logica de pos-envio (que ja existe para criar oportunidades e notificar) tambem chamara a Edge Function `send-email` para enviar o email de boas-vindas ao lead

**Migracao SQL**:
```
ALTER TABLE config_newsletter_formularios
  ADD COLUMN IF NOT EXISTS email_boas_vindas_ativo boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS assunto_boas_vindas text DEFAULT 'Bem-vindo!',
  ADD COLUMN IF NOT EXISTS template_boas_vindas text;
```

---

## 4. Popup: Acoes Avancadas de Marketing

### Situacao Atual
O `ConfigPopupForm` ja implementa: gatilho (saida, tempo, scroll, clique), posicao, animacao, overlay, cookie, mobile.

### O que falta (padroes de CRM avancado)

Adicionar na tabela `config_popup_formularios`:
- `frequencia_exibicao` (text): 'sempre', 'uma_vez', 'uma_vez_por_dia', 'uma_vez_por_semana', 'personalizado'
- `max_exibicoes` (integer): numero maximo de vezes que o popup aparece para o mesmo visitante
- `paginas_alvo` (text[]): lista de URLs/paths onde o popup deve aparecer (se vazio, aparece em todas)
- `paginas_excluidas` (text[]): URLs onde o popup NAO deve aparecer
- `utm_filtro` (jsonb): filtrar por UTM source/medium/campaign para segmentar campanhas
- `mostrar_botao_fechar` (boolean): se o X de fechar aparece
- `delay_botao_fechar` (integer): atraso em segundos antes de mostrar o botao de fechar (tecnica de marketing para forcar leitura)
- `ativo_a_partir_de` (timestamptz): data de inicio de exibicao
- `ativo_ate` (timestamptz): data de fim de exibicao (campanhas temporarias)

**Migracao SQL**:
```
ALTER TABLE config_popup_formularios
  ADD COLUMN IF NOT EXISTS frequencia_exibicao text DEFAULT 'uma_vez',
  ADD COLUMN IF NOT EXISTS max_exibicoes integer DEFAULT null,
  ADD COLUMN IF NOT EXISTS paginas_alvo text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS paginas_excluidas text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS utm_filtro jsonb DEFAULT null,
  ADD COLUMN IF NOT EXISTS mostrar_botao_fechar boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS delay_botao_fechar integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ativo_a_partir_de timestamptz DEFAULT null,
  ADD COLUMN IF NOT EXISTS ativo_ate timestamptz DEFAULT null;
```

**UI no ConfigPopupForm**: Adicionar secoes:
- "Frequencia de Exibicao" com select e campo de max
- "Segmentacao" com inputs para paginas alvo/excluidas e filtros UTM
- "Agendamento" com date pickers para inicio/fim
- "Botao Fechar" com toggle e delay

---

## Arquivos Alterados

| Arquivo | Alteracao |
|---------|-----------|
| **Migracao SQL** | Adicionar colunas em `campos_formularios`, `config_newsletter_formularios`, `config_popup_formularios` e `formularios` |
| `src/modules/formularios/services/formularios.api.ts` | Atualizar interfaces `ConfigPopup`, `ConfigNewsletter`, `CampoFormulario`, `Formulario` |
| `src/modules/formularios/components/campos/CampoConfigPanel.tsx` | Adicionar seletor de largura fracionaria (1/2, 1/3, 2/3) |
| `src/modules/formularios/components/editor/FormPreview.tsx` | Renderizar campos com flex-wrap respeitando larguras fracionarias |
| `src/modules/formularios/components/editor/EditorTabsConfig.tsx` | Adicionar secao LGPD global |
| `src/modules/formularios/components/config/ConfigPopupForm.tsx` | Adicionar secoes avancadas de marketing |
| `src/modules/formularios/components/config/ConfigNewsletterForm.tsx` | Adicionar secao de email de boas-vindas |
| `src/modules/formularios/components/config/LgpdConfigSection.tsx` | **NOVO** - Componente de config LGPD reutilizavel |

## Ordem de Implementacao

1. Sistema de larguras fracionarias (colunas) - impacto visual imediato
2. LGPD global para todos os formularios
3. Acoes avancadas de marketing no popup
4. Email automatico de boas-vindas
