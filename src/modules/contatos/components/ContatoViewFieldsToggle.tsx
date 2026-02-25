/**
 * AIDEV-NOTE: Toggle de visibilidade de campos no modal de visualização de contato
 * Labels e obrigatoriedade vêm da configuração global (/configuracoes/campos)
 * Persiste no localStorage separadamente do toggle de formulário
 */

import { useState, useRef, useEffect, useMemo } from 'react'
import { Eye } from 'lucide-react'
import { useCamposConfig } from '../hooks/useCamposConfig'
import type { TipoContato } from '../services/contatos.api'

export interface ViewFieldVisibility {
  [fieldKey: string]: boolean
}

const STORAGE_KEY = 'contatos_view_fields_visibility'

// Keys dos campos do sistema por tipo (ordem de exibição)
const CAMPO_KEYS_PESSOA = ['nome', 'sobrenome', 'email', 'telefone', 'cargo']
const CAMPO_KEYS_EMPRESA = ['razao_social', 'nome_fantasia', 'cnpj', 'email', 'telefone', 'website', 'segmento', 'porte']

// Campos meta (não configuráveis globalmente, fixos do sistema)
const META_FIELDS_PESSOA = [
  { key: 'empresa', label: 'Empresa', obrigatorio: false },
  { key: 'responsavel', label: 'Responsável', obrigatorio: false },
  { key: 'status', label: 'Status', obrigatorio: true },
  { key: 'origem', label: 'Origem', obrigatorio: false },
  { key: 'observacoes', label: 'Observações', obrigatorio: false },
  { key: 'segmentos', label: 'Segmentação', obrigatorio: false },
]

const META_FIELDS_EMPRESA = [
  { key: 'status', label: 'Status', obrigatorio: true },
  { key: 'origem', label: 'Origem', obrigatorio: false },
  { key: 'observacoes', label: 'Observações', obrigatorio: false },
  { key: 'segmentos', label: 'Segmentação', obrigatorio: false },
  { key: 'pessoas', label: 'Pessoas Vinculadas', obrigatorio: false },
]

function getSavedVisibility(): Record<string, ViewFieldVisibility> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

function saveVisibility(data: Record<string, ViewFieldVisibility>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getViewFieldVisibility(tipo: TipoContato): ViewFieldVisibility {
  return getSavedVisibility()[tipo] || {}
}

export function isViewFieldVisible(tipo: TipoContato, fieldKey: string, obrigatorio: boolean): boolean {
  if (obrigatorio) return true
  const vis = getViewFieldVisibility(tipo)
  return vis[fieldKey] !== false
}

interface ContatoViewFieldsToggleProps {
  tipo: TipoContato
  onChange?: () => void
}

export function ContatoViewFieldsToggle({ tipo, onChange }: ContatoViewFieldsToggleProps) {
  const [open, setOpen] = useState(false)
  const [visibility, setVisibility] = useState<Record<string, ViewFieldVisibility>>(getSavedVisibility)
  const ref = useRef<HTMLDivElement>(null)

  // Buscar configuração global de campos
  const { getLabel, isRequired: isCampoRequired, campos } = useCamposConfig(tipo)
  const camposCustomizados = campos.filter(c => !c.sistema && c.ativo)

  // Construir lista de campos do sistema com labels e obrigatoriedade da config global
  const camposSistema = useMemo(() => {
    const keys = tipo === 'pessoa' ? CAMPO_KEYS_PESSOA : CAMPO_KEYS_EMPRESA
    const campoItems = keys.map(key => ({
      key,
      label: getLabel(key),
      obrigatorio: isCampoRequired(key),
    }))
    const metaItems = tipo === 'pessoa' ? META_FIELDS_PESSOA : META_FIELDS_EMPRESA
    return [...campoItems, ...metaItems]
  }, [tipo, getLabel, isCampoRequired])

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
    onChange?.()
  }

  const isVisible = (key: string, obrigatorio: boolean) => {
    if (obrigatorio) return true
    return currentVisibility[key] !== false
  }

  const visibleCount = [
    ...camposSistema.filter(c => isVisible(c.key, c.obrigatorio)),
    ...camposCustomizados.filter(c => isVisible(`custom_${c.slug}`, c.obrigatorio ?? false)),
  ].length
  const totalCount = camposSistema.length + camposCustomizados.length

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-md border transition-all duration-200 ${
          open
            ? 'border-primary/40 bg-primary/5 text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent'
        }`}
        title="Campos visíveis na visualização"
      >
        <Eye className="w-3.5 h-3.5" />
        <span className="text-[10px] text-muted-foreground">{visibleCount}/{totalCount}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 bg-background rounded-lg shadow-lg border border-border py-2 z-[600] max-h-[60vh] overflow-y-auto">
          <div className="px-3 pb-2 border-b border-border">
            <p className="text-sm font-medium text-foreground">
              Campos Visíveis — {tipo === 'pessoa' ? 'Pessoa' : 'Empresa'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Escolha quais campos exibir ao visualizar
            </p>
          </div>

          {/* Campos do Sistema */}
          <div className="px-3 pt-2 pb-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Campos do Sistema</p>
            {camposSistema.map(c => {
              const active = isVisible(c.key, c.obrigatorio)
              return (
                <div
                  key={c.key}
                  className={`flex items-center justify-between py-2 text-sm ${
                    c.obrigatorio ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  onClick={() => { if (!c.obrigatorio) toggleField(c.key) }}
                >
                  <span className="flex items-center gap-2">
                    <span className={c.obrigatorio ? 'text-muted-foreground' : 'text-foreground'}>{c.label}</span>
                    {c.obrigatorio && <span className="text-[10px] text-destructive font-medium">*</span>}
                  </span>
                  <div
                    className={`relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${
                      active ? 'bg-primary' : 'bg-muted-foreground/25'
                    } ${c.obrigatorio ? 'opacity-60' : ''}`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                        active ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Campos Personalizados */}
          {camposCustomizados.length > 0 && (
            <div className="px-3 pt-2 pb-1 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Campos Personalizados</p>
              {camposCustomizados.map(c => {
                const key = `custom_${c.slug}`
                const active = isVisible(key, c.obrigatorio ?? false)
                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between py-2 text-sm ${
                      c.obrigatorio ? 'cursor-not-allowed' : 'cursor-pointer'
                    }`}
                    onClick={() => { if (!c.obrigatorio) toggleField(key) }}
                  >
                    <span className="flex items-center gap-2">
                      <span className={c.obrigatorio ? 'text-muted-foreground' : 'text-foreground'}>{c.nome}</span>
                      {c.obrigatorio && <span className="text-[10px] text-destructive font-medium">*</span>}
                    </span>
                    <div
                      className={`relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${
                        active ? 'bg-primary' : 'bg-muted-foreground/25'
                      } ${c.obrigatorio ? 'opacity-60' : ''}`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                          active ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
