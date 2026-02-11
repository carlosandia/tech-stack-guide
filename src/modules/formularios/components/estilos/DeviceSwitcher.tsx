/**
 * AIDEV-NOTE: Seletor de dispositivo (Desktop/Tablet/Mobile) estilo Elementor
 * Usado nos painéis de estilo para configurar valores responsivos
 */

import { Monitor, Tablet, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'

export type DeviceType = 'desktop' | 'tablet' | 'mobile'

interface Props {
  value: DeviceType
  onChange: (device: DeviceType) => void
  className?: string
}

const DEVICES: { key: DeviceType; icon: typeof Monitor; label: string }[] = [
  { key: 'desktop', icon: Monitor, label: 'Desktop' },
  { key: 'tablet', icon: Tablet, label: 'Tablet' },
  { key: 'mobile', icon: Smartphone, label: 'Mobile' },
]

export function DeviceSwitcher({ value, onChange, className }: Props) {
  return (
    <div className={cn('inline-flex items-center gap-0.5 rounded-md border border-border bg-muted/40 p-0.5', className)}>
      {DEVICES.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          title={label}
          className={cn(
            'p-1 rounded transition-colors',
            value === key
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          <Icon className="w-3 h-3" />
        </button>
      ))}
    </div>
  )
}
