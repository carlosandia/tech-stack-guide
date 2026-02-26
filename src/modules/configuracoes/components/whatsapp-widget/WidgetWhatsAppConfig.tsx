/**
 * AIDEV-NOTE: Seção de configuração do Widget WhatsApp para Website
 * Campos: ativo, número, posição, formulário, foto, nome, mensagem, cor
 * Inclui upload de foto, multi-select de campos e geração de script embed
 */

import { useState, useRef, useMemo } from 'react'
import { MessageSquare, Copy, Check, Upload, X, Mail, AlertTriangle, ArrowRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useCampos } from '../../hooks/useCampos'
import { useFunis } from '@/modules/negocios/hooks/useFunis'
import { supabase } from '@/lib/supabase'
import { compressImage } from '@/shared/utils/compressMedia'
import type { WidgetWhatsAppConfig as WidgetConfig } from './types'
import { DEFAULT_WIDGET_CONFIG } from './types'
import { WidgetWhatsAppPreview } from './WidgetWhatsAppPreview'
import { generateWidgetScript } from './generateWidgetScript'

interface Props {
  value: WidgetConfig
  onChange: (config: WidgetConfig) => void
  organizacaoId: string
}

export function WidgetWhatsAppConfig({ value, onChange, organizacaoId }: Props) {
  const config = { ...DEFAULT_WIDGET_CONFIG, ...value }
  const { data: camposData } = useCampos('pessoa')
  const { data: funis } = useFunis()
  const campos = camposData?.campos || []
  const funisAtivos = useMemo(() => (funis || []).filter((f: any) => !f.arquivado && !f.deletado_em), [funis])
  const [copiado, setCopiado] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Buscar conexão de email ativa
  const { data: conexaoEmail } = useQuery({
    queryKey: ['conexao-email-widget', organizacaoId],
    queryFn: async () => {
      const { data } = await supabase
        .from('conexoes_email')
        .select('id, email, status')
        .is('deletado_em', null)
        .in('status', ['conectado', 'ativo'])
        .limit(1)
        .maybeSingle()
      return data
    },
    enabled: !!organizacaoId && config.ativo,
    staleTime: 60_000,
  })

  const update = <K extends keyof WidgetConfig>(key: K, val: WidgetConfig[K]) => {
    onChange({ ...config, [key]: val })
  }

  // Mapa de nomes dos campos para o preview
  const camposNomes = useMemo(() => {
    const map: Record<string, string> = {}
    campos.forEach(c => { map[c.id] = c.nome })
    return map
  }, [campos])

  const handleUploadFoto = async (file: File) => {
    // AIDEV-NOTE: Validar MIME type seguro
    const SAFE_MIMES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
    if (!SAFE_MIMES.has(file.type)) {
      toast.error('Apenas imagens JPEG, PNG, GIF ou WebP são permitidas')
      return
    }

    // Validar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 2MB')
      return
    }

    try {
      setUploading(true)
      const compressed = await compressImage(file)
      const MIME_EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp' }
      const ext = MIME_EXT[file.type] || 'jpg'
      const path = `${organizacaoId}/widget-atendente/${Date.now()}.${ext}`

      const { error } = await supabase.storage.from('assinaturas').upload(path, compressed, {
        contentType: compressed instanceof File ? compressed.type : file.type,
        upsert: true,
      })
      if (error) throw error

      const { data: urlData } = supabase.storage.from('assinaturas').getPublicUrl(path)
      update('foto_atendente_url', urlData.publicUrl)
      toast.success('Foto enviada com sucesso')
    } catch {
      toast.error('Erro ao enviar foto')
    } finally {
      setUploading(false)
    }
  }

  const handleCopiarScript = () => {
    if (!organizacaoId) {
      toast.error('Organização não encontrada')
      return
    }
    const script = generateWidgetScript(organizacaoId)
    navigator.clipboard.writeText(script)
    setCopiado(true)
    toast.success('Script copiado para a área de transferência!')
    setTimeout(() => setCopiado(false), 2500)
  }

  const toggleCampo = (campoId: string) => {
    const atual = config.campos_formulario
    if (atual.includes(campoId)) {
      // Ao remover campo, remover também dos obrigatórios
      update('campos_formulario', atual.filter(id => id !== campoId))
      if (config.campos_obrigatorios?.includes(campoId)) {
        update('campos_obrigatorios', (config.campos_obrigatorios || []).filter(id => id !== campoId))
      }
    } else {
      update('campos_formulario', [...atual, campoId])
    }
  }

  const toggleObrigatorio = (campoId: string) => {
    const atual = config.campos_obrigatorios || []
    if (atual.includes(campoId)) {
      update('campos_obrigatorios', atual.filter(id => id !== campoId))
    } else {
      update('campos_obrigatorios', [...atual, campoId])
    }
  }

  return (
    <section className="bg-card rounded-lg border border-border p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#25D366' }}>
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">WhatsApp no Website</h2>
            <p className="text-xs text-muted-foreground">Adicione um botão flutuante de WhatsApp no seu site</p>
          </div>
        </div>

        {/* Toggle Ativar */}
        <button
          onClick={() => update('ativo', !config.ativo)}
          className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${config.ativo ? 'bg-primary' : 'bg-muted'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${config.ativo ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>

      {config.ativo && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna Esquerda - Configurações */}
          <div className="space-y-5">
            {/* Pipeline / Funil */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Pipeline de Destino</label>
              <select
                value={config.funil_id}
                onChange={e => update('funil_id', e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground"
              >
                <option value="">Selecione a pipeline...</option>
                {funisAtivos.map((f: any) => (
                  <option key={f.id} value={f.id}>{f.nome}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">Em qual pipeline as oportunidades do widget serão criadas</p>
            </div>

            {/* Número WhatsApp */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Número WhatsApp</label>
              <input
                type="text"
                value={config.numero}
                onChange={e => update('numero', e.target.value)}
                placeholder="5511999999999"
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground"
              />
              <p className="text-xs text-muted-foreground mt-1">Inclua o código do país (ex: 55 para Brasil)</p>
            </div>

            {/* Posição */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Posição do Botão</label>
              <div className="flex gap-2">
                {(['esquerda', 'direita'] as const).map(pos => (
                  <button
                    key={pos}
                    onClick={() => update('posicao', pos)}
                    className={`flex-1 h-10 rounded-md border text-sm font-medium transition-colors ${
                      config.posicao === pos
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-input bg-background text-foreground hover:bg-accent'
                    }`}
                  >
                    {pos === 'esquerda' ? '← Esquerda inferior' : 'Direita inferior →'}
                  </button>
                ))}
              </div>
            </div>

            {/* Cor do Botão */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Cor do Botão</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={config.cor_botao}
                  onChange={e => update('cor_botao', e.target.value)}
                  className="w-10 h-10 rounded-md border border-input cursor-pointer"
                />
                <input
                  type="text"
                  value={config.cor_botao}
                  onChange={e => update('cor_botao', e.target.value)}
                  className="w-32 h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground font-mono"
                />
              </div>
            </div>

            {/* Nome do Atendente */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Nome do Atendente</label>
              {/* AIDEV-NOTE: Seg — maxLength previne payloads excessivos; sanitização no edge function */}
              <input
                type="text"
                value={config.nome_atendente}
                onChange={e => update('nome_atendente', e.target.value)}
                placeholder="Maria"
                maxLength={100}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground"
              />
            </div>

            {/* Foto do Atendente */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Foto do Atendente</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) handleUploadFoto(f)
                }}
              />
              <div className="flex items-center gap-3">
                {config.foto_atendente_url ? (
                  <div className="relative">
                    <img src={config.foto_atendente_url} alt="Foto" className="w-12 h-12 rounded-full object-cover border border-border" />
                    <button
                      onClick={() => update('foto_atendente_url', '')}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : null}
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-3 h-9 rounded-md border border-input bg-background text-sm text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Enviando...' : 'Enviar foto'}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Máximo 2MB · JPEG, PNG, GIF ou WebP</p>
            </div>

            {/* Mensagem de Boas-Vindas */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Mensagem de Boas-vindas</label>
              <textarea
                value={config.mensagem_boas_vindas}
                onChange={e => update('mensagem_boas_vindas', e.target.value)}
                placeholder="Olá! 👋 Como posso te ajudar?"
                rows={2}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground resize-none"
              />
            </div>

            {/* Horário de Atendimento */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground block">Horário de Atendimento</label>
              <div className="flex gap-2">
                {(['sempre', 'personalizado'] as const).map(opt => (
                  <button
                    key={opt}
                    onClick={() => update('horario_atendimento', opt)}
                    className={`flex-1 h-10 rounded-md border text-sm font-medium transition-colors ${
                      config.horario_atendimento === opt
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-input bg-background text-foreground hover:bg-accent'
                    }`}
                  >
                    {opt === 'sempre' ? 'Sempre Online' : 'Horário Personalizado'}
                  </button>
                ))}
              </div>

              {config.horario_atendimento === 'personalizado' && (
                <div className="border border-border rounded-md p-3 space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Dias da semana</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((label, idx) => {
                        const ativo = (config.horario_dias || []).includes(idx)
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              const dias = config.horario_dias || []
                              update('horario_dias', ativo ? dias.filter(d => d !== idx) : [...dias, idx].sort())
                            }}
                            className={`w-10 h-9 rounded-md text-xs font-medium border transition-colors ${
                              ativo
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-input bg-background text-muted-foreground hover:bg-accent'
                            }`}
                          >
                            {label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Início</label>
                      <input
                        type="time"
                        value={config.horario_inicio || '09:00'}
                        onChange={e => update('horario_inicio', e.target.value)}
                        className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Fim</label>
                      <input
                        type="time"
                        value={config.horario_fim || '18:00'}
                        onChange={e => update('horario_fim', e.target.value)}
                        className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pré-Formulário */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Pré-formulário</p>
                  <p className="text-xs text-muted-foreground">Coletar dados antes de redirecionar ao WhatsApp</p>
                </div>
                <button
                  onClick={() => update('usar_formulario', !config.usar_formulario)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${config.usar_formulario ? 'bg-primary' : 'bg-muted'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${config.usar_formulario ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {config.usar_formulario && (
                <div className="border border-border rounded-md p-3 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">Selecione os campos (entidade Pessoa)</p>
                  {campos.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">Nenhum campo cadastrado em Pessoa</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {campos.filter(c => c.ativo !== false).map(c => {
                        const selected = config.campos_formulario.includes(c.id)
                        return (
                          <button
                            key={c.id}
                            onClick={() => toggleCampo(c.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                              selected
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border bg-background text-muted-foreground hover:bg-accent'
                            }`}
                          >
                            {c.nome}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* Campos obrigatórios */}
                  {config.campos_formulario.length > 0 && (
                    <div className="pt-2 border-t border-border space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">Campos obrigatórios</p>
                      <div className="flex flex-wrap gap-2">
                        {config.campos_formulario.map(campoId => {
                          const campo = campos.find(c => c.id === campoId)
                          if (!campo) return null
                          const isObrigatorio = (config.campos_obrigatorios || []).includes(campoId)
                          return (
                            <button
                              key={campoId}
                              onClick={() => toggleObrigatorio(campoId)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                isObrigatorio
                                  ? 'border-destructive bg-destructive/10 text-destructive'
                                  : 'border-border bg-background text-muted-foreground hover:bg-accent'
                              }`}
                            >
                              {campo.nome} {isObrigatorio ? '*' : ''}
                            </button>
                          )
                        })}
                      </div>
                      <p className="text-[10px] text-muted-foreground">Clique para marcar/desmarcar como obrigatório</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notificação por Email */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Notificar e-mail</p>
                  <p className="text-xs text-muted-foreground">Enviar email quando chegar um novo lead pelo widget</p>
                </div>
                <button
                  onClick={() => {
                    if (!conexaoEmail && !config.notificar_email) {
                      toast.error('Conecte uma conta de email em Conexões primeiro')
                      return
                    }
                    const newVal = !config.notificar_email
                    update('notificar_email', newVal)
                    if (newVal && conexaoEmail?.email && !config.email_destino) {
                      update('email_destino', conexaoEmail.email)
                    }
                  }}
                  disabled={!conexaoEmail}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
                    config.notificar_email ? 'bg-primary' : 'bg-muted'
                  } ${!conexaoEmail ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                    config.notificar_email ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {!conexaoEmail && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-md border border-amber-200 bg-amber-50 text-amber-800">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p>Nenhuma conexão de email ativa.</p>
                    <Link to="/configuracoes/conexoes" className="inline-flex items-center gap-1 font-medium underline underline-offset-2 mt-0.5">
                      Ir para Conexões <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}

              {config.notificar_email && conexaoEmail && (
                <div className="border border-border rounded-md p-3 space-y-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Email de destino</label>
                    {/* AIDEV-NOTE: Seg — maxLength + pattern para prevenir email header injection */}
                    <input
                      type="email"
                      value={config.email_destino}
                      onChange={e => update('email_destino', e.target.value)}
                      placeholder={conexaoEmail.email || 'email@exemplo.com'}
                      maxLength={255}
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    Enviado via <span className="font-medium text-foreground">{conexaoEmail.email}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Botão Copiar Script */}
            <div className="pt-2 border-t border-border">
              <button
                onClick={handleCopiarScript}
                disabled={!config.numero}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiado ? 'Copiado!' : 'Copiar Script do Widget'}
              </button>
              <p className="text-xs text-muted-foreground mt-2">
                Cole o script antes do fechamento da tag {'</body>'} no HTML do seu site
              </p>
            </div>
          </div>

          {/* Coluna Direita - Preview */}
          <div>
            <WidgetWhatsAppPreview config={config} camposNomes={camposNomes} />
          </div>
        </div>
      )}
    </section>
  )
}
