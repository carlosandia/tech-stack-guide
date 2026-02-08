/**
 * AIDEV-NOTE: Badge de emails não lidos para o menu de navegação (RF-011)
 */

import { useContadorNaoLidos } from '../hooks/useEmails'

export function EmailBadge() {
  const { data } = useContadorNaoLidos()
  const count = data?.inbox || 0

  if (count === 0) return null

  return (
    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold ml-1">
      {count > 99 ? '99+' : count}
    </span>
  )
}
