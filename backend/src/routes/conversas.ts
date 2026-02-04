/**
 * AIDEV-NOTE: Routes do modulo de Conversas (PRD-09)
 *
 * Endpoints de Conversas:
 * - GET /api/v1/conversas - Lista conversas com filtros
 * - GET /api/v1/conversas/:id - Detalhes de uma conversa
 * - POST /api/v1/conversas - Inicia nova conversa
 * - PATCH /api/v1/conversas/:id/status - Altera status
 * - POST /api/v1/conversas/:id/marcar-lida - Marca como lida
 *
 * Endpoints de Mensagens (nested):
 * - GET /api/v1/conversas/:id/mensagens - Lista mensagens
 * - POST /api/v1/conversas/:id/mensagens/texto - Envia texto
 * - POST /api/v1/conversas/:id/mensagens/media - Envia midia
 * - POST /api/v1/conversas/:id/mensagens/localizacao - Envia localizacao
 * - POST /api/v1/conversas/:id/mensagens/contato - Envia contato
 * - POST /api/v1/conversas/:id/mensagens/enquete - Envia enquete
 *
 * Regras de Acesso:
 * - Super Admin: NAO tem acesso
 * - Admin: Ve todas conversas do tenant
 * - Member: Ve apenas suas proprias conversas
 */

import { Router } from 'express'
import type { Request, Response } from 'express'
import { authMiddleware, requireRole, requireTenant } from '../middlewares/auth'
import conversasService from '../services/conversas.service'
import mensagensService from '../services/mensagens.service'
import {
  ListarConversasQuerySchema,
  AlterarStatusConversaSchema,
  CriarConversaSchema,
} from '../schemas/conversas'
import {
  ListarMensagensQuerySchema,
  EnviarMensagemTextoSchema,
  EnviarMensagemMediaSchema,
  EnviarMensagemLocalizacaoSchema,
  EnviarMensagemContatoSchema,
  EnviarMensagemEnqueteSchema,
} from '../schemas/mensagens'

const router = Router()

// =====================================================
// Middlewares
// =====================================================

router.use(authMiddleware)
router.use(requireTenant)
router.use(requireRole('admin', 'member'))

// =====================================================
// CONVERSAS
// =====================================================

/**
 * GET /api/v1/conversas
 * Lista conversas com filtros e paginacao
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { organizacao_id, id: usuarioId, role } = req.user!

    if (!organizacao_id) {
      return res.status(400).json({ error: 'Organizacao nao identificada' })
    }

    const parseResult = ListarConversasQuerySchema.safeParse(req.query)

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Parametros de consulta invalidos',
        details: parseResult.error.flatten(),
      })
    }

    const resultado = await conversasService.listar(
      organizacao_id,
      usuarioId,
      role,
      parseResult.data
    )

    return res.json(resultado)
  } catch (error) {
    console.error('Erro ao listar conversas:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Erro ao listar conversas',
    })
  }
})

/**
 * GET /api/v1/conversas/:id
 * Busca conversa por ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { organizacao_id, id: usuarioId, role } = req.user!
    const { id: conversaId } = req.params

    if (!organizacao_id) {
      return res.status(400).json({ error: 'Organizacao nao identificada' })
    }

    const conversa = await conversasService.buscarPorId(
      conversaId,
      organizacao_id,
      usuarioId,
      role
    )

    if (!conversa) {
      return res.status(404).json({ error: 'Conversa nao encontrada' })
    }

    return res.json(conversa)
  } catch (error) {
    console.error('Erro ao buscar conversa:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Erro ao buscar conversa',
    })
  }
})

/**
 * POST /api/v1/conversas
 * Inicia nova conversa
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { organizacao_id, id: usuarioId } = req.user!

    if (!organizacao_id) {
      return res.status(400).json({ error: 'Organizacao nao identificada' })
    }

    const parseResult = CriarConversaSchema.safeParse(req.body)

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Dados invalidos',
        details: parseResult.error.flatten(),
      })
    }

    const conversa = await conversasService.criar(
      organizacao_id,
      usuarioId,
      parseResult.data
    )

    return res.status(201).json(conversa)
  } catch (error) {
    console.error('Erro ao criar conversa:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Erro ao criar conversa',
    })
  }
})

/**
 * PATCH /api/v1/conversas/:id/status
 * Altera status da conversa
 */
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { organizacao_id, id: usuarioId, role } = req.user!
    const { id: conversaId } = req.params

    if (!organizacao_id) {
      return res.status(400).json({ error: 'Organizacao nao identificada' })
    }

    const parseResult = AlterarStatusConversaSchema.safeParse(req.body)

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Dados invalidos',
        details: parseResult.error.flatten(),
      })
    }

    const conversa = await conversasService.alterarStatus(
      conversaId,
      organizacao_id,
      usuarioId,
      role,
      parseResult.data
    )

    return res.json(conversa)
  } catch (error) {
    console.error('Erro ao alterar status da conversa:', error)

    const message = error instanceof Error ? error.message : 'Erro ao alterar status'

    if (message.includes('permissao')) {
      return res.status(403).json({ error: message })
    }
    if (message.includes('nao encontrada')) {
      return res.status(404).json({ error: message })
    }

    return res.status(500).json({ error: message })
  }
})

