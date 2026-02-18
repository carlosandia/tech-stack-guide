/**
 * AIDEV-NOTE: Barra de sugestões de correção ortográfica inline
 * Exibe chips clicáveis acima do textarea, similar ao teclado do celular
 * Segue design system: bg-muted, rounded-md, text-sm, border-border
 */

interface SugestaoCorrecaoProps {
  palavraOriginal: string
  sugestoes: string[]
  onSelect: (correcao: string) => void
}

export function SugestaoCorrecao({ palavraOriginal, sugestoes, onSelect }: SugestaoCorrecaoProps) {
  return (
    <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border/50 bg-muted/40 animate-in fade-in slide-in-from-bottom-1 duration-150">
      {/* Palavra original entre aspas */}
      <button
        type="button"
        onClick={() => onSelect(palavraOriginal)}
        className="px-2.5 py-1 text-xs rounded-md bg-background border border-border text-muted-foreground hover:bg-accent transition-colors truncate max-w-[120px]"
        title={`Manter "${palavraOriginal}"`}
      >
        "{palavraOriginal}"
      </button>

      {/* Divider */}
      <div className="w-px h-5 bg-border/60 flex-shrink-0" />

      {/* Sugestões de correção */}
      {sugestoes.slice(0, 2).map((sugestao) => (
        <button
          key={sugestao}
          type="button"
          onClick={() => onSelect(sugestao)}
          className="px-2.5 py-1 text-xs rounded-md bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors truncate max-w-[120px]"
          title={`Substituir por "${sugestao}"`}
        >
          {sugestao}
        </button>
      ))}
    </div>
  )
}
