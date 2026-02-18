import { forwardRef } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { LoginPage, ForgotPasswordPage, ResetPasswordPage, SetPasswordPage } from '@/modules/auth'
import {
  AdminLayout,
  AdminDashboardPage,
  AdminOrganizacoesPage,
  AdminOrganizacaoDetalhesPage,
  AdminPlanosPage,
  AdminConfiguracoesGlobaisPage,
  AdminModulosPage,
  AdminEvolucaoPage,
} from '@/modules/admin'
import { AppLayout, AppDashboardPage, PerfilPage } from '@/modules/app'
import { FormulariosPage, FormularioEditorPage } from '@/modules/formularios'
import { FormularioPublicoPage } from '@/modules/formularios/pages/FormularioPublicoPage'
import { OAuthGoogleCallbackPage } from '@/pages/OAuthGoogleCallbackPage'
import { PlanosPage, TrialCadastroPage, CheckoutSucessoPage, OnboardingPage, PoliticaPrivacidadePage, TermosServicoPage, LandingPage } from '@/modules/public'
import { BlockedPage } from '@/modules/blocked'
import { ConfiguracoesLayout, CamposPage, ProdutosPage, MotivosPage, TarefasTemplatesPage, EtapasTemplatesPage, RegrasPage, ConfigCardPage, ConexoesPage, WebhooksEntradaPage, WebhooksSaidaPage, MembrosPage, EquipesPage, PerfisPermissaoPage, MetasPage, ConfigGeralPage } from '@/modules/configuracoes'
import { AutomacoesPage } from '@/modules/automacoes'
import { ContatosPage } from '@/modules/contatos'
import { NegociosPage, PipelineConfigPage } from '@/modules/negocios'
import { TarefasPage } from '@/modules/tarefas'
import { ConversasPage } from '@/modules/conversas'
import { EmailsPage } from '@/modules/emails'

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
 * /* - CRM (Admin e Member) com AppLayout (sem prefixo /app)
 * /admin/* - Super Admin
 */

const App = forwardRef<HTMLDivElement>(function App(_props, _ref) {
  const { loading, isAuthenticated, role, user } = useAuth()

  // AIDEV-NOTE: Bloquear acesso de usuarios com status 'pendente' (ainda nao definiram senha)
  const isPendente = user?.status === 'pendente'

  // AIDEV-NOTE: Se o usuario está na pagina de set-password, não bloquear
  // mesmo que esteja autenticado. Isso previne que o convidado seja redirecionado
  // para o dashboard antes de definir a senha.
  const isSetPasswordPage = window.location.pathname === '/auth/set-password'

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
       <Route path="/bloqueado" element={<BlockedPage />} />
       <Route path="/f/:slug" element={<FormularioPublicoPage />} />
       <Route path="/privacidade" element={<PoliticaPrivacidadePage />} />
       <Route path="/termos" element={<TermosServicoPage />} />
       <Route path="/oauth/google/callback" element={<OAuthGoogleCallbackPage />} />
       <Route path="/auth/google/callback" element={<OAuthGoogleCallbackPage />} />
 
       {/* Rotas de autenticacao */}
       <Route path="/login" element={<LoginPage />} />
       <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
       <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
       <Route path="/auth/set-password" element={<SetPasswordPage />} />

      {/* Rotas do CRM (Admin/Member) com AppLayout - sem prefixo /app */}
      <Route
        element={
          isAuthenticated && (role === 'admin' || role === 'member')
            ? isPendente
              ? <Navigate to="/auth/set-password" replace />
              : <AppLayout />
            : <Navigate to="/login" replace />
        }
      >
        <Route path="/dashboard" element={<AppDashboardPage />} />
        <Route path="/perfil" element={<PerfilPage />} />
        <Route path="/contatos" element={<ContatosPage />} />
        <Route path="/contatos/:tipo" element={<ContatosPage />} />
        <Route path="/negocios" element={<NegociosPage />} />
        <Route path="/negocios/pipeline/:id" element={<PipelineConfigPage />} />
        <Route path="/tarefas" element={<TarefasPage />} />
        <Route path="/conversas" element={<ConversasPage />} />
        <Route path="/emails" element={<EmailsPage />} />
        <Route path="/formularios" element={<FormulariosPage />} />
        <Route path="/formularios/:id" element={<FormularioEditorPage />} />
        <Route path="/automacoes" element={<AutomacoesPage />} />
      </Route>

      {/* Configuracoes - PRD-05 (layout próprio com header/toolbar) */}
      <Route
        path="/configuracoes"
        element={
          isAuthenticated && (role === 'admin' || role === 'member')
            ? isPendente
              ? <Navigate to="/auth/set-password" replace />
              : <ConfiguracoesLayout />
            : <Navigate to="/login" replace />
        }
      >
        <Route index element={<Navigate to="campos" replace />} />
        <Route path="campos" element={<CamposPage />} />
        <Route path="produtos" element={<ProdutosPage />} />
        <Route path="motivos" element={<MotivosPage />} />
        <Route path="tarefas-templates" element={<TarefasTemplatesPage />} />
        <Route path="tarefas" element={<TarefasTemplatesPage />} />
        <Route path="etapas-templates" element={<EtapasTemplatesPage />} />
        <Route path="etapas" element={<EtapasTemplatesPage />} />
        <Route path="regras" element={<RegrasPage />} />
        <Route path="cards" element={<ConfigCardPage />} />
        <Route path="conexoes" element={<ConexoesPage />} />
        <Route path="webhooks-entrada" element={<WebhooksEntradaPage />} />
        <Route path="webhooks-saida" element={<WebhooksSaidaPage />} />
        <Route path="membros" element={<MembrosPage />} />
        <Route path="equipes" element={<EquipesPage />} />
        <Route path="perfis" element={<PerfisPermissaoPage />} />
        <Route path="metas" element={<MetasPage />} />
        <Route path="config-geral" element={<ConfigGeralPage />} />
      </Route>

      {/* Rotas Super Admin */}
      <Route
        path="/admin"
        element={
          isAuthenticated && role === 'super_admin'
            ? isPendente
              ? <Navigate to="/auth/set-password" replace />
              : <AdminLayout />
            : <Navigate to="/login" replace />
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="organizacoes" element={<AdminOrganizacoesPage />} />
        <Route path="organizacoes/:id" element={<AdminOrganizacaoDetalhesPage />} />
        <Route path="planos" element={<AdminPlanosPage />} />
         <Route path="modulos" element={<AdminModulosPage />} />
        <Route path="configuracoes" element={<AdminConfiguracoesGlobaisPage />} />
        <Route path="evolucao" element={<AdminEvolucaoPage />} />
      </Route>

      {/* Redireciona raiz baseado no role ou mostra landing */}
      <Route path="/" element={
        isAuthenticated && !isSetPasswordPage
          ? isPendente
            ? <Navigate to="/auth/set-password" replace />
            : role === 'super_admin'
              ? <Navigate to="/admin" replace />
              : <Navigate to="/dashboard" replace />
          : <LandingPage />
      } />

      {/* 404 - não redirecionar se está na pagina de set-password */}
      <Route path="*" element={
        isSetPasswordPage ? null : <Navigate to="/" replace />
      } />
    </Routes>
  )
})

App.displayName = 'App'

export default App
