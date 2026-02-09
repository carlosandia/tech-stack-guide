/**
 * AIDEV-NOTE: Rotas autenticadas para Formularios
 * Conforme PRD-17 - Modulo de Formularios (Etapa 1)
 *
 * Admin: CRUD completo, publicar, duplicar
 * Member: Visualizacao
 */

import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import formulariosService from '../services/formularios.service.js'
import camposService from '../services/campos-formularios.service.js'
import estilosService from '../services/estilos-formularios.service.js'
import submissoesService from '../services/submissoes-formularios.service.js'
import configService from '../services/config-formularios.service.js'
import {
  CriarFormularioSchema,
  AtualizarFormularioSchema,
  ListarFormulariosQuerySchema,
  CriarCampoSchema,
  AtualizarCampoSchema,
  ReordenarCamposSchema,
  AtualizarEstiloSchema,
  ListarSubmissoesQuerySchema,
  CriarLinkCompartilhamentoSchema,
  AtualizarConfigPopupSchema,
  AtualizarConfigNewsletterSchema,
  AtualizarEtapasSchema,
} from '../schemas/formularios.js'

const router = Router()

// =====================================================
// Helpers
// =====================================================

function getOrganizacaoId(req: Request): string {
  const user = (req as any).user
  if (!user?.organizacao_id) throw new Error('Usuario nao autenticado ou sem organizacao')
  return user.organizacao_id
}

function getUserId(req: Request): string | undefined {
  return (req as any).user?.id
}

function isAdmin(req: Request): boolean {
  const user = (req as any).user
  return user?.role === 'admin' || user?.role === 'super_admin'
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Acesso restrito a administradores' })
  next()
}

// =====================================================
// FORMULARIOS - CRUD
// =====================================================

// GET / - Listar formularios
router.get('/', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const query = ListarFormulariosQuerySchema.parse(req.query)
    const result = await formulariosService.listarFormularios(organizacaoId, query)
    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Parametros invalidos', details: error.errors })
    console.error('Erro ao listar formularios:', error)
    res.status(500).json({ error: 'Erro ao listar formularios' })
  }
})

// GET /contadores - Contadores para UI
router.get('/contadores', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const contadores = await formulariosService.obterContadores(organizacaoId)
    res.json(contadores)
  } catch (error) {
    console.error('Erro ao obter contadores:', error)
    res.status(500).json({ error: 'Erro ao obter contadores' })
  }
})

// GET /:id - Buscar formulario
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const formulario = await formulariosService.buscarFormulario(organizacaoId, req.params.id)
    if (!formulario) return res.status(404).json({ error: 'Formulario nao encontrado' })
    res.json(formulario)
  } catch (error) {
    console.error('Erro ao buscar formulario:', error)
    res.status(500).json({ error: 'Erro ao buscar formulario' })
  }
})

// POST / - Criar formulario (Admin)
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const payload = CriarFormularioSchema.parse(req.body)
    const formulario = await formulariosService.criarFormulario(organizacaoId, payload, getUserId(req))
    res.status(201).json(formulario)
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    console.error('Erro ao criar formulario:', error)
    res.status(500).json({ error: 'Erro ao criar formulario' })
  }
})

// PUT /:id - Atualizar formulario (Admin)
router.put('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const payload = AtualizarFormularioSchema.parse(req.body)
    const formulario = await formulariosService.atualizarFormulario(organizacaoId, req.params.id, payload)
    res.json(formulario)
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    if (error instanceof Error && error.message === 'Formulario nao encontrado') return res.status(404).json({ error: error.message })
    console.error('Erro ao atualizar formulario:', error)
    res.status(500).json({ error: 'Erro ao atualizar formulario' })
  }
})

// DELETE /:id - Excluir formulario (Admin)
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    await formulariosService.excluirFormulario(organizacaoId, req.params.id)
    res.status(204).send()
  } catch (error) {
    if (error instanceof Error && error.message === 'Formulario nao encontrado') return res.status(404).json({ error: error.message })
    console.error('Erro ao excluir formulario:', error)
    res.status(500).json({ error: 'Erro ao excluir formulario' })
  }
})

// POST /:id/publicar - Publicar formulario (Admin)
router.post('/:id/publicar', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const formulario = await formulariosService.publicarFormulario(organizacaoId, req.params.id)
    res.json(formulario)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Formulario nao encontrado') return res.status(404).json({ error: error.message })
      if (error.message.includes('pelo menos 1 campo')) return res.status(400).json({ error: error.message })
    }
    console.error('Erro ao publicar formulario:', error)
    res.status(500).json({ error: 'Erro ao publicar formulario' })
  }
})

// POST /:id/despublicar - Despublicar formulario (Admin)
router.post('/:id/despublicar', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const formulario = await formulariosService.despublicarFormulario(organizacaoId, req.params.id)
    res.json(formulario)
  } catch (error) {
    if (error instanceof Error && error.message === 'Formulario nao encontrado') return res.status(404).json({ error: error.message })
    console.error('Erro ao despublicar formulario:', error)
    res.status(500).json({ error: 'Erro ao despublicar formulario' })
  }
})

