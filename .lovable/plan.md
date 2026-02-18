
## Mover Feedback (Lampada) para o Header

### Objetivo
Remover o botao flutuante de feedback da lateral direita e integra-lo ao header, junto com os icones de Configuracoes (engrenagem) e Notificacoes (sino).

### Ordem recomendada dos icones (da esquerda para direita)
1. **Lampada (Feedback)** - acao menos frequente, fica mais distante do menu do usuario
2. **Engrenagem (Configuracoes)** - admin only, acesso a area importante
3. **Sino (Notificacoes)** - mais frequente, proximo ao usuario
4. **Avatar + Nome (User Menu)** - ultimo item, padrao de UX consolidado

Essa ordem segue a convencao de frequencia de uso crescente da esquerda para a direita, com o perfil sempre no extremo direito.

### Mudancas

#### 1. `src/modules/app/layouts/AppLayout.tsx`
- Remover o `<FeedbackButton />` flutuante do final do layout (linha 365)
- Adicionar um botao de feedback inline no header, na area direita (linha ~271), antes da engrenagem
- O botao tera o mesmo icone `Lightbulb`, estilo consistente com os demais (`p-2 rounded-md hover:bg-accent`)
- Ao clicar, abrira o `FeedbackPopover` posicionado como dropdown (absolute, similar ao sino)
- Manter a verificacao de role (admin/member only)
- Reduzir gap entre icones de `gap-1` para `gap-0` ou `gap-0.5`

#### 2. `src/modules/feedback/components/FeedbackButton.tsx`
- Refatorar para ser um botao inline (nao mais flutuante/fixed)
- Remover estilos de `fixed`, `translate-x`, gradiente, `group-hover`
- Transformar em um botao simples com icone + popover dropdown (mesmo padrao do `NotificacoesSino`)
- Manter logica de abrir/fechar popover e click-outside

### Secao Tecnica

**FeedbackButton refatorado:**
- Substituir o wrapper `fixed right-0 bottom-1/3` por `relative`
- Botao: `p-2 rounded-md hover:bg-accent transition-colors` (mesmo estilo do sino e engrenagem)
- Popover: posicionado `absolute right-0 mt-1` ao inves de `absolute bottom-16 right-4`
- Backdrop overlay `fixed inset-0 z-40` para fechar ao clicar fora (mesmo padrao do sino)

**AppLayout - area direita do header:**
```text
[Lampada] [Engrenagem] [Sino] [Avatar Carlos v]
   ^          ^           ^
 gap-0.5   gap-0.5    gap-0.5
```

Nenhuma dependencia nova. Nenhuma mudanca no AdminLayout (que tem estrutura separada).
