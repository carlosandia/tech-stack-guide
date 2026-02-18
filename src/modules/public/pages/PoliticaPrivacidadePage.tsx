import { Link } from 'react-router-dom'
import renoveLogo from '@/assets/logotipo-renove.svg'
import { PrivacidadeConteudo } from '../components/PrivacidadeConteudo'

/**
 * AIDEV-NOTE: Página pública de Política de Privacidade
 * Conforme LGPD e requisitos Meta/Google Ads
 * URL: /privacidade
 * Usa componente compartilhado PrivacidadeConteudo (sincronizado com dialog do checkout)
 */

export function PoliticaPrivacidadePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/planos" className="flex items-center gap-2">
              <img src={renoveLogo} alt="CRM Renove" className="h-8" />
            </Link>
            <Link
              to="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Já tem conta? Entrar
            </Link>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Política de Privacidade</h1>
          <p className="text-sm text-muted-foreground">Última atualização: 18 de fevereiro de 2026</p>
        </div>

        <PrivacidadeConteudo />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={renoveLogo} alt="CRM Renove" className="h-6" />
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link to="/termos" className="hover:text-foreground transition-colors">
                Termos de Serviço
              </Link>
              <span>|</span>
              <span className="text-foreground font-medium">Política de Privacidade</span>
              <span>|</span>
              <Link to="/planos" className="hover:text-foreground transition-colors">
                Planos
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Renove Digital. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
