import { Link } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/**
 * AIDEV-NOTE: Dialog inline com resumo da Política de Privacidade
 * Exibido dentro do fluxo de checkout para não interromper a contratação.
 * Link para versão completa em /privacidade.
 */

interface PrivacidadeResumoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PrivacidadeResumoDialog({ open, onOpenChange }: PrivacidadeResumoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground">
            Política de Privacidade
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 pr-2 space-y-4 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h3 className="font-semibold text-foreground mb-1">1. Dados Coletados</h3>
            <p>Coletamos dados de identificação (nome, e-mail, telefone), dados de uso da plataforma e dados de pagamento processados via Stripe. Não armazenamos dados de cartão de crédito.</p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-1">2. Finalidade</h3>
            <p>Seus dados são utilizados para prestação do serviço, comunicação sobre a conta, melhorias na plataforma e cumprimento de obrigações legais.</p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-1">3. Compartilhamento</h3>
            <p>Compartilhamos dados apenas com processadores essenciais (Supabase, Stripe) e quando exigido por lei. Nunca vendemos seus dados a terceiros.</p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-1">4. Segurança</h3>
            <p>Utilizamos criptografia em trânsito (TLS) e em repouso, isolamento multi-tenant via Row Level Security e backups automáticos.</p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-1">5. Seus Direitos (LGPD)</h3>
            <p>Você pode solicitar acesso, correção, exclusão ou portabilidade dos seus dados a qualquer momento pelo e-mail crm@renovedigital.com.br.</p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-1">6. Retenção</h3>
            <p>Dados são mantidos enquanto a conta estiver ativa. Após cancelamento, são retidos por 90 dias para eventual reativação e depois removidos.</p>
          </section>

          <div className="pt-2 border-t border-border">
            <Link
              to="/privacidade"
              target="_blank"
              className="text-primary hover:underline text-xs font-medium"
            >
              Ver versão completa da Política de Privacidade →
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
