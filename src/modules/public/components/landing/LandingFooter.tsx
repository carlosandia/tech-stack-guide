import { Link } from 'react-router-dom'
import { LogoRenove } from '@/components/LogoRenove'

/**
 * AIDEV-NOTE: Footer da landing page com links institucionais
 */
export function LandingFooter() {
  return (
    <footer className="py-10 md:py-12 bg-foreground">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <LogoRenove className="h-7" forceWhite />
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm">
            <Link to="/planos" className="text-muted hover:text-primary-foreground transition-colors">
              Planos
            </Link>
            <Link to="/termos" className="text-muted hover:text-primary-foreground transition-colors">
              Termos de Serviço
            </Link>
            <Link to="/privacidade" className="text-muted hover:text-primary-foreground transition-colors">
              Política de Privacidade
            </Link>
          </div>

          {/* CNPJ */}
          <p className="text-xs text-muted">
            Renove Digital LTDA • CNPJ 26.334.241/0001-60
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-muted/20 text-center">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} CRM Renove. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
