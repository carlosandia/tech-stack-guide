import { useState, useEffect } from 'react'
import renoveLogo from '@/assets/logotipo-renove.svg'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { LoginForm } from '../components/LoginForm'
import { useAuth } from '@/providers/AuthProvider'
import { useLoginBanner } from '../hooks/useLoginBanner'

/**
 * AIDEV-NOTE: Pagina de Login - Layout Split-Screen (estilo Pipefy)
 * Conforme PRD-03 - Interface de Login (RF-021)
 * Rota: /login
 * Redirecionamento por role:
 * - super_admin → /admin
 * - admin/member → /app
 *
 * Layout:
 * - Desktop/Tablet (>= 768px): formulario esquerda + banner direita
 * - Mobile (< 768px): banner topo + formulario abaixo
 */

// URLs de politica e termos (rotas internas)
const PRIVACY_URL = '/privacidade'
const TERMS_URL = '/termos'

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated, role, loading: authLoading, signIn } = useAuth()
  const { data: bannerConfig } = useLoginBanner()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Mensagem de sucesso apos reset de senha
  const successMessage = searchParams.get('success')

  // Redireciona se ja autenticado
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const redirectTo = role === 'super_admin' ? '/admin' : '/negocios'
      navigate(redirectTo, { replace: true })
    }
  }, [isAuthenticated, role, authLoading, navigate])

  const handleLogin = async (data: { email: string; senha: string; lembrar?: boolean }) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn(data.email, data.senha, data.lembrar)

      if (result.error) {
        const errorMessage = result.error.message
        if (errorMessage.includes('Invalid login credentials')) {
          setError('E-mail ou senha incorretos')
        } else if (errorMessage.includes('Email not confirmed')) {
          setError('Confirme seu e-mail antes de fazer login')
        } else {
          setError('Erro ao fazer login. Tente novamente.')
        }
        return
      }

      if (result.user) {
        const redirectTo = result.user.role === 'super_admin' ? '/admin' : '/negocios'
        navigate(redirectTo, { replace: true })
      }
    } catch {
      setError('E-mail ou senha incorretos')
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  const bgColor = bannerConfig?.background_color || '#F8FAFC'
  const desktopImg = bannerConfig?.desktop_image_url
  const tabletImg = bannerConfig?.tablet_image_url
  const mobileImg = bannerConfig?.mobile_image_url
  const linkUrl = bannerConfig?.link_url

  // Imagem do banner com fallback: tablet → desktop
  const bannerDesktop = desktopImg || ''
  const bannerTablet = tabletImg || desktopImg || ''
  const bannerMobile = mobileImg || ''

  const BannerImage = ({ src, className }: { src: string; className?: string }) => {
    if (!src) return null

    const img = (
      <img
        src={src}
        alt="Banner"
        className={`w-full h-full object-cover ${className || ''}`}
      />
    )

    if (linkUrl) {
      return (
        <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
          {img}
        </a>
      )
    }

    return img
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* === Mobile Banner (topo, < 768px) === */}
      {bannerMobile && (
        <div
          className="md:hidden w-full h-[200px] flex-shrink-0"
          style={{ backgroundColor: bgColor }}
        >
          <BannerImage src={bannerMobile} />
        </div>
      )}

      {/* === Lado Esquerdo: Formulário === */}
      <div className="md:w-[38%] flex-shrink-0 flex flex-col items-center justify-between bg-background px-4 py-8 md:py-12 md:px-8 lg:px-16 min-h-0 md:min-h-screen">
        {/* Spacer top */}
        <div className="flex-1" />

        <div className="w-full max-w-[400px] space-y-8">
          {/* Logo */}
          <div className="flex flex-col items-center">
            <img src={renoveLogo} alt="Renove" className="h-10" />
          </div>

          {/* Card */}
          <div className="space-y-6">
            {/* Mensagem de sucesso */}
            {successMessage && (
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-md">
                <p className="text-sm text-primary">
                  {successMessage === 'password_reset'
                    ? 'Senha alterada com sucesso! Faça login com sua nova senha.'
                    : successMessage}
                </p>
              </div>
            )}

            <LoginForm
              onSubmit={handleLogin}
              isLoading={isLoading}
              error={error}
            />
          </div>
        </div>

        {/* Spacer bottom */}
        <div className="flex-1" />

        {/* Links de Politica e Termos - rodapé fixo */}
        <div className="text-center text-xs text-muted-foreground py-4">
          <Link
            to={PRIVACY_URL}
            className="hover:text-foreground hover:underline transition-colors"
          >
            Política de Privacidade
          </Link>
          <span className="mx-2">•</span>
          <Link
            to={TERMS_URL}
            className="hover:text-foreground hover:underline transition-colors"
          >
            Termos de Serviço
          </Link>
        </div>
      </div>

      {/* === Lado Direito: Banner Desktop/Tablet (>= 768px) === */}
      <div
        className="hidden md:flex flex-1 items-center justify-center rounded-l-2xl overflow-hidden"
        style={{ backgroundColor: bgColor }}
      >
        {/* Tablet (768-1023px) */}
        {bannerTablet && (
          <div className="w-full h-full lg:hidden">
            <BannerImage src={bannerTablet} />
          </div>
        )}
        {/* Desktop (>= 1024px) */}
        {bannerDesktop && (
          <div className="w-full h-full hidden lg:block">
            <BannerImage src={bannerDesktop} />
          </div>
        )}
        {/* Fallback: sem imagem */}
        {!bannerTablet && !bannerDesktop && (
          <div className="text-muted-foreground text-sm text-center p-8">
            <p className="text-lg font-medium text-foreground mb-2">Bem-vindo ao Renove</p>
            <p>Configure um banner nas Configurações Globais</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default LoginPage
