/**
 * AIDEV-NOTE: Modal de criação/edição de contato
 * Conforme PRD-06 e Design System 10.5 - Modal/Dialog
 * - z-index: overlay 400, content 401
 * - Overlay: bg-black/80 backdrop-blur-sm
 * - Estrutura flex-col: header fixo, content scrollable, footer fixo
 * - Footer FORA da área de scroll
 * - Responsividade: w-[calc(100%-32px)] mobile, max-w-2xl desktop
 * - ARIA, ESC to close, focus trap
 */

import { useEffect, useMemo, useState, forwardRef, useRef, useId } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { X, User, Building2, Search } from 'lucide-react'
import { StatusContatoOptions, OrigemContatoOptions, PorteOptions } from '../schemas/contatos.schema'
import type { Contato, TipoContato } from '../services/contatos.api'
import { useCamposConfig } from '../hooks/useCamposConfig'
import type { CampoCustomizado } from '@/modules/configuracoes/services/configuracoes.api'
import { ContatoFormFieldsToggle, getFieldVisibility } from './ContatoFormFieldsToggle'
import { PhoneInputField } from './PhoneInputField'
import { formatCnpj } from '@/lib/formatters'
import { useContatos } from '../hooks/useContatos'
import { useSegmentos } from '../hooks/useSegmentos'
import type { Segmento } from '../services/contatos.api'
import type { InputHTMLAttributes, SelectHTMLAttributes } from 'react'

interface ContatoFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: Record<string, unknown>) => void
  tipo: TipoContato
  contato?: Contato | null
  loading?: boolean
  empresas?: Array<{ id: string; nome_fantasia?: string | null; razao_social?: string | null }>
  usuarios?: Array<{ id: string; nome: string; sobrenome?: string | null }>
  isAdmin?: boolean
  onBack?: () => void
}

function getInputType(tipoCampo: string): string {
  switch (tipoCampo) {
    case 'email': return 'email'
    case 'telefone': return 'tel'
    case 'url': return 'url'
    case 'numero': case 'decimal': return 'number'
    case 'data': return 'date'
    case 'data_hora': return 'datetime-local'
    default: return 'text'
  }
}

function getCampoPlaceholderText(campo: CampoCustomizado): string {
  if (campo.placeholder) return campo.placeholder
  switch (campo.tipo) {
    case 'email': return 'email@exemplo.com'
    case 'telefone': return '(11) 99999-9999'
    case 'url': return 'https://...'
    case 'cpf': return '000.000.000-00'
    case 'cnpj': return '00.000.000/0000-00'
    default: return ''
  }
}

