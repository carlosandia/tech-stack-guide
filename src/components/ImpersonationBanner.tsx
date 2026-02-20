/**
 * AIDEV-NOTE: Banner fixo de impersonação
 * Exibido APENAS quando existe sessão de impersonação VÁLIDA no banco de dados
 * Validação obrigatória: sessão ativa + não expirada + usuário atual é o admin_alvo
 * Não pode ser fechado - apenas encerrado via logout
 *
 * SEGURANÇA: URL params sozinhos NÃO ativam o banner - precisa de sessão válida no BD
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { AlertTriangle, LogOut, Clock } from 'lucide-react'

interface ImpersonationInfo {
  sessao_id: string
  org_nome: string
  timestamp: string
  expira_em: string
}

export function ImpersonationBanner() {
  const [info, setInfo] = useState<ImpersonationInfo | null>(null)
  const [timeLeft, setTimeLeft] = useState('')
  const [validating, setValidating] = useState(true)

  useEffect(() => {
    const validateImpersonation = async () => {
      setValidating(true)

      try {
        // 1. Verificar se há sessão de impersonação ativa para o usuário atual
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          sessionStorage.removeItem('impersonation_active')
          setInfo(null)
          setValidating(false)
          return
        }

        // 2. Buscar usuário no banco para obter o ID interno
        const { data: usuario } = await supabase
          .from('usuarios')
          .select('id, organizacao_id')
          .eq('auth_id', user.id)
          .single()

        if (!usuario) {
          sessionStorage.removeItem('impersonation_active')
          setInfo(null)
          setValidating(false)
          return
        }

        // 3. Verificar se existe sessão de impersonação ATIVA para este usuário como admin_alvo
        // AIDEV-NOTE: Só super_admin pode criar sessões, então se existe uma sessão válida
        // onde este usuário é o admin_alvo, significa que foi criada legitimamente
        const { data: sessao, error: sessaoError } = await supabase
          .from('sessoes_impersonacao')
          .select(`
            id,
            expira_em,
            motivo,
            criado_em,
            organizacoes_saas:organizacao_id (nome)
          `)
          .eq('admin_alvo_id', usuario.id)
          .eq('ativo', true)
          .gt('expira_em', new Date().toISOString())
          .order('criado_em', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (sessaoError || !sessao) {
          // Não há sessão válida - limpar qualquer estado residual
          sessionStorage.removeItem('impersonation_active')
          setInfo(null)

          // Limpar URL params se existirem (tentativa de bypass)
          const urlParams = new URLSearchParams(window.location.search)
          if (urlParams.get('impersonation') === 'true') {
            const newUrl = window.location.pathname
            window.history.replaceState({}, '', newUrl)
          }

          setValidating(false)
          return
        }

        // 4. Sessão válida encontrada - ativar banner
        const orgNome = (sessao.organizacoes_saas as any)?.nome || 'Organização'
        const impersonationData: ImpersonationInfo = {
          sessao_id: sessao.id,
          org_nome: orgNome,
          timestamp: sessao.criado_em,
          expira_em: sessao.expira_em
        }

        sessionStorage.setItem('impersonation_active', JSON.stringify(impersonationData))
        setInfo(impersonationData)

        // Limpar URL params após validação bem-sucedida
        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.has('impersonation') || urlParams.has('org_nome')) {
          const newUrl = window.location.pathname
          window.history.replaceState({}, '', newUrl)
        }

      } catch (error) {
        console.error('[ImpersonationBanner] Erro ao validar sessão:', error)
        sessionStorage.removeItem('impersonation_active')
        setInfo(null)
      } finally {
        setValidating(false)
      }
    }

    validateImpersonation()
  }, [])

  // Timer de tempo restante baseado em expira_em do banco
  useEffect(() => {
    if (!info?.expira_em) return

    const interval = setInterval(() => {
      const expiry = new Date(info.expira_em).getTime()
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
  }, [info?.expira_em])

  const handleEncerrar = async () => {
    try {
      // 1. Encerrar sessão no banco de dados
      if (info?.sessao_id) {
        await supabase
          .from('sessoes_impersonacao')
          .update({
            ativo: false,
            encerrado_em: new Date().toISOString()
          })
          .eq('id', info.sessao_id)
      }
    } catch (error) {
      console.error('[ImpersonationBanner] Erro ao encerrar sessão:', error)
    } finally {
      // 2. Limpar estado local e fazer logout
      sessionStorage.removeItem('impersonation_active')
      await supabase.auth.signOut()
      // Redirecionar para login (Super Admin fará login novamente)
      window.location.href = '/login'
    }
  }

  // Não exibir enquanto valida ou se não há sessão válida
  if (validating || !info) return null

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
