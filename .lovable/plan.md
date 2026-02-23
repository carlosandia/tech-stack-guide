
# Correcoes na Pagina de Detalhes do Parceiro e Meta de Gratuidade

## Problema 1: URL do link de indicacao incorreta

Na pagina `ParceiroDetalhesPage.tsx`, o link de indicacao e montado usando `window.location.origin` (que retorna o dominio atual do preview/app). Porem, o campo `base_url_indicacao` ja existe na config do programa de parceiros exatamente para definir a URL base correta.

**Atualmente:** `window.location.origin + /parceiro/CODIGO` = `https://app.renovedigital.com.br/parceiro/CODIGO`

**Correto:** Deveria usar o `base_url_indicacao` da config (que o admin configura em Configuracoes > Parceiros), montando algo como `https://crm.renovedigital.com.br/parceiro/CODIGO`.

### Correcao

No `ParceiroDetalhesPage.tsx`:
- Importar `useConfigPrograma` para acessar o `base_url_indicacao`
- Substituir `window.location.origin` pelo `base_url_indicacao` da config (com fallback para `window.location.origin`)
- Montar o link como: `{baseUrl}/parceiro/{codigo}` onde `baseUrl` vem da config

Porem, o campo `base_url_indicacao` hoje armazena `https://app.renovedigital.com.br/cadastro` (com `/cadastro` no final). Isso precisa ser corrigido no banco para `https://crm.renovedigital.com.br` (sem path). Ou alternativamente, o link pode ser montado como `{base_url_indicacao}?ref={codigo}` se o formato com `/cadastro` for intencional.

**Pergunta ao usuario necessaria** sobre o formato da URL.

---

## Problema 2: Meta para gratuidade nao e configuravel na tela

Analisando a tela de configuracoes (`ConfiguracoesGlobaisPage.tsx`), a meta para gratuidade **ja e configuravel**. Quando o toggle "Programa de Gratuidade" esta ativado, aparecem 4 campos:
- Meta inicial (indicados)
- Carencia (dias)
- Meta renovacao (indicados)
- Periodo renovacao (meses)

O toggle esta **desativado** na screenshot do usuario, por isso os campos nao aparecem.

Na `ParceirosPage`, a coluna "Meta" so aparece quando `config.regras_gratuidade.ativo === true`. Como esta desativada, a coluna nao aparece - comportamento correto.

**Nao ha bug aqui** - o programa de gratuidade esta desabilitado. Se o usuario quiser usar metas, basta ativar o toggle em Configuracoes > Parceiros.

---

## Plano de implementacao

### Arquivo: `src/modules/admin/pages/ParceiroDetalhesPage.tsx`

1. Importar `useConfigPrograma` do hook de parceiros
2. Buscar a config dentro do componente
3. Substituir `window.location.origin` por uma funcao que monta a URL correta usando `config.base_url_indicacao` como base (removendo paths extras e usando apenas o origin)
4. Fallback para `window.location.origin` caso `base_url_indicacao` esteja vazio

### Detalhe tecnico

```text
// Antes:
`${window.location.origin}/parceiro/${parceiro.codigo_indicacao}`

// Depois:
const baseOrigin = config?.base_url_indicacao 
  ? new URL(config.base_url_indicacao).origin 
  : window.location.origin
`${baseOrigin}/parceiro/${parceiro.codigo_indicacao}`
```

Isso extrai apenas o origin (protocolo + dominio) do `base_url_indicacao`, ignorando qualquer path como `/cadastro`, e monta o link correto para `/parceiro/CODIGO`.
