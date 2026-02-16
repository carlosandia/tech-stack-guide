

# Correcao: Etapas Padrao para Novos Tenants + Edicao de Etiqueta em Etapas Sistema

## Resumo

Duas acoes necessarias:

1. **Dados**: Inserir etapas padrao (Novos Negocios, Ganho, Perdido) nas organizacoes "Personal Junior" e "Litoral Place" que estao sem elas
2. **UI Pipeline Config**: Mostrar botao de edicao (lapis) nas etapas de sistema (entrada/ganho/perda) na configuracao de pipeline, permitindo editar APENAS o campo "Etiqueta WhatsApp"

---

## Parte 1: Inserir Etapas Padrao (Dados)

Inserir 3 registros na tabela `etapas_templates` para cada organizacao que nao possui:

| Organizacao | Nome | Tipo | Cor | Prob | Sistema |
|---|---|---|---|---|---|
| Personal Junior | Novos Negocios | entrada | #3B82F6 | 10 | true |
| Personal Junior | Ganho | ganho | #22C55E | 100 | true |
| Personal Junior | Perdido | perda | #EF4444 | 0 | true |
| Litoral Place | Novos Negocios | entrada | #3B82F6 | 10 | true |
| Litoral Place | Ganho | ganho | #22C55E | 100 | true |
| Litoral Place | Perdido | perda | #EF4444 | 0 | true |

IDs das organizacoes:
- Personal Junior: `1a3e19c7-66d6-4016-b5bb-1351a75b0fe1`
- Litoral Place: `0f93da3e-58b3-48f7-80e0-7e4902799357`

---

## Parte 2: Lapis de Edicao para Etapas Sistema na Pipeline

### Arquivo: `src/modules/negocios/components/config/ConfigEtapas.tsx`

**Mudanca**: Mostrar o botao de edicao (lapis) para etapas de sistema (entrada/ganho/perda), sem mostrar o botao de excluir:

```typescript
// ANTES (linha ~194): so mostra lapis para NAO-sistema
{!isSistema(etapa) && (
  <>
    <button onClick={...}><Pencil /></button>
    <button onClick={...}><Trash2 /></button>
  </>
)}

// DEPOIS: lapis para TODAS, lixeira so para nao-sistema
<button onClick={() => { setEditando(etapa); setShowModal(true) }}
  className="p-1.5 rounded-md hover:bg-accent text-muted-foreground"
  title="Editar">
  <Pencil className="w-3.5 h-3.5" />
</button>
{!isSistema(etapa) && (
  <button onClick={() => excluirEtapa.mutate(etapa.id)}
    className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive"
    title="Excluir">
    <Trash2 className="w-3.5 h-3.5" />
  </button>
)}
```

### Arquivo: `src/modules/negocios/components/config/EtapaFormModal.tsx`

**Mudanca**: Detectar se a etapa e de sistema e bloquear todos os campos exceto "Etiqueta WhatsApp":

```typescript
// Adicionar deteccao de sistema
const isSistema = etapa?.tipo === 'entrada' || etapa?.tipo === 'ganho' || etapa?.tipo === 'perda'

// Campos nome, cor, probabilidade: disabled={isSistema}
// Campo etiqueta_whatsapp: sempre habilitado

// Titulo do modal: "Etiqueta da Etapa" quando sistema
// Mensagem informativa quando sistema
```

### Arquivo: `src/modules/configuracoes/pages/EtapasTemplatesPage.tsx`

**Mudanca**: Mostrar lapis de edicao para etapas de sistema tambem (mesma logica — editar so etiqueta). Atualmente o `handleEdit` retorna sem fazer nada para etapas sistema. Remover essa restricao e permitir abrir o modal.

### Arquivo: `src/modules/configuracoes/components/etapas/EtapaTemplateFormModal.tsx`

**Mudanca**: Quando `isProtegido` (etapa sistema), ainda permitir salvar — so que apenas campos nao-protegidos serao editaveis. Atualmente o botao "Salvar" e escondido quando `isProtegido`. Mudar para mostrar o botao e permitir salvar os campos liberados.

**Nota**: A tabela `etapas_templates` NAO possui coluna `etiqueta_whatsapp` (apenas `etapas_funil` tem). Para a pagina de templates globais, o modal abrira em modo somente-leitura como esta hoje (sem campo de etiqueta). A mudanca principal de edicao de etiqueta e na configuracao de pipeline (`EtapaFormModal`).

---

## Arquivos a Modificar

1. **Dados** — INSERT de 6 registros em `etapas_templates`
2. `src/modules/negocios/components/config/ConfigEtapas.tsx` — Mostrar lapis para etapas sistema
3. `src/modules/negocios/components/config/EtapaFormModal.tsx` — Campos bloqueados exceto etiqueta quando sistema
4. `src/modules/configuracoes/pages/EtapasTemplatesPage.tsx` — Mostrar lapis para etapas sistema (somente leitura)
5. `src/modules/configuracoes/components/etapas/EtapaTemplateFormModal.tsx` — Abrir em modo visualizacao para etapas sistema

## Resultado Esperado

- Todas as organizacoes terao as 3 etapas padrao visiveis em Configuracoes > Etapas
- Na configuracao de pipeline, o lapis aparecera para Novos Negocios, Ganho e Perdido
- Ao clicar, o modal abrira com todos os campos bloqueados exceto "Etiqueta WhatsApp"
- O botao "Salvar" estara disponivel para salvar a etiqueta

