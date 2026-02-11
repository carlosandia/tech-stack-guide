/**
 * AIDEV-NOTE: Wrapper responsivo para campos de estilo
 * Mostra DeviceSwitcher inline e indica overrides com bolinha azul
 */

import { Label } from '@/components/ui/label'
import { DeviceSwitcher, type DeviceType } from './DeviceSwitcher'
import { cn } from '@/lib/utils'

interface Props {
  label: string
  device: DeviceType
  onDeviceChange: (d: DeviceType) => void
  desktopValue: string
  tabletValue?: string
  mobileValue?: string
  children: React.ReactNode
  className?: string
}

export function ResponsiveField({
  label,
  device,
  onDeviceChange,
  tabletValue,
  mobileValue,
  children,
  className,
}: Props) {
  const hasTabletOverride = !!tabletValue
  const hasMobileOverride = !!mobileValue

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5">
          <Label className="text-[10px] text-muted-foreground">{label}</Label>
          {/* Override indicators */}
          {(hasTabletOverride || hasMobileOverride) && (
            <div className="flex items-center gap-0.5">
              {hasTabletOverride && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Override tablet definido" />
              )}
              {hasMobileOverride && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary" title="Override mobile definido" />
              )}
            </div>
          )}
        </div>
        <DeviceSwitcher value={device} onChange={onDeviceChange} />
      </div>
      {children}
    </div>
  )
}
