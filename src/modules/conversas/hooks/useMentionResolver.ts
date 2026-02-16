/**
 * AIDEV-NOTE: Hook para resolver menções (@numero) em mensagens de grupo
 * Extrai JIDs mencionados do raw_data e busca nomes na tabela contatos
 * Usa React Query com cache para evitar queries repetidas
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Mensagem } from '../services/conversas.api'

/**
 * Extrai todos os números mencionados únicos de um conjunto de mensagens
 * Busca em: _data.message.extendedTextMessage.contextInfo.mentionedJid
 * e também no nível raiz: _data.mentionedIds
 */
function extractMentionedNumbers(mensagens: Mensagem[]): string[] {
  const numbers = new Set<string>()

  for (const msg of mensagens) {
    if (!msg.raw_data) continue
    const rawData = msg.raw_data as Record<string, unknown>
    const _data = rawData._data as Record<string, unknown> | undefined
    if (!_data) continue

    // Path 1: extendedTextMessage.contextInfo.mentionedJid (NOWEB)
    const message = _data.message as Record<string, unknown> | undefined
    const extText = message?.extendedTextMessage as Record<string, unknown> | undefined
    const contextInfo = extText?.contextInfo as Record<string, unknown> | undefined
    const mentionedJid = (contextInfo?.mentionedJid || contextInfo?.mentionedJID) as string[] | undefined

    // Path 2: GOWS uses _data.MentionedJID
    const mentionedJID2 = _data.MentionedJID as string[] | undefined

    // Path 3: raiz do raw_data
    const mentionedIds = rawData.mentionedIds as string[] | undefined

    const allJids = [
      ...(mentionedJid || []),
      ...(mentionedJID2 || []),
      ...(mentionedIds || []),
    ]

    for (const jid of allJids) {
      if (typeof jid === 'string') {
        const num = jid
          .replace('@s.whatsapp.net', '')
          .replace('@c.us', '')
          .replace('@lid', '')
        if (num && /^\d+$/.test(num)) {
          numbers.add(num)
        }
      }
    }
  }

  return Array.from(numbers)
}

/**
 * Busca nomes de contatos pelos números de telefone
 * Retorna Map<numero, nome>
 */
async function fetchContactNames(numbers: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>()
  if (numbers.length === 0) return result

  // Buscar contatos que tenham telefone correspondente
  // Usar OR com ilike para cada numero (últimos 8+ dígitos)
  const filters = numbers.map(n => {
    const suffix = n.length > 8 ? n.slice(-8) : n
    return `telefone.ilike.%${suffix}`
  }).join(',')

  const { data } = await supabase
    .from('contatos')
    .select('nome, nome_fantasia, telefone')
    .or(filters)
    .is('deletado_em', null)
    .limit(100)

  if (!data) return result

  // Mapear cada número mencionado para o nome do contato
  for (const numero of numbers) {
    const suffix = numero.length > 8 ? numero.slice(-8) : numero
    const contato = data.find(c =>
      c.telefone && c.telefone.includes(suffix)
    )
    if (contato) {
      const nome = contato.nome || contato.nome_fantasia
      if (nome) result.set(numero, nome)
    }
  }

  // Também buscar pushNames diretamente das mensagens (para contatos não cadastrados)
  // Isso usa o raw_data das próprias mensagens como fallback
  return result
}

/**
 * Extrai pushNames dos participantes mencionados diretamente do raw_data das mensagens
 * Serve como fallback quando o contato não está cadastrado
 */
function extractPushNamesFromMessages(mensagens: Mensagem[]): Map<string, string> {
  const pushNames = new Map<string, string>()

  for (const msg of mensagens) {
    if (!msg.raw_data) continue
    const rawData = msg.raw_data as Record<string, unknown>
    const _data = rawData._data as Record<string, unknown> | undefined
    if (!_data) continue

    // Extrair pushName do remetente
    const pushName = (_data.pushName || _data.PushName || rawData.pushName || rawData.notifyName) as string | undefined
    const fromNumber = (msg.from_number || msg.participant || '')
      .replace('@s.whatsapp.net', '')
      .replace('@c.us', '')
      .replace('@lid', '')

    if (pushName && fromNumber && /^\d+$/.test(fromNumber)) {
      pushNames.set(fromNumber, pushName)
    }
  }

  return pushNames
}

export interface MentionResolverResult {
  /** Map de numero -> nome para substituir @numero por @nome */
  contactMap: Map<string, string>
  isLoading: boolean
}

/**
 * Hook principal: recebe mensagens, extrai menções, busca nomes
 */
export function useMentionResolver(mensagens: Mensagem[]): MentionResolverResult {
  const mentionedNumbers = useMemo(
    () => extractMentionedNumbers(mensagens),
    [mensagens]
  )

  const pushNamesFromMessages = useMemo(
    () => extractPushNamesFromMessages(mensagens),
    [mensagens]
  )

  const queryKey = useMemo(
    () => ['mention-resolver', ...mentionedNumbers.sort()],
    [mentionedNumbers]
  )

  const { data: dbContactMap, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchContactNames(mentionedNumbers),
    enabled: mentionedNumbers.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10,
  })

  // Merge: DB contacts têm prioridade sobre pushNames
  const contactMap = useMemo(() => {
    const merged = new Map(pushNamesFromMessages)
    if (dbContactMap) {
      for (const [k, v] of dbContactMap) {
        merged.set(k, v) // DB sobrescreve pushName
      }
    }
    return merged
  }, [dbContactMap, pushNamesFromMessages])

  return { contactMap, isLoading }
}
