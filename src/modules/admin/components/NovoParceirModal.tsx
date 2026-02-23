import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Loader2, Search, Users2 } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { supabase } from '@/lib/supabase'
import { CriarParceiroSchema, type CriarParceiroData } from '../schemas/parceiro.schema'
import { useCreateParceiro } from '../hooks/useParceiros'
import { listarOrganizacoesDisponiveis } from '../services/parceiros.api'


interface Props {
  isOpen: boolean
  onClose: () => void
}

type OrgDisponivel = {
  id: string
  nome: string
  email: string | null
  status: string
}

/**
 * AIDEV-NOTE: NovoParceirModal — cadastra parceiro buscando admin automaticamente ao selecionar org
 * Segue padrao de modal com header fixo + content scrollável + footer fixo (PRD Programa de Parceiros)
 */
export function NovoParceirModal({ isOpen, onClose }: Props) {
  const [busca, setBusca] = useState('')
  const [orgs, setOrgs] = useState<OrgDisponivel[]>([])
  const [orgSelecionada, setOrgSelecionada] = useState<OrgDisponivel | null>(null)
  const [buscandoOrgs, setBuscandoOrgs] = useState(false)
  const [buscandoAdmin, setBuscandoAdmin] = useState(false)
  const [adminNome, setAdminNome] = useState<string | null>(null)
  const [erroAdmin, setErroAdmin] = useState<string | null>(null)
  const [mostrarLista, setMostrarLista] = useState(false)

  const createParceiro = useCreateParceiro()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CriarParceiroData>({
    resolver: zodResolver(CriarParceiroSchema),
  })

  // Fechar ao pressionar Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  // Reset ao fechar
  useEffect(() => {
    if (!isOpen) {
      reset()
      setBusca('')
      setOrgs([])
      setOrgSelecionada(null)
      setAdminNome(null)
      setErroAdmin(null)
      setMostrarLista(false)
    }
  }, [isOpen, reset])

  // Buscar orgs disponíveis com debounce
  const buscarOrgs = useCallback(async (termo: string) => {
    setBuscandoOrgs(true)
    try {
      const resultado = await listarOrganizacoesDisponiveis(termo || undefined)
      setOrgs(resultado)
    } catch {
      setOrgs([])
    } finally {
      setBuscandoOrgs(false)
    }
  }, [])

  // AIDEV-NOTE: Buscar orgs quando o popover abre ou quando a busca muda
  useEffect(() => {
    if (!mostrarLista) return
    const timer = setTimeout(() => buscarOrgs(busca), 400)
    return () => clearTimeout(timer)
  }, [busca, buscarOrgs, mostrarLista])

  // AIDEV-NOTE: Ao selecionar org, buscar automaticamente o primeiro admin ativo
  const handleSelecionarOrg = async (org: OrgDisponivel) => {
    setOrgSelecionada(org)
    setMostrarLista(false)
    setBusca('')
    setValue('organizacao_id', org.id)
    setAdminNome(null)
    setErroAdmin(null)

    setBuscandoAdmin(true)
    try {
      const { data: adminUsuario } = await supabase
        .from('usuarios')
        .select('id, nome, email')
        .eq('organizacao_id', org.id)
        .eq('role', 'admin')
        .eq('status', 'ativo')
        .order('criado_em', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (adminUsuario) {
        setValue('usuario_id', adminUsuario.id)
        setAdminNome(`${adminUsuario.nome} (${adminUsuario.email})`)
        setErroAdmin(null)
      } else {
        setValue('usuario_id', '')
        setErroAdmin('Esta organização não possui admin ativo')
      }
    } catch {
      setErroAdmin('Erro ao buscar admin da organização')
    } finally {
      setBuscandoAdmin(false)
    }
  }

  const onSubmit = (data: CriarParceiroData) => {
    if (erroAdmin) return

    createParceiro.mutate(data, {
      onSuccess: () => {
        onClose()
      },
    })
  }

  if (!isOpen) return null

  const semAdmin = !!erroAdmin
  const podeSubmeter = !semAdmin && !!orgSelecionada && !buscandoAdmin

  return (
    <>
      <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[401] flex items-center justify-center p-4 pointer-events-none">
      <div className="pointer-events-auto bg-card rounded-lg border border-border shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
        {/* Header fixo */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Users2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Novo Parceiro</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-accent rounded-md transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Conteúdo scrollável */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
            {/* Campo: Empresa Parceira */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                Empresa Parceira <span className="text-destructive">*</span>
              </label>

              <Popover open={mostrarLista} onOpenChange={setMostrarLista}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full px-3 py-2 border border-border rounded-md text-sm text-left flex items-center justify-between hover:bg-accent/50 transition-colors"
                  >
                    <span className={orgSelecionada ? 'text-foreground' : 'text-muted-foreground'}>
                      {orgSelecionada ? orgSelecionada.nome : 'Selecione uma empresa...'}
                    </span>
                    <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[var(--radix-popover-trigger-width)] p-0"
                  align="start"
                  sideOffset={4}
                >
                  <div className="p-2 border-b border-border">
                    <input
                      type="text"
                      autoFocus
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      placeholder="Buscar por nome ou email..."
                      className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-md outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto py-1">
                    {buscandoOrgs ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : orgs.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma organização disponível
                      </p>
                    ) : (
                      orgs.map((org) => (
                        <button
                          key={org.id}
                          type="button"
                          onClick={() => handleSelecionarOrg(org)}
                          className="w-full px-3 py-2 text-left hover:bg-accent transition-colors"
                        >
                          <p className="text-sm font-medium text-foreground">{org.nome}</p>
                          {org.email && (
                            <p className="text-xs text-muted-foreground">{org.email}</p>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {errors.organizacao_id && (
                <p className="text-xs text-destructive">{errors.organizacao_id.message}</p>
              )}

              {/* Status do admin encontrado */}
              {buscandoAdmin && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Buscando admin da organização...
                </div>
              )}
              {adminNome && !erroAdmin && (
                <p className="text-xs text-green-600">
                  ✓ Admin encontrado: {adminNome}
                </p>
              )}
              {erroAdmin && (
                <p className="text-xs text-destructive">{erroAdmin}</p>
              )}
            </div>

            {/* Campo: % de Comissão (opcional) */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                % de Comissão{' '}
                <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                placeholder="Usar padrão do programa (10%)"
                {...register('percentual_comissao', {
                  setValueAs: (v) => (v === '' || v === null ? null : Number(v)),
                })}
                className="w-full px-3 py-2 border border-border rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/20 bg-background"
              />
              {errors.percentual_comissao && (
                <p className="text-xs text-destructive">{errors.percentual_comissao.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Deixe em branco para usar o percentual padrão configurado no programa.
              </p>
            </div>

            {/* Campo oculto usuario_id */}
            <input type="hidden" {...register('usuario_id')} />
          </div>

          {/* Footer fixo */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-md text-sm font-medium hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!podeSubmeter || createParceiro.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createParceiro.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Cadastrar Parceiro
            </button>
          </div>
        </form>
      </div>
      </div>
    </>
  )
}
