import { supabaseAdmin } from '../config/supabase.js'
import { logger } from '../utils/logger.js'
import type { Plataforma } from '../schemas/admin.js'

/**
 * AIDEV-NOTE: Service para configuracoes globais da plataforma
 * Conforme PRD-14 - Painel Super Admin
 *
 * Gerencia credenciais de apps/OAuth (Meta, Google, Stripe, etc.)
 * NAO gerencia dados de contas de tenants
 */

interface ConfigGlobal {
  id: string
  plataforma: Plataforma
  configuracoes: Record<string, unknown>
  configurado: boolean
  ultimo_teste: string | null
  ultimo_erro: string | null
  criado_em: string
  atualizado_em: string
}

class ConfigGlobalService {
  /**
   * Lista todas as configuracoes globais
   */
  async listar(): Promise<ConfigGlobal[]> {
    const { data, error } = await supabaseAdmin
      .from('configuracoes_globais')
      .select('*')
      .order('plataforma', { ascending: true })

    if (error) {
      logger.error('Erro ao listar configuracoes globais:', error)
      throw new Error('Erro ao listar configuracoes')
    }

    // Mascarar campos sensiveis
    return (data || []).map((config) => ({
      ...config,
      configuracoes: this.mascararSensiveis(config.configuracoes as Record<string, unknown>),
    }))
  }

  /**
   * Obtem configuracao de uma plataforma
   */
  async obter(plataforma: Plataforma): Promise<ConfigGlobal> {
    const { data, error } = await supabaseAdmin
      .from('configuracoes_globais')
      .select('*')
      .eq('plataforma', plataforma)
      .single()

    if (error || !data) {
      throw new Error(`Configuracao ${plataforma} nao encontrada`)
    }

    return {
      ...data,
      configuracoes: this.mascararSensiveis(data.configuracoes as Record<string, unknown>),
    }
  }

  /**
   * Atualiza configuracao de uma plataforma
   */
  async atualizar(
    plataforma: Plataforma,
    configuracoes: Record<string, unknown>,
    superAdminId: string
  ): Promise<void> {
    // Buscar configuracao atual
    const { data: atual } = await supabaseAdmin
      .from('configuracoes_globais')
      .select('configuracoes')
      .eq('plataforma', plataforma)
      .single()

    // Mesclar configuracoes (nao sobrescrever campos nao enviados)
    const configAtual = (atual?.configuracoes as Record<string, unknown>) || {}
    const novaConfig = { ...configAtual }

    // Atualizar apenas campos enviados
    for (const [key, value] of Object.entries(configuracoes)) {
      if (value !== undefined && value !== '') {
        novaConfig[key] = value
      }
    }

    // Verificar se esta configurado (campos obrigatorios preenchidos)
    const configurado = this.verificarConfigurado(plataforma, novaConfig)

    const { error } = await supabaseAdmin
      .from('configuracoes_globais')
      .update({
        configuracoes: novaConfig,
        configurado,
        atualizado_em: new Date().toISOString(),
      })
      .eq('plataforma', plataforma)

    if (error) {
      logger.error(`Erro ao atualizar configuracao ${plataforma}:`, error)
      throw new Error('Erro ao atualizar configuracao')
    }

    // Audit log (sem dados sensiveis)
    await supabaseAdmin.from('audit_log').insert({
      usuario_id: superAdminId,
      acao: 'atualizar_config_global',
      entidade: 'configuracoes_globais',
      entidade_id: plataforma,
      dados_novos: { plataforma, campos_atualizados: Object.keys(configuracoes) },
    })

    logger.info(`Configuracao ${plataforma} atualizada por Super Admin ${superAdminId}`)
  }

