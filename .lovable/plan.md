

# Correcoes Pontuais no Componente de Visualizacoes

## 1. Labels em negrito no ConfigResumo

Atualmente os labels "Periodo:", "Funil:", "Secoes:" usam `font-medium text-foreground/70`. Alterar para `font-semibold text-foreground` para ficarem visivelmente em negrito conforme o usuario solicitou.

**Arquivo:** `DashboardVisualizacoes.tsx`, linhas 91, 96, 101

---

## 2. Simplificar modo de edicao (remover redundancia)

Atualmente no modo edicao existem 3 acoes:
- "Atualizar com configuracoes atuais" (atualiza filtros/config mas nao o nome)
- "Salvar" (salva so o nome)
- "Cancelar"

Isso e confuso e redundante. A correcao:

- **Remover** o botao "Atualizar com configuracoes atuais" como acao separada
- **Adicionar** um checkbox discreto: "Usar configuracoes atuais do dashboard"
- **Salvar** passa a salvar o nome E, se o checkbox estiver marcado, tambem atualiza filtros + config_exibicao
- **Cancelar** permanece igual

Isso unifica tudo num unico fluxo claro: editar nome, opcionalmente atualizar config, e salvar.

### Secao Tecnica

**Arquivo:** `src/modules/app/components/dashboard/DashboardVisualizacoes.tsx`

Mudancas:
- Adicionar estado `updateConfig` (boolean, default false) no componente
- Substituir o botao "Atualizar com configuracoes atuais" por um checkbox com label
- No `handleSaveEdit`, verificar `updateConfig`: se true, incluir `filtros` e `config_exibicao` atuais no payload do `editar()`
- Alterar classes dos labels no `ConfigResumo` para `font-semibold text-foreground`

