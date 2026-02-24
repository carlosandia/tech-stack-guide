
## Plano: Horario de Atendimento do Widget + Formatacao da Mensagem WhatsApp

### Verificacao de banco realizada

- Tabela `configuracoes_tenant` ja possui coluna `widget_whatsapp_config` (JSONB) -- confirmado
- Nenhum campo `horario_atendimento` existe no projeto -- sem duplicacao
- Nenhuma migracao de banco necessaria -- os novos campos ficam dentro do JSONB existente

---

### 1. Tipos (`types.ts`)

Adicionar 4 novos campos ao tipo `WidgetWhatsAppConfig`:

```text
horario_atendimento: 'sempre' | 'personalizado'
horario_dias: number[]          // 0=Dom, 1=Seg ... 6=Sab
horario_inicio: string          // "09:00"
horario_fim: string             // "18:00"
```

Defaults: `horario_atendimento: 'sempre'`, `horario_dias: [1,2,3,4,5]`, `horario_inicio: '09:00'`, `horario_fim: '18:00'`

---

### 2. Schema Zod (`configuracoes.api.ts`)

Estender o schema `widget_whatsapp_config` (linhas 3278-3292) com:

```text
horario_atendimento: z.enum(['sempre', 'personalizado']).optional()
horario_dias: z.array(z.number().min(0).max(6)).optional()
horario_inicio: z.string().regex(/^\d{2}:\d{2}$/).optional()
horario_fim: z.string().regex(/^\d{2}:\d{2}$/).optional()
```

---

### 3. UI de Configuracao (`WidgetWhatsAppConfig.tsx`)

Nova secao "Horario de Atendimento" com:
- Toggle pill: "Sempre Online" / "Horario Personalizado"
- Quando personalizado: 7 botoes de dias da semana (Dom-Sab) + campos de horario inicio/fim (`type="time"`)

---

### 4. Preview (`WidgetWhatsAppPreview.tsx`)

- Se `horario_atendimento === 'sempre'`: mostrar "Online"
- Se `personalizado`: calcular com base no dia/hora atual, ocultar "Online" se fora do horario

---

### 5. Edge Function Loader (`widget-whatsapp-loader/index.ts`)

**a) Logica Online/Offline:**
- Gerar JS que verifica dia/hora no browser do visitante
- Se fora do horario configurado, ocultar o texto "Online" do header do widget

**b) Formatacao da mensagem no submit:**
Trocar o formato atual (uma linha com `|` separando tudo) por formato WhatsApp com bold:

```text
Atual:   "Rogeria Mendanha | (21) 98150-7584 | rogeria@gmail.com"

Novo:
*Nome:*
Rogeria Mendanha

*Telefone:*
(21) 98150-7584

*Email:*
rogeria@gmail.com
```

Usando `*campo:*` (bold do WhatsApp) + `%0A` para quebras de linha na URL `wa.me`.

---

### Arquivos a modificar

| Arquivo | Alteracao |
|---|---|
| `src/modules/configuracoes/components/whatsapp-widget/types.ts` | 4 novos campos + defaults |
| `src/modules/configuracoes/services/configuracoes.api.ts` | Estender schema Zod (4 campos) |
| `src/modules/configuracoes/components/whatsapp-widget/WidgetWhatsAppConfig.tsx` | Secao de horario de atendimento |
| `src/modules/configuracoes/components/whatsapp-widget/WidgetWhatsAppPreview.tsx` | Logica online/offline |
| `supabase/functions/widget-whatsapp-loader/index.ts` | Online/offline + formatacao mensagem |

### Sem migracoes de banco

Tudo armazenado no JSONB `widget_whatsapp_config` ja existente na tabela `configuracoes_tenant`.
