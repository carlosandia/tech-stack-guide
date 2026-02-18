

## Adicionar palavras faltantes ao dicionário de correções

Problema: O dicionário atual não contém diversas palavras com **til** (ã, õ) e outros acentos frequentes no dia a dia. Exemplo: `amanha` deveria sugerir `amanhã`.

---

### Palavras a adicionar

**Com til (ã/õ) — faltantes:**

| Chave | Correção |
|-------|----------|
| amanha | amanhã |
| manha | manhã |
| irma | irmã |
| irmao | irmão |
| irmaos | irmãos |
| mae | mãe |
| pao | pão |
| paes | pães |
| chao | chão |
| mao | mão |
| maos | mãos |
| cidadao | cidadão |
| cidadaos | cidadãos |
| capitao | capitão |
| alemao | alemão |
| coracao | coração |
| coracoes | corações |
| razao | razão |
| razoes | razões |
| estacao | estação |
| estacoes | estações |
| relacao | relação |
| relacoes | relações |
| licao | lição |
| licoes | lições |
| eleicao | eleição |
| eleicoes | eleições |
| regiao | região |
| regioes | regiões |
| natacao | natação |
| alimentacao | alimentação |
| atribuicao | atribuição |
| motivacao | motivação |
| negociacao | negociação |
| negociacoes | negociações |
| autorizacao | autorização |
| intencao | intenção |
| intencoes | intenções |
| mencao | menção |
| dimensao | dimensão |
| pensao | pensão |
| pressao | pressão |
| expressao | expressão |
| impressao | impressão |
| permissao | permissão |
| discussao | discussão |
| profissao | profissão |
| missao | missão |
| visao | visão |
| decisao | decisão |
| televisao | televisão |
| divisao | divisão |
| precisao | precisão |
| ocasiao | ocasião |
| opiniao | opinião |
| uniao | união |

**Acentos agudos/circunflexos faltantes:**

| Chave | Correção |
|-------|----------|
| cafe | café |
| pe | pé |
| fe | fé |
| saude | saúde |
| conteudo | conteúdo |
| conteudos | conteúdos |
| assunto | assunto |
| incluido | incluído |
| construido | construído |
| destruido | destruído |
| gratuito | gratuito |
| juizo | juízo |
| raiz | raiz |
| pais | país |
| reais | reais |
| tambem já existe |
| ontem | ontem |
| aqui | aqui |
| agua | água |
| aguia | águia |
| obstaculo | obstáculo |
| veiculo | veículo |
| veiculos | veículos |
| musica | música |
| musicas | músicas |
| medico | médico |
| medica | médica |
| juridico | jurídico |
| juridica | jurídica |
| valido | válido |
| valida | válida |
| solido | sólido |
| liquido | líquido |
| individuo | indivíduo |
| habito | hábito |
| credivel | crível |
| impossivel já existe |
| responsavel já existe |
| agradavel | agradável |
| saudavel | saudável |
| amavel | amável |
| notavel | notável |
| terrivel | terrível |
| incrivel | incrível |
| flexivel | flexível |
| acessivel | acessível |
| compativel | compatível |
| sustentavel | sustentável |
| rentavel | rentável |

*Nota: palavras que já existem no dicionário não serão duplicadas.*

---

### Arquivo impactado

| Arquivo | Ação |
|---------|------|
| `src/modules/conversas/utils/dicionario-correcoes.ts` | Adicionar ~80 novas entradas |

### Garantias

- Apenas adição de novas chaves ao dicionário existente
- Nenhuma lógica alterada (hook, componente, ChatInput)
- Performance mantida: O(1) lookup
- Organizado por categoria para fácil manutenção

