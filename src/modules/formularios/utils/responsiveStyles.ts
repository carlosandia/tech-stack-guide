/**
 * AIDEV-NOTE: Utilitário para resolver estilos responsivos
 * Gera CSS com media queries para Desktop/Tablet/Mobile
 */

/**
 * Resolve o valor de uma propriedade responsiva para um dado breakpoint.
 * Herda do desktop se não houver override.
 */
export function resolveValue(
  estilos: Record<string, unknown>,
  campo: string,
  device: 'desktop' | 'tablet' | 'mobile'
): string | undefined {
  if (device === 'desktop') {
    return estilos[campo] as string | undefined
  }
  const override = estilos[`${campo}_${device}`] as string | undefined
  return override || (estilos[campo] as string | undefined)
}

/**
 * Gera uma tag <style> com media queries para propriedades responsivas.
 * @param selector - CSS selector (ex: '.form-btn-submit')
 * @param rules - Array de { prop: CSS property, field: campo no estilo, estilos }
 */
export interface ResponsiveRule {
  prop: string       // CSS property (e.g. 'width', 'font-size')
  field: string      // field name in estilos (e.g. 'largura', 'font_size')
  estilos: Record<string, unknown>
  transform?: (val: string) => string // optional transform (e.g. 'full' -> '100%')
}

export function generateResponsiveCss(
  selector: string,
  rules: ResponsiveRule[]
): string {
  const tabletRules: string[] = []
  const mobileRules: string[] = []

  for (const { prop, field, estilos, transform } of rules) {
    const tabletVal = estilos[`${field}_tablet`] as string | undefined
    const mobileVal = estilos[`${field}_mobile`] as string | undefined

    if (tabletVal) {
      const v = transform ? transform(tabletVal) : tabletVal
      tabletRules.push(`  ${prop}: ${v} !important;`)
    }
    if (mobileVal) {
      const v = transform ? transform(mobileVal) : mobileVal
      mobileRules.push(`  ${prop}: ${v} !important;`)
    }
  }

  let css = ''
  if (tabletRules.length) {
    css += `@media (min-width: 768px) and (max-width: 1023px) {\n  ${selector} {\n  ${tabletRules.join('\n  ')}\n  }\n}\n`
  }
  if (mobileRules.length) {
    css += `@media (max-width: 767px) {\n  ${selector} {\n  ${mobileRules.join('\n  ')}\n  }\n}\n`
  }
  return css
}

/** Transform largura value from select to CSS */
export function larguraToCSS(val: string): string {
  if (val === 'full') return '100%'
  if (val === 'auto') return 'auto'
  return val
}

/**
 * AIDEV-NOTE: Gera CSS responsivo para blocos de colunas
 * Default inteligente: se larguras_mobile não definido, empilha 100%
 */
export function generateColunasResponsiveCss(
  blocoId: string,
  config: { colunas: number; larguras: string; larguras_tablet?: string; larguras_mobile?: string }
): string {
  const selector = `[data-bloco-id="${blocoId}"]`
  let css = ''

  // Tablet
  if (config.larguras_tablet) {
    const widths = config.larguras_tablet.split(',').map(l => l.trim())
    css += `@media (min-width: 768px) and (max-width: 1023px) {\n  ${selector} { flex-wrap: wrap !important; }\n`
    widths.forEach((w, i) => {
      css += `  ${selector} > .col-${i} { width: ${w} !important; }\n`
    })
    css += `}\n`
  }

  // Mobile - default to 100% each column (stacking) if not specified
  const mobileLarguras = config.larguras_mobile || Array(config.colunas).fill('100%').join(',')
  const mobileWidths = mobileLarguras.split(',').map(l => l.trim())
  css += `@media (max-width: 767px) {\n  ${selector} { flex-wrap: wrap !important; }\n`
  mobileWidths.forEach((w, i) => {
    css += `  ${selector} > .col-${i} { width: ${w} !important; }\n`
  })
  css += `}\n`

  return css
}

/** Generate all responsive CSS for a form */
export function generateFormResponsiveCss(
  formId: string,
  botao?: Record<string, unknown>,
  container?: Record<string, unknown>,
  campos?: Record<string, unknown>,
): string {
  let css = ''
  const prefix = `[data-form-id="${formId}"]`

  if (botao) {
    css += generateResponsiveCss(`${prefix} .form-btn-submit`, [
      { prop: 'width', field: 'largura', estilos: botao, transform: larguraToCSS },
      { prop: 'height', field: 'altura', estilos: botao },
      { prop: 'font-size', field: 'font_size', estilos: botao },
    ])
    css += generateResponsiveCss(`${prefix} .form-btn-whatsapp`, [
      { prop: 'width', field: 'whatsapp_largura', estilos: botao, transform: larguraToCSS },
      { prop: 'height', field: 'whatsapp_altura', estilos: botao },
      { prop: 'font-size', field: 'whatsapp_font_size', estilos: botao },
    ])
    // Responsive: botões wrapper - empilhar no mobile se necessário
    const mLargura = botao.largura_mobile as string | undefined
    const mWLargura = botao.whatsapp_largura_mobile as string | undefined
    if (mLargura || mWLargura) {
      const shouldStack = larguraToCSS(mLargura || botao.largura as string || 'full') === '100%' || larguraToCSS(mWLargura || botao.whatsapp_largura as string || 'full') === '100%'
      if (shouldStack) {
        css += `@media (max-width: 767px) {\n  ${prefix} .form-btns-wrapper { flex-direction: column !important; }\n  ${prefix} .form-btns-wrapper > div { width: 100% !important; }\n}\n`
      }
    }
    const tLargura = botao.largura_tablet as string | undefined
    const tWLargura = botao.whatsapp_largura_tablet as string | undefined
    if (tLargura || tWLargura) {
      const shouldStack = larguraToCSS(tLargura || botao.largura as string || 'full') === '100%' || larguraToCSS(tWLargura || botao.whatsapp_largura as string || 'full') === '100%'
      if (shouldStack) {
        css += `@media (min-width: 768px) and (max-width: 1023px) {\n  ${prefix} .form-btns-wrapper { flex-direction: column !important; }\n  ${prefix} .form-btns-wrapper > div { width: 100% !important; }\n}\n`
      }
    }
  }

  if (container) {
    css += generateResponsiveCss(`${prefix} .form-container, ${prefix}[data-form-container]`, [
      { prop: 'padding-top', field: 'padding_top', estilos: container, transform: v => `${v}px` },
      { prop: 'padding-right', field: 'padding_right', estilos: container, transform: v => `${v}px` },
      { prop: 'padding-bottom', field: 'padding_bottom', estilos: container, transform: v => `${v}px` },
      { prop: 'padding-left', field: 'padding_left', estilos: container, transform: v => `${v}px` },
      { prop: 'max-width', field: 'max_width', estilos: container },
    ])
  }

  if (campos) {
    css += generateResponsiveCss(`${prefix} .form-input-field`, [
      { prop: 'height', field: 'input_height', estilos: campos },
    ])
    css += generateResponsiveCss(`${prefix} .form-label`, [
      { prop: 'font-size', field: 'label_tamanho', estilos: campos },
    ])
  }

  return css
}
