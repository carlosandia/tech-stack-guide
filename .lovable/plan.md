
# Plano: Redesign da Aba Configuracoes + Multi-step Avancado

## Problema Atual

A aba "Configuracoes" usa um grid 2x2 com secoes colapsaveis (accordions) que ficam comprimidas e dificeis de navegar. Configuracoes de Newsletter, Popup, Multi-step, LGPD, Logica e A/B ficam todas misturadas dentro de accordions, resultando em UX ruim com muito scroll e pouca clareza.

## Solucao: Navegacao por Abas Verticais (Sidebar + Conteudo)

Substituir o grid 2x2 por um layout com **sidebar de navegacao a esquerda** e **area de conteudo full-width a direita**. Cada secao ocupa 100% da area disponivel, sem accordions.

```text
+---------------------------+------------------------------------------------+
| Sidebar (200px)           | Conteudo (flex-1)                              |
|                           |                                                |
| > Geral          (ativo)  | [Formulario completo da secao selecionada]     |
| > LGPD                    |                                                |
| > Logica                  |                                                |
| > A/B Testing             |                                                |
|                           |                                                |
| Secoes condicionais:      |                                                |
| > Popup (so se popup)     |                                                |
| > Newsletter (so se NL)   |                                                |
| > Etapas (so se multi)    |                                                |
+---------------------------+------------------------------------------------+
```

### Regras de exibicao dos itens na sidebar:
- **Geral**: sempre visivel (etapas multi-step ficam aqui quando tipo=multi_step)
- **LGPD / Consentimento**: sempre visivel
- **Logica Condicional**: sempre visivel
- **A/B Testing**: sempre visivel
- **Popup**: so aparece quando `formulario.tipo === 'popup'`
- **Newsletter**: so aparece quando `formulario.tipo === 'newsletter'`
- **Etapas**: so aparece quando `formulario.tipo === 'multi_step'`

### Design da sidebar:
- Fundo `bg-muted/30`, borda `border-r border-border`
- Itens com icone + label, estilo ghost
- Item ativo: `bg-primary/10 text-primary font-medium border-l-2 border-primary`
- Largura fixa: `w-48` (192px)

## Multi-step: Configuracoes Avancadas por Etapa

### Aprimoramento do ConfigEtapasForm

Transformar de um simples CRUD de etapas para uma interface profissional de configuracao multi-step:

#### Configuracoes Globais do Multi-step (topo da secao "Etapas"):
- **Indicador de progresso**: tipo (barra, numeros, icones, dots)
- **Navegacao**: permitir voltar, pular etapas, salvar rascunho
- **Validacao**: validar por etapa ou so no final
- **Texto do botao final**: customizavel (ex: "Enviar", "Finalizar")

#### Configuracoes por Etapa (no card expandido):
- Titulo e descricao (ja existem)
- **Icone da etapa**: seletor de icone (lucide)
- **Logica de pulo**: condicao para pular esta etapa automaticamente
- **Campos vinculados**: indicador visual de quais campos pertencem a esta etapa
- Textos dos botoes proximo/anterior (ja existem)
- Validar antes de avancar (ja existe)
- **Barra de progresso visivel**: toggle por etapa

#### Migracoes SQL necessarias:
Adicionar colunas na tabela `formularios` para config global multi-step:

```sql
ALTER TABLE public.formularios
  ADD COLUMN IF NOT EXISTS multi_step_config jsonb DEFAULT '{}';
```

O JSONB armazena:
- `tipo_progresso`: 'barra' | 'numeros' | 'icones' | 'dots'
- `permitir_voltar`: boolean
- `permitir_pular`: boolean  
- `salvar_rascunho`: boolean
- `validar_por_etapa`: boolean

### Acoes de Marketing para Multi-step:
- **Progressive Profiling**: ja implementado nos campos (mostrar_para_leads_conhecidos, alternativa_para_campo_id)
- **Lead Scoring por etapa**: somar pontuacao conforme avanca
- **Abandono de etapa**: trackear em qual etapa o usuario desistiu (ja feito via submissoes parciais)
- **Auto-save entre etapas**: salvar progresso parcial

## Arquivos Alterados

| Arquivo | Alteracao |
|---------|-----------|
| `src/modules/formularios/components/editor/EditorTabsConfig.tsx` | Reescrever: remover grid 2x2 com accordions, implementar layout sidebar + conteudo com navegacao vertical |
| `src/modules/formularios/components/config/ConfigEtapasForm.tsx` | Expandir: adicionar config global multi-step (tipo progresso, navegacao), melhorar cards de etapa com icone e campos vinculados |
| `src/modules/formularios/services/formularios.api.ts` | Adicionar interface `MultiStepConfig` e campo `multi_step_config` no tipo `Formulario` |
| `src/modules/formularios/components/config/ConfigPopupForm.tsx` | Sem mudanca no conteudo, apenas sera renderizado dentro da nova sidebar |
| `src/modules/formularios/components/config/ConfigNewsletterForm.tsx` | Sem mudanca no conteudo |
| `src/modules/formularios/components/config/LgpdConfigSection.tsx` | Sem mudanca no conteudo |
| **Migracao SQL** | `ALTER TABLE formularios ADD COLUMN multi_step_config jsonb DEFAULT '{}'` |

## Detalhes Tecnicos

### EditorTabsConfig - Nova estrutura:
```text
Estado: activeSection (string) controla qual secao esta visivel
Sidebar: lista de itens filtrada por formulario.tipo
Conteudo: renderizacao condicional baseada em activeSection
```

### Responsividade:
- Desktop (lg+): sidebar fixa + conteudo ao lado
- Mobile/tablet: sidebar vira tabs horizontais (underline) no topo, conteudo abaixo

### Padrao do Design System:
- Usa `text-sm font-medium` para labels da sidebar
- Icones `w-4 h-4` do lucide-react
- Item ativo com `border-l-2 border-primary` (desktop) ou `border-b-2 border-primary` (mobile)
- Cores: `text-muted-foreground` inativo, `text-primary` ativo
