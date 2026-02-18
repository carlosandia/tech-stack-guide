import { Link } from 'react-router-dom'

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
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2H20C21.1 2 22 2.9 22 4V8C22 9.7 20.7 11 19 11H12M4 22V2M4 22H8M4 22H0M8 22C8 22 13 22 15 18M15 18L22 22" />
              </svg>
            </div>
            <span className="text-sm font-bold text-primary-foreground">CRM Renove</span>
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
