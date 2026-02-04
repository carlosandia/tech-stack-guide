/**
 * AIDEV-NOTE: Utilitarios de criptografia para tokens OAuth
 * Conforme PRD-08 - Tokens devem ser armazenados criptografados (AES-256)
 */

import CryptoJS from 'crypto-js'
import { env } from '../config/env'

// AIDEV-NOTE: ENCRYPTION_KEY deve ser definida em .env (32 bytes para AES-256)
const ENCRYPTION_KEY = env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY || 'default-key-change-in-production'

/**
 * Criptografa um valor usando AES-256
 * @param plainText Texto a ser criptografado
 * @returns Texto criptografado em base64
 */
export function encrypt(plainText: string): string {
  if (!plainText) return ''

  const encrypted = CryptoJS.AES.encrypt(plainText, ENCRYPTION_KEY)
  return encrypted.toString()
}

/**
 * Descriptografa um valor criptografado com AES-256
 * @param encryptedText Texto criptografado em base64
 * @returns Texto original ou string vazia se falhar
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return ''

  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY)
    const decrypted = bytes.toString(CryptoJS.enc.Utf8)
    return decrypted
  } catch (error) {
    console.error('Erro ao descriptografar:', error)
    return ''
  }
}

/**
 * Gera hash SHA256 de um valor (para envio ao Meta)
 * @param value Valor a ser hashado
 * @returns Hash SHA256 em hexadecimal (lowercase)
 */
export function sha256(value: string): string {
  if (!value) return ''

  // Normalizar: lowercase, trim
  const normalized = value.toLowerCase().trim()
  return CryptoJS.SHA256(normalized).toString(CryptoJS.enc.Hex)
}

/**
 * Gera um state aleatorio para OAuth
 * @param length Tamanho do state (default: 32)
 * @returns String aleatoria
 */
export function generateState(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return result
}

/**
 * Gera um idempotency key unico para operacoes
 * @param organizacaoId ID da organizacao
 * @param tipo Tipo da operacao
 * @param entidadeId ID da entidade
 * @param acao Acao realizada
 * @returns Idempotency key
 */
export function generateIdempotencyKey(
  organizacaoId?: string,
  tipo?: string,
  entidadeId?: string,
  acao?: string
): string {
  // Se nenhum argumento for fornecido, gera um UUID simples
  if (!organizacaoId && !tipo && !entidadeId && !acao) {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
  }
  return `${organizacaoId}:${tipo}:${entidadeId}:${acao}`
}

/**
 * Valida se uma string parece ser um token valido
 * @param token Token a validar
 * @returns true se parecer valido
 */
export function isValidToken(token: string | null | undefined): boolean {
  if (!token) return false
  // Tokens OAuth geralmente tem pelo menos 20 caracteres
  return token.length >= 20
}
