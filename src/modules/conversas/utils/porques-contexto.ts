/**
 * AIDEV-NOTE: Lógica contextual para resolver os 4 "porquês" da língua portuguesa
 * Analisa a posição de "pq" no texto e retorna sugestões ordenadas por probabilidade
 *
 * Regras:
 * 1. Início de frase → "Por que" (pergunta) priorizado
 * 2. Meio de frase → "porque" (explicação) priorizado
 * 3. Após artigo (o, do, pelo) → "porquê" (substantivo)
 * 4. Final de frase (antes de . ? !) → "por quê" priorizado
 */

/** Artigos que indicam uso substantivado do "porquê" */
const ARTIGOS_SUBSTANTIVO = ['o', 'do', 'pelo', 'todo', 'um', 'cada', 'este', 'esse', 'aquele']

/**
 * Extrai a palavra imediatamente antes da posição `start` no texto
 */
function palavraAnterior(texto: string, start: number): string {
  let i = start - 1
  // Pular espaços
  while (i >= 0 && texto[i] === ' ') i--
  if (i < 0) return ''

  let fim = i + 1
  while (i >= 0 && /\S/.test(texto[i])) i--

  return texto.slice(i + 1, fim).toLowerCase()
}

/**
 * Verifica se a posição é início de frase
 * (após . ! ? ou no começo do texto)
 */
function isInicioDeFrase(texto: string, start: number): boolean {
  if (start === 0) return true

  let i = start - 1
  // Pular espaços
  while (i >= 0 && texto[i] === ' ') i--
  if (i < 0) return true

  return /[.!?]/.test(texto[i])
}

/**
 * Verifica se a posição é final de frase
 * (seguido de . ? ! ou fim do texto)
 */
function isFinalDeFrase(texto: string, end: number): boolean {
  let i = end
  // Pular espaços
  while (i < texto.length && texto[i] === ' ') i++

  if (i >= texto.length) return true
  return /[.!?]/.test(texto[i])
}

/**
 * Verifica se há interrogação após a posição
 */
function temInterrogacao(texto: string, end: number): boolean {
  let i = end
  while (i < texto.length && texto[i] === ' ') i++
  return texto[i] === '?'
}

/**
 * Resolve as sugestões para "pq" com base no contexto da frase
 * Retorna array de sugestões ordenadas da mais provável para menos provável
 */
export function resolverPorques(texto: string, start: number, end: number): string[] {
  const anterior = palavraAnterior(texto, start)

  // AIDEV-NOTE: Regra 3 — Após artigo → substantivo "porquê"
  if (ARTIGOS_SUBSTANTIVO.includes(anterior)) {
    return ['porquê']
  }

  const inicioFrase = isInicioDeFrase(texto, start)
  const finalFrase = isFinalDeFrase(texto, end)
  const interrogacao = temInterrogacao(texto, end)

  // AIDEV-NOTE: Regra 4 — Final de frase com interrogação
  if (interrogacao) {
    return inicioFrase
      ? ['Por quê', 'Por que']
      : ['por quê', 'por que']
  }

  // AIDEV-NOTE: Regra 4 — Final de frase (ponto/exclamação/fim do texto)
  if (finalFrase && !inicioFrase) {
    return ['por quê', 'por que']
  }

  // AIDEV-NOTE: Regra 1 — Início de frase → provável pergunta
  if (inicioFrase) {
    return ['Por que', 'Porque']
  }

  // AIDEV-NOTE: Regra 2 — Meio de frase → provável explicação
  return ['porque', 'por que']
}
