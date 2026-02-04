/**
 * AIDEV-NOTE: Utilitarios de Retry e Circuit Breaker
 * Conforme PRD-08 - Secao Retry e Resiliencia
 */

// =====================================================
// Tipos
// =====================================================

export interface RetryOptions {
  maxRetries: number
  baseDelay: number
  maxDelay?: number
  retryableErrors?: string[]
  onRetry?: (error: Error, attempt: number) => void
}

export interface CircuitBreakerConfig {
  failureThreshold: number
  resetTimeout: number // ms
}

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

// =====================================================
// Constantes
// =====================================================

// Erros que devem gerar retry
export const RETRYABLE_ERRORS = [
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EAI_AGAIN',
  'RATE_LIMITED',
  '429',
  '500',
  '502',
  '503',
  '504',
]

// Erros que NAO devem gerar retry
export const NON_RETRYABLE_ERRORS = [
  'INVALID_TOKEN',
  'PERMISSION_DENIED',
  '400',
  '401',
  '403',
  '404',
  '422',
]

// Configuracoes de Circuit Breaker por servico
export const CIRCUIT_BREAKER_CONFIG: Record<string, CircuitBreakerConfig> = {
  meta_capi: { failureThreshold: 5, resetTimeout: 60000 },
  meta_audiences: { failureThreshold: 3, resetTimeout: 120000 },
  waha: { failureThreshold: 3, resetTimeout: 30000 },
  google_calendar: { failureThreshold: 3, resetTimeout: 60000 },
  gmail: { failureThreshold: 3, resetTimeout: 60000 },
  instagram: { failureThreshold: 3, resetTimeout: 60000 },
  smtp: { failureThreshold: 3, resetTimeout: 30000 },
}

// Configuracoes de Retry por tipo de operacao
export const RETRY_CONFIG: Record<string, RetryOptions> = {
  oauth_refresh: { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 },
  capi_event: { maxRetries: 5, baseDelay: 2000, maxDelay: 30000 },
  audience_sync: { maxRetries: 3, baseDelay: 5000, maxDelay: 60000 },
  lead_ads_webhook: { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 },
  whatsapp_send: { maxRetries: 3, baseDelay: 2000, maxDelay: 15000 },
  instagram_send: { maxRetries: 3, baseDelay: 2000, maxDelay: 15000 },
  google_calendar_create: { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 },
  email_send: { maxRetries: 3, baseDelay: 3000, maxDelay: 30000 },
  webhook_saida: { maxRetries: 5, baseDelay: 5000, maxDelay: 30000 },
}

// =====================================================
// Funcoes de Retry
// =====================================================

/**
 * Calcula o delay com exponential backoff e jitter
 * @param attempt Numero da tentativa (1-based)
 * @param baseDelay Delay base em ms
 * @param maxDelay Delay maximo em ms
 * @returns Delay em ms
 */
export function calculateRetryDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number = 60000
): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1)
  const cappedDelay = Math.min(exponentialDelay, maxDelay)
  const jitter = Math.random() * 0.3 * cappedDelay // 0-30% jitter
  return Math.floor(cappedDelay + jitter)
}

/**
 * Verifica se um erro eh retryable
 * @param error Erro a verificar
 * @param customRetryable Lista customizada de erros retryable
 * @returns true se o erro deve gerar retry
 */
export function isRetryableError(
  error: any,
  customRetryable?: string[]
): boolean {
  const errorCode = String(
    error.code || error.status || error.response?.status || ''
  )
  const errorMessage = String(error.message || '')

  const retryable = customRetryable || RETRYABLE_ERRORS

  // Verifica se o codigo do erro esta na lista de retryable
  const isCodeRetryable = retryable.some(code =>
    errorCode.includes(String(code)) || errorMessage.includes(String(code))
  )

  // Verifica se NAO esta na lista de non-retryable
  const isNonRetryable = NON_RETRYABLE_ERRORS.some(code =>
    errorCode.includes(String(code)) || errorMessage.includes(String(code))
  )

  return isCodeRetryable && !isNonRetryable
}

/**
 * Wrapper de retry generico
 * @param operation Operacao a executar
 * @param options Opcoes de retry
 * @returns Resultado da operacao
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const {
    maxRetries,
    baseDelay,
    maxDelay = 60000,
    retryableErrors,
    onRetry
  } = options

  let lastError: Error = new Error('Unknown error')

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error
      const isRetryable = isRetryableError(error, retryableErrors)
      const isLastAttempt = attempt === maxRetries

      if (!isRetryable || isLastAttempt) {
        throw error
      }

      const delay = calculateRetryDelay(attempt, baseDelay, maxDelay)
      onRetry?.(error, attempt)

      console.log(`[Retry] Tentativa ${attempt}/${maxRetries} falhou. Retry em ${delay}ms. Erro: ${error.message}`)

      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Wrapper de retry usando configuracao pre-definida
 * @param operationType Tipo da operacao (key em RETRY_CONFIG)
 * @param operation Operacao a executar
 * @returns Resultado da operacao
 */
