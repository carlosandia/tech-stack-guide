/**
 * AIDEV-NOTE: Modal de criação/edição de Meta
 * Conforme PRD-05 - Seção 3.3.3 Modal de Criação/Edição
 */

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Target, Building2, Users, User } from 'lucide-react'
import { metaFormSchema, type MetaFormValues, METRICAS_POR_CATEGORIA, CATEGORIAS, PERIODOS } from '../../schemas/metas.schema'
import type { MetaComProgresso, EquipeComMembros, UsuarioTenant } from '../../services/configuracoes.api'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (values: MetaFormValues) => void
  meta?: MetaComProgresso | null
  equipes: EquipeComMembros[]
  usuarios: UsuarioTenant[]
  loading?: boolean
}

export function MetaFormModal({ open, onClose, onSubmit, meta, equipes, usuarios, loading }: Props) {
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('receita')

  const form = useForm<MetaFormValues>({
    resolver: zodResolver(metaFormSchema),
    defaultValues: {
      tipo: 'empresa',
      nome: '',
      metrica: 'valor_vendas',
      valor_meta: 0,
      periodo: 'mensal',
      data_inicio: new Date().toISOString().split('T')[0],
      data_fim: '',
    },
  })

  const tipoSelecionado = form.watch('tipo')
  const periodoSelecionado = form.watch('periodo')
  const dataInicio = form.watch('data_inicio')

  // Auto-calcular data_fim baseado no período
  useEffect(() => {
    if (dataInicio && periodoSelecionado) {
      const inicio = new Date(dataInicio)
      const fim = new Date(inicio)
      switch (periodoSelecionado) {
        case 'mensal': fim.setMonth(fim.getMonth() + 1); fim.setDate(fim.getDate() - 1); break
        case 'trimestral': fim.setMonth(fim.getMonth() + 3); fim.setDate(fim.getDate() - 1); break
        case 'semestral': fim.setMonth(fim.getMonth() + 6); fim.setDate(fim.getDate() - 1); break
        case 'anual': fim.setFullYear(fim.getFullYear() + 1); fim.setDate(fim.getDate() - 1); break
      }
      form.setValue('data_fim', fim.toISOString().split('T')[0])
    }
  }, [dataInicio, periodoSelecionado, form])

  // Preencher ao editar
  useEffect(() => {
    if (meta) {
      form.reset({
        tipo: meta.tipo,
        nome: meta.nome || '',
        metrica: meta.metrica,
        valor_meta: meta.valor_meta,
        periodo: meta.periodo,
        data_inicio: meta.data_inicio?.split('T')[0] || '',
        data_fim: meta.data_fim?.split('T')[0] || '',
        equipe_id: meta.equipe_id || undefined,
        usuario_id: meta.usuario_id || undefined,
        funil_id: meta.funil_id || undefined,
      })
      // Determinar categoria da métrica
      for (const [cat, metricas] of Object.entries(METRICAS_POR_CATEGORIA)) {
        if (metricas.some(m => m.value === meta.metrica)) {
          setCategoriaAtiva(cat)
          break
        }
      }
    } else {
      form.reset({
        tipo: 'empresa',
        nome: '',
        metrica: 'valor_vendas',
        valor_meta: 0,
        periodo: 'mensal',
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim: '',
      })
      setCategoriaAtiva('receita')
    }
  }, [meta, form])

  if (!open) return null

  const metricasCategoria = METRICAS_POR_CATEGORIA[categoriaAtiva as keyof typeof METRICAS_POR_CATEGORIA] || []

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit(values)
  })

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center">
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-lg shadow-xl border border-border w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              {meta ? 'Editar Meta' : 'Nova Meta'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded-md">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nível da Meta */}
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">Nível da Meta *</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'empresa', label: 'Empresa', desc: 'Meta global', icon: Building2 },
                { value: 'equipe', label: 'Equipe', desc: 'Por grupo', icon: Users },
                { value: 'individual', label: 'Individual', desc: 'Por membro', icon: User },
              ].map(opt => {
                const Icon = opt.icon
                const selected = tipoSelecionado === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => form.setValue('tipo', opt.value as MetaFormValues['tipo'])}
                    className={`flex flex-col items-center gap-1.5 p-4 rounded-lg border-2 transition-all duration-200 ${
                      selected
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/30 hover:bg-accent'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-sm font-medium">{opt.label}</span>
                    <span className="text-xs">{opt.desc}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Equipe (se tipo === equipe) */}
          {tipoSelecionado === 'equipe' && (
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Equipe *</label>
              <select
                {...form.register('equipe_id')}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground"
              >
                <option value="">Selecione a equipe...</option>
                {equipes.map(e => (
                  <option key={e.id} value={e.id}>{e.nome}</option>
                ))}
              </select>
            </div>
          )}

          {/* Membro (se tipo === individual) */}
          {tipoSelecionado === 'individual' && (
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Membro *</label>
              <select
                {...form.register('usuario_id')}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground"
              >
                <option value="">Selecione o membro...</option>
                {usuarios.filter(u => u.status === 'ativo').map(u => (
                  <option key={u.id} value={u.id}>{u.nome} {u.sobrenome || ''}</option>
                ))}
              </select>
            </div>
          )}

          {/* Nome */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Nome da Meta *</label>
            <input
              {...form.register('nome')}
              placeholder="Ex: Meta de Receita Fevereiro 2026"
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground"
            />
            {form.formState.errors.nome && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.nome.message}</p>
            )}
          </div>

          {/* Categoria */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Categoria da Métrica *</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS.map(cat => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => {
                    setCategoriaAtiva(cat.key)
                    const primeiraMetrica = METRICAS_POR_CATEGORIA[cat.key as keyof typeof METRICAS_POR_CATEGORIA]?.[0]
                    if (primeiraMetrica) {
                      form.setValue('metrica', primeiraMetrica.value as MetaFormValues['metrica'])
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    categoriaAtiva === cat.key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-accent'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Métrica */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Métrica *</label>
            <div className="space-y-1.5">
              {metricasCategoria.map(m => (
                <label
                  key={m.value}
                  className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-all duration-200 ${
                    form.watch('metrica') === m.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <input
                    type="radio"
                    value={m.value}
                    checked={form.watch('metrica') === m.value}
                    onChange={() => form.setValue('metrica', m.value as MetaFormValues['metrica'])}
                    className="accent-primary"
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground">{m.label}</span>
                    <span className="text-xs text-muted-foreground ml-2">({m.unidade})</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Valor da Meta */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Valor da Meta *</label>
            <input
              type="number"
              step="0.01"
              {...form.register('valor_meta', { valueAsNumber: true })}
              placeholder="0,00"
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground"
            />
            {form.formState.errors.valor_meta && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.valor_meta.message}</p>
            )}
          </div>

          {/* Período */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Período *</label>
            <div className="flex flex-wrap gap-3">
              {PERIODOS.map(p => (
                <label
                  key={p.value}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md border cursor-pointer text-sm transition-all duration-200 ${
                    periodoSelecionado === p.value
                      ? 'border-primary bg-primary/5 text-primary font-medium'
                      : 'border-border text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  <input
                    type="radio"
                    value={p.value}
                    checked={periodoSelecionado === p.value}
                    onChange={() => form.setValue('periodo', p.value as MetaFormValues['periodo'])}
                    className="sr-only"
                  />
                  {p.label}
                </label>
              ))}
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Data de Início *</label>
              <input
                type="date"
                {...form.register('data_inicio')}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Data de Fim</label>
              <input
                type="date"
                {...form.register('data_fim')}
                readOnly
                className="w-full h-10 px-3 rounded-md border border-input bg-muted text-sm text-muted-foreground"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-foreground bg-secondary rounded-md hover:bg-accent transition-all duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-all duration-200 disabled:opacity-50"
            >
              <Target className="w-4 h-4" />
              {meta ? 'Salvar' : 'Criar Meta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