  /**
   * Testa conexao com uma plataforma
   */
  async testar(plataforma: Plataforma, superAdminId: string): Promise<{ sucesso: boolean; mensagem: string }> {
    const { data } = await supabaseAdmin
      .from('configuracoes_globais')
      .select('configuracoes')
      .eq('plataforma', plataforma)
      .single()

    if (!data) {
      return { sucesso: false, mensagem: 'Configuracao nao encontrada' }
    }

    const config = data.configuracoes as Record<string, unknown>
    let resultado: { sucesso: boolean; mensagem: string }

    try {
      switch (plataforma) {
        case 'stripe':
          resultado = await this.testarStripe(config)
          break
        case 'email_sistema':
          resultado = await this.testarEmail(config)
          break
        case 'meta':
          resultado = await this.testarMeta(config)
          break
        case 'google':
          resultado = await this.testarGoogle(config)
          break
        case 'recaptcha':
          resultado = await this.testarRecaptcha(config)
          break
        case 'waha':
          resultado = await this.testarWaha(config)
          break
        default:
          resultado = { sucesso: false, mensagem: 'Plataforma nao suportada para teste' }
      }
    } catch (err) {
      resultado = {
        sucesso: false,
        mensagem: err instanceof Error ? err.message : 'Erro ao testar conexao',
      }
    }

    // Atualizar status do teste
    await supabaseAdmin
      .from('configuracoes_globais')
      .update({
        ultimo_teste: new Date().toISOString(),
        ultimo_erro: resultado.sucesso ? null : resultado.mensagem,
      })
      .eq('plataforma', plataforma)

    // Audit log
    await supabaseAdmin.from('audit_log').insert({
      usuario_id: superAdminId,
      acao: 'testar_config_global',
      entidade: 'configuracoes_globais',
      entidade_id: plataforma,
      dados_novos: { resultado: resultado.sucesso ? 'sucesso' : 'falha' },
    })

    return resultado
  }

  /**
   * Regenera webhook token do Meta
   */
  async regenerarWebhookTokenMeta(superAdminId: string): Promise<string> {
    const novoToken = this.gerarTokenAleatorio(32)

    await supabaseAdmin
      .from('configuracoes_globais')
      .update({
        configuracoes: supabaseAdmin.rpc('jsonb_set', {
          target: 'configuracoes',
          path: '{webhook_verify_token_encrypted}',
          new_value: novoToken,
        }),
        atualizado_em: new Date().toISOString(),
      })
      .eq('plataforma', 'meta')

    // Na pratica, usaria uma funcao SQL para atualizar apenas o campo
    const { data: atual } = await supabaseAdmin
      .from('configuracoes_globais')
      .select('configuracoes')
      .eq('plataforma', 'meta')
      .single()

    if (atual) {
      const config = atual.configuracoes as Record<string, unknown>
      config.webhook_verify_token_encrypted = novoToken

      await supabaseAdmin
        .from('configuracoes_globais')
        .update({
          configuracoes: config,
          atualizado_em: new Date().toISOString(),
        })
        .eq('plataforma', 'meta')
    }

    // Audit log
    await supabaseAdmin.from('audit_log').insert({
      usuario_id: superAdminId,
      acao: 'regenerar_webhook_token_meta',
      entidade: 'configuracoes_globais',
      entidade_id: 'meta',
    })

    logger.info(`Webhook token Meta regenerado por Super Admin ${superAdminId}`)
    return novoToken
  }

  // =======================
  // HELPERS PRIVADOS
  // =======================

  private mascararSensiveis(config: Record<string, unknown>): Record<string, unknown> {
    const camposSensiveis = [
      'app_secret_encrypted',
      'client_secret_encrypted',
      'secret_key_encrypted',
      'webhook_secret_encrypted',
      'api_key_encrypted',
      'smtp_pass_encrypted',
      'webhook_verify_token_encrypted',
    ]

    const resultado = { ...config }
    for (const campo of camposSensiveis) {
      if (resultado[campo]) {
        resultado[campo] = '********'
      }
    }
    return resultado
  }

  private verificarConfigurado(plataforma: Plataforma, config: Record<string, unknown>): boolean {
    const camposObrigatorios: Record<Plataforma, string[]> = {
      meta: ['app_id', 'app_secret_encrypted'],
      google: ['client_id', 'client_secret_encrypted', 'redirect_uri'],
      recaptcha: ['site_key', 'secret_key_encrypted'],
      stripe: ['public_key', 'secret_key_encrypted'],
      waha: ['api_url', 'api_key_encrypted'],
      email_sistema: ['smtp_host', 'smtp_user', 'smtp_pass_encrypted', 'from_email'],
    }

    const campos = camposObrigatorios[plataforma] || []
    return campos.every((campo) => config[campo] && config[campo] !== '')
  }

