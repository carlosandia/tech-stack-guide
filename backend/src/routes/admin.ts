import { Router, type Request, type Response, type NextFunction } from 'express'
import { authMiddleware, requireRole } from '../middlewares/auth.js'
import { organizacaoService } from '../services/organizacao.service.js'
import { planoService } from '../services/plano.service.js'
import { configGlobalService } from '../services/config-global.service.js'
import { metricasService } from '../services/metricas.service.js'
import { logger } from '../utils/logger.js'
import {
  CriarOrganizacaoSchema,
  AtualizarOrganizacaoSchema,
  ListarOrganizacoesQuerySchema,
  CriarPlanoSchema,
  AtualizarPlanoSchema,
  DefinirModulosPlanoSchema,
  AtualizarModulosOrganizacaoSchema,
  AtualizarConfigGlobalSchema,
  PlataformasEnum,
  MetricasPeriodoSchema,
  ImpersonarSchema,
} from '../schemas/admin.js'
import { feedbacksService } from '../services/feedbacks.service.js'
import {
  ListarFeedbacksQuerySchema,
  AlterarStatusFeedbackSchema,
} from '../schemas/feedbacks.js'

/**
 * AIDEV-NOTE: Rotas do Painel Super Admin
 * Conforme PRD-14 - Painel Super Admin
 *
 * Todas as rotas requerem autenticacao e role super_admin
 *
 * Prefixo: /api/v1/admin
 */

const router = Router()

// Todos os endpoints requerem autenticacao e role super_admin
router.use(authMiddleware)
router.use(requireRole('super_admin'))

// Helper para validar schema
function validateBody<T>(schema: { parse: (data: unknown) => T }) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body)
      next()
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errors' in err) {
        const zodError = err as { errors: Array<{ path: string[]; message: string }> }
        return res.status(400).json({
          error: 'Dados invalidos',
          details: zodError.errors.map(e => ({
            campo: e.path.join('.'),
            mensagem: e.message,
          })),
        })
      }
      return res.status(400).json({ error: 'Dados invalidos' })
    }
  }
}

function validateQuery<T>(schema: { parse: (data: unknown) => T }) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query) as typeof req.query
      next()
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errors' in err) {
        const zodError = err as { errors: Array<{ path: string[]; message: string }> }
        return res.status(400).json({
          error: 'Parametros invalidos',
          details: zodError.errors.map(e => ({
            campo: e.path.join('.'),
            mensagem: e.message,
          })),
        })
      }
      return res.status(400).json({ error: 'Parametros invalidos' })
    }
  }
}

// ============================
// ORGANIZACOES (TENANTS)
// ============================

/**
 * GET /admin/organizacoes
 * Lista todas as organizacoes com filtros e paginacao
 */
router.get(
  '/organizacoes',
  validateQuery(ListarOrganizacoesQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const query = req.query as unknown as ReturnType<typeof ListarOrganizacoesQuerySchema.parse>
      const resultado = await organizacaoService.listar(query)

      res.json({
        success: true,
        data: resultado,
      })
    } catch (err) {
      logger.error('Erro ao listar organizacoes:', err)
      res.status(500).json({
        error: 'Erro ao listar organizacoes',
        message: err instanceof Error ? err.message : 'Erro desconhecido',
      })
    }
  }
)

/**
 * POST /admin/organizacoes
 * Cria nova organizacao (wizard completo)
 */
router.post(
  '/organizacoes',
  validateBody(CriarOrganizacaoSchema),
  async (req: Request, res: Response) => {
    try {
      const resultado = await organizacaoService.criar(req.body, req.user!.id)

      res.status(201).json({
        success: true,
        message: 'Organizacao criada com sucesso',
        data: resultado,
      })
    } catch (err) {
      logger.error('Erro ao criar organizacao:', err)
      res.status(400).json({
        error: 'Erro ao criar organizacao',
        message: err instanceof Error ? err.message : 'Erro desconhecido',
      })
    }
  }
)

/**
 * GET /admin/organizacoes/:id
 * Detalhes de uma organizacao
 */
router.get('/organizacoes/:id', async (req: Request, res: Response) => {
  try {
    const org = await organizacaoService.obter(req.params.id)

    res.json({
      success: true,
      data: org,
    })
  } catch (err) {
    logger.error('Erro ao obter organizacao:', err)
    res.status(404).json({
      error: 'Organizacao nao encontrada',
      message: err instanceof Error ? err.message : 'Erro desconhecido',
    })
  }
})

