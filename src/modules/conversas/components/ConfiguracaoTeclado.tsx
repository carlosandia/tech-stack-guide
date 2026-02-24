/**
 * AIDEV-NOTE: Painel de configurações do teclado/autocorrect
 * Exibido quando a tab "Teclado" está ativa no ChatInput
 * Permite gerenciar idioma e palavras bloqueadas
 */

import { X, Globe, Ban, Sparkles } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { LANGUAGES } from '../hooks/useKeyboardLanguage'

interface ConfiguracaoTecladoProps {
  language: string
  onLanguageChange: (lang: string) => void
  blockedWords: string[]
  onUnblockWord: (word: string) => void
}

export function ConfiguracaoTeclado({
  language,
  onLanguageChange,
  blockedWords,
  onUnblockWord,
}: ConfiguracaoTecladoProps) {
  const isEnabled = language !== 'off'

  return (
    <div className="p-3 space-y-4 max-h-[200px] overflow-y-auto">
      {/* Seção: Toggle ativar/desativar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
            Corretor ortográfico
          </label>
          <Switch
            checked={isEnabled}
            onCheckedChange={(checked) => onLanguageChange(checked ? 'pt-br' : 'off')}
          />
        </div>
        <p className="text-[11px] text-muted-foreground leading-snug">
          Sugere correções enquanto você digita
        </p>
      </div>

      {/* Seções desabilitadas quando off */}
      <div className={!isEnabled ? 'opacity-50 pointer-events-none' : undefined}>
        {/* Seção: Idioma */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
            Idioma das sugestões
          </label>
          <Select value={isEnabled ? language : 'pt-br'} onValueChange={onLanguageChange}>
            <SelectTrigger className="h-8 text-xs w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.filter(l => l.value !== 'off').map(lang => (
                <SelectItem key={lang.value} value={lang.value} className="text-xs">
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Seção: Palavras ignoradas */}
        <div className="space-y-1.5 mt-4">
          <label className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <Ban className="w-3.5 h-3.5 text-muted-foreground" />
            Palavras ignoradas
          </label>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Palavras que você marcou para não receber sugestão. Clique no X para voltar a sugerir.
          </p>

          {blockedWords.length === 0 ? (
            <p className="text-[11px] text-muted-foreground/60 italic py-2">
              Nenhuma palavra ignorada. Pressione Esc na barra de sugestão para adicionar.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {blockedWords.map(word => (
                <span
                  key={word}
                  className="inline-flex items-center gap-1 bg-muted border border-border rounded-md px-2 py-0.5 text-xs text-foreground"
                >
                  {word}
                  <button
                    type="button"
                    onClick={() => onUnblockWord(word)}
                    className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    title={`Voltar a sugerir "${word}"`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
