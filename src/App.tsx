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
import { AppLayout, AppDashboardPage } from '@/modules/app'
import { FormulariosPage, FormularioEditorPage } from '@/modules/formularios'
import { FormularioPublicoPage } from '@/modules/formularios/pages/FormularioPublicoPage'
import { PlanosPage, TrialCadastroPage, CheckoutSucessoPage, OnboardingPage } from '@/modules/public'
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
 * /app/* - CRM (Admin e Member) com AppLayout
 * /admin/* - Super Admin
 */

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
       <Route path="/bloqueado" element={<BlockedPage />} />
       <Route path="/f/:slug" element={<FormularioPublicoPage />} />
 
       {/* Rotas de autenticacao */}
       <Route path="/login" element={<LoginPage />} />
       <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
       <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
       <Route path="/auth/set-password" element={<SetPasswordPage />} />

      {/* Rotas do CRM (Admin/Member) com AppLayout */}
      <Route
        path="/app"
        element={
          isAuthenticated && (role === 'admin' || role === 'member')
            ? <AppLayout />
            : <Navigate to="/login" replace />
        }
      >
        <Route index element={<AppDashboardPage />} />
        <Route path="contatos" element={<ContatosPage />} />
        <Route path="contatos/:tipo" element={<ContatosPage />} />
        <Route path="negocios" element={<NegociosPage />} />
        <Route path="negocios/pipeline/:id" element={<PipelineConfigPage />} />
        <Route path="tarefas" element={<TarefasPage />} />
        <Route path="conversas" element={<ConversasPage />} />
        <Route path="emails" element={<EmailsPage />} />
        <Route path="formularios" element={<FormulariosPage />} />
        <Route path="formularios/:id" element={<FormularioEditorPage />} />
      </Route>

      {/* Configuracoes - PRD-05 (layout próprio com header/toolbar) */}
      <Route
        path="/app/configuracoes"
        element={
          isAuthenticated && (role === 'admin' || role === 'member')
            ? <ConfiguracoesLayout />
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
        <Route path="automacoes" element={<AutomacoesPage />} />
      </Route>

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
        <Route path="evolucao" element={<AdminEvolucaoPage />} />
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