/**
 * PATCH /admin/organizacoes/:id
 * Atualiza uma organizacao
 */
router.patch(
  '/organizacoes/:id',
  validateBody(AtualizarOrganizacaoSchema),
  async (req: Request, res: Response) => {
    try {
      await organizacaoService.atualizar(req.params.id, req.body, req.user!.id)

      res.json({
        success: true,
        message: 'Organizacao atualizada com sucesso',
      })
    } catch (err) {
      logger.error('Erro ao atualizar organizacao:', err)
      res.status(400).json({
        error: 'Erro ao atualizar organizacao',
        message: err instanceof Error ? err.message : 'Erro desconhecido',
      })
    }
  }
)

/**
 * POST /admin/organizacoes/:id/suspender
 * Suspende uma organizacao
 */
router.post(
  '/organizacoes/:id/suspender',
  validateBody(ImpersonarSchema), // Reutiliza schema que tem campo motivo
  async (req: Request, res: Response) => {
    try {
      await organizacaoService.suspender(req.params.id, req.body.motivo, req.user!.id)

      res.json({
        success: true,
        message: 'Organizacao suspensa com sucesso',
      })
    } catch (err) {
      logger.error('Erro ao suspender organizacao:', err)
      res.status(400).json({
        error: 'Erro ao suspender organizacao',
        message: err instanceof Error ? err.message : 'Erro desconhecido',
      })
    }
  }
)

/**
 * POST /admin/organizacoes/:id/reativar
 * Reativa uma organizacao suspensa
 */
router.post('/organizacoes/:id/reativar', async (req: Request, res: Response) => {
  try {
    await organizacaoService.reativar(req.params.id, req.user!.id)

    res.json({
      success: true,
      message: 'Organizacao reativada com sucesso',
    })
  } catch (err) {
    logger.error('Erro ao reativar organizacao:', err)
    res.status(400).json({
      error: 'Erro ao reativar organizacao',
      message: err instanceof Error ? err.message : 'Erro desconhecido',
    })
  }
})

/**
 * POST /admin/organizacoes/:id/impersonar
 * Inicia impersonacao de uma organizacao
 */
router.post(
  '/organizacoes/:id/impersonar',
  validateBody(ImpersonarSchema),
  async (req: Request, res: Response) => {
    try {
      // Registrar impersonacao no audit log
      const { supabaseAdmin } = await import('../config/supabase.js')

      await supabaseAdmin.from('audit_log').insert({
        usuario_id: req.user!.id,
        organizacao_id: req.params.id,
        acao: 'impersonar_organizacao',
        entidade: 'organizacoes_saas',
        entidade_id: req.params.id,
        dados_novos: {
          motivo: req.body.motivo,
          ip: req.ip,
          user_agent: req.headers['user-agent'],
        },
      })

      // Buscar organizacao e admin
      const org = await organizacaoService.obter(req.params.id)

      res.json({
        success: true,
        message: 'Impersonacao iniciada',
        data: {
          organizacao_id: org.id,
          organizacao_nome: org.nome,
          // Em producao, poderia gerar token temporario com claims do admin do tenant
        },
      })
    } catch (err) {
      logger.error('Erro ao impersonar organizacao:', err)
      res.status(400).json({
        error: 'Erro ao impersonar organizacao',
        message: err instanceof Error ? err.message : 'Erro desconhecido',
      })
    }
  }
)

/**
 * GET /admin/organizacoes/:id/usuarios
 * Lista usuarios (Admin + Members) de uma organizacao
 */
router.get('/organizacoes/:id/usuarios', async (req: Request, res: Response) => {
  try {
    const resultado = await organizacaoService.listarUsuarios(req.params.id)

    res.json({
      success: true,
      data: resultado,
    })
  } catch (err) {
    logger.error('Erro ao listar usuarios da organizacao:', err)
    res.status(400).json({
      error: 'Erro ao listar usuarios',
      message: err instanceof Error ? err.message : 'Erro desconhecido',
    })
  }
})

/**
 * GET /admin/organizacoes/:id/limites
 * Obtem limites de uso vs utilizacao
 */
router.get('/organizacoes/:id/limites', async (req: Request, res: Response) => {
  try {
    const resultado = await organizacaoService.obterLimites(req.params.id)

    res.json({
      success: true,
      data: resultado,
    })
  } catch (err) {
    logger.error('Erro ao obter limites:', err)
    res.status(400).json({
      error: 'Erro ao obter limites',
      message: err instanceof Error ? err.message : 'Erro desconhecido',
    })
  }
})

