/**
 * AIDEV-NOTE: Index das rotas de conexoes/integracoes
 * Conforme PRD-08 - Conexoes com Plataformas Externas
 */

import { Router } from 'express'
import whatsappRoutes, { wahaWebhookHandler } from './whatsapp'
import googleRoutes from './google'
import emailRoutes from './email'
import metaRoutes, { metaLeadsWebhookVerify, metaLeadsWebhookHandler } from './meta'
import instagramRoutes, { instagramWebhookVerify, instagramWebhookHandler } from './instagram'

const router = Router()

// Registra sub-rotas
router.use('/whatsapp', whatsappRoutes)
router.use('/google', googleRoutes)
router.use('/email', emailRoutes)
router.use('/meta', metaRoutes)
router.use('/instagram', instagramRoutes)

// Exporta handlers de webhook para serem registrados separadamente
export {
  wahaWebhookHandler,
  metaLeadsWebhookVerify,
  metaLeadsWebhookHandler,
  instagramWebhookVerify,
  instagramWebhookHandler,
}

export default router
