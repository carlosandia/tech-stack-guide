/**
 * AIDEV-NOTE: Dropdown customizado com checkboxes para selecao_multipla
 * Usado no editor (CampoItem), preview final (renderFinalCampo),
 * pagina publica (FormularioPublicoPage) — unificado visualmente.
 * O widget embed replica este visual via vanilla JS.
 */

import { useState, useRef, useEffect } from 'react'
import type { CSSProperties } from 'react'

interface MultiSelectDropdownProps {
  opcoes: string[]
  selectedValues: string[]
  onChange?: (values: string[]) => void
  placeholder?: string
  inputStyle?: CSSProperties
  fontFamily?: string
  borderColor?: string
  disabled?: boolean
}

export function MultiSelectDropdown({
  opcoes,
  selectedValues,
  onChange,
  placeholder = 'Selecione uma ou mais...',
  inputStyle = {},
  fontFamily,
  borderColor = '#D1D5DB',
  disabled = false,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const toggleValue = (v: string) => {
    if (!onChange) return
    const newVals = selectedValues.includes(v)
      ? selectedValues.filter(s => s !== v)
      : [...selectedValues, v]
    onChange(newVals)
  }

  const displayText = selectedValues.length > 0
    ? selectedValues.join(', ')
    : placeholder

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(prev => !prev)}
        style={{
          ...inputStyle,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled ? 'default' : 'pointer',
          textAlign: 'left',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          appearance: 'none',
          fontFamily,
        }}
      >
        <span style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
          color: selectedValues.length > 0 ? (inputStyle.color || '#1F2937') : '#9CA3AF',
        }}>
          {displayText}
        </span>
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{ flexShrink: 0, marginLeft: '8px', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
        >
          <path d="M3 4.5L6 7.5L9 4.5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown popover */}
      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 9999,
          marginTop: '4px',
          backgroundColor: '#FFFFFF',
          border: `1px solid ${borderColor}`,
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          maxHeight: '200px',
          overflowY: 'auto',
          padding: '4px 0',
        }}>
          {opcoes.map((op, i) => {
            const label = typeof op === 'string' ? op : `Opção ${i + 1}`
            const isChecked = selectedValues.includes(label)
            return (
              <label
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily,
                  color: '#374151',
                  backgroundColor: isChecked ? '#EFF6FF' : '#FFFFFF',
                  transition: 'background-color 0.1s',
                }}
                onMouseEnter={e => {
                  if (!isChecked) (e.currentTarget as HTMLElement).style.backgroundColor = '#F9FAFB'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = isChecked ? '#EFF6FF' : '#FFFFFF'
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleValue(label)}
                  style={{ width: '16px', height: '16px', accentColor: '#3B82F6', flexShrink: 0 }}
                />
                {label}
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}
