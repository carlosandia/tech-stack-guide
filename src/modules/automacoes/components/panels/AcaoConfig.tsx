/**
 * AIDEV-NOTE: Configuração do nó Ação
 * Reorganizado com categorias (Parte 7) + campos contextuais por tipo de ação (Parte 4)
 */

import { ACAO_TIPOS, ACAO_CATEGORIAS, VARIAVEIS_DINAMICAS } from '../../schemas/automacoes.schema'
import { ChevronDown, ChevronUp, ChevronRight, Variable } from 'lucide-react'
import { useState } from 'react'

interface AcaoConfigProps {
  data: Record<string, unknown>
  onUpdate: (data: Record<string, unknown>) => void
}

// AIDEV-NOTE: Helper para inserir variável dinâmica em um campo de texto
function VariavelInserter({ onInsert }: { onInsert: (v: string) => void }) {
  const [aberto, setAberto] = useState(false)

  const categorias = [...new Set(VARIAVEIS_DINAMICAS.map(v => v.categoria))]

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 transition-colors"
      >
        <Variable className="w-3 h-3" />
        Inserir variável
        {aberto ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {aberto && (
        <div className="mt-1 border border-border rounded-md bg-white max-h-40 overflow-y-auto">
          {categorias.map(cat => (
            <div key={cat}>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase px-2 pt-1.5 pb-0.5">{cat}</p>
              {VARIAVEIS_DINAMICAS.filter(v => v.categoria === cat).map(v => (
                <button
                  key={v.chave}
                  type="button"
                  onClick={() => { onInsert(v.chave); setAberto(false) }}
                  className="w-full text-left px-2 py-1 text-xs hover:bg-accent transition-colors"
                >
                  <span className="font-mono text-primary/80">{v.chave}</span>
                  <span className="text-muted-foreground ml-1">— {v.label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// AIDEV-NOTE: Campos contextuais renderizados de acordo com o tipo de ação selecionada
function CamposContextuais({ tipo, data, onUpdate }: { tipo: string; data: Record<string, unknown>; onUpdate: (d: Record<string, unknown>) => void }) {
  const config = (data.config as Record<string, string>) || {}
  const updateConfig = (patch: Record<string, string>) => onUpdate({ ...data, config: { ...config, ...patch } })
  const appendToConfig = (field: string, value: string) => {
    const current = config[field] || ''
    updateConfig({ [field]: current + value })
  }

  switch (tipo) {
    case 'enviar_whatsapp':
      return (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Número de destino</label>
            <input type="text" value={config.destino || ''} onChange={e => updateConfig({ destino: e.target.value })} placeholder="{{contato.telefone}}" className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
          </div>
          {/* AIDEV-NOTE: GAP 1 — Tipo de mídia para WhatsApp */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Tipo de conteúdo</label>
            <select value={config.midia_tipo || 'texto'} onChange={e => updateConfig({ midia_tipo: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="texto">Texto</option>
              <option value="imagem">Imagem</option>
              <option value="audio">Áudio</option>
              <option value="documento">Documento</option>
            </select>
          </div>
          {config.midia_tipo && config.midia_tipo !== 'texto' && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">URL da mídia</label>
              <input type="url" value={config.midia_url || ''} onChange={e => updateConfig({ midia_url: e.target.value })} placeholder="https://exemplo.com/arquivo.png" className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
              <p className="text-[11px] text-muted-foreground mt-1">URL pública do arquivo a ser enviado.</p>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-muted-foreground">{config.midia_tipo && config.midia_tipo !== 'texto' ? 'Legenda' : 'Mensagem'}</label>
            <textarea value={config.mensagem || ''} onChange={e => updateConfig({ mensagem: e.target.value })} placeholder="Olá {{contato.nome}}, ..." rows={4} className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground resize-none" />
            <VariavelInserter onInsert={v => appendToConfig('mensagem', v)} />
          </div>
        </div>
      )

    case 'enviar_email':
      return (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Para</label>
            <input type="text" value={config.para || ''} onChange={e => updateConfig({ para: e.target.value })} placeholder="{{contato.email}}" className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Assunto</label>
            <input type="text" value={config.assunto || ''} onChange={e => updateConfig({ assunto: e.target.value })} placeholder="Assunto do email" className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Corpo</label>
            <textarea value={config.corpo || ''} onChange={e => updateConfig({ corpo: e.target.value })} rows={4} placeholder="Conteúdo do email..." className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground resize-none" />
            <VariavelInserter onInsert={v => appendToConfig('corpo', v)} />
          </div>
          {/* AIDEV-NOTE: GAP 8 — Checkbox apenas contato principal */}
          <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
            <input type="checkbox" checked={config.apenas_contato_principal === 'true'} onChange={e => updateConfig({ apenas_contato_principal: e.target.checked ? 'true' : 'false' })} className="rounded border-border" />
            Aplicar apenas ao contato principal
          </label>
        </div>
      )

    case 'criar_notificacao':
      return (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Título</label>
            <input type="text" value={config.titulo || ''} onChange={e => updateConfig({ titulo: e.target.value })} placeholder="Nova notificação" className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Mensagem</label>
            <textarea value={config.mensagem || ''} onChange={e => updateConfig({ mensagem: e.target.value })} rows={3} placeholder="Conteúdo da notificação..." className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground resize-none" />
            <VariavelInserter onInsert={v => appendToConfig('mensagem', v)} />
          </div>
        </div>
      )

    case 'mover_etapa':
      return (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Funil</label>
            <input type="text" value={config.funil_id || ''} onChange={e => updateConfig({ funil_id: e.target.value })} placeholder="ID do funil" className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Etapa destino</label>
            <input type="text" value={config.etapa_id || ''} onChange={e => updateConfig({ etapa_id: e.target.value })} placeholder="ID da etapa" className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
          </div>
        </div>
      )

    case 'criar_tarefa':
      return (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Título da tarefa</label>
            <input type="text" value={config.titulo || ''} onChange={e => updateConfig({ titulo: e.target.value })} placeholder="Follow-up com {{contato.nome}}" className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
            <VariavelInserter onInsert={v => appendToConfig('titulo', v)} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Prazo (dias)</label>
            <input type="number" min={1} value={config.prazo_dias || ''} onChange={e => updateConfig({ prazo_dias: e.target.value })} placeholder="3" className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Descrição</label>
            <textarea value={config.descricao || ''} onChange={e => updateConfig({ descricao: e.target.value })} rows={2} placeholder="Detalhes da tarefa..." className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground resize-none" />
          </div>
        </div>
      )

    case 'criar_oportunidade':
      return (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Título</label>
            <input type="text" value={config.titulo || ''} onChange={e => updateConfig({ titulo: e.target.value })} placeholder="Oportunidade de {{contato.nome}}" className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
            <VariavelInserter onInsert={v => appendToConfig('titulo', v)} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Funil</label>
            <input type="text" value={config.funil_id || ''} onChange={e => updateConfig({ funil_id: e.target.value })} placeholder="ID do funil" className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Valor (R$)</label>
            <input type="number" min={0} value={config.valor || ''} onChange={e => updateConfig({ valor: e.target.value })} placeholder="0" className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
          </div>
        </div>
      )

    case 'marcar_resultado_oportunidade':
      return (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Resultado</label>
            <select value={config.resultado || ''} onChange={e => updateConfig({ resultado: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">Selecione...</option>
              <option value="ganho">Ganho</option>
              <option value="perda">Perda</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Motivo (opcional)</label>
            <input type="text" value={config.motivo || ''} onChange={e => updateConfig({ motivo: e.target.value })} placeholder="Motivo do resultado" className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
          </div>
        </div>
      )

    case 'adicionar_nota':
      return (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Conteúdo da nota</label>
            <textarea value={config.conteudo || ''} onChange={e => updateConfig({ conteudo: e.target.value })} rows={3} placeholder="Nota automática..." className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground resize-none" />
            <VariavelInserter onInsert={v => appendToConfig('conteudo', v)} />
          </div>
        </div>
      )

    case 'atualizar_campo_contato':
    case 'atualizar_campo_oportunidade':
      return (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Nome do campo</label>
            <input type="text" value={config.campo || ''} onChange={e => updateConfig({ campo: e.target.value })} placeholder="Ex: status, segmento..." className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Novo valor</label>
            <input type="text" value={config.valor || ''} onChange={e => updateConfig({ valor: e.target.value })} placeholder="Valor a definir" className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
          </div>
        </div>
      )

    case 'adicionar_segmento':
    case 'remover_segmento':
      return (
        <div>
          <label className="text-xs font-medium text-muted-foreground">Nome do segmento</label>
          <input type="text" value={config.segmento || ''} onChange={e => updateConfig({ segmento: e.target.value })} placeholder="Ex: VIP, Inativo..." className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
        </div>
      )

    case 'alterar_status_contato':
      return (
        <div>
          <label className="text-xs font-medium text-muted-foreground">Novo status</label>
          <select value={config.status || ''} onChange={e => updateConfig({ status: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary">
            <option value="">Selecione...</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="arquivado">Arquivado</option>
          </select>
        </div>
      )

    case 'alterar_responsavel':
      return (
        <div>
          <label className="text-xs font-medium text-muted-foreground">Responsável (ID do usuário)</label>
          <input type="text" value={config.usuario_id || ''} onChange={e => updateConfig({ usuario_id: e.target.value })} placeholder="ID do novo responsável" className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
        </div>
      )

    case 'distribuir_responsavel':
      return (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Distribuição automática Round Robin entre os membros ativos do tenant.
          </p>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Pular inativos?</label>
            <select value={config.pular_inativos || 'true'} onChange={e => updateConfig({ pular_inativos: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </select>
          </div>
        </div>
      )

    case 'enviar_webhook':
      return (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">URL do Webhook</label>
            <input type="url" value={config.url || ''} onChange={e => updateConfig({ url: e.target.value })} placeholder="https://..." className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Método</label>
            <select value={config.metodo || 'POST'} onChange={e => updateConfig({ metodo: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Payload JSON (opcional)</label>
            <textarea value={config.payload || ''} onChange={e => updateConfig({ payload: e.target.value })} rows={3} placeholder='{"contato": "{{contato.nome}}"}' className="w-full mt-1 px-3 py-2 text-sm font-mono text-xs border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground resize-none" />
            <VariavelInserter onInsert={v => appendToConfig('payload', v)} />
          </div>
        </div>
      )

    case 'alterar_status_conversa':
      return (
        <div>
          <label className="text-xs font-medium text-muted-foreground">Novo status</label>
          <select value={config.status || ''} onChange={e => updateConfig({ status: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary">
            <option value="">Selecione...</option>
            <option value="aberta">Aberta</option>
            <option value="pendente">Pendente</option>
            <option value="resolvida">Resolvida</option>
            <option value="fechada">Fechada</option>
          </select>
        </div>
      )

    default:
      return (
        <p className="text-xs text-muted-foreground italic">Selecione um tipo de ação acima para configurá-la.</p>
      )
  }
}

export function AcaoConfig({ data, onUpdate }: AcaoConfigProps) {
  const currentTipo = (data.tipo as string) || ''
  // Apenas "comunicacao" expandida por padrão
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(['comunicacao']))

  const toggleCat = (key: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground">Tipo de Ação</label>
        <p className="text-xs text-muted-foreground mb-2">O que deve acontecer?</p>
      </div>

      {ACAO_CATEGORIAS.map(cat => {
        const acoes = ACAO_TIPOS.filter(a => a.categoria === cat.key && a.tipo !== 'aguardar')
        if (acoes.length === 0) return null
        const isExpanded = expandedCats.has(cat.key)
        return (
          <div key={cat.key}>
            <button
              type="button"
              onClick={() => toggleCat(cat.key)}
              className="flex items-center gap-1 w-full text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 hover:text-foreground transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              {cat.label}
            </button>
            {isExpanded && (
              <div className="space-y-1">
                {acoes.map(a => (
                  <button
                    key={a.tipo}
                    onClick={() => onUpdate({ ...data, tipo: a.tipo, config: a.tipo === currentTipo ? (data.config || {}) : {} })}
                    className={`
                      w-full text-left px-3 py-2 rounded-md text-sm transition-colors
                      ${currentTipo === a.tipo
                        ? 'bg-green-50 text-green-700 border border-green-300'
                        : 'hover:bg-accent text-foreground border border-transparent'
                      }
                    `}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Campos contextuais após selecionar tipo */}
      {currentTipo && (
        <div className="pt-3 border-t border-border">
          <p className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">Configuração</p>
          <CamposContextuais tipo={currentTipo} data={data} onUpdate={onUpdate} />
        </div>
      )}
    </div>
  )
}