/**
 * POST /api/v1/conversas/:id/marcar-lida
 * Marca conversa como lida
 */
router.post('/:id/marcar-lida', async (req: Request, res: Response) => {
  try {
    const { organizacao_id, id: usuarioId, role } = req.user!
    const { id: conversaId } = req.params

    if (!organizacao_id) {
      return res.status(400).json({ error: 'Organizacao nao identificada' })
    }

    await conversasService.marcarComoLida(
      conversaId,
      organizacao_id,
      usuarioId,
      role
    )

    return res.json({ success: true })
  } catch (error) {
    console.error('Erro ao marcar conversa como lida:', error)

    const message = error instanceof Error ? error.message : 'Erro ao marcar como lida'

    if (message.includes('permissao')) {
      return res.status(403).json({ error: message })
    }
    if (message.includes('nao encontrada')) {
      return res.status(404).json({ error: message })
    }

    return res.status(500).json({ error: message })
  }
})

// =====================================================
// MENSAGENS (nested)
// =====================================================

/**
 * GET /api/v1/conversas/:id/mensagens
 * Lista mensagens de uma conversa
 */
router.get('/:id/mensagens', async (req: Request, res: Response) => {
  try {
    const { organizacao_id, id: usuarioId, role } = req.user!
    const { id: conversaId } = req.params

    if (!organizacao_id) {
      return res.status(400).json({ error: 'Organizacao nao identificada' })
    }

    const parseResult = ListarMensagensQuerySchema.safeParse(req.query)

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Parametros de consulta invalidos',
        details: parseResult.error.flatten(),
      })
    }

    const resultado = await mensagensService.listar(
      conversaId,
      organizacao_id,
      usuarioId,
      role,
      parseResult.data
    )

    return res.json(resultado)
  } catch (error) {
    console.error('Erro ao listar mensagens:', error)

    const message = error instanceof Error ? error.message : 'Erro ao listar mensagens'

    if (message.includes('permissao')) {
      return res.status(403).json({ error: message })
    }
    if (message.includes('nao encontrada')) {
      return res.status(404).json({ error: message })
    }

    return res.status(500).json({ error: message })
  }
})

/**
 * POST /api/v1/conversas/:id/mensagens/texto
 * Envia mensagem de texto
 */
router.post('/:id/mensagens/texto', async (req: Request, res: Response) => {
  try {
    const { organizacao_id, id: usuarioId, role } = req.user!
    const { id: conversaId } = req.params

    if (!organizacao_id) {
      return res.status(400).json({ error: 'Organizacao nao identificada' })
    }

    const parseResult = EnviarMensagemTextoSchema.safeParse(req.body)

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Dados invalidos',
        details: parseResult.error.flatten(),
      })
    }

    const mensagem = await mensagensService.enviarTexto(
      conversaId,
      organizacao_id,
      usuarioId,
      role,
      parseResult.data
    )

    return res.status(201).json(mensagem)
  } catch (error) {
    console.error('Erro ao enviar mensagem de texto:', error)

    const message = error instanceof Error ? error.message : 'Erro ao enviar mensagem'

    if (message.includes('permissao')) {
      return res.status(403).json({ error: message })
    }
    if (message.includes('nao encontrada') || message.includes('nao implementado')) {
      return res.status(400).json({ error: message })
    }

    return res.status(500).json({ error: message })
  }
})

