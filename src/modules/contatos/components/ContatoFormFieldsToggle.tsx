/**
 * AIDEV-NOTE: Popover de visibilidade dos campos do formulário de contatos
 * Permite ao usuário escolher quais campos exibir no modal de criação/edição
 * Campos obrigatórios (sistema) não podem ser ocultados
 * Persiste no localStorage
 */

import { useState, useRef, useEffect } from 'react'
import { Eye } from 'lucide-react'
import { useCampos } from '@/modules/configuracoes/hooks/useCampos'
import type { TipoContato } from '../services/contatos.api'

export interface FormFieldVisibility {
  [fieldKey: string]: boolean
}

const STORAGE_KEY = 'contatos_form_fields_visibility'

// Campos do sistema que sempre existem no formulário
const CAMPOS_SISTEMA_PESSOA = [
  { key: 'nome', label: 'Nome', obrigatorio: true },
  { key: 'sobrenome', label: 'Sobrenome', obrigatorio: true },
  { key: 'email', label: 'Email', obrigatorio: false },
  { key: 'telefone', label: 'Telefone', obrigatorio: false },
  { key: 'cargo', label: 'Cargo', obrigatorio: false },
  { key: 'linkedin_url', label: 'LinkedIn', obrigatorio: false },
  { key: 'empresa_id', label: 'Empresa Vinculada', obrigatorio: false },
  { key: 'status', label: 'Status', obrigatorio: true },
  { key: 'origem', label: 'Origem', obrigatorio: true },
  { key: 'observacoes', label: 'Observações', obrigatorio: false },
]

const CAMPOS_SISTEMA_EMPRESA = [
  { key: 'razao_social', label: 'Razão Social', obrigatorio: true },
  { key: 'nome_fantasia', label: 'Nome Fantasia', obrigatorio: false },
  { key: 'cnpj', label: 'CNPJ', obrigatorio: false },
  { key: 'email', label: 'Email', obrigatorio: false },
  { key: 'telefone', label: 'Telefone', obrigatorio: false },
  { key: 'website', label: 'Website', obrigatorio: false },
  { key: 'segmento', label: 'Segmento de Mercado', obrigatorio: false },
  { key: 'porte', label: 'Porte', obrigatorio: false },
  { key: 'status', label: 'Status', obrigatorio: true },
  { key: 'origem', label: 'Origem', obrigatorio: true },
  { key: 'observacoes', label: 'Observações', obrigatorio: false },
]

function getSavedVisibility(): Record<string, FormFieldVisibility> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

function saveVisibility(data: Record<string, FormFieldVisibility>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getFieldVisibility(tipo: TipoContato): FormFieldVisibility {
  const all = getSavedVisibility()
  return all[tipo] || {}
}

export function isFieldVisible(tipo: TipoContato, fieldKey: string, obrigatorio: boolean): boolean {
  if (obrigatorio) return true
  const vis = getFieldVisibility(tipo)
  // Default to visible if not explicitly set
  return vis[fieldKey] !== false
}

interface ContatoFormFieldsToggleProps {
  tipo: TipoContato
}

export function ContatoFormFieldsToggle({ tipo }: ContatoFormFieldsToggleProps) {
  const [open, setOpen] = useState(false)
  const [visibility, setVisibility] = useState<Record<string, FormFieldVisibility>>(getSavedVisibility)
  const ref = useRef<HTMLDivElement>(null)

  // Buscar campos customizados
  const entidade = tipo === 'pessoa' ? 'pessoa' : 'empresa'
  const { data: camposData } = useCampos(entidade as 'pessoa' | 'empresa')
  const camposCustomizados = camposData?.campos?.filter(c => !c.sistema && c.ativo) || []

  const camposSistema = tipo === 'pessoa' ? CAMPOS_SISTEMA_PESSOA : CAMPOS_SISTEMA_EMPRESA

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const currentVisibility = visibility[tipo] || {}

  const toggleField = (key: string) => {
    const updated = {
      ...visibility,
      [tipo]: {
        ...currentVisibility,
        [key]: currentVisibility[key] === false ? true : false,
      },
    }
    setVisibility(updated)
    saveVisibility(updated)
  }

  const isVisible = (key: string, obrigatorio: boolean) => {
    if (obrigatorio) return true
    return currentVisibility[key] !== false
  }

  const visibleCount = [
    ...camposSistema.filter(c => isVisible(c.key, c.obrigatorio)),
    ...camposCustomizados.filter(c => isVisible(`custom_${c.slug}`, c.obrigatorio)),
  ].length
  const totalCount = camposSistema.length + camposCustomizados.length

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 px-2.5 py-1.5 text-sm rounded-md border transition-colors ${
          open
            ? 'border-primary/40 bg-primary/5 text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent'
        }`}
        title="Campos visíveis no formulário"
      >
        <Eye className="w-3.5 h-3.5" />
        <span className="hidden lg:inline">Campos</span>
        <span className="text-[10px] text-muted-foreground">{visibleCount}/{totalCount}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 bg-background rounded-lg shadow-lg border border-border py-2 z-[500] max-h-[70vh] overflow-y-auto">
          <div className="px-3 pb-2 border-b border-border">
            <p className="text-sm font-medium text-foreground">
              Campos do Formulário — {tipo === 'pessoa' ? 'Pessoa' : 'Empresa'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Escolha quais campos exibir ao criar/editar
            </p>
          </div>

          {/* Campos do Sistema */}
          <div className="px-3 pt-2 pb-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Campos do Sistema</p>
            {camposSistema.map(c => (
              <label
                key={c.key}
                className={`flex items-center justify-between py-1.5 text-sm ${
                  c.obrigatorio ? 'text-muted-foreground cursor-not-allowed' : 'text-foreground cursor-pointer hover:text-primary'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{c.label}</span>
                  {c.obrigatorio && <span className="text-[10px] text-destructive">*</span>}
                </span>
                <button
                  onClick={(e) => { e.preventDefault(); if (!c.obrigatorio) toggleField(c.key) }}
                  disabled={c.obrigatorio}
                  className={`relative w-8 h-4.5 rounded-full transition-colors ${
                    isVisible(c.key, c.obrigatorio)
                      ? 'bg-primary'
                      : 'bg-muted-foreground/30'
                  } ${c.obrigatorio ? 'opacity-50' : ''}`}
                >
                  <span
                    className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform ${
                      isVisible(c.key, c.obrigatorio) ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </label>
            ))}
          </div>

          {/* Campos Personalizados */}
          {camposCustomizados.length > 0 && (
            <div className="px-3 pt-2 pb-1 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Campos Personalizados</p>
              {camposCustomizados.map(c => {
                const key = `custom_${c.slug}`
                return (
                  <label
                    key={key}
                    className={`flex items-center justify-between py-1.5 text-sm ${
                      c.obrigatorio ? 'text-muted-foreground cursor-not-allowed' : 'text-foreground cursor-pointer hover:text-primary'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{c.nome}</span>
                      {c.obrigatorio && <span className="text-[10px] text-destructive">*</span>}
                    </span>
                    <button
                      onClick={(e) => { e.preventDefault(); if (!c.obrigatorio) toggleField(key) }}
                      disabled={c.obrigatorio}
                      className={`relative w-8 h-4.5 rounded-full transition-colors ${
                        isVisible(key, c.obrigatorio)
                          ? 'bg-primary'
                          : 'bg-muted-foreground/30'
                      } ${c.obrigatorio ? 'opacity-50' : ''}`}
                    >
                      <span
                        className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform ${
                          isVisible(key, c.obrigatorio) ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </label>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
