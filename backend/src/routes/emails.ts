/**
 * AIDEV-NOTE: Routes do modulo Caixa de Entrada de Email (PRD-11)
 *
 * Endpoints:
 * - GET    /api/v1/emails              - Listar emails (paginado, filtros, pasta)
 * - GET    /api/v1/emails/nao-lidos    - Contador de nao-lidos
 * - GET    /api/v1/emails/rascunhos    - Listar rascunhos
 * - POST   /api/v1/emails/rascunhos    - Criar/atualizar rascunho
 * - DELETE /api/v1/emails/rascunhos/:id - Deletar rascunho
 * - POST   /api/v1/emails/enviar       - Enviar novo email
 * - POST   /api/v1/emails/lote         - Acoes em lote
 * - POST   /api/v1/emails/sync         - Forcar sincronizacao
 * - GET    /api/v1/emails/sync/status  - Status do sync
 * - GET    /api/v1/emails/assinatura   - Obter assinatura
 * - PUT    /api/v1/emails/assinatura   - Salvar assinatura
 * - GET    /api/v1/emails/:id          - Detalhe de um email
 * - PATCH  /api/v1/emails/:id          - Atualizar (lido, favorito, pasta)
 * - DELETE /api/v1/emails/:id          - Mover para lixeira
 * - POST   /api/v1/emails/:id/responder    - Responder
 * - POST   /api/v1/emails/:id/encaminhar   - Encaminhar
 * - GET    /api/v1/emails/:id/anexos/:anexoId - Download de anexo
 *
 * Regras de Acesso:
 * - Super Admin: NAO tem acesso
 * - Admin/Member: Acessam seus proprios emails
 */

import { Router } from 'express'
import type { Request, Response } from 'express'
import { authMiddleware, requireRole, requireTenant } from '../middlewares/auth.js'
import caixaEntradaService from '../services/caixa-entrada.service.js'
import {
  ListarEmailsQuerySchema,
  AtualizarEmailSchema,
  AcaoLoteSchema,
  EnviarEmailSchema,
  ResponderEmailSchema,
  EncaminharEmailSchema,
  CriarRascunhoSchema,
  SalvarAssinaturaSchema,
} from '../schemas/emails.js'

const router = Router()

// Aplica middlewares de autenticacao
router.use(authMiddleware, requireTenant, requireRole('admin', 'member'))