  private gerarTokenAleatorio(tamanho: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let resultado = ''
    for (let i = 0; i < tamanho; i++) {
      resultado += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return resultado
  }

  // =======================
  // TESTES DE CONEXAO
  // =======================

  private async testarStripe(config: Record<string, unknown>): Promise<{ sucesso: boolean; mensagem: string }> {
    const secretKey = config.secret_key_encrypted as string
    if (!secretKey) {
      return { sucesso: false, mensagem: 'Secret key nao configurada' }
    }

    try {
      const response = await fetch('https://api.stripe.com/v1/charges?limit=1', {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
        signal: AbortSignal.timeout(10000),
      })

      if (response.ok) {
        return { sucesso: true, mensagem: 'Conexao com Stripe bem sucedida' }
      } else {
        const errorData = await response.json() as { error?: { message?: string } }
        return { sucesso: false, mensagem: errorData.error?.message || 'Erro de autenticacao' }
      }
    } catch {
      return { sucesso: false, mensagem: 'Erro ao conectar com Stripe' }
    }
  }

  private async testarEmail(config: Record<string, unknown>): Promise<{ sucesso: boolean; mensagem: string }> {
    // Verificar campos obrigatorios
    const host = config.smtp_host as string
    const user = config.smtp_user as string
    const pass = config.smtp_pass_encrypted as string

    if (!host || !user || !pass) {
      return { sucesso: false, mensagem: 'Configuracao SMTP incompleta' }
    }

    // Em producao, testaria conexao SMTP real
    // Por enquanto, apenas verifica se campos estao preenchidos
    return { sucesso: true, mensagem: 'Configuracao SMTP validada' }
  }

  private async testarMeta(config: Record<string, unknown>): Promise<{ sucesso: boolean; mensagem: string }> {
    const appId = config.app_id as string
    const appSecret = config.app_secret_encrypted as string

    if (!appId || !appSecret) {
      return { sucesso: false, mensagem: 'App ID ou App Secret nao configurados' }
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${appId}?access_token=${appId}|${appSecret}`,
        { signal: AbortSignal.timeout(10000) }
      )

      if (response.ok) {
        return { sucesso: true, mensagem: 'Conexao com Meta bem sucedida' }
      } else {
        const errorData = await response.json() as { error?: { message?: string } }
        return { sucesso: false, mensagem: errorData.error?.message || 'Erro de autenticacao' }
      }
    } catch {
      return { sucesso: false, mensagem: 'Erro ao conectar com Meta' }
    }
  }

  private async testarGoogle(config: Record<string, unknown>): Promise<{ sucesso: boolean; mensagem: string }> {
    const clientId = config.client_id as string
    const redirectUri = config.redirect_uri as string

    if (!clientId || !redirectUri) {
      return { sucesso: false, mensagem: 'Client ID ou Redirect URI nao configurados' }
    }

    // Verificar se redirect URI e valida
    try {
      new URL(redirectUri)
      return { sucesso: true, mensagem: 'Configuracao Google validada' }
    } catch {
      return { sucesso: false, mensagem: 'Redirect URI invalida' }
    }
  }

  private async testarRecaptcha(config: Record<string, unknown>): Promise<{ sucesso: boolean; mensagem: string }> {
    const siteKey = config.site_key as string
    const secretKey = config.secret_key_encrypted as string

    if (!siteKey || !secretKey) {
      return { sucesso: false, mensagem: 'Site Key ou Secret Key nao configurados' }
    }

    // Verificar se chaves estao no formato correto
    if (!siteKey.startsWith('6L')) {
      return { sucesso: false, mensagem: 'Site Key invalida' }
    }

    return { sucesso: true, mensagem: 'Configuracao reCAPTCHA validada' }
  }

  private async testarWaha(config: Record<string, unknown>): Promise<{ sucesso: boolean; mensagem: string }> {
    const apiUrl = config.api_url as string
    const apiKey = config.api_key_encrypted as string

    if (!apiUrl || !apiKey) {
      return { sucesso: false, mensagem: 'API URL ou API Key nao configurados' }
    }

    try {
      const response = await fetch(`${apiUrl}/api/sessions`, {
        headers: {
          'X-Api-Key': apiKey,
        },
      })

      if (response.ok) {
        return { sucesso: true, mensagem: 'Conexao com WAHA bem sucedida' }
      } else {
        return { sucesso: false, mensagem: 'Erro de autenticacao com WAHA' }
      }
    } catch {
      return { sucesso: false, mensagem: 'Erro ao conectar com WAHA' }
    }
  }
}

export const configGlobalService = new ConfigGlobalService()
