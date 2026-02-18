import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * AIDEV-NOTE: Header fixo da landing page com navegacao por ancoras
 * Segue Design System: Inter, cores semanticas, responsivo mobile-first
 */
export function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = [
    { label: 'Funcionalidades', href: '#funcionalidades' },
    { label: 'Como Funciona', href: '#como-funciona' },
    { label: 'Depoimentos', href: '#depoimentos' },
    { label: 'Planos', href: '/planos' },
    { label: 'FAQ', href: '#faq' },
  ]

  const scrollTo = (href: string) => {
    setMenuOpen(false)
    if (href.startsWith('#')) {
      const el = document.querySelector(href)
      el?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2H20C21.1 2 22 2.9 22 4V8C22 9.7 20.7 11 19 11H12M4 22V2M4 22H8M4 22H0M8 22C8 22 13 22 15 18M15 18L22 22" />
            </svg>
          </div>
          <span className="text-lg font-bold text-foreground">Renove</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) =>
            link.href.startsWith('/') ? (
              <Link
                key={link.label}
                to={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ) : (
              <button
                key={link.label}
                onClick={() => scrollTo(link.href)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </button>
            )
          )}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">Entrar</Button>
          </Link>
          <Link to="/trial">
            <Button size="sm">Teste grátis</Button>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-background border-b border-border px-4 pb-4 space-y-3">
          {navLinks.map((link) =>
            link.href.startsWith('/') ? (
              <Link
                key={link.label}
                to={link.href}
                className="block py-2 text-sm font-medium text-muted-foreground"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ) : (
              <button
                key={link.label}
                onClick={() => scrollTo(link.href)}
                className="block w-full text-left py-2 text-sm font-medium text-muted-foreground"
              >
                {link.label}
              </button>
            )
          )}
          <div className="flex gap-3 pt-2">
            <Link to="/login" className="flex-1">
              <Button variant="outline" className="w-full" size="sm">Entrar</Button>
            </Link>
            <Link to="/trial" className="flex-1">
              <Button className="w-full" size="sm">Teste grátis</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
