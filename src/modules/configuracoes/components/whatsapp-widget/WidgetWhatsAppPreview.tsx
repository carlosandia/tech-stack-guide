/**
 * AIDEV-NOTE: Preview visual do Widget WhatsApp
 * Atualiza em tempo real conforme configurações mudam
 */

import type { WidgetWhatsAppConfig } from './types'

interface Props {
  config: WidgetWhatsAppConfig
  camposNomes: Record<string, string>
}

export function WidgetWhatsAppPreview({ config, camposNomes }: Props) {
  const camposSelecionados = config.campos_formulario
    .map(id => camposNomes[id])
    .filter(Boolean)

  return (
    <div className="relative bg-muted/50 rounded-lg border border-border p-4 sm:p-6 min-h-[520px] sm:min-h-[540px] flex items-end overflow-hidden" style={{ justifyContent: config.posicao === 'esquerda' ? 'flex-start' : 'flex-end' }}>
      {/* Label */}
      <div className="absolute top-3 left-3 text-xs text-muted-foreground font-medium">
        Preview do Widget
      </div>

      <div className="flex flex-col items-end gap-3" style={{ alignItems: config.posicao === 'esquerda' ? 'flex-start' : 'flex-end' }}>
        {/* Chat Window */}
        {config.usar_formulario && (
          <div className="w-[260px] sm:w-[300px] bg-white rounded-2xl shadow-xl overflow-hidden border border-border">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3" style={{ background: '#075E54' }}>
              {config.foto_atendente_url ? (
                <img
                  src={config.foto_atendente_url}
                  alt={config.nome_atendente}
                  className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0" style={{ background: '#128C7E' }}>
                  {(config.nome_atendente || 'A')[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{config.nome_atendente || 'Atendente'}</p>
                <p className="text-white/60 text-xs">Online</p>
              </div>
            </div>

            {/* Messages area */}
            <div className="p-3" style={{ background: '#ECE5DD' }}>
              <div className="bg-white rounded-tr-xl rounded-b-xl px-3 py-2 max-w-[85%] shadow-sm">
                <p className="text-sm text-gray-800">{config.mensagem_boas_vindas || 'Olá! 👋'}</p>
                <p className="text-[10px] text-gray-400 text-right mt-1">
                  {new Date().getHours().toString().padStart(2, '0')}:{new Date().getMinutes().toString().padStart(2, '0')}
                </p>
              </div>
            </div>

            {/* Form */}
            {camposSelecionados.length > 0 && (
              <div className="p-3 border-t border-gray-100 space-y-2">
                {camposSelecionados.map((nome, i) => (
                  <div key={i}>
                    <label className="text-[11px] text-gray-500 block mb-0.5">{nome}</label>
                    <div className="h-8 rounded-lg border border-gray-200 bg-gray-50" />
                  </div>
                ))}
                <button
                  className="w-full py-2.5 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2 mt-1"
                  style={{ background: config.cor_botao }}
                >
                  <WhatsAppIcon size={16} />
                  Iniciar Conversa
                </button>
              </div>
            )}
          </div>
        )}

        {/* Floating Button */}
        <button
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
          style={{ background: config.cor_botao }}
        >
          <WhatsAppIcon size={28} />
        </button>
      </div>
    </div>
  )
}

function WhatsAppIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.612l4.458-1.495A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.35 0-4.514-.807-6.23-2.157l-.156-.124-3.244 1.088 1.088-3.244-.136-.17A9.96 9.96 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z" />
    </svg>
  )
}