/**
 * GET /admin/organizacoes/:id/modulos
 * Lista modulos de uma organizacao
 */
router.get('/organizacoes/:id/modulos', async (req: Request, res: Response) => {
  try {
    const modulos = await planoService.obterModulosOrganizacao(req.params.id)

    res.json({
      success: true,
      data: modulos,
    })
  } catch (err) {
    logger.error('Erro ao obter modulos da organizacao:', err)
    res.status(400).json({
      error: 'Erro ao obter modulos',
      message: err instanceof Error ? err.message : 'Erro desconhecido',
    })
  }
})

/**
 * PUT /admin/organizacoes/:id/modulos
 * Atualiza modulos de uma organizacao
 */
router.put(
  '/organizacoes/:id/modulos',
  validateBody(AtualizarModulosOrganizacaoSchema),
  async (req: Request, res: Response) => {
    try {
      await planoService.atualizarModulosOrganizacao(
        req.params.id,
        req.body.modulos,
        req.user!.id
      )

      res.json({
        success: true,
        message: 'Modulos atualizados com sucesso',
      })
    } catch (err) {
      logger.error('Erro ao atualizar modulos:', err)
      res.status(400).json({
        error: 'Erro ao atualizar modulos',
        message: err instanceof Error ? err.message : 'Erro desconhecido',
      })
    }
  }
)

/**
 * GET /admin/organizacoes/:id/relatorios
 * Metricas de vendas do tenant
 */
