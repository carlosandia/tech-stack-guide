
# Corrigir Tamanho da Fonte do Titulo na Pagina Publica (/f/:slug)

## Problema Identificado

A pagina publica do formulario (`/f/:slug`) ignora o `estilo_campo.label_tamanho` configurado para campos de titulo e paragrafo. O `labelStyle` que chega ja contem os valores corretos (merge feito via `getLabelStyle` > `mergeCampoEstilo`), porem o `renderCampoPublico` sobrescreve o `fontSize` com o valor do `valor_padrao.tamanho` (que e "18" - o default do layout).

### Dados do Banco
- `valor_padrao.tamanho` = "18" (default do layout)
- `validacoes.estilo_campo.label_tamanho` = "35" (override configurado pelo usuario)
- O editor e o widget embed ja usam o override corretamente
- A pagina publica mostra "18px" em vez de "35px"

## Alteracoes

### Arquivo: `src/modules/formularios/pages/FormularioPublicoPage.tsx`

**Titulo (linha 821-823)**: Aplicar a mesma logica de prioridade do editor:
1. `estilo_campo.label_tamanho` (override individual) - se existir
2. `valor_padrao.tamanho` (configuracao do layout)
3. Fallback "18px"

Tambem aplicar mesma logica para cor e peso da fonte.

**Paragrafo (linha 825-827)**: Mesma correcao. Atualmente nem usa `labelStyle`, precisa incorporar overrides.

### Logica Corrigida (titulo)
```
case 'titulo': {
  const tc = parseLayoutConfig(campo.valor_padrao, 'titulo')
  const campoOver = (campo.validacoes as any)?.estilo_campo || {}
  const fontSize = campoOver.label_tamanho
    ? ensureUnit(String(campoOver.label_tamanho), tc.tamanho + 'px', 'fontSize')
    : tc.tamanho + 'px'
  const color = campoOver.label_cor || tc.cor || '#374151'
  const weight = campoOver.label_font_weight || '600'
  return <h3 style={{ ...labelStyle, fontSize, fontWeight: weight, marginBottom: 0, textAlign: tc.alinhamento, color }}>{...}</h3>
}
```

### Logica Corrigida (paragrafo)
```
case 'paragrafo': {
  const pc = parseLayoutConfig(campo.valor_padrao, 'paragrafo')
  const campoOver = (campo.validacoes as any)?.estilo_campo || {}
  const fontSize = campoOver.label_tamanho
    ? ensureUnit(String(campoOver.label_tamanho), pc.tamanho + 'px', 'fontSize')
    : pc.tamanho + 'px'
  const color = campoOver.label_cor || pc.cor || '#374151'
  const weight = campoOver.label_font_weight || '400'
  return <p style={{ fontSize, fontWeight: weight, margin: 0, fontFamily, textAlign: pc.alinhamento, color }}>{...}</p>
}
```

## Resultado Esperado

Apos a correcao, a pagina `/f/demonstracao-crm-mlrb6yoz` exibira o titulo "Demonstracao Gratuita" com font-size equivalente a 35px (2.1875rem), identico ao que aparece no editor e no widget embed.
