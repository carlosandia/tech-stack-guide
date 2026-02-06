import { useConfigToolbar } from '../../contexts/ConfigToolbarContext'

/**
 * AIDEV-NOTE: Toolbar contextual do módulo Configurações
 * Apenas título + subtítulo + ações (sem sub-navegação)
 * Sticky dentro da content area (com lg:ml-60)
 */

interface ConfigToolbarProps {
  pageTitle: string
}

export function ConfigToolbar({ pageTitle }: ConfigToolbarProps) {
  const { actions, subtitle } = useConfigToolbar()

  return (
    <div className="sticky top-14 z-30 bg-gray-50/50 backdrop-blur-sm border-b border-gray-200/60">
      <div className="flex items-center justify-between h-12 px-4 lg:px-6 max-w-[1920px] mx-auto">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-base font-semibold text-foreground whitespace-nowrap">
            {pageTitle}
          </h1>
          {subtitle && (
            <>
              <span className="text-muted-foreground hidden sm:inline">·</span>
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {subtitle}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      </div>
    </div>
  )
}
