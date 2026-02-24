

## Plano: Atualizar Dicionario de Correcoes com base no Documento de Vicios de Linguagem

### Analise de Impacto na Fluidez

Antes de adicionar qualquer palavra, classifiquei cada item do documento em 3 categorias:

---

### CATEGORIA 1: Seguro para adicionar (correcao clara, sem ambiguidade)

Palavras novas que nao existem no dicionario atual e tem correcao inequivoca:

**Novas abreviacoes de chat:**
| Chave | Sugestao | Motivo |
|-------|----------|--------|
| `oq` | o que | Abreviacao muito comum |
| `oqe` | o que | Variacao |
| `kd` | cadê | Abreviacao comum |
| `cad` | cadê | Variacao |
| `qnd` | quando | Variacao de `qdo` (ja existe) |
| `qnto` | quanto | Variacao de `qto` (ja existe) |
| `mtu` | muito | Variacao de `mto` (ja existe) |
| `tmb` | também | Variacao de `tbm` (ja existe) |
| `nd` | nada | Abreviacao comum |
| `nda` | nada | Variacao |
| `qlqr` | qualquer | Abreviacao |
| `qq` | qualquer | Abreviacao |
| `dnv` | de novo | Abreviacao comum |
| `smp` | sempre | Abreviacao |
| `sdds` | saudades | Abreviacao muito comum |
| `sdd` | saudades | Variacao |
| `sla` | sei lá | Abreviacao |
| `vdd` | verdade | Abreviacao |
| `pse` | pois é | Abreviacao |
| `pdc` | pode crer | Abreviacao |
| `btf` | boto fé | Abreviacao |
| `mds` | meu Deus | Abreviacao |
| `ft` | foto | Abreviacao |
| `ctt` | contato | Abreviacao |
| `amh` | amanhã | Abreviacao |
| `obg` | obrigado | Ja existe -- manter |

**Novos erros ortograficos:**
| Chave | Sugestao | Motivo |
|-------|----------|--------|
| `eh` | é | Erro de acentuacao muito comum em chat |
| `nivel` | nível | Falta acento |
| `benvindo` | bem-vindo | Erro ortografico comum |

---

### CATEGORIA 2: NAO adicionar (prejudica a fluidez)

Palavras que, se adicionadas, vao **irritar o usuario** ou causar falsos positivos:

| Palavra | Motivo para NAO adicionar |
|---------|--------------------------|
| `ta` / `tá` | Muito curta (2 letras), altissima frequencia em chat. Corrigir "ta" para "está" quebraria a fluidez natural da conversa |
| `to` / `tô` | Mesmo problema -- 2 letras, uso universal em chat |
| `tava` | Coloquial aceito em chat, corrigir para "estava" seria pedante no contexto de atendimento |
| `pra` / `pro` | Contracoes aceitas universalmente, inclusive em comunicacao semi-formal |
| `num` | Ambiguo: pode ser "não" (regional) ou "em um" -- impossivel decidir sem contexto |
| `cê` | Variacao regional, corrigir seria invasivo |
| `kkk` / `kkkk` / `rs` / `rsrs` / `haha` | Sao reacoes de riso, nao erros. Sugerir correcao seria absurdo |
| `aff` / `ué` | Interjeicoes validas |
| `zap` | Giria para WhatsApp, aceita no contexto |
| `dm` | Sigla tecnica aceita |
| `fb` / `ig` / `yt` | Siglas de redes sociais, aceitas |
| `fds` | Ambiguo (pode ser palavrao ou "fim de semana") |
| `slk` / `slc` / `tsv` / `dmr` / `vdb` | Girias muito informais -- o sistema nao deve tentar "traduzir" girias, apenas corrigir ortografia |
| Estrangeirismos (`deletar`, `logar`, `printar`, `feedback`, `call`, etc.) | Sao termos consagrados no uso diario, especialmente em contexto CRM/tech |

**Palavras gramaticais complexas (requerem contexto de frase):**
| Palavra | Motivo |
|---------|--------|
| `mal` / `mau` | Depende se e adverbio ou adjetivo -- lookup de palavra unica nao resolve |
| `onde` / `aonde` | Depende de movimento vs localizacao |
| `há` / `a` (tempo) | Depende de passado vs futuro |
| `porque` / `por que` | 4 formas, depende da posicao na frase |
| Pleonasmos (`entrar para dentro`, etc.) | Multi-palavra, o sistema atual faz lookup de palavra unica |
| Regencias (`assistir ao`, etc.) | Multi-palavra |

---

### CATEGORIA 3: Remover do dicionario atual (problematico)

| Chave | Problema | Acao |
|-------|----------|------|
| `q` → `que` | Letra unica, dispara em qualquer "q" digitado. Extremamente invasivo | **Remover** |
| `havia` → `havia` | Mapeia para si mesmo, entrada inutil | **Remover** |

---

### Resumo das alteracoes no arquivo

**Arquivo**: `src/modules/conversas/utils/dicionario-correcoes.ts`

1. **Adicionar ~28 novas entradas** (abreviacoes e erros ortograficos seguros)
2. **Remover 2 entradas problematicas** (`q` e `havia`)
3. **Reorganizar comentarios** para incluir as novas categorias

Nenhum outro arquivo precisa ser alterado -- o hook `useAutoCorrect` e a UI `SugestaoCorrecao` ja funcionam com qualquer entrada do dicionario.