router.get('/organizacoes/:id/relatorios', async (req: Request, res: Response) => {
  try {
    const periodo = {
      inicio: new Date(req.query.inicio as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
      fim: new Date(req.query.fim as string || new Date()),
    }

    const metricas = await metricasService.obterMetricasTenant(req.params.id, periodo)

    res.json({
      success: true,
      data: metricas,
    })
  } catch (err) {
    logger.error('Erro ao obter relatorios:', err)
    res.status(400).json({
      error: 'Erro ao obter relatorios',
      message: err instanceof Error ? err.message : 'Erro desconhecido',
    })
  }
})

// ============================
// PLANOS
// ============================

/**
 * GET /admin/planos
 * Lista todos os planos
 */
router.get('/planos', async (_req: Request, res: Response) => {
  try {
    const planos = await planoService.listar()

    res.json({
      success: true,
      data: planos,
    })
  } catch (err) {
    logger.error('Erro ao listar planos:', err)
    res.status(500).json({
      error: 'Erro ao listar planos',
      message: err instanceof Error ? err.message : 'Erro desconhecido',
    })
  }
})

/**
 * POST /admin/planos
 * Cria novo plano
 */
router.post(
  '/planos',
  validateBody(CriarPlanoSchema),
  async (req: Request, res: Response) => {
    try {
      const id = await planoService.criar(req.body, req.user!.id)

      res.status(201).json({
        success: true,
        message: 'Plano criado com sucesso',
        data: { id },
      })
    } catch (err) {
      logger.error('Erro ao criar plano:', err)
      res.status(400).json({
        error: 'Erro ao criar plano',
        message: err instanceof Error ? err.message : 'Erro desconhecido',
      })
    }
  }
)

/**
 * GET /admin/planos/:id
 * Detalhes de um plano com modulos
 */
router.get('/planos/:id', async (req: Request, res: Response) => {
  try {
    const plano = await planoService.obter(req.params.id)

    res.json({
      success: true,
      data: plano,
    })
  } catch (err) {
    logger.error('Erro ao obter plano:', err)
    res.status(404).json({
      error: 'Plano nao encontrado',
      message: err instanceof Error ? err.message : 'Erro desconhecido',
    })
  }
})

/**
 * PATCH /admin/planos/:id
 * Atualiza um plano
 */
router.patch(
  '/planos/:id',
  validateBody(AtualizarPlanoSchema),
  async (req: Request, res: Response) => {
    try {
      await planoService.atualizar(req.params.id, req.body, req.user!.id)

      res.json({
        success: true,
        message: 'Plano atualizado com sucesso',
      })
    } catch (err) {
      logger.error('Erro ao atualizar plano:', err)
      res.status(400).json({
        error: 'Erro ao atualizar plano',
        message: err instanceof Error ? err.message : 'Erro desconhecido',
      })
    }
  }
)

/**
 * GET /admin/planos/:id/modulos
 * Modulos vinculados a um plano
 */
router.get('/planos/:id/modulos', async (req: Request, res: Response) => {
  try {
    const plano = await planoService.obter(req.params.id)

    res.json({
      success: true,
      data: plano.modulos,
    })
  } catch (err) {
    logger.error('Erro ao obter modulos do plano:', err)
    res.status(400).json({
      error: 'Erro ao obter modulos',
      message: err instanceof Error ? err.message : 'Erro desconhecido',
    })
  }
})

/**
 * PUT /admin/planos/:id/modulos
 * Define modulos de um plano
 */
router.put(
  '/planos/:id/modulos',
  validateBody(DefinirModulosPlanoSchema),
  async (req: Request, res: Response) => {
    try {
      await planoService.definirModulos(req.params.id, req.body, req.user!.id)

      res.json({
        success: true,
        message: 'Modulos do plano atualizados com sucesso',
      })
    } catch (err) {
      logger.error('Erro ao definir modulos do plano:', err)
      res.status(400).json({
        error: 'Erro ao definir modulos',
        message: err instanceof Error ? err.message : 'Erro desconhecido',
      })
    }
  }
)

// ============================
// MODULOS
// ============================

/**
 * GET /admin/modulos
 * Lista todos os modulos disponiveis
 */
router.get('/modulos', async (_req: Request, res: Response) => {
  try {
    const modulos = await planoService.listarModulos()

    res.json({
      success: true,
      data: modulos,
    })
  } catch (err) {
    logger.error('Erro ao listar modulos:', err)
    res.status(500).json({
      error: 'Erro ao listar modulos',
      message: err instanceof Error ? err.message : 'Erro desconhecido',
    })
  }
})

// ============================
// CONFIGURACOES GLOBAIS
// ============================

/**
 * GET /admin/config-global
 * Lista todas as configuracoes globais
 */
router.get('/config-global', async (_req: Request, res: Response) => {
  try {
    const configs = await configGlobalService.listar()

    res.json({
      success: true,
      data: configs,
    })
  } catch (err) {
    logger.error('Erro ao listar configuracoes:', err)
    res.status(500).json({
      error: 'Erro ao listar configuracoes',
      message: err instanceof Error ? err.message : 'Erro desconhecido',
    })
  }
})

/**
 * GET /admin/config-global/:plataforma
 * Obtem configuracao de uma plataforma
 */
router.get('/config-global/:plataforma', async (req: Request, res: Response) => {
  try {
    const plataforma = PlataformasEnum.parse(req.params.plataforma)
    const config = await configGlobalService.obter(plataforma)

    res.json({
      success: true,
      data: config,
    })
  } catch (err) {
    logger.error('Erro ao obter configuracao:', err)
    res.status(400).json({
      error: 'Erro ao obter configuracao',
      message: err instanceof Error ? err.message : 'Erro desconhecido',
    })
  }
})

/**
 * PATCH /admin/config-global/:plataforma
 * Atualiza configuracao de uma plataforma
 */
router.patch(
  '/config-global/:plataforma',
  validateBody(AtualizarConfigGlobalSchema),
  async (req: Request, res: Response) => {
    try {
      const plataforma = PlataformasEnum.parse(req.params.plataforma)
      await configGlobalService.atualizar(plataforma, req.body.configuracoes, req.user!.id)

      res.json({
        success: true,
        message: 'Configuracao atualizada com sucesso',
      })
    } catch (err) {
      logger.error('Erro ao atualizar configuracao:', err)
      res.status(400).json({
        error: 'Erro ao atualizar configuracao',
        message: err instanceof Error ? err.message : 'Erro desconhecido',
      })
    }
  }
)

/**
 * POST /admin/config-global/:plataforma/testar
 * Testa conexao com uma plataforma
 */
router.post('/config-global/:plataforma/testar', async (req: Request, res: Response) => {
  try {
    const plataforma = PlataformasEnum.parse(req.params.plataforma)
    const resultado = await configGlobalService.testar(plataforma, req.user!.id)

    res.json({
      success: true,
      data: resultado,
    })
  } catch (err) {
    logger.error('Erro ao testar configuracao:', err)
    res.status(400).json({
      error: 'Erro ao testar configuracao',
      message: err instanceof Error ? err.message : 'Erro desconhecido',
    })
  }
})

/**
 * POST /admin/config-global/meta/regenerar-token
 * Regenera webhook verify token do Meta
 */
router.post('/config-global/meta/regenerar-token', async (req: Request, res: Response) => {
  try {
    const novoToken = await configGlobalService.regenerarWebhookTokenMeta(req.user!.id)

    res.json({
      success: true,
      message: 'Token regenerado com sucesso',
      data: { token: novoToken },
    })
  } catch (err) {
    logger.error('Erro ao regenerar token:', err)
    res.status(400).json({
      error: 'Erro ao regenerar token',
      message: err instanceof Error ? err.message : 'Erro desconhecido',
    })
  }
})

// ============================
// METRICAS
// ============================

/**
 * GET /admin/metricas/resumo
 * Dashboard resumido da plataforma
 */
router.get(
  '/metricas/resumo',
  validateQuery(MetricasPeriodoSchema),
  async (req: Request, res: Response) => {
    try {
      const query = req.query as unknown as ReturnType<typeof MetricasPeriodoSchema.parse>
      const resumo = await metricasService.obterResumo(query.periodo)

      res.json({
        success: true,
        data: resumo,
      })
    } catch (err) {
      logger.error('Erro ao obter metricas:', err)
      res.status(500).json({
        error: 'Erro ao obter metricas',
        message: err instanceof Error ? err.message : 'Erro desconhecido',
      })
    }
  }
)

/**
 * GET /admin/metricas/financeiro
 * Metricas financeiras (MRR, Churn, etc)
 */
router.get(
  '/metricas/financeiro',
  validateQuery(MetricasPeriodoSchema),
  async (req: Request, res: Response) => {
    try {
      const query = req.query as unknown as ReturnType<typeof MetricasPeriodoSchema.parse>
      const financeiro = await metricasService.obterFinanceiro(query.periodo)

      res.json({
        success: true,
        data: financeiro,
      })
    } catch (err) {
      logger.error('Erro ao obter metricas financeiras:', err)
      res.status(500).json({
        error: 'Erro ao obter metricas financeiras',
        message: err instanceof Error ? err.message : 'Erro desconhecido',
      })
    }
  }
)

// ============================
// FEEDBACKS (PRD-15)
// ============================

/**
 * GET /admin/feedbacks
 * Lista todos os feedbacks de todos os tenants
 */
router.get(
  '/feedbacks',
  validateQuery(ListarFeedbacksQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const query = req.query as unknown as ReturnType<typeof ListarFeedbacksQuerySchema.parse>
      const resultado = await feedbacksService.listar(query)

      res.json({
        success: true,
        data: resultado,
      })
    } catch (err) {
      logger.error('Erro ao listar feedbacks:', err)
      res.status(500).json({
        error: 'Erro ao listar feedbacks',
        message: err instanceof Error ? err.message : 'Erro desconhecido',
      })
    }
  }
)