export async function withRetryConfig<T>(
  operationType: keyof typeof RETRY_CONFIG,
  operation: () => Promise<T>
): Promise<T> {
  const config = RETRY_CONFIG[operationType]
  if (!config) {
    throw new Error(`Configuracao de retry nao encontrada para: ${operationType}`)
  }
  return withRetry(operation, config)
}

// =====================================================
// Circuit Breaker
// =====================================================

interface CircuitBreakerState {
  state: CircuitState
  failures: number
  lastFailure: number | null
  nextRetry: number | null
}

// Estado dos circuit breakers por servico
const circuitBreakerStates: Map<string, CircuitBreakerState> = new Map()

/**
 * Obtem ou cria o estado de um circuit breaker
 */
function getCircuitState(service: string): CircuitBreakerState {
  if (!circuitBreakerStates.has(service)) {
    circuitBreakerStates.set(service, {
      state: 'CLOSED',
      failures: 0,
      lastFailure: null,
      nextRetry: null,
    })
  }
  return circuitBreakerStates.get(service)!
}

/**
 * Verifica se o circuit breaker permite a requisicao
 * @param service Nome do servico
 * @returns true se a requisicao pode prosseguir
 */
export function canExecute(service: string): boolean {
  const config = CIRCUIT_BREAKER_CONFIG[service]
  if (!config) return true // Sem config = sempre permite

  const state = getCircuitState(service)
  const now = Date.now()

  switch (state.state) {
    case 'CLOSED':
      return true

    case 'OPEN':
      if (state.nextRetry && now >= state.nextRetry) {
        // Tempo de espera passou, vai para HALF_OPEN
        state.state = 'HALF_OPEN'
        return true
      }
      return false

    case 'HALF_OPEN':
      return true
  }
}

/**
 * Registra sucesso no circuit breaker
 * @param service Nome do servico
 */
export function recordSuccess(service: string): void {
  const state = getCircuitState(service)

  if (state.state === 'HALF_OPEN') {
    // Sucesso em HALF_OPEN -> volta para CLOSED
    state.state = 'CLOSED'
  }

  state.failures = 0
  state.lastFailure = null
  state.nextRetry = null
}

/**
 * Registra falha no circuit breaker
 * @param service Nome do servico
 */
export function recordFailure(service: string): void {
  const config = CIRCUIT_BREAKER_CONFIG[service]
  if (!config) return

  const state = getCircuitState(service)
  const now = Date.now()

  state.failures++
  state.lastFailure = now

  if (state.state === 'HALF_OPEN') {
    // Falha em HALF_OPEN -> volta para OPEN
    state.state = 'OPEN'
    state.nextRetry = now + config.resetTimeout
  } else if (state.failures >= config.failureThreshold) {
    // Atingiu threshold -> abre circuito
    state.state = 'OPEN'
    state.nextRetry = now + config.resetTimeout
    console.warn(`[CircuitBreaker] ${service}: Circuito ABERTO apos ${state.failures} falhas`)
  }
}

/**
 * Wrapper que combina Circuit Breaker + Retry
 * @param service Nome do servico
 * @param operationType Tipo da operacao
 * @param operation Operacao a executar
 * @returns Resultado da operacao
 */
export async function withCircuitBreakerAndRetry<T>(
  service: string,
  operationType: keyof typeof RETRY_CONFIG,
  operation: () => Promise<T>
): Promise<T> {
  if (!canExecute(service)) {
    throw new Error(`[CircuitBreaker] Servico ${service} indisponivel (circuito aberto)`)
  }

  try {
    const result = await withRetryConfig(operationType, operation)
    recordSuccess(service)
    return result
  } catch (error) {
    recordFailure(service)
    throw error
  }
}

/**
 * Obtem o estado atual de todos os circuit breakers
 * @returns Mapa de estados
 */
export function getCircuitBreakerStates(): Map<string, CircuitBreakerState> {
  return circuitBreakerStates
}

/**
 * Reseta o circuit breaker de um servico (para testes)
 * @param service Nome do servico
 */
export function resetCircuitBreaker(service: string): void {
  circuitBreakerStates.delete(service)
}
