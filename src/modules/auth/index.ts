/**
 * AIDEV-NOTE: Modulo de autenticacao
 * Conforme PRD-03 - Autenticacao e Autorizacao
 */

// Pages
export { LoginPage } from './pages/LoginPage'
export { ForgotPasswordPage } from './pages/ForgotPasswordPage'
export { ResetPasswordPage } from './pages/ResetPasswordPage'

// Components
export { LoginForm } from './components/LoginForm'

// Services
export { authApi } from './services/auth.api'
export type {
  LoginRequest,
  LoginResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  PerfilResponse,
} from './services/auth.api'