/**
 * GET /admin/feedbacks/:id
 * Detalhes de um feedback
 */
router.get('/feedbacks/:id', async (req: Request, res: Response) => {
  try {
    const feedback = await feedbacksService.buscarPorId(req.params.id)

    if (!feedback) {
      return res.status(404).json({
        error: 'Feedback nao encontrado',
      })
    }

    res.json({
      success: true,
      data: feedback,
    })
  } catch (err) {
    logger.error('Erro ao obter feedback:', err)
    res.status(500).json({
      error: 'Erro ao obter feedback',
      message: err instanceof Error ? err.message : 'Erro desconhecido',
    })
  }
})

/**
 * PATCH /admin/feedbacks/:id/status
 * Marca feedback como resolvido
 */
router.patch(
  '/feedbacks/:id/status',
  validateBody(AlterarStatusFeedbackSchema),
  async (req: Request, res: Response) => {
    try {
      const resultado = await feedbacksService.resolver(req.params.id, req.user!.id)

      res.json({
        success: true,
        message: 'Feedback marcado como resolvido. Usuario foi notificado.',
        data: resultado,
      })
    } catch (err) {
      logger.error('Erro ao resolver feedback:', err)

      const message = err instanceof Error ? err.message : 'Erro desconhecido'

      if (message.includes('nao encontrado')) {
        return res.status(404).json({ error: message })
      }
      if (message.includes('ja esta resolvido')) {
        return res.status(400).json({ error: message })
      }

      res.status(500).json({
        error: 'Erro ao resolver feedback',
        message,
      })
    }
  }
)

export default router
