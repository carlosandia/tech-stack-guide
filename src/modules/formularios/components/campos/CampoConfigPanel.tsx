/**
 * AIDEV-NOTE: Painel lateral de configuração do campo selecionado
 * Permite editar label, placeholder, obrigatório, validações, mapeamento
 * Inclui campos customizados globais (pessoa/empresa) no mapeamento
 * Auto-save com debounce de 800ms
 */

import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { X, Plus, Loader2, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'

import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CampoFormulario } from '../../services/formularios.api'
import { useCriarCampo, useCampos } from '@/modules/configuracoes/hooks/useCampos'
import { tipoCampoOptions } from '@/modules/configuracoes/schemas/campos.schema'
import type { CriarCampoPayload } from '@/modules/configuracoes/services/configuracoes.api'

interface MapeamentoItem {
  value: string
  label: string
  grupo: string
}

const MAPEAMENTOS_PADRAO: MapeamentoItem[] = [
  { value: 'nenhum', label: 'Nenhum', grupo: '' },
  // Pessoa
  { value: 'pessoa.nome', label: 'Nome', grupo: 'Pessoa' },
  { value: 'pessoa.sobrenome', label: 'Sobrenome', grupo: 'Pessoa' },
  { value: 'pessoa.email', label: 'Email', grupo: 'Pessoa' },
  { value: 'pessoa.telefone', label: 'Telefone', grupo: 'Pessoa' },
  { value: 'pessoa.cargo', label: 'Cargo', grupo: 'Pessoa' },
  { value: 'pessoa.linkedin_url', label: 'LinkedIn', grupo: 'Pessoa' },
  { value: 'pessoa.observacoes', label: 'Observações', grupo: 'Pessoa' },
  // Empresa
  { value: 'empresa.nome_fantasia', label: 'Nome Fantasia', grupo: 'Empresa' },
  { value: 'empresa.razao_social', label: 'Razão Social', grupo: 'Empresa' },
  { value: 'empresa.cnpj', label: 'CNPJ', grupo: 'Empresa' },
  { value: 'empresa.email', label: 'Email', grupo: 'Empresa' },
  { value: 'empresa.telefone', label: 'Telefone', grupo: 'Empresa' },
  { value: 'empresa.website', label: 'Website', grupo: 'Empresa' },
  { value: 'empresa.segmento', label: 'Segmento de Mercado', grupo: 'Empresa' },
  { value: 'empresa.porte', label: 'Porte', grupo: 'Empresa' },
  { value: 'empresa.observacoes', label: 'Observações', grupo: 'Empresa' },
]

const LARGURAS = [
  { value: 'full', label: 'Largura Total (100%)' },
  { value: '1/2', label: 'Meia Largura (50%)' },
  { value: '1/3', label: 'Um Terço (33%)' },
  { value: '2/3', label: 'Dois Terços (66%)' },
]

// AIDEV-NOTE: Helper para parsear JSON do campo titulo (alinhamento, cor, tamanho)
function parseTituloConfig(valorPadrao: string | null | undefined): { alinhamento: string; cor: string; tamanho: string } {
  const defaults = { alinhamento: 'left', cor: '#374151', tamanho: '18' }
  if (!valorPadrao) return defaults
  try {
    const parsed = JSON.parse(valorPadrao)
    return {
      alinhamento: parsed.alinhamento || defaults.alinhamento,
      cor: parsed.cor || defaults.cor,
      tamanho: parsed.tamanho || defaults.tamanho,
    }
  } catch {
    return defaults
  }
}

interface Props {
  campo: CampoFormulario
  onUpdate: (payload: Partial<CampoFormulario>) => void
  onClose: () => void
  className?: string
}

