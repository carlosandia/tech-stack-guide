/**
 * AIDEV-NOTE: Hook para resolver menções (@numero) em mensagens de grupo
 * Extrai JIDs mencionados do raw_data e busca nomes via:
 * 1. PushNames dos participantes nas proprias mensagens (mapeia LID -> pushName)
 * 2. Contatos cadastrados na base (via telefone)
 * Usa React Query com cache para evitar queries repetidas
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Mensagem } from '../services/conversas.api'

/**
 * Extrai todos os números mencionados únicos de um conjunto de mensagens
 * Busca em múltiplos caminhos do raw_data (NOWEB e GOWS)
 */
function extractMentionedNumbers(mensagens: Mensagem[]): string[] {
  const numbers = new Set<string>()

  for (const msg of mensagens) {
    if (!msg.raw_data) continue
    const rawData = msg.raw_data as Record<string, unknown>
    const _data = rawData._data as Record<string, unknown> | undefined
    if (!_data) continue

    // AIDEV-NOTE: GOWS usa PascalCase (Message), NOWEB usa camelCase (message)
    const message = (_data.Message || _data.message) as Record<string, unknown> | undefined
    const extText = message?.extendedTextMessage as Record<string, unknown> | undefined
    const contextInfo = extText?.contextInfo as Record<string, unknown> | undefined
    const mentionedJid = (contextInfo?.mentionedJid || contextInfo?.mentionedJID) as string[] | undefined

    // GOWS top-level MentionedJID
    const mentionedJID2 = _data.MentionedJID as string[] | undefined

    // Raiz do raw_data
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
 * AIDEV-NOTE: Extrai mapeamento LID -> pushName e numero_real -> pushName
 * das mensagens da conversa. Isso resolve menções @lid que não existem
 * como contatos cadastrados, usando o pushName de quem enviou mensagens no grupo.
 * 
 * Também mapeia participant (LID) -> pushName para resolver menções por LID.
 */
function extractParticipantNames(mensagens: Mensagem[]): Map<string, string> {
  const nameMap = new Map<string, string>()

  for (const msg of mensagens) {
    if (!msg.raw_data || msg.from_me) continue
    const rawData = msg.raw_data as Record<string, unknown>
    const _data = rawData._data as Record<string, unknown> | undefined
    if (!_data) continue

    // Extrair pushName
    const info = _data.Info as Record<string, unknown> | undefined
    const pushName = (
      info?.PushName ||
      _data.pushName ||
      _data.PushName ||
      rawData.pushName ||
      rawData.notifyName
    ) as string | undefined

    if (!pushName) continue

    // Mapear por participant (pode ser LID)
    const participant = msg.participant || ''
    const participantClean = participant
      .replace('@s.whatsapp.net', '')
      .replace('@c.us', '')
      .replace('@lid', '')
    if (participantClean && /^\d+$/.test(participantClean)) {
      nameMap.set(participantClean, pushName)
    }

    // Mapear por Sender (LID do GOWS)
    const sender = (info?.Sender || '') as string
    const senderClean = sender
      .replace('@s.whatsapp.net', '')
      .replace('@c.us', '')
      .replace('@lid', '')
    if (senderClean && /^\d+$/.test(senderClean) && senderClean !== participantClean) {
      nameMap.set(senderClean, pushName)
    }

    // Mapear por from_number (numero real)
    const fromNumber = (msg.from_number || '')
      .replace('@s.whatsapp.net', '')
      .replace('@c.us', '')
      .replace('@lid', '')
    if (fromNumber && /^\d+$/.test(fromNumber)) {
      nameMap.set(fromNumber, pushName)
    }
  }

  return nameMap
}

/**
 * Busca nomes de contatos pelos números de telefone
 * Retorna Map<numero, nome>
 */
async function fetchContactNames(numbers: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>()
  if (numbers.length === 0) return result

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

  return result
}

export interface MentionResolverResult {
  /** Map de numero -> nome para substituir @numero por @nome */
  contactMap: Map<string, string>
  isLoading: boolean
}

/**
 * Hook principal: recebe mensagens, extrai menções, busca nomes
 * Prioridade: contatos do DB > pushNames dos participantes > numero formatado
 */
export function useMentionResolver(mensagens: Mensagem[]): MentionResolverResult {
  const mentionedNumbers = useMemo(
    () => extractMentionedNumbers(mensagens),
    [mensagens]
  )

  // AIDEV-NOTE: Extrai pushNames de TODOS os participantes do grupo
  // Isso resolve menções @lid onde o mencionado já enviou mensagem no grupo
  const participantNames = useMemo(
    () => extractParticipantNames(mensagens),
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
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  })

  // Merge: DB contacts > participantNames (pushNames)
  const contactMap = useMemo(() => {
    const merged = new Map(participantNames)
    if (dbContactMap) {
      for (const [k, v] of dbContactMap) {
        merged.set(k, v) // DB sobrescreve pushName
      }
    }
    return merged
  }, [dbContactMap, participantNames])

  return { contactMap, isLoading }
}
