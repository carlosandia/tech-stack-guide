import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { env, validateEnv } from './config/env.js'
import { logger } from './utils/logger.js'
import { authMiddleware, requireTenant } from './middlewares/auth.js'

// Rotas existentes
import authRoutes from './routes/auth.js'
import adminRoutes from './routes/admin.js'

// Rotas PRD-05 - Configuracoes do Tenant
import camposRoutes from './routes/campos.js'

// Rotas PRD-07 - Negocios
import funisRoutes from './routes/funis.js'
import oportunidadesRoutes from './routes/oportunidades.js'
import preOportunidadesRoutes from './routes/pre-oportunidades.js'
import produtosRoutes from './routes/produtos.js'
import motivosRoutes from './routes/motivos.js'
import tarefasTemplatesRoutes from './routes/tarefas-templates.js'
import etapasTemplatesRoutes from './routes/etapas-templates.js'
import regrasRoutes, { configCardRouter } from './routes/regras.js'
import integracoesRoutes from './routes/integracoes.js'
import webhooksRoutes, { webhookReceiverRouter } from './routes/webhooks.js'
import equipesRoutes, { usuariosRouter, perfisRouter } from './routes/equipe.js'
import metasRoutes from './routes/metas.js'

// Rotas PRD-08 - Conexoes com Plataformas Externas
import conexoesRoutes, {
  wahaWebhookHandler,
  metaLeadsWebhookVerify,
  metaLeadsWebhookHandler,
  instagramWebhookVerify,
  instagramWebhookHandler,
} from './routes/conexoes/index.js'

// Rotas PRD-09 - Conversas
import conversasRoutes from './routes/conversas.js'
import mensagensProntasRoutes from './routes/mensagens-prontas.js'
import notasContatoRoutes from './routes/notas-contato.js'
import mensagensAgendadasRoutes from './routes/mensagens-agendadas.js'

// Rotas PRD-10 - Tarefas (Acompanhamento)
import tarefasRoutes from './routes/tarefas.js'

// Rotas PRD-06 - Contatos
import contatosRoutes from './routes/contatos.js'
import segmentosRoutes from './routes/segmentos.js'

// Rotas PRD-15 - Feedbacks e Notificacoes
import feedbacksRoutes from './routes/feedbacks.js'
import notificacoesRoutes from './routes/notificacoes.js'

/**
 * AIDEV-NOTE: Ponto de entrada do backend
 * Configuracao de middlewares globais e rotas
 */

// Valida variaveis de ambiente
try {
  validateEnv()
} catch (error) {
  logger.error('Erro na validacao de ambiente:', error)
  process.exit(1)
}

const app = express()

// Middlewares globais
app.use(helmet())
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}))
app.use(express.json())

// Rate limiting
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  message: {
    error: 'Muitas requisicoes. Tente novamente mais tarde.',
  },
})
app.use('/api/', limiter)

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.0.1',
  })
})

// Rotas da API
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/admin', adminRoutes)

// Webhook receiver (publico - nao requer autenticacao)
app.use('/api/v1/webhook', webhookReceiverRouter)

// Rotas PRD-05 - Configuracoes do Tenant (requer autenticacao + tenant)
app.use('/api/v1/campos', authMiddleware, requireTenant, camposRoutes)
app.use('/api/v1/produtos', authMiddleware, requireTenant, produtosRoutes)
app.use('/api/v1/categorias-produtos', authMiddleware, requireTenant, produtosRoutes)
app.use('/api/v1/motivos-resultado', authMiddleware, requireTenant, motivosRoutes)
app.use('/api/v1/tarefas-templates', authMiddleware, requireTenant, tarefasTemplatesRoutes)
app.use('/api/v1/etapas-templates', authMiddleware, requireTenant, etapasTemplatesRoutes)
app.use('/api/v1/regras-qualificacao', authMiddleware, requireTenant, regrasRoutes)
app.use('/api/v1/configuracoes-card', authMiddleware, requireTenant, configCardRouter)
app.use('/api/v1/integracoes', authMiddleware, requireTenant, integracoesRoutes)
app.use('/api/v1/webhooks-entrada', authMiddleware, requireTenant, webhooksRoutes)
app.use('/api/v1/webhooks-saida', authMiddleware, requireTenant, webhooksRoutes)
app.use('/api/v1/equipes', authMiddleware, requireTenant, equipesRoutes)
app.use('/api/v1/usuarios', authMiddleware, requireTenant, usuariosRouter)
app.use('/api/v1/perfis-permissao', authMiddleware, requireTenant, perfisRouter)
app.use('/api/v1/metas', authMiddleware, requireTenant, metasRoutes)

// Rotas PRD-06 - Contatos (requer autenticacao + tenant)
app.use('/api/v1/contatos', authMiddleware, requireTenant, contatosRoutes)
app.use('/api/v1/segmentos', authMiddleware, requireTenant, segmentosRoutes)

// Rotas PRD-07 - Negocios (requer autenticacao + tenant)
app.use('/api/v1/funis', authMiddleware, requireTenant, funisRoutes)
app.use('/api/v1/oportunidades', authMiddleware, requireTenant, oportunidadesRoutes)
app.use('/api/v1/pre-oportunidades', authMiddleware, requireTenant, preOportunidadesRoutes)

// Rotas PRD-08 - Conexoes (requer autenticacao + tenant)
app.use('/api/v1/conexoes', authMiddleware, requireTenant, conexoesRoutes)

// Rotas PRD-09 - Conversas
// AIDEV-NOTE: Auth e requireTenant ja estao nos routers
app.use('/api/v1/conversas', conversasRoutes)
app.use('/api/v1/mensagens-prontas', mensagensProntasRoutes)
app.use('/api/v1', notasContatoRoutes) // Monta em /api/v1 pois tem rotas /contatos/:id/notas e /notas/:id
app.use('/api/v1/mensagens-agendadas', mensagensAgendadasRoutes)

// Rotas PRD-10 - Tarefas (Acompanhamento)
// AIDEV-NOTE: Auth e requireTenant ja estao no router de tarefas
app.use('/api/v1/tarefas', tarefasRoutes)

// Rotas PRD-15 - Feedbacks e Notificacoes
// AIDEV-NOTE: Auth e requireTenant ja estao nos routers
app.use('/api/v1/feedbacks', feedbacksRoutes)
app.use('/api/v1/notificacoes', notificacoesRoutes)

// Webhooks PRD-08 - Conexoes (publico - nao requer autenticacao)
app.post('/webhooks/waha/:organizacao_id', wahaWebhookHandler)
app.get('/webhooks/meta-leads', metaLeadsWebhookVerify)
app.post('/webhooks/meta-leads', metaLeadsWebhookHandler)
app.get('/webhooks/instagram', instagramWebhookVerify)
app.post('/webhooks/instagram', instagramWebhookHandler)

// Handler de erro global
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Erro nao tratado:', err)
  res.status(500).json({
    error: 'Erro interno do servidor',
  })
})

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: 'Rota nao encontrada',
  })
})

// Inicia servidor
app.listen(env.PORT, () => {
  logger.info(`Servidor rodando na porta ${env.PORT}`)
  logger.info(`Ambiente: ${env.NODE_ENV}`)
})