export function ContatoFormModal({
  open,
  onClose,
  onSubmit,
  tipo,
  contato,
  loading,
  empresas = [],
  usuarios = [],
  isAdmin = false,
  onBack,
}: ContatoFormModalProps) {
  const isEditing = !!contato
  const isPessoa = tipo === 'pessoa'
  const modalRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  const [visibilityVersion, setVisibilityVersion] = useState(0)

  // Segmentos
  const { data: segmentosData } = useSegmentos()
  const segmentosList: Segmento[] = segmentosData?.segmentos || []
  const [selectedSegmentoIds, setSelectedSegmentoIds] = useState<string[]>([])

  // Campos config
  const { campos: todosOsCampos, getLabel, getPlaceholder: getCampoPlaceholder, isRequired: isCampoRequired } = useCamposConfig(tipo)
  const camposCustomizados = todosOsCampos.filter(c => !c.sistema && c.ativo)

  const labelWithReq = (key: string, fallback: string) => {
    const label = getLabel(key, fallback)
    return isCampoRequired(key) ? `${label} *` : label
  }
  const regOpts = (key: string, fallback: string, fallbackReq?: boolean) =>
    isCampoRequired(key, fallbackReq) ? { required: `${getLabel(key, fallback)} é obrigatório` } : {}

  // Pessoas para empresa
  const { data: pessoasData } = useContatos(
    !isPessoa ? { tipo: 'pessoa', limit: 200 } : undefined
  )
  const pessoasDisponiveis = pessoasData?.contatos || []

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fieldVisibility = useMemo(() => getFieldVisibility(tipo), [tipo, open, visibilityVersion])

  const isVisible = (key: string, obrigatorio: boolean) => {
    if (obrigatorio) return true
    return fieldVisibility[key] !== false
  }

  const form = useForm<Record<string, any>>({ defaultValues: {} })

  // ESC to close + focus trap
  useEffect(() => {
    if (!open) return

    const prev = document.activeElement as HTMLElement

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
      prev?.focus()
    }
  }, [open, onClose])

  // Reset form when opening
  useEffect(() => {
    if (!open) return

    setSelectedSegmentoIds(contato?.segmentos?.map(s => s.id) || [])

    const defaults: Record<string, any> = {
      status: 'novo',
      origem: 'manual',
    }

    if (contato) {
      if (isPessoa) {
        defaults.nome = contato.nome || ''
        defaults.sobrenome = contato.sobrenome || ''
        defaults.email = contato.email || ''
        defaults.telefone = contato.telefone || ''
        defaults.cargo = contato.cargo || ''
        defaults.empresa_id = contato.empresa_id || ''
        defaults.linkedin_url = contato.linkedin_url || ''
      } else {
        defaults.razao_social = contato.razao_social || ''
        defaults.nome_fantasia = contato.nome_fantasia || ''
        defaults.cnpj = contato.cnpj || ''
        defaults.email = contato.email || ''
        defaults.telefone = contato.telefone || ''
        defaults.website = contato.website || ''
        defaults.segmento = contato.segmento || ''
        defaults.porte = contato.porte || ''
      }
      defaults.status = contato.status || 'novo'
      defaults.origem = contato.origem || 'manual'
      defaults.owner_id = contato.owner_id || ''
      defaults.observacoes = contato.observacoes || ''

      camposCustomizados.forEach(c => {
        const key = `custom_${c.slug}`
        defaults[key] = (contato as any)?.[key] || (contato as any)?.campos_customizados?.[c.slug] || ''
      })
    } else {
      if (isPessoa) {
        defaults.nome = ''
        defaults.sobrenome = ''
        defaults.email = ''
        defaults.telefone = ''
        defaults.cargo = ''
        defaults.empresa_id = ''
        defaults.linkedin_url = ''
      } else {
        defaults.razao_social = ''
        defaults.nome_fantasia = ''
        defaults.cnpj = ''
        defaults.email = ''
        defaults.telefone = ''
        defaults.website = ''
        defaults.segmento = ''
        defaults.porte = ''
      }
      defaults.owner_id = ''
      defaults.observacoes = ''

      camposCustomizados.forEach(c => {
        defaults[`custom_${c.slug}`] = c.valor_padrao || ''
      })
    }

    form.reset(defaults)
  }, [contato, open, isPessoa, camposCustomizados.length])

  const handleSubmit = (data: Record<string, any>) => {
    const cleanData: Record<string, unknown> = { ...data, tipo }
    for (const key of Object.keys(cleanData)) {
      if (cleanData[key] === '') cleanData[key] = null
    }
    // DB constraints: empresa requer razao_social, pessoa requer nome
    if (isPessoa && !cleanData.nome) {
      form.setError('nome', { message: 'Nome é obrigatório' })
      return
    }
    if (!isPessoa && !cleanData.razao_social) {
      form.setError('razao_social', { message: 'Razão Social é obrigatória' })
      return
    }
    if (cleanData.cnpj && typeof cleanData.cnpj === 'string') {
      cleanData.cnpj = cleanData.cnpj.replace(/\D/g, '')
    }
    if (selectedSegmentoIds.length > 0) {
      cleanData.segmento_ids = selectedSegmentoIds
    }
    onSubmit(cleanData)
  }

  if (!open) return null

  // ========= Render helpers =========

  const renderPessoaFields = () => {
    const fields: JSX.Element[] = []

    fields.push(
      <div key="nome-row" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField label="Nome *" error={form.formState.errors.nome?.message as string} {...form.register('nome', { required: 'Nome é obrigatório' })} />
        {isVisible('sobrenome', isCampoRequired('sobrenome')) && (
          <InputField label={labelWithReq('sobrenome', 'Sobrenome')} error={form.formState.errors.sobrenome?.message as string} {...form.register('sobrenome', regOpts('sobrenome', 'Sobrenome'))} />
        )}
      </div>
    )

    const optionalRows: JSX.Element[] = []

    if (isVisible('email', isCampoRequired('email'))) {
      optionalRows.push(<InputField key="email" label={labelWithReq('email', 'Email')} type="email" error={form.formState.errors.email?.message as string} {...form.register('email', regOpts('email', 'Email'))} />)
    }
    if (isVisible('telefone', isCampoRequired('telefone'))) {
      optionalRows.push(
        <Controller key="telefone" name="telefone" control={form.control}
          rules={isCampoRequired('telefone') ? { required: `${getLabel('telefone', 'Telefone')} é obrigatório` } : {}}
          render={({ field }) => (
            <PhoneInputField label={labelWithReq('telefone', 'Telefone')} value={field.value} onChange={field.onChange} />
          )}
        />
      )
    }
    if (isVisible('cargo', isCampoRequired('cargo'))) {
      optionalRows.push(<InputField key="cargo" label={labelWithReq('cargo', 'Cargo')} error={form.formState.errors.cargo?.message as string} {...form.register('cargo', regOpts('cargo', 'Cargo'))} />)
    }
    if (isVisible('linkedin_url', isCampoRequired('linkedin_url'))) {
      optionalRows.push(<InputField key="linkedin" label={labelWithReq('linkedin_url', 'LinkedIn')} placeholder={getCampoPlaceholder('linkedin_url', 'https://linkedin.com/in/...')} error={form.formState.errors.linkedin_url?.message as string} {...form.register('linkedin_url', regOpts('linkedin_url', 'LinkedIn'))} />)
    }
    if (isVisible('empresa_id', false)) {
      optionalRows.push(
        <EmpresaSearchField key="empresa" label="Empresa vinculada" empresas={empresas} value={form.watch('empresa_id') || ''} onChange={(id) => form.setValue('empresa_id', id)} />
      )
    }

    for (let i = 0; i < optionalRows.length; i += 2) {
      const pair = optionalRows.slice(i, i + 2)
      fields.push(<div key={`opt-row-${i}`} className="grid grid-cols-1 sm:grid-cols-2 gap-4">{pair}</div>)
    }

    return fields
  }

  const renderEmpresaFields = () => {
    const fields: JSX.Element[] = []

    fields.push(
      <div key="empresa-row-1" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField label="Razão Social *" error={form.formState.errors.razao_social?.message as string} {...form.register('razao_social', { required: 'Razão Social é obrigatória' })} />
        {isVisible('nome_fantasia', isCampoRequired('nome_fantasia')) && (
          <InputField label={labelWithReq('nome_fantasia', 'Nome Fantasia')} error={form.formState.errors.nome_fantasia?.message as string} {...form.register('nome_fantasia', regOpts('nome_fantasia', 'Nome Fantasia'))} />
        )}
      </div>
    )

    const optionalRows: JSX.Element[] = []

    if (isVisible('cnpj', isCampoRequired('cnpj'))) {
      optionalRows.push(
        <Controller key="cnpj" name="cnpj" control={form.control}
          rules={isCampoRequired('cnpj') ? { required: `${getLabel('cnpj', 'CNPJ')} é obrigatório` } : {}}
          render={({ field }) => (
            <InputField label={labelWithReq('cnpj', 'CNPJ')} placeholder={getCampoPlaceholder('cnpj', 'XX.XXX.XXX/XXXX-XX')}
              value={field.value || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { field.onChange(formatCnpj(e.target.value)) }}
            />
          )}
        />
      )
    }
    if (isVisible('email', isCampoRequired('email'))) {
      optionalRows.push(<InputField key="email" label={labelWithReq('email', 'Email')} type="email" error={form.formState.errors.email?.message as string} {...form.register('email', regOpts('email', 'Email'))} />)
    }
    if (isVisible('telefone', isCampoRequired('telefone'))) {
      optionalRows.push(
        <Controller key="telefone" name="telefone" control={form.control}
          rules={isCampoRequired('telefone') ? { required: `${getLabel('telefone', 'Telefone')} é obrigatório` } : {}}
          render={({ field }) => (
            <PhoneInputField label={labelWithReq('telefone', 'Telefone')} value={field.value} onChange={field.onChange} />
          )}
        />
      )
    }
    if (isVisible('website', isCampoRequired('website'))) {
      optionalRows.push(<InputField key="website" label={labelWithReq('website', 'Website')} placeholder={getCampoPlaceholder('website', 'https://...')} error={form.formState.errors.website?.message as string} {...form.register('website', regOpts('website', 'Website'))} />)
    }
    if (isVisible('segmento', isCampoRequired('segmento'))) {
      optionalRows.push(<InputField key="segmento" label={labelWithReq('segmento', 'Segmento de Mercado')} error={form.formState.errors.segmento?.message as string} {...form.register('segmento', regOpts('segmento', 'Segmento de Mercado'))} />)
    }
    if (isVisible('porte', isCampoRequired('porte'))) {
      optionalRows.push(
        <SelectField key="porte" label={labelWithReq('porte', 'Porte')} {...form.register('porte', regOpts('porte', 'Porte'))}>
          <option value="">Selecione</option>
          {PorteOptions.map((p) => (<option key={p.value} value={p.value}>{p.label}</option>))}
        </SelectField>
      )
    }

    for (let i = 0; i < optionalRows.length; i += 2) {
      const pair = optionalRows.slice(i, i + 2)
      fields.push(<div key={`opt-row-${i}`} className="grid grid-cols-1 sm:grid-cols-2 gap-4">{pair}</div>)
    }

    return fields
  }

  const renderCustomFields = () => {
    const visibleCustom = camposCustomizados.filter(c => isVisible(`custom_${c.slug}`, c.obrigatorio))
    if (visibleCustom.length === 0) return null

    const rows: JSX.Element[] = []
    const fields: JSX.Element[] = visibleCustom.map(campo => {
      const key = `custom_${campo.slug}`
      const label = campo.nome + (campo.obrigatorio ? ' *' : '')

      if ((campo.tipo === 'select' || campo.tipo === 'multi_select') && campo.opcoes?.length) {
        return (
          <SelectField key={key} label={label} {...form.register(key)}>
            <option value="">Selecione</option>
            {campo.opcoes.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
          </SelectField>
        )
      }

      if (campo.tipo === 'texto_longo') {
        return (
          <div key={key}>
            <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
            <textarea {...form.register(key)} rows={2} placeholder={getCampoPlaceholderText(campo)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
        )
      }

      if (campo.tipo === 'booleano') {
        return (
          <div key={key} className="flex items-center gap-2 py-2">
            <input type="checkbox" {...form.register(key)} className="rounded border-input" />
            <label className="text-sm font-medium text-foreground">{label}</label>
          </div>
        )
      }

      if (campo.tipo === 'telefone') {
        return (
          <Controller key={key} name={key} control={form.control}
            render={({ field }) => (<PhoneInputField label={label} value={field.value} onChange={field.onChange} />)}
          />
        )
      }

      return (
        <InputField key={key} label={label} type={getInputType(campo.tipo)} placeholder={getCampoPlaceholderText(campo)} {...form.register(key)} />
      )
    })

    for (let i = 0; i < fields.length; i += 2) {
      const pair = fields.slice(i, i + 2)
      rows.push(<div key={`custom-row-${i}`} className="grid grid-cols-1 sm:grid-cols-2 gap-4">{pair}</div>)
    }

    return (
      <>
        <div className="border-t border-border pt-4 mt-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Campos Personalizados</p>
        </div>
        {rows}
      </>
    )
  }

  const renderPessoasVinculadas = () => {
    if (isPessoa || !isEditing || !contato) return null
    const pessoasVinculadas = pessoasDisponiveis.filter(p => p.empresa_id === contato.id)

    return (
      <div className="border-t border-border pt-4 mt-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Pessoas Vinculadas ({pessoasVinculadas.length})
        </p>
        {pessoasVinculadas.length > 0 ? (
          <div className="space-y-1">
            {pessoasVinculadas.map(p => (
              <div key={p.id} className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-muted/50">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-sm text-foreground">{p.nome} {p.sobrenome || ''}</span>
                {p.email && <span className="text-xs text-muted-foreground ml-auto">{p.email}</span>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma pessoa vinculada a esta empresa</p>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Overlay - z-400 */}
      <div
        className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog container - z-401 */}
      <div className="fixed inset-0 z-[401] flex items-center justify-center pointer-events-none">
        <form
          ref={modalRef as any}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onSubmit={form.handleSubmit(handleSubmit)}
          className="
            pointer-events-auto
            bg-card border border-border rounded-lg shadow-lg
            flex flex-col
            w-[calc(100%-16px)] sm:w-[calc(100%-32px)] sm:max-w-2xl
            max-h-[calc(100dvh-16px)] sm:max-h-[85vh]
          "
        >
          {/* Header - fixo */}
          <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                {isPessoa ? <User className="w-5 h-5 text-primary" /> : <Building2 className="w-5 h-5 text-primary" />}
              </div>
              <h2 id={titleId} className="text-lg font-semibold text-foreground">
                {isEditing ? 'Editar' : isPessoa ? 'Nova Pessoa' : 'Nova Empresa'}
              </h2>
            </div>
            <div className="flex items-center gap-1">
              <ContatoFormFieldsToggle tipo={tipo} onChange={() => setVisibilityVersion(v => v + 1)} />
              <button type="button" onClick={onClose} className="p-2 hover:bg-accent rounded-md transition-all duration-200" aria-label="Fechar">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 min-h-0 overscroll-contain">
            <div className="space-y-5">
              {isPessoa ? renderPessoaFields() : renderEmpresaFields()}

              {/* Status + Origem */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectField label="Status" {...form.register('status')}>
                  {StatusContatoOptions.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
                </SelectField>
                <SelectField label="Origem" {...form.register('origem')}>
                  {OrigemContatoOptions.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                </SelectField>
              </div>

              {/* Responsável (Admin only) */}
              {isAdmin && usuarios.length > 0 && (
                <SelectField label="Responsável" {...form.register('owner_id')}>
                  <option value="">Sem responsável</option>
                  {usuarios.map((u) => (<option key={u.id} value={u.id}>{u.nome} {u.sobrenome || ''}</option>))}
                </SelectField>
              )}

              {/* Segmentos */}
              {segmentosList.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Segmentos</label>
                  <div className="flex flex-wrap gap-2 p-3 rounded-md border border-input bg-background min-h-[42px]">
                    {segmentosList.map(seg => {
                      const isSelected = selectedSegmentoIds.includes(seg.id)
                      return (
                        <button key={seg.id} type="button"
                          onClick={() => {
                            setSelectedSegmentoIds(prev =>
                              isSelected ? prev.filter(id => id !== seg.id) : [...prev, seg.id]
                            )
                          }}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                            isSelected
                              ? 'bg-primary/10 text-primary border border-primary/30'
                              : 'bg-muted text-muted-foreground border border-transparent hover:border-border'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: seg.cor }} />
                          {seg.nome}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {renderCustomFields()}
              {renderPessoasVinculadas()}

              {/* Observações */}
              {isVisible('observacoes', false) && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Observações</label>
                  <textarea {...form.register('observacoes')} rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer - fixo, FORA do scroll */}
          <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-t border-border bg-card rounded-b-lg">
            <div className="flex items-center justify-end gap-2 sm:gap-3">
              <button type="button" onClick={onBack || onClose} className="px-4 h-9 text-sm font-medium rounded-md border border-border text-foreground hover:bg-accent transition-all duration-200" disabled={loading}>
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="px-4 h-9 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 disabled:opacity-50">
                {loading ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  )
}

// =====================================================
// Empresa search field
// =====================================================

function EmpresaSearchField({
  label,
  empresas,
  value,
  onChange,
}: {
  label: string
  empresas: Array<{ id: string; nome_fantasia?: string | null; razao_social?: string | null }>
  value: string
  onChange: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const selectedEmpresa = empresas.find(e => e.id === value)
  const displayName = selectedEmpresa ? (selectedEmpresa.nome_fantasia || selectedEmpresa.razao_social || '') : ''

  const filtered = search
    ? empresas.filter(e => (e.nome_fantasia || e.razao_social || '').toLowerCase().includes(search.toLowerCase()))
    : empresas

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between rounded-md border border-input bg-background px-3 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <span className={displayName ? 'text-foreground' : 'text-muted-foreground'}>{displayName || 'Nenhuma'}</span>
        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-full bg-background rounded-md shadow-lg border border-border py-1 z-[600] max-h-[220px]">
          <div className="px-2 pb-1 pt-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
              <input type="text" placeholder="Buscar empresa..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-[160px]">
            <button type="button" onClick={() => { onChange(''); setOpen(false); setSearch('') }}
              className={`flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-accent transition-colors text-left ${!value ? 'text-primary' : 'text-muted-foreground'}`}
            >Nenhuma</button>
            {filtered.map(e => (
              <button key={e.id} type="button" onClick={() => { onChange(e.id); setOpen(false); setSearch('') }}
                className={`flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-accent transition-colors text-left ${value === e.id ? 'bg-primary/5 text-primary' : 'text-foreground'}`}
              >
                <Building2 className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                <span className="truncate">{e.nome_fantasia || e.razao_social}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-sm text-muted-foreground">Nenhuma empresa encontrada</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// =====================================================
// Form field components
// =====================================================

const InputField = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }>(
  ({ label, error, className, ...props }, ref) => (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      <input ref={ref} {...props}
        className={`w-full h-10 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${error ? 'border-destructive' : ''} ${className || ''}`}
      />
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  )
)
InputField.displayName = 'InputField'

const SelectField = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: React.ReactNode }>(
  ({ label, children, className, ...props }, ref) => (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      <select ref={ref} {...props}
        className={`w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${className || ''}`}
      >
        {children}
      </select>
    </div>
  )
)
SelectField.displayName = 'SelectField'
