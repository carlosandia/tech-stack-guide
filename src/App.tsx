 import { Routes, Route, Navigate } from 'react-router-dom'
 import { useAuth } from '@/providers/AuthProvider'
 import { LoginPage, ForgotPasswordPage, ResetPasswordPage } from '@/modules/auth'
 import {
   AdminLayout,
   AdminDashboardPage,
   AdminOrganizacoesPage,
   AdminOrganizacaoDetalhesPage,
   AdminPlanosPage,
   AdminConfiguracoesGlobaisPage,
   AdminModulosPage,
 } from '@/modules/admin'
 import { PlanosPage, TrialCadastroPage, CheckoutSucessoPage, OnboardingPage } from '@/modules/public'

/**
 * AIDEV-NOTE: Roteamento principal da aplicacao
 * Conforme PRD-03 - Autenticacao e Autorizacao
 *
 * Rotas publicas:
 * /login - Autenticacao
 * /recuperar-senha - Recuperacao de senha
 * /redefinir-senha - Redefinicao de senha
 *
 * Rotas protegidas:
 * /app/* - CRM (Admin e Member)
 * /admin/* - Super Admin
 */

// Pagina temporaria do Dashboard (a ser implementada no PRD-14)
function DashboardPage() {
  const { user, role, tenantId } = useAuth()

  return (
    <div className="min-h-screen p-8 bg-background">
      <h1 className="text-3xl font-bold text-foreground mb-4">Dashboard</h1>
      <div className="bg-card p-6 rounded-lg border">
        <p className="text-card-foreground">
          Usuario: {user?.email}
        </p>
        <p className="text-muted-foreground">
          Role: {role || 'N/A'}
        </p>
        <p className="text-muted-foreground">
          Tenant: {tenantId || 'N/A'}
        </p>
      </div>
    </div>
  )
}

function App() {
  const { loading, isAuthenticated, role } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">
          Carregando...
        </div>
      </div>
    )
  }

  return (
    <Routes>
       {/* Rotas publicas */}
       <Route path="/planos" element={<PlanosPage />} />
       <Route path="/trial" element={<TrialCadastroPage />} />
       <Route path="/sucesso" element={<CheckoutSucessoPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
 
       {/* Rotas de autenticacao */}
       <Route path="/login" element={<LoginPage />} />
       <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
       <Route path="/redefinir-senha" element={<ResetPasswordPage />} />

      {/* Rotas do CRM (Admin/Member) */}
      <Route path="/app/*" element={
        isAuthenticated ? <DashboardPage /> : <Navigate to="/login" replace />
      } />

      {/* Rotas Super Admin */}
      <Route
        path="/admin"
        element={
          isAuthenticated && role === 'super_admin'
            ? <AdminLayout />
            : <Navigate to="/login" replace />
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="organizacoes" element={<AdminOrganizacoesPage />} />
        <Route path="organizacoes/:id" element={<AdminOrganizacaoDetalhesPage />} />
        <Route path="planos" element={<AdminPlanosPage />} />
         <Route path="modulos" element={<AdminModulosPage />} />
        <Route path="configuracoes" element={<AdminConfiguracoesGlobaisPage />} />
      </Route>

      {/* Redireciona raiz baseado no role */}
      <Route path="/" element={
        isAuthenticated
          ? role === 'super_admin'
            ? <Navigate to="/admin" replace />
            : <Navigate to="/app" replace />
          : <Navigate to="/login" replace />
      } />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