/**
 * POST /api/v1/conversas/:id/mensagens/media
 * Envia mensagem com midia (imagem, video, audio, documento)
 */
router.post('/:id/mensagens/media', async (req: Request, res: Response) => {
  try {
    const { organizacao_id, id: usuarioId, role } = req.user!
    const { id: conversaId } = req.params

    if (!organizacao_id) {
      return res.status(400).json({ error: 'Organizacao nao identificada' })
    }

    const parseResult = EnviarMensagemMediaSchema.safeParse(req.body)

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Dados invalidos',
        details: parseResult.error.flatten(),
      })
    }

    const mensagem = await mensagensService.enviarMedia(
      conversaId,
      organizacao_id,
      usuarioId,
      role,
      parseResult.data
    )

    return res.status(201).json(mensagem)
  } catch (error) {
    console.error('Erro ao enviar midia:', error)

    const message = error instanceof Error ? error.message : 'Erro ao enviar midia'

    if (message.includes('permissao')) {
      return res.status(403).json({ error: message })
    }
    if (message.includes('nao encontrada') || message.includes('nao implementado')) {
      return res.status(400).json({ error: message })
    }

    return res.status(500).json({ error: message })
  }
})

/**
 * POST /api/v1/conversas/:id/mensagens/localizacao
 * Envia localizacao
 */
router.post('/:id/mensagens/localizacao', async (req: Request, res: Response) => {
  try {
    const { organizacao_id, id: usuarioId, role } = req.user!
    const { id: conversaId } = req.params

    if (!organizacao_id) {
      return res.status(400).json({ error: 'Organizacao nao identificada' })
    }

    const parseResult = EnviarMensagemLocalizacaoSchema.safeParse(req.body)

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Dados invalidos',
        details: parseResult.error.flatten(),
      })
    }

    const mensagem = await mensagensService.enviarLocalizacao(
      conversaId,
      organizacao_id,
      usuarioId,
      role,
      parseResult.data
    )

    return res.status(201).json(mensagem)
  } catch (error) {
    console.error('Erro ao enviar localizacao:', error)

    const message = error instanceof Error ? error.message : 'Erro ao enviar localizacao'

    if (message.includes('permissao')) {
      return res.status(403).json({ error: message })
    }

    return res.status(500).json({ error: message })
  }
})

/**
 * POST /api/v1/conversas/:id/mensagens/contato
 * Envia vCard
 */
router.post('/:id/mensagens/contato', async (req: Request, res: Response) => {
  try {
    const { organizacao_id, id: usuarioId, role } = req.user!
    const { id: conversaId } = req.params

    if (!organizacao_id) {
      return res.status(400).json({ error: 'Organizacao nao identificada' })
    }

    const parseResult = EnviarMensagemContatoSchema.safeParse(req.body)

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Dados invalidos',
        details: parseResult.error.flatten(),
      })
    }

    const mensagem = await mensagensService.enviarContato(
      conversaId,
      organizacao_id,
      usuarioId,
      role,
      parseResult.data
    )

    return res.status(201).json(mensagem)
  } catch (error) {
    console.error('Erro ao enviar contato:', error)

    const message = error instanceof Error ? error.message : 'Erro ao enviar contato'

    if (message.includes('permissao')) {
      return res.status(403).json({ error: message })
    }

    return res.status(500).json({ error: message })
  }
})

/**
 * POST /api/v1/conversas/:id/mensagens/enquete
 * Envia enquete
 */
router.post('/:id/mensagens/enquete', async (req: Request, res: Response) => {
  try {
    const { organizacao_id, id: usuarioId, role } = req.user!
    const { id: conversaId } = req.params

    if (!organizacao_id) {
      return res.status(400).json({ error: 'Organizacao nao identificada' })
    }

    const parseResult = EnviarMensagemEnqueteSchema.safeParse(req.body)

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Dados invalidos',
        details: parseResult.error.flatten(),
      })
    }

    const mensagem = await mensagensService.enviarEnquete(
      conversaId,
      organizacao_id,
      usuarioId,
      role,
      parseResult.data
    )

    return res.status(201).json(mensagem)
  } catch (error) {
    console.error('Erro ao enviar enquete:', error)

    const message = error instanceof Error ? error.message : 'Erro ao enviar enquete'

    if (message.includes('permissao')) {
      return res.status(403).json({ error: message })
    }

    return res.status(500).json({ error: message })
  }
})

export default router
