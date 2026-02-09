/**
 * AIDEV-NOTE: Formulário para criar/editar uma regra condicional
 */

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { RegraCondicional, CondicaoRegra, CampoFormulario } from '../../services/formularios.api'

interface Props {
  campos: CampoFormulario[]
  regra?: RegraCondicional | null
  onSave: (payload: Partial<RegraCondicional>) => void
  onCancel: () => void
}

const TIPOS_ACAO = [
  { value: 'mostrar', label: 'Mostrar campo' },
  { value: 'ocultar', label: 'Ocultar campo' },
  { value: 'pular_etapa', label: 'Pular para etapa' },
  { value: 'redirecionar', label: 'Redirecionar para URL' },
  { value: 'definir_valor', label: 'Definir valor do campo' },
]

const OPERADORES = [
  { value: 'igual', label: 'É igual a' },
  { value: 'diferente', label: 'É diferente de' },
  { value: 'contem', label: 'Contém' },
  { value: 'nao_contem', label: 'Não contém' },
  { value: 'maior', label: 'Maior que' },
  { value: 'menor', label: 'Menor que' },
  { value: 'vazio', label: 'Está vazio' },
  { value: 'nao_vazio', label: 'Não está vazio' },
]

export function RegraCondicionalForm({ campos, regra, onSave, onCancel }: Props) {
  const [nomeRegra, setNomeRegra] = useState(regra?.nome_regra || '')
  const [tipoAcao, setTipoAcao] = useState(regra?.tipo_acao || 'mostrar')
  const [campoAlvoId, setCampoAlvoId] = useState(regra?.campo_alvo_id || '')
  const [etapaAlvo, setEtapaAlvo] = useState(regra?.indice_etapa_alvo?.toString() || '')
  const [urlAlvo, setUrlAlvo] = useState(regra?.url_redirecionamento_alvo || '')
  const [valorAlvo, setValorAlvo] = useState(regra?.valor_alvo || '')
  const [logica, setLogica] = useState(regra?.logica_condicoes || 'E')
  const [condicoes, setCondicoes] = useState<CondicaoRegra[]>(
    regra?.condicoes?.length ? regra.condicoes : [{ campo_id: '', operador: 'igual', valor: '' }]
  )

  const addCondicao = () => {
    setCondicoes([...condicoes, { campo_id: '', operador: 'igual', valor: '' }])
  }

  const removeCondicao = (index: number) => {
    if (condicoes.length <= 1) return
    setCondicoes(condicoes.filter((_, i) => i !== index))
  }

  const updateCondicao = (index: number, field: keyof CondicaoRegra, value: string) => {
    const updated = [...condicoes]
    updated[index] = { ...updated[index], [field]: value }
    setCondicoes(updated)
  }

  const handleSave = () => {
    if (!nomeRegra.trim()) return

    const payload: Partial<RegraCondicional> = {
      nome_regra: nomeRegra.trim(),
      tipo_acao: tipoAcao,
      logica_condicoes: logica,
      condicoes: condicoes.filter((c) => c.campo_id),
      ativa: regra?.ativa ?? true,
      ordem_regra: regra?.ordem_regra ?? 0,
    }

    if (tipoAcao === 'mostrar' || tipoAcao === 'ocultar' || tipoAcao === 'definir_valor') {
      payload.campo_alvo_id = campoAlvoId || null
    }
    if (tipoAcao === 'pular_etapa') {
      payload.indice_etapa_alvo = etapaAlvo ? parseInt(etapaAlvo) : null
    }
    if (tipoAcao === 'redirecionar') {
      payload.url_redirecionamento_alvo = urlAlvo || null
    }
    if (tipoAcao === 'definir_valor') {
      payload.valor_alvo = valorAlvo || null
    }

    onSave(payload)
  }

  const needsCampoAlvo = ['mostrar', 'ocultar', 'definir_valor'].includes(tipoAcao)

  return (
    <div className="border border-border rounded-lg p-4 space-y-4 bg-card">
      <h3 className="text-sm font-semibold text-foreground">
        {regra ? 'Editar Regra' : 'Nova Regra'}
      </h3>

      {/* Nome */}
      <div>
        <label className="text-xs font-medium text-muted-foreground">Nome da regra</label>
        <input
          value={nomeRegra}
          onChange={(e) => setNomeRegra(e.target.value)}
          placeholder="Ex: Mostrar campo empresa se tipo = PJ"
          className="w-full mt-1 bg-background border border-border rounded-md px-3 py-2 text-sm"
        />
      </div>

      {/* Condições */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">Condições</label>
          <div className="flex gap-1">
            <button
              onClick={() => setLogica('E')}
              className={`px-2 py-0.5 rounded text-xs font-medium ${logica === 'E' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            >
              E
            </button>
            <button
              onClick={() => setLogica('OU')}
              className={`px-2 py-0.5 rounded text-xs font-medium ${logica === 'OU' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            >
              OU
            </button>
          </div>
        </div>

        {condicoes.map((cond, i) => (
          <div key={i} className="flex items-center gap-2">
            <select
              value={cond.campo_id}
              onChange={(e) => updateCondicao(i, 'campo_id', e.target.value)}
              className="flex-1 bg-background border border-border rounded-md px-2 py-1.5 text-xs"
            >
              <option value="">Selecione o campo</option>
              {campos.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>

            <select
              value={cond.operador}
              onChange={(e) => updateCondicao(i, 'operador', e.target.value)}
              className="w-32 bg-background border border-border rounded-md px-2 py-1.5 text-xs"
            >
              {OPERADORES.map((op) => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>

            {!['vazio', 'nao_vazio'].includes(cond.operador) && (
              <input
                value={cond.valor || ''}
                onChange={(e) => updateCondicao(i, 'valor', e.target.value)}
                placeholder="Valor"
                className="w-28 bg-background border border-border rounded-md px-2 py-1.5 text-xs"
              />
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              disabled={condicoes.length <= 1}
              onClick={() => removeCondicao(i)}
            >
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </Button>
          </div>
        ))}

        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addCondicao}>
          <Plus className="w-3 h-3" />
          Adicionar condição
        </Button>
      </div>

      {/* Ação */}
      <div>
        <label className="text-xs font-medium text-muted-foreground">Ação</label>
        <select
          value={tipoAcao}
          onChange={(e) => setTipoAcao(e.target.value)}
          className="w-full mt-1 bg-background border border-border rounded-md px-3 py-2 text-sm"
        >
          {TIPOS_ACAO.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Campo alvo */}
      {needsCampoAlvo && (
        <div>
          <label className="text-xs font-medium text-muted-foreground">Campo alvo</label>
          <select
            value={campoAlvoId}
            onChange={(e) => setCampoAlvoId(e.target.value)}
            className="w-full mt-1 bg-background border border-border rounded-md px-3 py-2 text-sm"
          >
            <option value="">Selecione</option>
            {campos.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
      )}

      {tipoAcao === 'pular_etapa' && (
        <div>
          <label className="text-xs font-medium text-muted-foreground">Número da etapa</label>
          <input
            type="number"
            value={etapaAlvo}
            onChange={(e) => setEtapaAlvo(e.target.value)}
            min={1}
            className="w-full mt-1 bg-background border border-border rounded-md px-3 py-2 text-sm"
          />
        </div>
      )}

      {tipoAcao === 'redirecionar' && (
        <div>
          <label className="text-xs font-medium text-muted-foreground">URL de redirecionamento</label>
          <input
            value={urlAlvo}
            onChange={(e) => setUrlAlvo(e.target.value)}
            placeholder="https://..."
            className="w-full mt-1 bg-background border border-border rounded-md px-3 py-2 text-sm"
          />
        </div>
      )}

      {tipoAcao === 'definir_valor' && (
        <div>
          <label className="text-xs font-medium text-muted-foreground">Valor a definir</label>
          <input
            value={valorAlvo}
            onChange={(e) => setValorAlvo(e.target.value)}
            className="w-full mt-1 bg-background border border-border rounded-md px-3 py-2 text-sm"
          />
        </div>
      )}

      {/* Botões */}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancelar</Button>
        <Button size="sm" onClick={handleSave} disabled={!nomeRegra.trim()}>
          {regra ? 'Salvar' : 'Criar regra'}
        </Button>
      </div>
    </div>
  )
}
