/**
 * AIDEV-NOTE: Aba E-mail (RF-14.3 Tab 4)
 * Estado vazio com orientação para configurar conexão de e-mail
 */

import { Mail, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function AbaEmail() {
  const navigate = useNavigate()

  return (
    <div className="text-center py-8 space-y-3">
      <Mail className="w-10 h-10 mx-auto text-muted-foreground/30" />
      <div>
        <p className="text-sm font-medium text-foreground">E-mail</p>
        <p className="text-xs text-muted-foreground mt-1">
          Para enviar e-mails, configure sua conexão de e-mail.
        </p>
      </div>
      <button
        type="button"
        onClick={() => navigate('/app/configuracoes/conexoes')}
        className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
      >
        Ir para Configurações
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  )
}
