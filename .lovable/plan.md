
# Plano: Correção da Config Geral + Editor Rico de Assinatura + Validação de Email

## 1. Resumo das Mudanças

A página "Config Geral" será reposicionada na sidebar (saindo do grupo "EQUIPE"), a seção de Notificações ganhará validação de conexão de email ativa, e a Assinatura de Mensagem será substituída por um editor rich text completo com suporte a imagens, formatação e tabelas.

---

## 2. O que será feito

### 2.1 Reposicionar "Config Geral" na Sidebar

Atualmente "Config Geral" está dentro do grupo "EQUIPE" (junto com Membros, Perfis, Metas). Isso está errado -- é uma configuração geral do CRM e não tem relação com equipe.

**Solucao:** Criar um novo grupo "GERAL" no topo da sidebar, antes de "EQUIPE", contendo apenas "Config Geral".

Ordem final da sidebar:
- **GERAL** (novo grupo)
  - Config Geral
- **EQUIPE** (sem Config Geral)
  - Membros
  - Perfis
  - Metas
- **CONEXOES** (sem mudancas)
- **PIPELINE** (sem mudancas)

Arquivos afetados:
- `src/modules/configuracoes/components/layout/ConfigSidebar.tsx` -- mover item para novo grupo
- `src/modules/configuracoes/components/layout/ConfigMobileDrawer.tsx` -- reflete automaticamente pois usa `sidebarGroups`

### 2.2 Aviso de Conexão de Email nas Notificações

A seção "Notificações" envia emails (nova oportunidade, tarefa vencida, mudança de etapa). Se não houver conexão de email configurada, os toggles ficam sem efeito prático.

**Solucao:** Na `ConfigGeralPage`, verificar se existe uma conexão de email ativa (consulta em `conexoes_email` com status `connected` ou `ativo`). Se não houver:
- Exibir um banner de aviso acima dos toggles: "Para enviar notificações por email, conecte primeiro uma conta de email nas Conexões."
- Incluir um link para `/app/configuracoes/conexoes`
- Os toggles continuam funcionais (o admin pode configurar antes de conectar o email)

Arquivos afetados:
- `src/modules/configuracoes/pages/ConfigGeralPage.tsx` -- adicionar query de verificação + banner

### 2.3 Editor Rico para Assinatura de Mensagem

Substituir o `<textarea>` simples por um editor WYSIWYG completo usando **TipTap** (editor headless baseado em ProseMirror, MIT, amplamente usado).

**Funcionalidades do editor:**
- Negrito, Itálico, Sublinhado, Tachado
- Headings (H2, H3)
- Listas (ordenada e não-ordenada)
- Alinhamento de texto (esquerda, centro, direita)
- Inserção de imagem (via URL)
- Tabela (inserir, adicionar/remover linhas e colunas)
- Link
- Separador horizontal
- Desfazer/Refazer

O conteúdo será salvo como HTML na coluna `assinatura_mensagem` (tipo `text` no banco -- já suporta HTML).

**Dependências a instalar:**
- `@tiptap/react`
- `@tiptap/pm`
- `@tiptap/starter-kit` (bold, italic, heading, lists, etc.)
- `@tiptap/extension-underline`
- `@tiptap/extension-text-align`
- `@tiptap/extension-image`
- `@tiptap/extension-table`
- `@tiptap/extension-table-row`
- `@tiptap/extension-table-cell`
- `@tiptap/extension-table-header`
- `@tiptap/extension-link`

**Arquivos novos:**
- `src/modules/configuracoes/components/editor/RichTextEditor.tsx` -- componente reutilizável do editor com toolbar
- `src/modules/configuracoes/components/editor/EditorToolbar.tsx` -- toolbar com todos os botões de formatação

**Arquivos modificados:**
- `src/modules/configuracoes/pages/ConfigGeralPage.tsx` -- trocar textarea pelo `RichTextEditor`

### 2.4 Validação e Testes

Após a implementação:
- Verificar que a sidebar mostra "Config Geral" no grupo "GERAL" (tanto desktop quanto mobile drawer)
- Verificar o banner de aviso quando não há email conectado
- Verificar que o editor rico carrega, formata texto, insere imagens por URL e cria tabelas
- Verificar que salvar preserva o HTML e recarrega corretamente

---

## 3. Detalhes Técnicos

### 3.1 Sidebar - Nova estrutura de grupos

```text
sidebarGroups = [
  {
    key: 'geral',
    label: 'Geral',
    adminOnly: true,
    items: [
      { label: 'Config Geral', path: '/app/configuracoes/config-geral', icon: Settings, adminOnly: true }
    ]
  },
  {
    key: 'equipe',
    label: 'Equipe',
    adminOnly: true,
    items: [
      // Membros, Perfis, Metas (sem Config Geral)
    ]
  },
  // ... conexoes, pipeline sem mudancas
]
```

### 3.2 Banner de email desconectado

Componente inline na seção Notificações, consultando `conexoes_email` via Supabase:

```text
[icone alerta] Para enviar notificações por email, conecte uma conta de email.
              [Ir para Conexões ->]
```

Estilo: `bg-amber-50 border-amber-200 text-amber-800` (padrão de alerta do design system).

### 3.3 Editor Rico (TipTap)

Estrutura do componente:

```text
+--------------------------------------------------+
| [B] [I] [U] [S] | [H2] [H3] | [UL] [OL]        |
| [Left] [Center] [Right] | [Link] [Img] [Table]  |
| [HR] | [Undo] [Redo]                              |
+--------------------------------------------------+
|                                                    |
|  Area de edição rich text                          |
|  (contenteditable via ProseMirror/TipTap)          |
|                                                    |
+--------------------------------------------------+
```

- Toolbar com ícones do Lucide (já instalado)
- Estilo consistente com o design system (borders, radius, cores)
- O editor recebe `value` (HTML string) e emite `onChange(html)`
- Inserção de imagem via prompt de URL (sem upload de arquivo no editor -- é uma assinatura)
- Tabela com controles básicos (inserir 3x3, adicionar/remover linha/coluna)

### 3.4 Fluxo de dados

O campo `assinatura_mensagem` na tabela `configuracoes_tenant` é do tipo `text` e já aceita HTML. Não será necessária migração de banco. O HTML será sanitizado na exibição (quando usado em emails futuramente).
