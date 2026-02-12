/**
 * AIDEV-NOTE: Configuração do nó Ação
 * Reorganizado com categorias (Parte 7) + campos contextuais por tipo de ação (Parte 4)
 */

import { ACAO_TIPOS, ACAO_CATEGORIAS, VARIAVEIS_DINAMICAS } from '../../schemas/automacoes.schema'
import { ChevronDown, ChevronUp, ChevronRight, Variable, X, Search, User } from 'lucide-react'
import { useState, useRef, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useCampos } from '@/modules/configuracoes/hooks/useCampos'
import type { Entidade } from '@/modules/configuracoes/services/configuracoes.api'
import { StatusConexao } from './StatusConexao'
import { FunilEtapaSelect } from './FunilEtapaSelect'
import { MediaUploader } from './MediaUploader'

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

// AIDEV-NOTE: Seletor de membros com badges (multi-select)
function MembroSelector({ selectedIds, onChange, label }: {
  selectedIds: string[]
  onChange: (ids: string[]) => void
  label?: string
}) {
  const [search, setSearch] = useState('')
  const { data: membros } = useQuery({
    queryKey: ['automacao-membros-tenant'],
    queryFn: async () => {
      const { data } = await supabase
        .from('usuarios')
        .select('id, nome, sobrenome, role, status')
        .eq('status', 'ativo')
        .is('deletado_em', null)
        .order('nome')
      return data || []
    },
    staleTime: 60_000,
  })

  const filtered = (membros || []).filter(m =>
    !selectedIds.includes(m.id) &&
    `${m.nome} ${m.sobrenome || ''}`.toLowerCase().includes(search.toLowerCase())
  )

  const selectedMembros = (membros || []).filter(m => selectedIds.includes(m.id))

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label || 'Responsável(is)'}</label>
      {/* Badges dos selecionados */}
      {selectedMembros.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1.5 mb-2">
          {selectedMembros.map(m => (
            <span
              key={m.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20"
            >
              <User className="w-3 h-3" />
              {m.nome} {m.sobrenome || ''}
              <button
                type="button"
                onClick={() => onChange(selectedIds.filter(id => id !== m.id))}
                className="ml-0.5 hover:text-destructive transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar membro..."
          className="w-full pl-8 pr-3 py-2 text-sm border border-border rounded-md bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      {/* Lista */}
      {(search || selectedIds.length === 0) && filtered.length > 0 && (
        <div className="mt-1 max-h-32 overflow-y-auto border border-border rounded-md bg-background">
          {filtered.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange([...selectedIds, m.id])}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-accent transition-colors text-left"
            >
              <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{m.nome} {m.sobrenome || ''}</span>
              <span className="text-[10px] text-muted-foreground ml-auto">{m.role}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// AIDEV-NOTE: Sub-componente para selecionar segmentos existentes do banco ou criar novo
function SegmentoSelect({ segmentoId, onChange, modo }: {
  segmentoId: string
  segmentoNome?: string
  onChange: (id: string, nome: string) => void
  modo: 'adicionar' | 'remover'
}) {
  const [criando, setCriando] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [salvando, setSalvando] = useState(false)
  const queryClient = useQueryClient()

  const { data: segmentos } = useQuery({
    queryKey: ['automacao-segmentos'],
    queryFn: async () => {
      const { data } = await supabase
        .from('segmentos')
        .select('id, nome, cor')
        .is('deletado_em', null)
        .order('nome')
      return data || []
    },
    staleTime: 60_000,
  })

  const criarSegmento = async () => {
    if (!novoNome.trim()) return
    setSalvando(true)
    try {
      // Obter organizacao_id do usuario logado
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')
      const { data: usr } = await supabase.from('usuarios').select('organizacao_id').eq('auth_id', user.id).maybeSingle()
      if (!usr?.organizacao_id) throw new Error('Organização não encontrada')

      const cores = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4']
      const corAleatoria = cores[Math.floor(Math.random() * cores.length)]

      const { data: novo, error } = await supabase
        .from('segmentos')
        .insert({ organizacao_id: usr.organizacao_id, nome: novoNome.trim(), cor: corAleatoria })
        .select('id, nome')
        .single()

      if (error) throw error
      queryClient.invalidateQueries({ queryKey: ['automacao-segmentos'] })
      onChange(novo.id, novo.nome)
      setNovoNome('')
      setCriando(false)
    } catch (err) {
      console.error('[SegmentoSelect] Erro ao criar:', err)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">
        {modo === 'adicionar' ? 'Segmento a adicionar' : 'Segmento a remover'}
      </label>
      <select
        value={segmentoId}
        onChange={e => {
          const seg = (segmentos || []).find(s => s.id === e.target.value)
          onChange(e.target.value, seg?.nome || '')
        }}
        className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <option value="">Selecione um segmento...</option>
        {(segmentos || []).map(s => (
          <option key={s.id} value={s.id}>{s.nome}</option>
        ))}
      </select>

      {/* Criar novo segmento inline */}
      {!criando ? (
        <button
          type="button"
          onClick={() => setCriando(true)}
          className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 transition-colors"
        >
          <span className="text-lg leading-none">+</span> Criar novo segmento
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={novoNome}
            onChange={e => setNovoNome(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && criarSegmento()}
            placeholder="Nome do segmento..."
            autoFocus
            className="flex-1 px-3 py-1.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={criarSegmento}
            disabled={salvando || !novoNome.trim()}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {salvando ? '...' : 'Criar'}
          </button>
          <button
            type="button"
            onClick={() => { setCriando(false); setNovoNome('') }}
            className="px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

// AIDEV-NOTE: Sub-componente para selecionar webhook de saída existente ou usar URL manual
function WebhookSaidaSelect({ config, updateConfig, appendToConfig }: {
  config: Record<string, string>
  updateConfig: (patch: Record<string, string>) => void
  appendToConfig: (field: string, value: string) => void
}) {
  const { data: webhooks } = useQuery({
    queryKey: ['automacao-webhooks-saida'],
    queryFn: async () => {
      const { data } = await supabase
        .from('webhooks_saida')
        .select('id, nome, url, ativo')
        .eq('ativo', true)
        .is('deletado_em', null)
        .order('nome')
      return data || []
    },
    staleTime: 60_000,
  })

  const handleWebhookSelect = (webhookId: string) => {
    const wh = (webhooks || []).find(w => w.id === webhookId)
    if (wh) {
      updateConfig({ webhook_id: wh.id, url: wh.url, webhook_nome: wh.nome })
    } else {
      updateConfig({ webhook_id: '', url: '', webhook_nome: '' })
    }
  }

  return (
    <div className="space-y-3">
      {(webhooks || []).length > 0 && (
        <div>
          <label className="text-xs font-medium text-muted-foreground">Webhook de saída</label>
          <select
            value={config.webhook_id || ''}
            onChange={e => handleWebhookSelect(e.target.value)}
            className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Selecione um webhook ou use URL manual...</option>
            {(webhooks || []).map(w => (
              <option key={w.id} value={w.id}>{w.nome}</option>
            ))}
          </select>
        </div>
      )}
      {!config.webhook_id && (
        <div>
          <label className="text-xs font-medium text-muted-foreground">URL do Webhook</label>
          <input type="url" value={config.url || ''} onChange={e => updateConfig({ url: e.target.value })} placeholder="https://..." className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
        </div>
      )}
      {config.webhook_id && (
        <p className="text-[11px] text-muted-foreground">
          URL: <span className="font-mono">{config.url}</span>
        </p>
      )}
      <div>
        <label className="text-xs font-medium text-muted-foreground">Método</label>
        <select value={config.metodo || 'POST'} onChange={e => updateConfig({ metodo: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Payload JSON (opcional)</label>
        <textarea value={config.payload || ''} onChange={e => updateConfig({ payload: e.target.value })} rows={3} placeholder='{"contato": "{{contato.nome}}"}' className="w-full mt-1 px-3 py-2 text-sm font-mono text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground resize-none" />
        <VariavelInserter onInsert={v => appendToConfig('payload', v)} />
      </div>
      {(webhooks || []).length === 0 && (
        <p className="text-[11px] text-muted-foreground">
          Dica: Configure webhooks de saída em Configurações → Webhooks Saída para reutilizá-los aqui.
        </p>
      )}
    </div>
  )
}

// AIDEV-NOTE: GAP 9 — Sub-componente para carregar campos dinâmicos via hook
// Carrega campos do banco (sistema + custom) agrupados em Pessoa, Empresa e Oportunidade
// Campos de endereço, status, origem e observações são colunas diretas da tabela contatos
// e são adicionados ao grupo Pessoa como "extras da tabela"
function CamposDinamicosSelect({ entidade, config, updateConfig, appendToConfig }: {
  entidade: 'oportunidade' | 'contato'
  config: Record<string, string>
  updateConfig: (patch: Record<string, string>) => void
  appendToConfig: (field: string, value: string) => void
}) {
  // Campos hardcoded da tabela oportunidades (não existem em campos_customizados)
  const CAMPOS_OPORTUNIDADE_TABELA = [
    { slug: 'titulo', nome: 'Título', grupo: 'Oportunidade' },
    { slug: 'valor', nome: 'Valor', grupo: 'Oportunidade' },
    { slug: 'tipo_valor', nome: 'Tipo de valor', grupo: 'Oportunidade' },
    { slug: 'moeda', nome: 'Moeda', grupo: 'Oportunidade' },
    { slug: 'previsao_fechamento', nome: 'Previsão de fechamento', grupo: 'Oportunidade' },
    { slug: 'observacoes', nome: 'Observações', grupo: 'Oportunidade' },
    { slug: 'recorrente', nome: 'Recorrente', grupo: 'Oportunidade' },
    { slug: 'periodo_recorrencia', nome: 'Período recorrência', grupo: 'Oportunidade' },
    { slug: 'modo_valor', nome: 'Modo valor', grupo: 'Oportunidade' },
    { slug: 'qualificado_mql', nome: 'Qualificado MQL', grupo: 'Oportunidade' },
    { slug: 'qualificado_sql', nome: 'Qualificado SQL', grupo: 'Oportunidade' },
    { slug: 'utm_source', nome: 'UTM Source', grupo: 'UTM' },
    { slug: 'utm_campaign', nome: 'UTM Campaign', grupo: 'UTM' },
    { slug: 'utm_medium', nome: 'UTM Medium', grupo: 'UTM' },
    { slug: 'utm_term', nome: 'UTM Term', grupo: 'UTM' },
    { slug: 'utm_content', nome: 'UTM Content', grupo: 'UTM' },
  ]

  // Campos extras da tabela contatos que não existem em campos_customizados
  // Pertencem logicamente ao grupo Pessoa
  const CAMPOS_EXTRAS_PESSOA = [
    { slug: 'status', nome: 'Status' },
    { slug: 'origem', nome: 'Origem' },
    { slug: 'observacoes', nome: 'Observações' },
    { slug: 'endereco_cep', nome: 'CEP' },
    { slug: 'endereco_logradouro', nome: 'Logradouro' },
    { slug: 'endereco_numero', nome: 'Número' },
    { slug: 'endereco_complemento', nome: 'Complemento' },
    { slug: 'endereco_bairro', nome: 'Bairro' },
    { slug: 'endereco_cidade', nome: 'Cidade' },
    { slug: 'endereco_estado', nome: 'Estado' },
  ]

  // Buscar campos do banco via useCampos (sistema + custom)
  const entidadePessoa: Entidade = 'pessoa'
  const entidadeEmpresa: Entidade = 'empresa'
  const entidadeOportunidade: Entidade = 'oportunidade'
  const { data: camposPessoa } = useCampos(entidadePessoa)
  const { data: camposEmpresa } = useCampos(entidadeEmpresa)
  const { data: camposOportunidade } = useCampos(entidadeOportunidade)

  const todosCamposPessoa = camposPessoa?.campos || []
  const todosCamposEmpresa = camposEmpresa?.campos || []
  const todosCamposOportunidade = camposOportunidade?.campos || []

  if (entidade === 'contato') {
    return (
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Campo</label>
          <select
            value={config.campo || ''}
            onChange={e => updateConfig({ campo: e.target.value })}
            className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Selecione um campo...</option>
            {/* Grupo Pessoa: campos do banco + extras da tabela */}
            <optgroup label="Pessoa">
              {todosCamposPessoa.map(c => (
                <option key={c.id} value={c.sistema ? c.slug : `custom:pessoa:${c.slug}`}>
                  {c.nome}
                </option>
              ))}
              {CAMPOS_EXTRAS_PESSOA.map(c => (
                <option key={`extra_${c.slug}`} value={c.slug}>{c.nome}</option>
              ))}
            </optgroup>
            {/* Grupo Empresa: campos do banco */}
            <optgroup label="Empresa">
              {todosCamposEmpresa.map(c => (
                <option key={c.id} value={c.sistema ? c.slug : `custom:empresa:${c.slug}`}>
                  {c.nome}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Novo valor</label>
          <input type="text" value={config.valor || ''} onChange={e => updateConfig({ valor: e.target.value })} placeholder="Valor a definir" className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
          <VariavelInserter onInsert={v => appendToConfig('valor', v)} />
        </div>
      </div>
    )
  }

  // Entidade = oportunidade
  const gruposOp = [...new Set(CAMPOS_OPORTUNIDADE_TABELA.map(c => c.grupo))]

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Campo</label>
        <select
          value={config.campo || ''}
          onChange={e => updateConfig({ campo: e.target.value })}
          className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Selecione um campo...</option>
          {gruposOp.map(grupo => (
            <optgroup key={grupo} label={grupo}>
              {CAMPOS_OPORTUNIDADE_TABELA.filter(c => c.grupo === grupo).map(c => (
                <option key={c.slug} value={c.slug}>{c.nome}</option>
              ))}
            </optgroup>
          ))}
          {todosCamposOportunidade.length > 0 && (
            <optgroup label="Customizados">
              {todosCamposOportunidade.map(c => (
                <option key={c.id} value={`custom:oportunidade:${c.slug}`}>{c.nome}</option>
              ))}
            </optgroup>
          )}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Novo valor</label>
        <input type="text" value={config.valor || ''} onChange={e => updateConfig({ valor: e.target.value })} placeholder="Valor a definir" className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
        <VariavelInserter onInsert={v => appendToConfig('valor', v)} />
      </div>
    </div>
  )
}

// AIDEV-NOTE: Campos contextuais renderizados de acordo com o tipo de ação selecionada
function CamposContextuais({ tipo, data, onUpdate }: { tipo: string; data: Record<string, unknown>; onUpdate: (d: Record<string, unknown>) => void }) {
  // AIDEV-NOTE: useRef para evitar stale closure ao colapsar/expandir categorias
  const dataRef = useRef(data)
  dataRef.current = data

  const config = (data.config as Record<string, string>) || {}

  const updateConfig = useCallback((patch: Record<string, string>) => {
    const latest = dataRef.current
    const latestConfig = (latest.config as Record<string, string>) || {}
    onUpdate({ ...latest, config: { ...latestConfig, ...patch } })
  }, [onUpdate])

  const appendToConfig = useCallback((field: string, value: string) => {
    const latest = dataRef.current
    const latestConfig = (latest.config as Record<string, string>) || {}
    const current = latestConfig[field] || ''
    updateConfig({ [field]: current + value })
  }, [updateConfig])

  switch (tipo) {
    case 'enviar_whatsapp':
      return (
        <div className="space-y-3">
          <StatusConexao
            tipo="whatsapp"
            conexaoTipo={config.conexao_tipo}
            onConexaoTipoChange={v => updateConfig({ conexao_tipo: v })}
          />
          <div>
            <label className="text-xs font-medium text-muted-foreground">Número de destino</label>
            <input type="text" value={config.destino || ''} onChange={e => updateConfig({ destino: e.target.value })} placeholder="{{contato.telefone}}" className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Tipo de conteúdo</label>
            <select value={config.midia_tipo || 'texto'} onChange={e => updateConfig({ midia_tipo: e.target.value, midia_url: '' })} className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="texto">Texto</option>
              <option value="imagem">Imagem</option>
              <option value="audio">Áudio</option>
              <option value="documento">Documento</option>
            </select>
          </div>
          {config.midia_tipo && config.midia_tipo !== 'texto' && (
            <MediaUploader
              tipo={config.midia_tipo as 'imagem' | 'audio' | 'documento'}
              midiaUrl={config.midia_url || ''}
              onUrlChange={url => updateConfig({ midia_url: url })}
            />
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
          <StatusConexao
            tipo="email"
            conexaoTipo={config.conexao_tipo}
            onConexaoTipoChange={v => updateConfig({ conexao_tipo: v })}
          />
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
          <FunilEtapaSelect
            funilId={config.funil_id || ''}
            etapaId={config.etapa_id || ''}
            onFunilChange={id => updateConfig({ funil_id: id, etapa_id: '' })}
             onEtapaChange={id => updateConfig({ etapa_id: id })}
             labelEtapa="Etapa destino"
          />
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
          <FunilEtapaSelect
            funilId={config.funil_id || ''}
            etapaId={config.etapa_id || ''}
            onFunilChange={id => updateConfig({ funil_id: id, etapa_id: '' })}
             onEtapaChange={id => updateConfig({ etapa_id: id })}
             labelEtapa="Etapa inicial (opcional)"
          />
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
            <label className="text-xs font-medium text-muted-foreground">Tipo da nota</label>
            <select value={config.tipo || 'texto'} onChange={e => updateConfig({ tipo: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="texto">Texto</option>
              <option value="audio">Áudio</option>
            </select>
          </div>
          {config.tipo === 'audio' ? (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Áudio da nota</label>
              <div className="mt-1">
                <MediaUploader
                  tipo="audio"
                  midiaUrl={config.audio_url || ''}
                  onUrlChange={url => updateConfig({ audio_url: url })}
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Conteúdo da nota</label>
              <textarea value={config.conteudo || ''} onChange={e => updateConfig({ conteudo: e.target.value })} rows={3} placeholder="Nota automática..." className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground resize-none" />
              <VariavelInserter onInsert={v => appendToConfig('conteudo', v)} />
            </div>
          )}
        </div>
      )

    case 'atualizar_campo_contato':
    case 'atualizar_campo_oportunidade': {
      const entidadeCampo = tipo === 'atualizar_campo_contato' ? 'contato' as const : 'oportunidade' as const
      return (
        <CamposDinamicosSelect
          entidade={entidadeCampo}
          config={config}
          updateConfig={updateConfig}
          appendToConfig={appendToConfig}
        />
      )
    }

    case 'adicionar_segmento':
    case 'remover_segmento':
      return (
        <SegmentoSelect
          segmentoId={config.segmento_id || ''}
          segmentoNome={config.segmento || ''}
          onChange={(id, nome) => updateConfig({ segmento_id: id, segmento: nome })}
          modo={tipo === 'adicionar_segmento' ? 'adicionar' : 'remover'}
        />
      )

    case 'alterar_status_contato':
      return (
        <div>
          <label className="text-xs font-medium text-muted-foreground">Novo status</label>
          <select value={config.status || ''} onChange={e => updateConfig({ status: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary">
            <option value="">Selecione...</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="arquivado">Arquivado</option>
          </select>
        </div>
      )

    case 'alterar_responsavel': {
      const ids = config.usuario_ids ? (config.usuario_ids as string).split(',').filter(Boolean) : (config.usuario_id ? [config.usuario_id] : [])
      return (
        <MembroSelector
          selectedIds={ids}
          onChange={newIds => updateConfig({ usuario_ids: newIds.join(','), usuario_id: newIds[0] || '' })}
          label="Novo(s) responsável(is)"
        />
      )
    }

    case 'distribuir_responsavel':
      return (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Distribui automaticamente entre os membros usando a configuração de rodízio (Round Robin) do funil selecionado.
          </p>
          <FunilEtapaSelect
            funilId={config.funil_id || ''}
            onFunilChange={id => updateConfig({ funil_id: id, etapa_id: '' })}
            mostrarEtapa={false}
            labelFunil="Funil de referência"
          />
          <p className="text-[11px] text-muted-foreground">Usa a configuração de distribuição cadastrada no funil (posição de rodízio, membros ativos, etc.).</p>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Pular inativos?</label>
            <select value={config.pular_inativos || 'true'} onChange={e => updateConfig({ pular_inativos: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </select>
          </div>
        </div>
      )

    case 'enviar_webhook':
      return (
        <WebhookSaidaSelect config={config} updateConfig={updateConfig} appendToConfig={appendToConfig} />
      )

    case 'alterar_status_conversa':
      return (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Canal da conversa</label>
            <select value={config.canal || ''} onChange={e => updateConfig({ canal: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">Todos os canais</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="instagram">Instagram</option>
            </select>
            <p className="text-[11px] text-muted-foreground mt-1">Filtra em qual canal a conversa será alterada. Vazio = qualquer canal.</p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Novo status</label>
            <select value={config.status || ''} onChange={e => updateConfig({ status: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">Selecione...</option>
              <option value="aberta">Aberta</option>
              <option value="pendente">Pendente</option>
              <option value="resolvida">Resolvida</option>
              <option value="fechada">Fechada</option>
            </select>
          </div>
        </div>
      )

    default:
      return (
        <p className="text-xs text-muted-foreground italic">Selecione um tipo de ação acima para configurá-la.</p>
      )
  }
}

export function AcaoConfig({ data, onUpdate }: AcaoConfigProps) {
  // AIDEV-NOTE: Refs para evitar stale closure no onClick dos tipos e repasse para CamposContextuais
  const dataRef = useRef(data)
  dataRef.current = data
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  const currentTipo = (data.tipo as string) || ''

  // AIDEV-NOTE: Auto-expandir a categoria que contém o tipo selecionado
  const currentCategoria = ACAO_TIPOS.find(a => a.tipo === currentTipo)?.categoria
  const [expandedCats, setExpandedCats] = useState<Set<string>>(() => {
    const initial = new Set(['comunicacao'])
    if (currentCategoria) initial.add(currentCategoria)
    return initial
  })

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
                    onClick={() => {
                      if (a.tipo === currentTipo) return // já selecionado, não reseta config
                      onUpdateRef.current({ ...dataRef.current, tipo: a.tipo, config: {} })
                    }}
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
          <CamposContextuais tipo={currentTipo} data={data} onUpdate={onUpdateRef.current} />
        </div>
      )}
    </div>
  )
}
