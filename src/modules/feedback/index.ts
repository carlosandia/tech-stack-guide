/**
 * AIDEV-NOTE: Barrel exports do modulo Feedback (PRD-15)
 */

// Componentes
export { FeedbackButton } from './components/FeedbackButton'
export { FeedbackPopover } from './components/FeedbackPopover'
export { NotificacoesSino } from './components/NotificacoesSino'

// Hooks
export { useCriarFeedback, useFeedbacksAdmin, useResolverFeedback } from './hooks/useFeedback'
export { useNotificacoes, useContagemNaoLidas, useMarcarLida, useMarcarTodasLidas } from './hooks/useNotificacoes'

// Services
export { feedbackApi } from './services/feedback.api'
export { notificacoesApi } from './services/notificacoes.api'
