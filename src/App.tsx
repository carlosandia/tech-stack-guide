import { forwardRef, Suspense } from 'react'
import { lazyWithRetry } from '@/utils/lazyWithRetry'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'

/**
 * AIDEV-NOTE: Code Splitting com React.lazy()
 * PRD: melhorias-performance.md - Fase 3
 *
 * Modulos carregados de forma lazy (sob demanda):
 * - Admin (so Super Admin precisa)
 * - App (CRM principal)
 * - Configuracoes (modulo grande)
 * - Modulos de features (contatos, negocios, etc)
 *
 * Modulos NAO lazy (carregam sempre):
 * - Auth (rota inicial)
 * - Public (landing, planos)
 *
 * AIDEV-NOTE: Fallback usa animate-pulse (padrao do projeto)
 * Carregamento de chunks e rapido (<300ms), nao precisa de spinner elaborado
 */

// Fallback simples para Suspense - consistente com padrao do projeto
const SuspenseFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-pulse text-muted-foreground text-sm">Carregando...</div>
  </div>
)

const SuspenseFallbackFullScreen = ({ text = 'Carregando...' }: { text?: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-pulse text-muted-foreground">{text}</div>
  </div>
)

// Auth - Carrega sempre (rota inicial, nao usar lazy)
import { LoginPage, ForgotPasswordPage, ResetPasswordPage, SetPasswordPage } from '@/modules/auth'

// Public - Carrega sempre (landing page, rotas publicas frequentes)
import { PlanosPage, TrialCadastroPage, CheckoutSucessoPage, OnboardingPage, PoliticaPrivacidadePage, TermosServicoPage, LandingPage, ParceiroPage } from '@/modules/public'
import { BlockedPage } from '@/modules/blocked'
import { OAuthGoogleCallbackPage } from '@/pages/OAuthGoogleCallbackPage'

// Formulario Publico - Carrega sempre (acesso direto via link)
import { FormularioPublicoPage } from '@/modules/formularios/pages/FormularioPublicoPage'

// ============================================
// LAZY LOADING - Modulos pesados
// ============================================

// Admin Module (so Super Admin)
// AIDEV-NOTE: Todos arquivos normalizados para export default - removido .then() patterns
const AdminLayout = lazyWithRetry(() => import('@/modules/admin/layouts/AdminLayout'), 'AdminLayout')
const AdminDashboardPage = lazyWithRetry(() => import('@/modules/admin/pages/DashboardPage'), 'AdminDashboard')
const AdminOrganizacoesPage = lazyWithRetry(() => import('@/modules/admin/pages/OrganizacoesPage'), 'AdminOrganizacoes')
const AdminOrganizacaoDetalhesPage = lazyWithRetry(() => import('@/modules/admin/pages/OrganizacaoDetalhesPage'), 'AdminOrgDetalhes')
const AdminPlanosPage = lazyWithRetry(() => import('@/modules/admin/pages/PlanosPage'), 'AdminPlanos')
const AdminConfiguracoesGlobaisPage = lazyWithRetry(() => import('@/modules/admin/pages/ConfiguracoesGlobaisPage'), 'AdminConfigGlobais')
const AdminModulosPage = lazyWithRetry(() => import('@/modules/admin/pages/ModulosPage'), 'AdminModulos')
const AdminEvolucaoPage = lazyWithRetry(() => import('@/modules/admin/pages/EvolucaoPage'), 'AdminEvolucao')
const AdminParceirosPage = lazyWithRetry(() => import('@/modules/admin/pages/ParceirosPage'), 'AdminParceiros')
const AdminParceiroDetalhesPage = lazyWithRetry(() => import('@/modules/admin/pages/ParceiroDetalhesPage'), 'AdminParceiroDetalhes')

// App Module (CRM principal)
const AppLayout = lazyWithRetry(() => import('@/modules/app/layouts/AppLayout'), 'AppLayout')
const AppDashboardPage = lazyWithRetry(() => import('@/modules/app/pages/DashboardPage'), 'AppDashboard')
const PerfilPage = lazyWithRetry(() => import('@/modules/app/pages/PerfilPage'), 'Perfil')

// Configuracoes Module
// AIDEV-NOTE: Todos arquivos normalizados para export default - removido .then() patterns
const ConfiguracoesLayout = lazyWithRetry(() => import('@/modules/configuracoes/layouts/ConfiguracoesLayout'), 'ConfigLayout')
const CamposPage = lazyWithRetry(() => import('@/modules/configuracoes/pages/CamposPage'), 'Campos')
const ProdutosPage = lazyWithRetry(() => import('@/modules/configuracoes/pages/ProdutosPage'), 'Produtos')
const MotivosPage = lazyWithRetry(() => import('@/modules/configuracoes/pages/MotivosPage'), 'Motivos')
const TarefasTemplatesPage = lazyWithRetry(() => import('@/modules/configuracoes/pages/TarefasTemplatesPage'), 'TarefasTemplates')
const EtapasTemplatesPage = lazyWithRetry(() => import('@/modules/configuracoes/pages/EtapasTemplatesPage'), 'EtapasTemplates')
const RegrasPage = lazyWithRetry(() => import('@/modules/configuracoes/pages/RegrasPage'), 'Regras')
const ConfigCardPage = lazyWithRetry(() => import('@/modules/configuracoes/pages/ConfigCardPage'), 'ConfigCard')
const ConexoesPage = lazyWithRetry(() => import('@/modules/configuracoes/pages/ConexoesPage'), 'Conexoes')
const WebhooksEntradaPage = lazyWithRetry(() => import('@/modules/configuracoes/pages/WebhooksEntradaPage'), 'WebhooksEntrada')
const WebhooksSaidaPage = lazyWithRetry(() => import('@/modules/configuracoes/pages/WebhooksSaidaPage'), 'WebhooksSaida')
const MembrosPage = lazyWithRetry(() => import('@/modules/configuracoes/pages/MembrosPage'), 'Membros')
const EquipesPage = lazyWithRetry(() => import('@/modules/configuracoes/pages/EquipesPage'), 'Equipes')
const PerfisPermissaoPage = lazyWithRetry(() => import('@/modules/configuracoes/pages/PerfisPermissaoPage'), 'PerfisPermissao')
const MetasPage = lazyWithRetry(() => import('@/modules/configuracoes/pages/MetasPage'), 'Metas')
const ConfigGeralPage = lazyWithRetry(() => import('@/modules/configuracoes/pages/ConfigGeralPage'), 'ConfigGeral')
const OrigensPage = lazyWithRetry(() => import('@/modules/configuracoes/pages/OrigensPage'), 'Origens')

// Feature Modules
// AIDEV-NOTE: Todos arquivos normalizados para export default - removido .then() patterns
const FormulariosPage = lazyWithRetry(() => import('@/modules/formularios/pages/FormulariosPage'), 'Formularios')
const FormularioEditorPage = lazyWithRetry(() => import('@/modules/formularios/pages/FormularioEditorPage'), 'FormularioEditor')
const AutomacoesPage = lazyWithRetry(() => import('@/modules/automacoes/pages/AutomacoesPage'), 'Automacoes')
const ContatosPage = lazyWithRetry(() => import('@/modules/contatos/pages/ContatosPage'), 'Contatos')
const NegociosPage = lazyWithRetry(() => import('@/modules/negocios/pages/NegociosPage'), 'Negocios')
const PipelineConfigPage = lazyWithRetry(() => import('@/modules/negocios/pages/PipelineConfigPage'), 'PipelineConfig')
const TarefasPage = lazyWithRetry(() => import('@/modules/tarefas/pages/TarefasPage'), 'Tarefas')
const ConversasPage = lazyWithRetry(() => import('@/modules/conversas/pages/ConversasPage'), 'Conversas')
const EmailsPage = lazyWithRetry(() => import('@/modules/emails/pages/EmailsPage'), 'Emails')

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
       <Route path="/parceiro/:codigo" element={<ParceiroPage />} />
       <Route path="/oauth/google/callback" element={<OAuthGoogleCallbackPage />} />
       <Route path="/auth/google/callback" element={<OAuthGoogleCallbackPage />} />
 
       {/* Rotas de autenticacao */}
       <Route path="/login" element={<LoginPage />} />
       <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
       <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
       <Route path="/auth/set-password" element={<SetPasswordPage />} />

      {/* Rotas do CRM (Admin/Member) com AppLayout - sem prefixo /app */}
      {/* AIDEV-NOTE: Suspense envolvendo lazy components - PRD: melhorias-performance.md */}
      <Route
        element={
          isAuthenticated && (role === 'admin' || role === 'member')
            ? isPendente
              ? <Navigate to="/auth/set-password" replace />
              : <Suspense fallback={<SuspenseFallbackFullScreen text="Carregando CRM..." />}><AppLayout /></Suspense>
            : <Navigate to="/login" replace />
        }
      >
        <Route path="/dashboard" element={<Suspense fallback={<SuspenseFallback />}><AppDashboardPage /></Suspense>} />
        <Route path="/perfil" element={<Suspense fallback={<SuspenseFallback />}><PerfilPage /></Suspense>} />
        <Route path="/contatos" element={<Navigate to="/contatos/pessoas" replace />} />
        <Route path="/contatos/:tipo" element={<Suspense fallback={<SuspenseFallback />}><ContatosPage /></Suspense>} />
        <Route path="/negocios" element={<Suspense fallback={<SuspenseFallback />}><NegociosPage /></Suspense>} />
        <Route path="/negocios/pipeline/:id" element={<Suspense fallback={<SuspenseFallback />}><PipelineConfigPage /></Suspense>} />
        <Route path="/tarefas" element={<Suspense fallback={<SuspenseFallback />}><TarefasPage /></Suspense>} />
        <Route path="/conversas" element={<Suspense fallback={<SuspenseFallback />}><ConversasPage /></Suspense>} />
        <Route path="/emails" element={<Suspense fallback={<SuspenseFallback />}><EmailsPage /></Suspense>} />
        <Route path="/formularios" element={<Suspense fallback={<SuspenseFallback />}><FormulariosPage /></Suspense>} />
        <Route path="/formularios/:id" element={<Suspense fallback={<SuspenseFallback />}><FormularioEditorPage /></Suspense>} />
        <Route path="/automacoes" element={<Suspense fallback={<SuspenseFallback />}><AutomacoesPage /></Suspense>} />
      </Route>

      {/* Configuracoes - PRD-05 (layout próprio com header/toolbar) */}
      <Route
        path="/configuracoes"
        element={
          isAuthenticated && (role === 'admin' || role === 'member')
            ? isPendente
              ? <Navigate to="/auth/set-password" replace />
              : <Suspense fallback={<SuspenseFallbackFullScreen text="Carregando configurações..." />}><ConfiguracoesLayout /></Suspense>
            : <Navigate to="/login" replace />
        }
      >
        <Route index element={<Navigate to="config-geral" replace />} />
        <Route path="campos" element={<Suspense fallback={<SuspenseFallback />}><CamposPage /></Suspense>} />
        <Route path="produtos" element={<Suspense fallback={<SuspenseFallback />}><ProdutosPage /></Suspense>} />
        <Route path="motivos" element={<Suspense fallback={<SuspenseFallback />}><MotivosPage /></Suspense>} />
        <Route path="origens" element={<Suspense fallback={<SuspenseFallback />}><OrigensPage /></Suspense>} />
        <Route path="tarefas-templates" element={<Suspense fallback={<SuspenseFallback />}><TarefasTemplatesPage /></Suspense>} />
        <Route path="tarefas" element={<Suspense fallback={<SuspenseFallback />}><TarefasTemplatesPage /></Suspense>} />
        <Route path="etapas-templates" element={<Suspense fallback={<SuspenseFallback />}><EtapasTemplatesPage /></Suspense>} />
        <Route path="etapas" element={<Suspense fallback={<SuspenseFallback />}><EtapasTemplatesPage /></Suspense>} />
        <Route path="regras" element={<Suspense fallback={<SuspenseFallback />}><RegrasPage /></Suspense>} />
        <Route path="cards" element={<Suspense fallback={<SuspenseFallback />}><ConfigCardPage /></Suspense>} />
        <Route path="conexoes" element={<Suspense fallback={<SuspenseFallback />}><ConexoesPage /></Suspense>} />
        <Route path="webhooks-entrada" element={<Suspense fallback={<SuspenseFallback />}><WebhooksEntradaPage /></Suspense>} />
        <Route path="webhooks-saida" element={<Suspense fallback={<SuspenseFallback />}><WebhooksSaidaPage /></Suspense>} />
        <Route path="membros" element={<Suspense fallback={<SuspenseFallback />}><MembrosPage /></Suspense>} />
        <Route path="equipes" element={<Suspense fallback={<SuspenseFallback />}><EquipesPage /></Suspense>} />
        <Route path="perfis" element={<Suspense fallback={<SuspenseFallback />}><PerfisPermissaoPage /></Suspense>} />
        <Route path="metas" element={<Suspense fallback={<SuspenseFallback />}><MetasPage /></Suspense>} />
        <Route path="config-geral" element={<Suspense fallback={<SuspenseFallback />}><ConfigGeralPage /></Suspense>} />
      </Route>

      {/* Rotas Super Admin */}
      <Route
        path="/admin"
        element={
          isAuthenticated && role === 'super_admin'
            ? isPendente
              ? <Navigate to="/auth/set-password" replace />
              : <Suspense fallback={<SuspenseFallbackFullScreen text="Carregando painel admin..." />}><AdminLayout /></Suspense>
            : <Navigate to="/login" replace />
        }
      >
        <Route index element={<Suspense fallback={<SuspenseFallback />}><AdminDashboardPage /></Suspense>} />
        <Route path="organizacoes" element={<Suspense fallback={<SuspenseFallback />}><AdminOrganizacoesPage /></Suspense>} />
        <Route path="organizacoes/:id" element={<Suspense fallback={<SuspenseFallback />}><AdminOrganizacaoDetalhesPage /></Suspense>} />
        <Route path="planos" element={<Suspense fallback={<SuspenseFallback />}><AdminPlanosPage /></Suspense>} />
        <Route path="modulos" element={<Suspense fallback={<SuspenseFallback />}><AdminModulosPage /></Suspense>} />
        <Route path="configuracoes" element={<Suspense fallback={<SuspenseFallback />}><AdminConfiguracoesGlobaisPage /></Suspense>} />
        <Route path="evolucao" element={<Suspense fallback={<SuspenseFallback />}><AdminEvolucaoPage /></Suspense>} />
        <Route path="parceiros" element={<Suspense fallback={<SuspenseFallback />}><AdminParceirosPage /></Suspense>} />
        <Route path="parceiros/:id" element={<Suspense fallback={<SuspenseFallback />}><AdminParceiroDetalhesPage /></Suspense>} />
      </Route>

      {/* Landing page sempre acessivel, mesmo logado */}
      <Route path="/" element={<LandingPage />} />

      {/* 404 - não redirecionar se está na pagina de set-password */}
      <Route path="*" element={
        isSetPasswordPage ? null : <Navigate to="/" replace />
      } />
    </Routes>
  )
})

App.displayName = 'App'

export default App
