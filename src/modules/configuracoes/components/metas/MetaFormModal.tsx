/**
 * AIDEV-NOTE: Modal de criação/edição de Meta
 * Migrado para usar ModalBase (Design System 10.5)
 */

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Target, Building2, Users, User, Loader2 } from 'lucide-react'
import { metaFormSchema, type MetaFormValues, METRICAS_POR_CATEGORIA, CATEGORIAS, PERIODOS, getMetricaUnidade } from '../../schemas/metas.schema'
import type { MetaComProgresso, EquipeComMembros, UsuarioTenant } from '../../services/configuracoes.api'
import { ModalBase } from '../ui/ModalBase'

// =====================================================
// Helpers de máscara monetária BRL
// =====================================================
function formatCurrency(value: number): string {
  if (!value && value !== 0) return ''
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}


interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (values: MetaFormValues) => void
  meta?: MetaComProgresso | null
  equipes: EquipeComMembros[]
  usuarios: UsuarioTenant[]
  loading?: boolean
  defaultTipo?: MetaFormValues['tipo']
}

export function MetaFormModal({ open, onClose, onSubmit, meta, equipes, usuarios, loading, defaultTipo = 'empresa' }: Props) {
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('receita')
  const [valorDisplay, setValorDisplay] = useState('')

  // Helper: calcula data_fim a partir de data_inicio + periodo
  const calcularDataFim = (dataInicio: string, periodo: string): string => {
    if (!dataInicio) return ''
    const inicio = new Date(dataInicio)
    const fim = new Date(inicio)
    switch (periodo) {
      case 'mensal': fim.setMonth(fim.getMonth() + 1); fim.setDate(fim.getDate() - 1); break
      case 'trimestral': fim.setMonth(fim.getMonth() + 3); fim.setDate(fim.getDate() - 1); break
      case 'semestral': fim.setMonth(fim.getMonth() + 6); fim.setDate(fim.getDate() - 1); break
      case 'anual': fim.setFullYear(fim.getFullYear() + 1); fim.setDate(fim.getDate() - 1); break
    }
    return fim.toISOString().split('T')[0]
  }

  const hoje = new Date().toISOString().split('T')[0]
  const dataFimInicial = calcularDataFim(hoje, 'mensal')

  const form = useForm<MetaFormValues>({
    resolver: zodResolver(metaFormSchema),
    defaultValues: { tipo: defaultTipo, nome: '', metrica: 'valor_vendas', valor_meta: 0, periodo: 'mensal', data_inicio: hoje, data_fim: dataFimInicial },
  })

  const tipoSelecionado = form.watch('tipo')
  const periodoSelecionado = form.watch('periodo')
  const dataInicio = form.watch('data_inicio')
  const metricaSelecionada = form.watch('metrica')
  const formValorMeta = form.watch('valor_meta')
  const unidadeAtual = getMetricaUnidade(metricaSelecionada)
  const isMoeda = unidadeAtual === 'R$'

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (!isMoeda) {
      const num = parseFloat(raw)
      form.setValue('valor_meta', isNaN(num) ? 0 : num)
      return
    }
    const digits = raw.replace(/\D/g, '')
    if (!digits) {
      setValorDisplay('')
      form.setValue('valor_meta', 0)
      return
    }
    const numValue = parseInt(digits, 10) / 100
    form.setValue('valor_meta', numValue)
    setValorDisplay(formatCurrency(numValue))
  }

  // Sincronizar display quando valor muda externamente (edição, reset)
  useEffect(() => {
    if (isMoeda && formValorMeta) {
      setValorDisplay(formatCurrency(formValorMeta))
    } else if (isMoeda) {
      setValorDisplay('')
    }
  }, [isMoeda, formValorMeta])

  // Auto-calcular data_fim baseado no período
  useEffect(() => {
    if (dataInicio && periodoSelecionado) {
      const novaDataFim = calcularDataFim(dataInicio, periodoSelecionado)
      form.setValue('data_fim', novaDataFim)
    }
  }, [dataInicio, periodoSelecionado, form])

  // Preencher ao editar
  useEffect(() => {
    if (meta) {
      form.reset({
        tipo: meta.tipo, nome: meta.nome || '', metrica: meta.metrica, valor_meta: meta.valor_meta,
        periodo: meta.periodo, data_inicio: meta.data_inicio?.split('T')[0] || '', data_fim: meta.data_fim?.split('T')[0] || '',
        equipe_id: meta.equipe_id || undefined, usuario_id: meta.usuario_id || undefined, funil_id: meta.funil_id || undefined,
      })
      for (const [cat, metricas] of Object.entries(METRICAS_POR_CATEGORIA)) {
        if (metricas.some(m => m.value === meta.metrica)) { setCategoriaAtiva(cat); break }
      }
    } else {
      const novoHoje = new Date().toISOString().split('T')[0]
      form.reset({ tipo: defaultTipo, nome: '', metrica: 'valor_vendas', valor_meta: 0, periodo: 'mensal', data_inicio: novoHoje, data_fim: calcularDataFim(novoHoje, 'mensal') })
      setCategoriaAtiva('receita')
      setValorDisplay('')
    }
  }, [meta, form, defaultTipo])

  if (!open) return null

  const metricasCategoria = METRICAS_POR_CATEGORIA[categoriaAtiva as keyof typeof METRICAS_POR_CATEGORIA] || []

  const handleFormSubmit = form.handleSubmit((values) => { onSubmit(values) })

  const footerContent = (
    <div className="flex items-center justify-end w-full gap-2 sm:gap-3">
      <button type="button" onClick={onClose} className="flex-1 sm:flex-none px-4 h-9 rounded-md border border-input text-sm font-medium text-foreground hover:bg-accent transition-all duration-200">Cancelar</button>
      <button type="submit" form="meta-form" disabled={loading}
        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all duration-200">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        <Target className="w-4 h-4" />
        {meta ? 'Salvar' : 'Criar Meta'}
      </button>
    </div>
  )

  return (
    <ModalBase onClose={onClose} title={meta ? 'Editar Meta' : 'Nova Meta'} description="Metas de Performance" icon={Target} variant={meta ? 'edit' : 'create'} size="lg" footer={footerContent}>
      <form id="meta-form" onSubmit={handleFormSubmit} className="px-4 sm:px-6 py-4 space-y-6">
        {/* Nível da Meta */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">Nível da Meta <span className="text-destructive">*</span></label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'empresa', label: 'Empresa', desc: 'Meta global', icon: Building2 },
              { value: 'equipe', label: 'Equipe', desc: 'Por grupo', icon: Users },
              { value: 'individual', label: 'Individual', desc: 'Por membro', icon: User },
            ].map(opt => {
              const Icon = opt.icon
              const selected = tipoSelecionado === opt.value
              return (
                <button key={opt.value} type="button" onClick={() => form.setValue('tipo', opt.value as MetaFormValues['tipo'])}
                  className={`flex flex-col items-center gap-1.5 p-4 rounded-lg border-2 transition-all duration-200 ${
                    selected ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/30 hover:bg-accent'
                  }`}>
                  <Icon className="w-6 h-6" />
                  <span className="text-sm font-medium">{opt.label}</span>
                  <span className="text-xs">{opt.desc}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Equipe / Membro condicionais */}
        {tipoSelecionado === 'equipe' && (
          <div>
            <label htmlFor="meta-equipe" className="block text-sm font-medium text-foreground mb-1">Equipe <span className="text-destructive">*</span></label>
            <select id="meta-equipe" {...form.register('equipe_id')} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200">
              <option value="">Selecione a equipe...</option>
              {equipes.map(e => (<option key={e.id} value={e.id}>{e.nome}</option>))}
            </select>
          </div>
        )}
        {tipoSelecionado === 'individual' && (
          <div>
            <label htmlFor="meta-usuario" className="block text-sm font-medium text-foreground mb-1">Membro <span className="text-destructive">*</span></label>
            <select id="meta-usuario" {...form.register('usuario_id')} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200">
              <option value="">Selecione o membro...</option>
              {usuarios.filter(u => u.status === 'ativo').map(u => (<option key={u.id} value={u.id}>{u.nome} {u.sobrenome || ''}</option>))}
            </select>
          </div>
        )}

        {/* Nome */}
        <div>
          <label htmlFor="meta-nome" className="block text-sm font-medium text-foreground mb-1">Nome da Meta <span className="text-destructive">*</span></label>
          <input id="meta-nome" {...form.register('nome')} placeholder="Ex: Meta de Receita Fevereiro 2026"
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200" aria-invalid={!!form.formState.errors.nome} />
          {form.formState.errors.nome && <p className="text-xs text-destructive mt-1">{form.formState.errors.nome.message}</p>}
        </div>

        {/* Categoria */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Categoria da Métrica <span className="text-destructive">*</span></label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIAS.map(cat => (
              <button key={cat.key} type="button"
                onClick={() => {
                  setCategoriaAtiva(cat.key)
                  const primeiraMetrica = METRICAS_POR_CATEGORIA[cat.key as keyof typeof METRICAS_POR_CATEGORIA]?.[0]
                  if (primeiraMetrica) form.setValue('metrica', primeiraMetrica.value as MetaFormValues['metrica'])
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  categoriaAtiva === cat.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent'
                }`}>
                {(() => { const CatIcon = cat.icon; return <CatIcon className="w-4 h-4" /> })()}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Métrica */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Métrica <span className="text-destructive">*</span></label>
           <div className="space-y-1.5">
            {metricasCategoria.map(m => (
              <label key={m.value}
                className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-all duration-200 ${
                  form.watch('metrica') === m.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                }`}>
                <input type="radio" value={m.value} checked={form.watch('metrica') === m.value}
                  onChange={() => form.setValue('metrica', m.value as MetaFormValues['metrica'])} className="accent-primary" />
                <div className="flex flex-col">
                  <div>
                    <span className="text-sm font-medium text-foreground">{m.label}</span>
                    <span className="text-xs text-muted-foreground ml-2">({m.unidade})</span>
                  </div>
                  {'hint' in m && m.hint && (
                    <span className="text-xs text-muted-foreground mt-0.5">{m.hint}</span>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Valor da Meta */}
        <div>
          <label htmlFor="meta-valor" className="block text-sm font-medium text-foreground mb-1">Valor da Meta <span className="text-destructive">*</span></label>
          <div className="relative">
            {isMoeda && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
            )}
            {isMoeda ? (
              <input
                id="meta-valor"
                type="text"
                inputMode="numeric"
                value={valorDisplay}
                onChange={handleValorChange}
                placeholder="0,00"
                className={`w-full h-10 ${isMoeda ? 'pl-10' : 'px-3'} pr-3 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200`}
                aria-invalid={!!form.formState.errors.valor_meta}
              />
            ) : (
              <input
                id="meta-valor"
                type="number"
                step={unidadeAtual === '%' ? '0.1' : '1'}
                {...form.register('valor_meta', { valueAsNumber: true })}
                placeholder="0"
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200"
                aria-invalid={!!form.formState.errors.valor_meta}
              />
            )}
            {!isMoeda && unidadeAtual && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{unidadeAtual}</span>
            )}
          </div>
          {form.formState.errors.valor_meta && <p className="text-xs text-destructive mt-1">{form.formState.errors.valor_meta.message}</p>}
        </div>

        {/* Período */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Período <span className="text-destructive">*</span></label>
          <div className="flex flex-wrap gap-3">
            {PERIODOS.map(p => (
              <label key={p.value}
                className={`flex items-center gap-2 px-4 py-2 rounded-md border cursor-pointer text-sm transition-all duration-200 ${
                  periodoSelecionado === p.value ? 'border-primary bg-primary/5 text-primary font-medium' : 'border-border text-muted-foreground hover:border-primary/30'
                }`}>
                <input type="radio" value={p.value} checked={periodoSelecionado === p.value}
                  onChange={() => form.setValue('periodo', p.value as MetaFormValues['periodo'])} className="sr-only" />
                {p.label}
              </label>
            ))}
          </div>
        </div>

        {/* Datas */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="meta-inicio" className="block text-sm font-medium text-foreground mb-1">Data de Início <span className="text-destructive">*</span></label>
            <input id="meta-inicio" type="date" {...form.register('data_inicio')} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200" />
          </div>
          <div>
            <label htmlFor="meta-fim" className="block text-sm font-medium text-foreground mb-1">Data de Fim</label>
            <input id="meta-fim" type="date" {...form.register('data_fim')} readOnly className="w-full h-10 px-3 rounded-md border border-input bg-muted text-sm text-muted-foreground" />
          </div>
        </div>
      </form>
    </ModalBase>
  )
}
