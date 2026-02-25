/**
 * AIDEV-NOTE: Hook para resolver menções (@numero) em mensagens de grupo
 * Extrai JIDs mencionados do raw_data e busca nomes via:
 * 1. PushNames dos participantes nas proprias mensagens (mapeia LID -> pushName)
 * 2. Contatos cadastrados na base (via telefone)
 * 3. [GOWS LID] Busca na tabela mensagens por participant com LID para extrair from_number/pushName
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

/**
 * AIDEV-NOTE: Resolve LIDs do GOWS buscando na tabela mensagens.
 * LIDs são identificadores internos do WhatsApp que não correspondem a telefones reais.
 * Busca mensagens onde participant = LID@lid em QUALQUER conversa (cross-grupo)
 * para extrair from_number e pushName.
 * Com o from_number, busca o nome do contato no DB.
 */
async function resolveLids(
  lids: string[]
): Promise<Map<string, string>> {
  const result = new Map<string, string>()
  if (lids.length === 0) return result

  // AIDEV-NOTE: Busca cross-conversa - o LID pode ter enviado msgs em outro grupo
  const participantFilters = lids.map(lid => `${lid}@lid`)

  const { data: mensagensData } = await supabase
    .from('mensagens')
    .select('from_number, participant, raw_data')
    .in('participant', participantFilters)
    .limit(lids.length * 5) // algumas mensagens por LID, cross-grupo

  if (!mensagensData || mensagensData.length === 0) return result

  // Mapear LID -> from_number e LID -> pushName
  const lidToFromNumber = new Map<string, string>()
  const lidToPushName = new Map<string, string>()

  for (const msg of mensagensData) {
    const participant = (msg.participant || '') as string
    const lidClean = participant.replace('@lid', '').replace('@s.whatsapp.net', '').replace('@c.us', '')

    if (!lids.includes(lidClean)) continue

    // Extrair from_number (numero real) - tentar from_number e SenderAlt do GOWS
    const rawData = msg.raw_data as Record<string, unknown> | null
    const _data = rawData?._data as Record<string, unknown> | undefined
    const info = _data?.Info as Record<string, unknown> | undefined
    // AIDEV-NOTE: SenderAlt contém o número real no formato 5511999999999:NN@s.whatsapp.net
    const senderAlt = ((info?.SenderAlt || '') as string)
      .replace(/:.*$/, '') // remove :NN@s.whatsapp.net
    const fromNumberRaw = ((msg.from_number || '') as string)
      .replace('@s.whatsapp.net', '')
      .replace('@c.us', '')
      .replace('@lid', '')
      .replace('@g.us', '')
    // Preferir SenderAlt (número real) sobre from_number (pode ser grupo @g.us)
    const fromNumber = (senderAlt && /^\d+$/.test(senderAlt)) ? senderAlt : fromNumberRaw
    if (fromNumber && /^\d+$/.test(fromNumber) && fromNumber.length <= 15 && !lidToFromNumber.has(lidClean)) {
      lidToFromNumber.set(lidClean, fromNumber)
    }

    // Extrair pushName do raw_data como fallback (reutiliza rawData/_data/info já extraídos)
    if (!lidToPushName.has(lidClean)) {
      const pushName = (
        info?.PushName ||
        _data?.pushName ||
        _data?.PushName ||
        rawData?.pushName ||
        rawData?.notifyName
      ) as string | undefined
      if (pushName) {
        lidToPushName.set(lidClean, pushName)
      }
    }
  }

  // Com os from_numbers encontrados, buscar nomes de contatos no DB
  const fromNumbers = Array.from(lidToFromNumber.values())
  const contactNames = await fetchContactNames(fromNumbers)

  // Montar resultado: LID -> nome do contato (via from_number) ou pushName
  for (const lid of lids) {
    const fromNumber = lidToFromNumber.get(lid)
    if (fromNumber) {
      const contactName = contactNames.get(fromNumber)
      if (contactName) {
        result.set(lid, contactName)
        continue
      }
    }
    // Fallback: pushName
    const pushName = lidToPushName.get(lid)
    if (pushName) {
      result.set(lid, pushName)
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
 * Prioridade: contatos do DB > pushNames dos participantes > LID resolve (DB mensagens) > numero formatado
 */
export function useMentionResolver(mensagens: Mensagem[], _conversaId?: string): MentionResolverResult {
  const mentionedNumbers = useMemo(
    () => extractMentionedNumbers(mensagens),
    [mensagens]
  )

  // AIDEV-NOTE: Extrai pushNames de TODOS os participantes do grupo
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

  // AIDEV-NOTE: Detectar LIDs não resolvidos pelas fontes 1 e 2
  // LIDs tipicamente têm mais de 15 dígitos e não são telefones reais
  const unresolvedLids = useMemo(() => {
    return mentionedNumbers.filter(num => {
      // Já resolvido pelo DB de contatos?
      if (dbContactMap?.has(num)) return false
      // Já resolvido pelo pushName dos participantes?
      if (participantNames.has(num)) return false
      // LIDs do GOWS têm tipicamente 15+ dígitos
      return num.length >= 15
    })
  }, [mentionedNumbers, dbContactMap, participantNames])

  // AIDEV-NOTE: Segunda query para resolver LIDs via tabela mensagens (cross-conversa)
  const { data: lidResolvedMap, isLoading: isLoadingLids } = useQuery({
    queryKey: ['mention-lid-resolver', ...unresolvedLids.sort()],
    queryFn: () => resolveLids(unresolvedLids),
    enabled: unresolvedLids.length > 0,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  })

  // Merge: DB contacts > LID resolved > participantNames (pushNames)
  const contactMap = useMemo(() => {
    const merged = new Map(participantNames)
    // LID resolved sobrescreve pushNames locais
    if (lidResolvedMap) {
      for (const [k, v] of lidResolvedMap) {
        merged.set(k, v)
      }
    }
    // DB contacts sobrescreve tudo
    if (dbContactMap) {
      for (const [k, v] of dbContactMap) {
        merged.set(k, v)
      }
    }
    return merged
  }, [dbContactMap, participantNames, lidResolvedMap])

  return { contactMap, isLoading: isLoading || isLoadingLids }
}
