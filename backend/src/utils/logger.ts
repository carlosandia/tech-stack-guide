import winston from 'winston'
import { env } from '../config/env.js'

/**
 * AIDEV-NOTE: Logger centralizado com Winston
 * Todos logs devem passar por aqui para consistencia
 */

const { combine, timestamp, printf, colorize, errors } = winston.format

// Formato customizado
const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  let log = `${timestamp} [${level}]: ${message}`

  if (Object.keys(meta).length > 0) {
    log += ` ${JSON.stringify(meta)}`
  }

  if (stack) {
    log += `\n${stack}`
  }

  return log
})

// Configuracao do logger
export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        logFormat
      ),
    }),
  ],
})

// Em producao, adiciona arquivo de log
if (env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    })
  )
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
    })
  )
}