// POST /:id/duplicar - Duplicar formulario (Admin)
router.post('/:id/duplicar', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const formulario = await formulariosService.duplicarFormulario(organizacaoId, req.params.id, getUserId(req))
    res.status(201).json(formulario)
  } catch (error) {
    if (error instanceof Error && error.message === 'Formulario nao encontrado') return res.status(404).json({ error: error.message })
    console.error('Erro ao duplicar formulario:', error)
    res.status(500).json({ error: 'Erro ao duplicar formulario' })
  }
})

// =====================================================
// CAMPOS DO FORMULARIO
// =====================================================

// PUT /:id/campos/reordenar - Reordenar campos (Admin) - DEVE vir ANTES de /:id/campos/:campoId
router.put('/:id/campos/reordenar', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const payload = ReordenarCamposSchema.parse(req.body)
    await camposService.reordenarCampos(organizacaoId, req.params.id, payload)
    res.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    console.error('Erro ao reordenar campos:', error)
    res.status(500).json({ error: 'Erro ao reordenar campos' })
  }
})

// GET /:id/campos - Listar campos
router.get('/:id/campos', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const campos = await camposService.listarCampos(organizacaoId, req.params.id)
    res.json({ campos })
  } catch (error) {
    if (error instanceof Error && error.message === 'Formulario nao encontrado') return res.status(404).json({ error: error.message })
    console.error('Erro ao listar campos:', error)
    res.status(500).json({ error: 'Erro ao listar campos' })
  }
})

// POST /:id/campos - Criar campo (Admin)
router.post('/:id/campos', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const payload = CriarCampoSchema.parse(req.body)
    const campo = await camposService.criarCampo(organizacaoId, req.params.id, payload)
    res.status(201).json(campo)
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    if (error instanceof Error && error.message === 'Formulario nao encontrado') return res.status(404).json({ error: error.message })
    console.error('Erro ao criar campo:', error)
    res.status(500).json({ error: 'Erro ao criar campo' })
  }
})

// PUT /:id/campos/:campoId - Atualizar campo (Admin)
router.put('/:id/campos/:campoId', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const payload = AtualizarCampoSchema.parse(req.body)
    const campo = await camposService.atualizarCampo(organizacaoId, req.params.id, req.params.campoId, payload)
    res.json(campo)
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    if (error instanceof Error) {
      if (error.message === 'Formulario nao encontrado' || error.message === 'Campo nao encontrado')
        return res.status(404).json({ error: error.message })
    }
    console.error('Erro ao atualizar campo:', error)
    res.status(500).json({ error: 'Erro ao atualizar campo' })
  }
})

// DELETE /:id/campos/:campoId - Excluir campo (Admin)
router.delete('/:id/campos/:campoId', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    await camposService.excluirCampo(organizacaoId, req.params.id, req.params.campoId)
    res.status(204).send()
  } catch (error) {
    if (error instanceof Error && error.message === 'Formulario nao encontrado') return res.status(404).json({ error: error.message })
    console.error('Erro ao excluir campo:', error)
    res.status(500).json({ error: 'Erro ao excluir campo' })
  }
})

// =====================================================
// ESTILOS DO FORMULARIO
// =====================================================

// GET /:id/estilos - Buscar estilos
router.get('/:id/estilos', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const estilos = await estilosService.buscarEstilos(organizacaoId, req.params.id)
    res.json(estilos || {})
  } catch (error) {
    if (error instanceof Error && error.message === 'Formulario nao encontrado') return res.status(404).json({ error: error.message })
    console.error('Erro ao buscar estilos:', error)
    res.status(500).json({ error: 'Erro ao buscar estilos' })
  }
})

// PUT /:id/estilos - Atualizar estilos (Admin)
router.put('/:id/estilos', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const payload = AtualizarEstiloSchema.parse(req.body)
    const estilos = await estilosService.atualizarEstilos(organizacaoId, req.params.id, payload)
    res.json(estilos)
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    if (error instanceof Error && error.message === 'Formulario nao encontrado') return res.status(404).json({ error: error.message })
    console.error('Erro ao atualizar estilos:', error)
    res.status(500).json({ error: 'Erro ao atualizar estilos' })
  }
})

// =====================================================
// SUBMISSOES
// =====================================================

// GET /:id/submissoes - Listar submissoes
router.get('/:id/submissoes', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const query = ListarSubmissoesQuerySchema.parse(req.query)
    const result = await submissoesService.listarSubmissoes(organizacaoId, req.params.id, query)
    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Parametros invalidos', details: error.errors })
    if (error instanceof Error && error.message === 'Formulario nao encontrado') return res.status(404).json({ error: error.message })
    console.error('Erro ao listar submissoes:', error)
    res.status(500).json({ error: 'Erro ao listar submissoes' })
  }
})