// =====================================================
// LISTAR EMAILS
// =====================================================
router.get('/', async (req: Request, res: Response) => {
  try {
    const parsed = ListarEmailsQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Parametros invalidos', detalhes: parsed.error.flatten() })
    }

    const result = await caixaEntradaService.listarEmails(
      req.user!.organizacao_id!,
      req.user!.id,
      parsed.data
    )

    res.json(result)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// =====================================================
// CONTADOR NAO-LIDOS
// =====================================================
router.get('/nao-lidos', async (req: Request, res: Response) => {
  try {
    const result = await caixaEntradaService.contarNaoLidos(
      req.user!.organizacao_id!,
      req.user!.id
    )
    res.json(result)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// =====================================================
// RASCUNHOS
// =====================================================
router.get('/rascunhos', async (req: Request, res: Response) => {
  try {
    const result = await caixaEntradaService.listarRascunhos(
      req.user!.organizacao_id!,
      req.user!.id
    )
    res.json({ data: result })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/rascunhos', async (req: Request, res: Response) => {
  try {
    const parsed = CriarRascunhoSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Dados invalidos', detalhes: parsed.error.flatten() })
    }

    const result = await caixaEntradaService.salvarRascunho(
      req.user!.organizacao_id!,
      req.user!.id,
      parsed.data
    )
    res.status(201).json(result)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/rascunhos/:id', async (req: Request, res: Response) => {
  try {
    await caixaEntradaService.deletarRascunho(
      req.user!.organizacao_id!,
      req.user!.id,
      req.params.id
    )
    res.json({ ok: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// =====================================================
// ENVIAR EMAIL
// =====================================================
router.post('/enviar', async (req: Request, res: Response) => {
  try {
    const parsed = EnviarEmailSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Dados invalidos', detalhes: parsed.error.flatten() })
    }

    const result = await caixaEntradaService.enviarEmail(
      req.user!.organizacao_id!,
      req.user!.id,
      parsed.data
    )
    res.json(result)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// =====================================================
// ACOES EM LOTE
// =====================================================
router.post('/lote', async (req: Request, res: Response) => {
  try {
    const parsed = AcaoLoteSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Dados invalidos', detalhes: parsed.error.flatten() })
    }

    const result = await caixaEntradaService.executarLote(
      req.user!.organizacao_id!,
      req.user!.id,
      parsed.data
    )
    res.json(result)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// =====================================================
// SINCRONIZACAO
// =====================================================
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const result = await caixaEntradaService.forcarSync(
      req.user!.organizacao_id!,
      req.user!.id
    )
    res.json(result)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/sync/status', async (req: Request, res: Response) => {
  try {
    const result = await caixaEntradaService.obterStatusSync(
      req.user!.organizacao_id!,
      req.user!.id
    )
    res.json({ data: result })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// =====================================================
// ASSINATURA
// =====================================================
router.get('/assinatura', async (req: Request, res: Response) => {
  try {
    const result = await caixaEntradaService.obterAssinatura(
      req.user!.organizacao_id!,
      req.user!.id
    )
    res.json(result)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/assinatura', async (req: Request, res: Response) => {
  try {
    const parsed = SalvarAssinaturaSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Dados invalidos', detalhes: parsed.error.flatten() })
    }

    const result = await caixaEntradaService.salvarAssinatura(
      req.user!.organizacao_id!,
      req.user!.id,
      parsed.data
    )
    res.json(result)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// =====================================================
// DETALHE / ATUALIZAR / DELETAR EMAIL
// =====================================================
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await caixaEntradaService.obterEmail(
      req.user!.organizacao_id!,
      req.user!.id,
      req.params.id
    )
    res.json(result)
  } catch (err: any) {
    const status = err.message?.includes('nao encontrado') ? 404 : 500
    res.status(status).json({ error: err.message })
  }
})

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const parsed = AtualizarEmailSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Dados invalidos', detalhes: parsed.error.flatten() })
    }

    const result = await caixaEntradaService.atualizarEmail(
      req.user!.organizacao_id!,
      req.user!.id,
      req.params.id,
      parsed.data
    )
    res.json(result)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await caixaEntradaService.deletarEmail(
      req.user!.organizacao_id!,
      req.user!.id,
      req.params.id
    )
    res.json({ ok: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// =====================================================
// RESPONDER / ENCAMINHAR
// =====================================================
router.post('/:id/responder', async (req: Request, res: Response) => {
  try {
    const parsed = ResponderEmailSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Dados invalidos', detalhes: parsed.error.flatten() })
    }

    const result = await caixaEntradaService.responderEmail(
      req.user!.organizacao_id!,
      req.user!.id,
      req.params.id,
      parsed.data
    )
    res.json(result)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/:id/encaminhar', async (req: Request, res: Response) => {
  try {
    const parsed = EncaminharEmailSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Dados invalidos', detalhes: parsed.error.flatten() })
    }

    const result = await caixaEntradaService.encaminharEmail(
      req.user!.organizacao_id!,
      req.user!.id,
      req.params.id,
      parsed.data
    )
    res.json(result)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// =====================================================
// DOWNLOAD DE ANEXO
// =====================================================
router.get('/:id/anexos/:anexoId', async (req: Request, res: Response) => {
  try {
    const result = await caixaEntradaService.downloadAnexo(
      req.user!.organizacao_id!,
      req.user!.id,
      req.params.id,
      req.params.anexoId
    )

    res.setHeader('Content-Type', result.mimeType)
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`)
    res.send(result.data)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