export function CampoConfigPanel({ campo, onUpdate, onClose, className }: Props) {
  const queryClient = useQueryClient()
  const criarCampoMutation = useCriarCampo()
  const { data: camposPessoa } = useCampos('pessoa')
  const { data: camposEmpresa } = useCampos('empresa')

  const [showCriarCampo, setShowCriarCampo] = useState(false)
  const [criarCampoEntidade, setCriarCampoEntidade] = useState<'pessoa' | 'empresa'>('pessoa')
  const [novoCampoNome, setNovoCampoNome] = useState('')
  const [novoCampoTipo, setNovoCampoTipo] = useState('texto')

  // Build dynamic mapping list with custom fields
  const MAPEAMENTOS = useMemo(() => {
    const items: MapeamentoItem[] = [...MAPEAMENTOS_PADRAO]

    const listaPessoa = Array.isArray(camposPessoa) ? camposPessoa : (camposPessoa?.campos || [])
    const customPessoa = listaPessoa.filter((c: any) => !c.sistema && !c.deletado_em)
    for (const cp of customPessoa) {
      const slug = cp.slug || cp.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_')
      const value = `custom.pessoa.${slug}`
      if (!items.some(i => i.value === value)) {
        items.push({ value, label: cp.nome, grupo: 'Pessoa' })
      }
    }

    const listaEmpresa = Array.isArray(camposEmpresa) ? camposEmpresa : (camposEmpresa?.campos || [])
    const customEmpresa = listaEmpresa.filter((c: any) => !c.sistema && !c.deletado_em)
    for (const ce of customEmpresa) {
      const slug = ce.slug || ce.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_')
      const value = `custom.empresa.${slug}`
      if (!items.some(i => i.value === value)) {
        items.push({ value, label: ce.nome, grupo: 'Empresa' })
      }
    }

    return items
  }, [camposPessoa, camposEmpresa])

  const [form, setForm] = useState({
    label: campo.label || '',
    nome: campo.nome || '',
    placeholder: campo.placeholder || '',
    texto_ajuda: campo.texto_ajuda || '',
    obrigatorio: campo.obrigatorio,
    mapeamento_campo: campo.mapeamento_campo || '',
    largura: campo.largura || 'full',
    valor_padrao: campo.valor_padrao || '',
  })

  const needsOptions = ['selecao', 'selecao_multipla', 'radio', 'ranking'].includes(campo.tipo)
  const [opcoesText, setOpcoesText] = useState(
    (campo.opcoes as string[] || []).join('\n')
  )

  // Titulo config state
  const isTitulo = campo.tipo === 'titulo'
  const [tituloConfig, setTituloConfig] = useState(() => parseTituloConfig(campo.valor_padrao))

  // Reset when campo changes
  useEffect(() => {
    setForm({
      label: campo.label || '',
      nome: campo.nome || '',
      placeholder: campo.placeholder || '',
      texto_ajuda: campo.texto_ajuda || '',
      obrigatorio: campo.obrigatorio,
      mapeamento_campo: campo.mapeamento_campo || '',
      largura: campo.largura || 'full',
      valor_padrao: campo.valor_padrao || '',
    })
    setOpcoesText((campo.opcoes as string[] || []).join('\n'))
    setTituloConfig(parseTituloConfig(campo.valor_padrao))
  }, [campo.id])

  const deriveNome = (label: string) =>
    label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')

  // AIDEV-NOTE: Auto-save com debounce de 800ms
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)

  const buildPayload = useCallback(() => {
    const payload: Partial<CampoFormulario> = {
      label: form.label,
      nome: deriveNome(form.label),
      placeholder: form.placeholder || null,
      texto_ajuda: form.texto_ajuda || null,
      obrigatorio: form.obrigatorio,
      mapeamento_campo: form.mapeamento_campo || null,
      largura: form.largura,
      valor_padrao: isTitulo ? JSON.stringify(tituloConfig) : (form.valor_padrao || null),
    }
    if (needsOptions) {
      const opcoes = opcoesText.split('\n').map((o) => o.trim()).filter(Boolean)
      ;(payload as any).opcoes = opcoes
    }
    return payload
  }, [form, tituloConfig, opcoesText, isTitulo, needsOptions])

  useEffect(() => {
    // Skip first render to avoid saving on mount
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onUpdate(buildPayload())
    }, 800)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [form, tituloConfig, opcoesText])

  // Flush on unmount or campo change
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        // Flush pending save is not needed here since campo is changing
      }
    }
  }, [campo.id])

  // Reset first render flag on campo change
  useEffect(() => {
    isFirstRender.current = true
  }, [campo.id])

  return (
    <div className={cn('space-y-4 overflow-y-auto', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Configurar Campo</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Label</Label>
          <Input
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            placeholder="Ex: Nome completo"
          />
        </div>

        {/* Configurações especiais para campo Título */}
        {isTitulo && (
          <div className="space-y-3 border-t border-border pt-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estilo do Título</p>
            
            <div className="space-y-1.5">
              <Label className="text-xs">Alinhamento</Label>
              <div className="flex gap-1">
                {([
                  { value: 'left', icon: AlignLeft, label: 'Esquerda' },
                  { value: 'center', icon: AlignCenter, label: 'Centro' },
                  { value: 'right', icon: AlignRight, label: 'Direita' },
                ] as const).map(({ value, icon: Icon, label }) => (
                  <Button
                    key={value}
                    type="button"
                    variant={tituloConfig.alinhamento === value ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 h-8"
                    onClick={() => setTituloConfig(prev => ({ ...prev, alinhamento: value }))}
                    title={label}
                  >
                    <Icon className="w-4 h-4" />
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Cor do Texto</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={tituloConfig.cor}
                  onChange={(e) => setTituloConfig(prev => ({ ...prev, cor: e.target.value }))}
                  className="w-8 h-8 rounded border border-input cursor-pointer"
                />
                <Input
                  value={tituloConfig.cor}
                  onChange={(e) => setTituloConfig(prev => ({ ...prev, cor: e.target.value }))}
                  className="flex-1 h-8 text-xs font-mono"
                  placeholder="#374151"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Tamanho da Fonte (px)</Label>
              <Input
                type="number"
                min={12}
                max={72}
                value={tituloConfig.tamanho}
                onChange={(e) => setTituloConfig(prev => ({ ...prev, tamanho: e.target.value }))}
                className="h-8"
              />
            </div>
          </div>
        )}

        {!isTitulo && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs">Placeholder</Label>
              <Input
                value={form.placeholder}
                onChange={(e) => setForm((f) => ({ ...f, placeholder: e.target.value }))}
                placeholder="Texto de exemplo"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Texto de Ajuda</Label>
              <Textarea
                value={form.texto_ajuda}
                onChange={(e) => setForm((f) => ({ ...f, texto_ajuda: e.target.value }))}
                placeholder="Instrução para o usuário"
                rows={2}
              />
            </div>
          </>
        )}

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="obrigatorio"
            checked={form.obrigatorio}
            onChange={(e) => setForm((f) => ({ ...f, obrigatorio: e.target.checked }))}
            className="rounded border-input"
          />
          <Label htmlFor="obrigatorio" className="text-xs cursor-pointer">Obrigatório</Label>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Largura</Label>
          <Select value={form.largura} onValueChange={(v) => setForm((f) => ({ ...f, largura: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LARGURAS.map((l) => (
                <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Mapear para Contato</Label>
          <Select
            value={form.mapeamento_campo || 'nenhum'}
            onValueChange={(v) => {
              if (v === '__criar_pessoa__') {
                setCriarCampoEntidade('pessoa')
                setShowCriarCampo(true)
                return
              }
              if (v === '__criar_empresa__') {
                setCriarCampoEntidade('empresa')
                setShowCriarCampo(true)
                return
              }
              setForm((f) => ({ ...f, mapeamento_campo: v === 'nenhum' ? '' : v }))
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Nenhum" />
            </SelectTrigger>
            <SelectContent>
              {(() => {
                const grupos = [...new Set(MAPEAMENTOS.map((m) => m.grupo))]
                return grupos.map((grupo) => {
                  const items = MAPEAMENTOS.filter((m) => m.grupo === grupo)
                  const canCreate = grupo === 'Pessoa' || grupo === 'Empresa'
                  return (
                    <div key={grupo || 'none'}>
                      {grupo && (
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {grupo}
                        </div>
                      )}
                      {items.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                      {canCreate && (
                        <SelectItem
                          value={grupo === 'Pessoa' ? '__criar_pessoa__' : '__criar_empresa__'}
                          className="text-primary"
                        >
                          <span className="flex items-center gap-1">
                            <Plus className="w-3 h-3" />
                            Criar campo de {grupo}
                          </span>
                        </SelectItem>
                      )}
                    </div>
                  )
                })
              })()}
            </SelectContent>
          </Select>

          {/* Mini-form para criar campo inline */}
          {showCriarCampo && (
            <div className="mt-2 p-3 border border-primary/30 rounded-lg bg-primary/5 space-y-2">
              <p className="text-xs font-semibold text-foreground">
                Novo campo de {criarCampoEntidade === 'pessoa' ? 'Pessoa' : 'Empresa'}
              </p>
              <Input
                value={novoCampoNome}
                onChange={(e) => setNovoCampoNome(e.target.value)}
                placeholder="Nome do campo"
                className="h-8 text-xs"
                autoFocus
              />
              <Select value={novoCampoTipo} onValueChange={setNovoCampoTipo}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tipoCampoOptions.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="h-7 text-xs flex-1"
                  disabled={!novoCampoNome.trim() || criarCampoMutation.isPending}
                  onClick={async () => {
                    const slug = novoCampoNome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
                    try {
                      await criarCampoMutation.mutateAsync({
                        nome: novoCampoNome.trim(),
                        entidade: criarCampoEntidade,
                        tipo: novoCampoTipo as CriarCampoPayload['tipo'],
                      })
                      await queryClient.invalidateQueries({
                        queryKey: ['configuracoes', 'campos', criarCampoEntidade],
                      })
                      const mapeamento = `custom.${criarCampoEntidade}.${slug}`
                      setForm((f) => ({ ...f, mapeamento_campo: mapeamento }))
                      setShowCriarCampo(false)
                      setNovoCampoNome('')
                      setNovoCampoTipo('texto')
                    } catch {
                      // Error handled by hook toast
                    }
                  }}
                >
                  {criarCampoMutation.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    'Criar'
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => {
                    setShowCriarCampo(false)
                    setNovoCampoNome('')
                    setNovoCampoTipo('texto')
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>

        {needsOptions && (
          <div className="space-y-1.5">
            <Label className="text-xs">Opções (uma por linha)</Label>
            <Textarea
              value={opcoesText}
              onChange={(e) => setOpcoesText(e.target.value)}
              rows={4}
              placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
            />
          </div>
        )}

        {campo.tipo === 'checkbox_termos' && (
          <div className="space-y-1.5">
            <Label className="text-xs">Texto dos Termos de Uso</Label>
            <Textarea
              value={form.valor_padrao}
              onChange={(e) => setForm((f) => ({ ...f, valor_padrao: e.target.value }))}
              rows={6}
              placeholder="Insira aqui o texto completo dos termos de uso que será exibido no link 'Ver termos'..."
            />
            <p className="text-[10px] text-muted-foreground">Este texto será exibido em um modal quando o usuário clicar em "Ver termos".</p>
          </div>
        )}

        {campo.tipo === 'imagem_link' && (
          <div className="space-y-3 border-t border-border pt-3">
            <div className="space-y-1.5">
              <Label className="text-xs">URL da Imagem</Label>
              <Input
                value={form.valor_padrao}
                onChange={(e) => setForm((f) => ({ ...f, valor_padrao: e.target.value }))}
                placeholder="https://exemplo.com/imagem.jpg"
              />
              <p className="text-[10px] text-muted-foreground">Cole a URL da imagem que deseja exibir.</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">URL de Redirecionamento (ao clicar)</Label>
              <Input
                value={form.placeholder}
                onChange={(e) => setForm((f) => ({ ...f, placeholder: e.target.value }))}
                placeholder="https://exemplo.com/pagina-destino"
              />
              <p className="text-[10px] text-muted-foreground">Quando o usuário clicar na imagem, será redirecionado para esta URL.</p>
            </div>
            {form.valor_padrao && (
              <div className="space-y-1">
                <Label className="text-xs">Prévia</Label>
                <img
                  src={form.valor_padrao}
                  alt="Prévia"
                  className="w-full max-h-32 object-cover rounded border border-border"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