// =====================================================
// LINKS DE COMPARTILHAMENTO
// =====================================================

// POST /:id/compartilhar - Criar link de compartilhamento (Admin)
router.post('/:id/compartilhar', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const payload = CriarLinkCompartilhamentoSchema.parse(req.body)
    const baseUrl = `${req.protocol}://${req.get('host')}`
    const link = await submissoesService.criarLinkCompartilhamento(
      organizacaoId, req.params.id, payload, baseUrl, getUserId(req)
    )
    res.status(201).json(link)
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    if (error instanceof Error && error.message === 'Formulario nao encontrado') return res.status(404).json({ error: error.message })
    console.error('Erro ao criar link:', error)
    res.status(500).json({ error: 'Erro ao criar link de compartilhamento' })
  }
})

// GET /:id/links-compartilhamento - Listar links
router.get('/:id/links-compartilhamento', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const links = await submissoesService.listarLinksCompartilhamento(organizacaoId, req.params.id)
    res.json({ links })
  } catch (error) {
    console.error('Erro ao listar links:', error)
    res.status(500).json({ error: 'Erro ao listar links de compartilhamento' })
  }
})

// =====================================================
// CONFIG POPUP (Etapa 2)
// =====================================================

// GET /:id/config-popup
router.get('/:id/config-popup', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const config = await configService.buscarConfigPopup(organizacaoId, req.params.id)
    res.json(config || {})
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Formulario nao encontrado') return res.status(404).json({ error: error.message })
      if (error.message.includes('nao e do tipo')) return res.status(400).json({ error: error.message })
    }
    console.error('Erro ao buscar config popup:', error)
    res.status(500).json({ error: 'Erro ao buscar config popup' })
  }
})

// PUT /:id/config-popup (Admin)
router.put('/:id/config-popup', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const payload = AtualizarConfigPopupSchema.parse(req.body)
    const config = await configService.atualizarConfigPopup(organizacaoId, req.params.id, payload)
    res.json(config)
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    if (error instanceof Error) {
      if (error.message === 'Formulario nao encontrado') return res.status(404).json({ error: error.message })
      if (error.message.includes('nao e do tipo')) return res.status(400).json({ error: error.message })
    }
    console.error('Erro ao atualizar config popup:', error)
    res.status(500).json({ error: 'Erro ao atualizar config popup' })
  }
})

// =====================================================
// CONFIG NEWSLETTER (Etapa 2)
// =====================================================

// GET /:id/config-newsletter
router.get('/:id/config-newsletter', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const config = await configService.buscarConfigNewsletter(organizacaoId, req.params.id)
    res.json(config || {})
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Formulario nao encontrado') return res.status(404).json({ error: error.message })
      if (error.message.includes('nao e do tipo')) return res.status(400).json({ error: error.message })
    }
    console.error('Erro ao buscar config newsletter:', error)
    res.status(500).json({ error: 'Erro ao buscar config newsletter' })
  }
})

// PUT /:id/config-newsletter (Admin)
router.put('/:id/config-newsletter', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const payload = AtualizarConfigNewsletterSchema.parse(req.body)
    const config = await configService.atualizarConfigNewsletter(organizacaoId, req.params.id, payload)
    res.json(config)
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    if (error instanceof Error) {
      if (error.message === 'Formulario nao encontrado') return res.status(404).json({ error: error.message })
      if (error.message.includes('nao e do tipo')) return res.status(400).json({ error: error.message })
    }
    console.error('Erro ao atualizar config newsletter:', error)
    res.status(500).json({ error: 'Erro ao atualizar config newsletter' })
  }
})

// =====================================================
// ETAPAS MULTI-STEP (Etapa 2)
// =====================================================

// GET /:id/etapas
router.get('/:id/etapas', async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const etapas = await configService.listarEtapas(organizacaoId, req.params.id)
    res.json({ etapas })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Formulario nao encontrado') return res.status(404).json({ error: error.message })
      if (error.message.includes('nao e do tipo')) return res.status(400).json({ error: error.message })
    }
    console.error('Erro ao listar etapas:', error)
    res.status(500).json({ error: 'Erro ao listar etapas' })
  }
})

// PUT /:id/etapas (Admin) - Bulk update
router.put('/:id/etapas', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizacaoId = getOrganizacaoId(req)
    const payload = AtualizarEtapasSchema.parse(req.body)
    const etapas = await configService.atualizarEtapas(organizacaoId, req.params.id, payload)
    res.json({ etapas })
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Dados invalidos', details: error.errors })
    if (error instanceof Error) {
      if (error.message === 'Formulario nao encontrado') return res.status(404).json({ error: error.message })
      if (error.message.includes('nao e do tipo')) return res.status(400).json({ error: error.message })
    }
    console.error('Erro ao atualizar etapas:', error)
    res.status(500).json({ error: 'Erro ao atualizar etapas' })
  }
})

export default router
