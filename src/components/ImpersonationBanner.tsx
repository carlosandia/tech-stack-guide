/**
 * AIDEV-NOTE: Banner fixo de impersonação
 * Exibido quando o usuário está em modo impersonação (detectado via URL params + sessionStorage)
 * Não pode ser fechado - apenas encerrado via logout
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { AlertTriangle, LogOut, Clock } from 'lucide-react'

export function ImpersonationBanner() {
  const [info, setInfo] = useState<{ org_nome: string; timestamp: string } | null>(null)
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    // Detectar impersonação via URL params na primeira carga
    const urlParams = new URLSearchParams(window.location.search)
    const isImpersonation = urlParams.get('impersonation') === 'true'
    const orgNome = urlParams.get('org_nome')

    if (isImpersonation && orgNome) {
      const data = { org_nome: decodeURIComponent(orgNome), timestamp: new Date().toISOString() }
      sessionStorage.setItem('impersonation_active', JSON.stringify(data))
      setInfo(data)
      // Limpar params da URL sem reload
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
      return
    }

    // Verificar sessionStorage
    const stored = sessionStorage.getItem('impersonation_active')
    if (stored) {
      try {
        setInfo(JSON.parse(stored))
      } catch {
        sessionStorage.removeItem('impersonation_active')
      }
    }
  }, [])

  // Timer de tempo restante (1h desde início)
  useEffect(() => {
    if (!info?.timestamp) return

    const interval = setInterval(() => {
      const start = new Date(info.timestamp).getTime()
      const expiry = start + 60 * 60 * 1000 // 1h
      const remaining = expiry - Date.now()

      if (remaining <= 0) {
        setTimeLeft('Expirado')
        handleEncerrar()
        return
      }

      const mins = Math.floor(remaining / 60000)
      const secs = Math.floor((remaining % 60000) / 1000)
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`)
    }, 1000)

    return () => clearInterval(interval)
  }, [info?.timestamp])

  const handleEncerrar = async () => {
    sessionStorage.removeItem('impersonation_active')
    await supabase.auth.signOut()
    // Redirecionar para login (Super Admin fará login novamente)
    window.location.href = '/login'
  }

  if (!info) return null

  return (
    <div className="flex-shrink-0 z-[999] bg-amber-500 text-amber-950">
      <div className="flex items-center justify-between px-4 py-2 max-w-[1920px] mx-auto">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">
            Modo Impersonação — Visualizando como <strong>{info.org_nome}</strong>
          </span>
          {timeLeft && (
            <span className="flex items-center gap-1 text-xs bg-amber-600/30 px-2 py-0.5 rounded-full">
              <Clock className="w-3 h-3" />
              {timeLeft}
            </span>
          )}
        </div>
        <button
          onClick={handleEncerrar}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-amber-900 text-amber-50 rounded-md hover:bg-amber-800 transition-colors"
        >
          <LogOut className="w-3 h-3" />
          Encerrar
        </button>
      </div>
    </div>
  )
}
