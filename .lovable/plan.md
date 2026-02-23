

## Reorganizar hero da ParceiroPage para uma UI mais coesa

### Problemas identificados
1. **Badge "Parceiro Certificado" duplicado** -- aparece no header E no hero, gerando redundancia visual
2. **Espacamento excessivo entre elementos** -- titulo, subtitulo, badge e toggle estao muito separados, criando sensacao de "solto"
3. **Falta de agrupamento visual** -- cada elemento parece independente, sem conexao entre eles

### Solucao proposta

**1. Remover o badge "Parceiro Certificado" do hero**
Ja existe no header. Manter no hero e redundante e ocupa espaco sem valor. Remover as linhas 217-223.

**2. Reduzir espacamentos entre elementos do hero**
- Titulo `mb-4` -> `mb-3`
- Subtitulo `mb-6` -> `mb-5`  
- Remover o `mb-8` do badge (que sera removido)
- Toggle fica logo apos o subtitulo, com menos distancia

**3. Agrupar subtitulo + toggle em um bloco coeso**
Colocar o subtitulo e o toggle mais proximos, criando uma unidade visual. O subtitulo contextualiza e o toggle e a acao imediata -- devem estar juntos.

**4. Reduzir padding vertical da hero**
De `py-12 sm:py-20` para `py-10 sm:py-16`, aproximando o titulo dos cards de planos e eliminando o excesso de espaco vazio.

### Resultado esperado
- Titulo -> Subtitulo -> Toggle (sem badge no meio)
- Tudo mais compacto e visualmente agrupado
- Menos "ar" entre os elementos, sensacao de layout organizado
- Badge de parceiro fica apenas no header, sem repeticao

### Detalhes tecnicos

**Arquivo:** `src/modules/public/pages/ParceiroPage.tsx`

- Linha 199: Reduzir padding da section hero de `py-12 sm:py-20` para `py-10 sm:py-16`
- Linha 207: Titulo `mb-4` -> `mb-3`
- Linha 213: Subtitulo `mb-6` -> `mb-5`
- Linhas 217-223: Remover bloco inteiro do badge "Parceiro Certificado" do hero
- Toggle permanece como esta, sem o `mb-8` anterior separando
