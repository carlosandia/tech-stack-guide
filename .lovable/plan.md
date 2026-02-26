

# Plano: Modal de Exportacao PDF com Periodo + Paginacao Inteligente

## Problema Atual

1. **Sem escolha de periodo**: O botao "Exportar" captura o dashboard como esta, sem permitir escolher datas especificas para o relatorio
2. **Blocos cortados**: A paginacao atual fatia o canvas em alturas fixas, cortando blocos no meio entre paginas
3. **Sem limite de seguranca**: Nenhum rate limit para exportacoes

---

## 1. Modal de Exportacao com Selecao de Periodo

### Comportamento

Ao clicar em "Exportar", abre um **Dialog** (nao gera o PDF direto) com:

- **Titulo**: "Exportar Relatorio"
- **Opcoes de periodo** (Select igual ao filtro do dashboard):
  - Ultimos 7 dias
  - Ultimos 30 dias
  - Ultimos 90 dias
  - Personalizado (abre date picker com `from` e `to`)
- **Checkbox**: "Usar periodo atual do dashboard" (pre-marcado, desabilita os selects acima)
- **Botao**: "Gerar PDF" / "Gerando..."
- **Rate limit visual**: Texto discreto "X exportacoes restantes hoje" no rodape do modal

### Rate Limit (client-side)

- Maximo **10 exportacoes por hora** por sessao
- Controle via `localStorage` com timestamp de cada exportacao
- Ao atingir o limite, botao desabilitado com mensagem "Limite atingido. Tente novamente em X min"

---

## 2. Paginacao Inteligente (sem cortar blocos)

### Abordagem

Em vez de capturar o container inteiro como um unico canvas e fatiar, a nova logica:

1. Identifica cada bloco filho (section) do container via `querySelectorAll`
2. Para cada bloco, calcula sua posicao Y e altura em pixels
3. Converte para mm proporcionalmente
4. Agrupa blocos por pagina: se adicionar o proximo bloco ultrapassa a altura disponivel, inicia nova pagina
5. Renderiza cada bloco individualmente no canvas (um `html2canvas` por bloco) e posiciona no PDF

### Algoritmo simplificado

```text
paginas = [[]]
alturaUsada = headerOffset (primeira pagina)

para cada bloco visivel:
  alturaBlocoMM = converter(bloco.offsetHeight)
  se alturaUsada + alturaBlocoMM > alturaDisponivelMM:
    paginas.push([])  // nova pagina
    alturaUsada = 0
  paginas[ultimo].push(bloco)
  alturaUsada += alturaBlocoMM + gap
```

### Beneficios

- Nenhum bloco e cortado entre paginas
- Cada bloco renderizado com qualidade independente
- Header do PDF apenas na primeira pagina
- Rodape com numero da pagina em todas

---

## 3. Melhorias no PDF Gerado

- **Header**: "Relatorio de Desempenho" + periodo selecionado + data de geracao
- **Rodape**: "Pagina X de Y" centralizado em cada pagina
- **Fundo branco** garantido em cada bloco para evitar transparencia
- **Nome do arquivo**: `relatorio-desempenho-{periodo}-{data}.pdf`

---

## Arquivos a Editar

| Arquivo | Acao |
|---------|------|
| `src/modules/app/components/dashboard/ExportarRelatorioPDF.tsx` | Reescrever: adicionar Dialog com selecao de periodo, rate limit, paginacao inteligente por blocos |

Nenhum arquivo novo necessario. Toda a logica fica no componente existente.

---

## Secao Tecnica

### Estrutura do Dialog

Usa `@radix-ui/react-dialog` (ja instalado) com:
- Select de periodo (reutiliza os mesmos valores do `DashboardFilters`)
- Calendar range picker para personalizado
- Estado local para periodo/datas do export (independente do dashboard)

### Rate Limit - localStorage

```text
Chave: "pdf_export_timestamps"
Valor: JSON array de timestamps (number[])
Logica: filtra timestamps > 1h atras, conta restantes
```

### Paginacao por blocos

O `contentRef` aponta para o container `space-y-6`. Os filhos diretos sao os blocos (DashboardSectionDraggable + header). A logica itera sobre `contentRef.current.children`, pula o header (index 0), e agrupa os demais respeitando a altura maxima da pagina A4 landscape (190mm de conteudo util).

Cada bloco e capturado individualmente com `html2canvas(bloco, { scale: 2 })` e posicionado verticalmente na pagina do PDF.

