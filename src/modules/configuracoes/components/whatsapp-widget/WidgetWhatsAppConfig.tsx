/**
 * AIDEV-NOTE: Seção de configuração do Widget WhatsApp para Website
 * Campos: ativo, número, posição, formulário, foto, nome, mensagem, cor
 * Inclui upload de foto, multi-select de campos e geração de script embed
 */

import { useState, useRef, useMemo } from 'react'
import { MessageSquare, Copy, Check, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { useCampos } from '../../hooks/useCampos'
import { supabase } from '@/lib/supabase'
import { compressImage } from '@/shared/utils/compressMedia'
import type { WidgetWhatsAppConfig as WidgetConfig } from './types'
import { DEFAULT_WIDGET_CONFIG } from './types'
import { WidgetWhatsAppPreview } from './WidgetWhatsAppPreview'
import { generateWidgetScript } from './generateWidgetScript'

interface Props {
  value: WidgetConfig
  onChange: (config: WidgetConfig) => void
}

export function WidgetWhatsAppConfig({ value, onChange }: Props) {
  const config = { ...DEFAULT_WIDGET_CONFIG, ...value }
  const { data: camposData } = useCampos('pessoa')
  const campos = camposData?.campos || []
  const [copiado, setCopiado] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

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
    try {
      setUploading(true)
      const compressed = await compressImage(file)
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `widget-atendente/${Date.now()}.${ext}`

      const { error } = await supabase.storage.from('assinaturas').upload(path, compressed, {
        contentType: compressed.type,
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
    const camposInfo = campos
      .filter(c => config.campos_formulario.includes(c.id))
      .map(c => ({ id: c.id, nome: c.nome, tipo: c.tipo, placeholder: c.placeholder }))

    const script = generateWidgetScript(config, camposInfo)
    navigator.clipboard.writeText(script)
    setCopiado(true)
    toast.success('Script copiado para a área de transferência!')
    setTimeout(() => setCopiado(false), 2500)
  }

  const toggleCampo = (campoId: string) => {
    const atual = config.campos_formulario
    if (atual.includes(campoId)) {
      update('campos_formulario', atual.filter(id => id !== campoId))
    } else {
      update('campos_formulario', [...atual, campoId])
    }
  }

  return (
    <section className="bg-card rounded-lg border border-border p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#25D366' }}>
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">WhatsApp no Website</h2>
            <p className="text-xs text-muted-foreground">Adicione um botão flutuante de WhatsApp no seu site</p>
          </div>
        </div>

        {/* Toggle Ativar */}
        <button
          onClick={() => update('ativo', !config.ativo)}
          className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${config.ativo ? 'bg-primary' : 'bg-muted'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${config.ativo ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>

      {config.ativo && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna Esquerda - Configurações */}
          <div className="space-y-5">
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
              <input
                type="text"
                value={config.nome_atendente}
                onChange={e => update('nome_atendente', e.target.value)}
                placeholder="Maria"
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

            {/* Pré-Formulário */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Pré-formulário</p>
                  <p className="text-xs text-muted-foreground">Coletar dados antes de redirecionar ao WhatsApp</p>
                </div>
                <button
                  onClick={() => update('usar_formulario', !config.usar_formulario)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${config.usar_formulario ? 'bg-primary' : 'bg-muted'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${config.usar_formulario ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {config.usar_formulario && (
                <div className="border border-border rounded-md p-3 space-y-2">
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
