import { Link } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/**
 * AIDEV-NOTE: Dialog inline com resumo dos Termos de Serviço
 * Exibido dentro do fluxo de checkout para não interromper a contratação.
 * Link para versão completa em /termos.
 */

interface TermosResumoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TermosResumoDialog({ open, onOpenChange }: TermosResumoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground">
            Termos de Serviço
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 pr-2 space-y-4 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h3 className="font-semibold text-foreground mb-1">1. Objeto</h3>
            <p>O CRM Renove é uma plataforma SaaS de gestão de relacionamento com clientes. Ao contratar, você obtém acesso às funcionalidades do plano escolhido durante a vigência da assinatura.</p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-1">2. Cadastro e Responsabilidade</h3>
            <p>Você é responsável pela veracidade dos dados informados e pela segurança das suas credenciais de acesso. Cada conta é pessoal e intransferível dentro da organização contratante.</p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-1">3. Planos e Pagamento</h3>
            <p>A cobrança é realizada de forma recorrente (mensal ou anual) via Stripe. O não pagamento pode resultar na suspensão do acesso. Cancelamentos podem ser feitos a qualquer momento, com efeito ao final do período vigente.</p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-1">4. Uso Aceitável</h3>
            <p>É proibido usar a plataforma para atividades ilegais, spam, engenharia reversa ou qualquer prática que comprometa a segurança ou desempenho do serviço.</p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-1">5. Propriedade dos Dados</h3>
            <p>Os dados inseridos por você permanecem de sua propriedade. A Renove Digital atua apenas como operadora, garantindo o armazenamento seguro conforme a LGPD.</p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-1">6. SLA e Disponibilidade</h3>
            <p>Nos comprometemos com 99,5% de disponibilidade mensal. Manutenções programadas serão comunicadas com antecedência.</p>
          </section>

          <div className="pt-2 border-t border-border">
            <Link
              to="/termos"
              target="_blank"
              className="text-primary hover:underline text-xs font-medium"
            >
              Ver versão completa dos Termos de Serviço →
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
