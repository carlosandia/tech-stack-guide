
# Adicionar Hub "Campanhas" com Badge "Em Breve"

## Objetivo
Criar um quarto hub de navegacao chamado **Campanhas** com dois sub-itens (Email Marketing e WhatsApp Marketing), ambos com badge "Em breve" e desabilitados. Tambem registrar os modulos no banco para o Super Admin.

## Mudancas

### 1. Navegacao - `src/modules/app/layouts/AppLayout.tsx`

Adicionar novo hub no array `navHubs` (entre Atendimento e Ferramentas):

```text
Campanhas
  - Email Marketing (slug: email-marketing)
  - WhatsApp Marketing (slug: whatsapp-marketing)
```

Importar icone `Megaphone` do lucide-react para o hub e `Send`/`MessageCircle` para os sub-itens.

Adicionar propriedade `comingSoon?: boolean` na interface `NavHubItem` para marcar itens como "em breve".

No componente `NavHubDropdown`, itens com `comingSoon: true` serao renderizados como desabilitados (similar ao locked) mas com badge "Em breve" ao inves do cadeado.

### 2. Badge "Em Breve" no Dropdown

Dentro do `NavHubDropdown`, antes do check de `isLocked`, adicionar tratamento para `comingSoon`:

```tsx
if (child.comingSoon) {
  return (
    <DropdownMenuItem disabled className="flex items-center gap-2.5 opacity-50 cursor-not-allowed">
      <ChildIcon className="w-4 h-4" />
      <span>{child.label}</span>
      <span className="ml-auto text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
        Em breve
      </span>
    </DropdownMenuItem>
  )
}
```

### 3. Badge no Hub Trigger

Quando **todos** os filhos de um hub sao `comingSoon`, exibir badge "Em breve" no proprio botao do hub (ao lado do chevron), com estilo sutil.

### 4. Modulos no Banco (Super Admin)

Inserir via SQL dois novos registros na tabela `modulos`:

```sql
INSERT INTO modulos (nome, slug, descricao, obrigatorio)
VALUES
  ('Email Marketing', 'email-marketing', 'Envio de campanhas de email marketing em massa', false),
  ('WhatsApp Marketing', 'whatsapp-marketing', 'Envio de campanhas de WhatsApp marketing em massa', false);
```

Isso fara com que eles aparecam automaticamente na pagina de Modulos do Super Admin (`/admin/modulos`).

## Detalhes Tecnicos

### Arquivos impactados

| Arquivo | Mudanca |
|---------|---------|
| `src/modules/app/layouts/AppLayout.tsx` | Adicionar hub Campanhas, propriedade `comingSoon`, logica de renderizacao |

### SQL a executar no Supabase

1 migration para inserir os 2 modulos na tabela `modulos`
