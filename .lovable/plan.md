

# Melhorar textos da seção "Automação de Etiquetas"

## O que muda

Tornar os textos do label e das opções do select mais claros e acessíveis para qualquer usuário, sem jargão técnico.

## Alterações

**Arquivo**: `src/modules/configuracoes/components/integracoes/WhatsAppConfigModal.tsx`

### 1. Label do select (linha 161)
- **De**: "Quando oportunidade já fechada"
- **Para**: "Se o contato já teve um negócio encerrado"

### 2. Opções do select (linhas 26-28)

| Valor | Label atual | Novo label | Descrição atual | Nova descrição |
|-------|------------|------------|-----------------|----------------|
| `criar_nova` | Criar nova oportunidade | Sempre criar novo negócio | Sempre cria uma nova, mesmo se já existe fechada | Cria um novo negócio mesmo que já exista um encerrado para esse contato |
| `ignorar` | Ignorar | Não fazer nada | Não faz nada se já existe qualquer oportunidade | Se já existir qualquer negócio (aberto ou encerrado), não cria outro |
| `criar_se_fechada` | Criar se fechada | Criar apenas se não houver aberto | Cria nova apenas se todas estão fechadas | Cria um novo negócio somente se não houver nenhum em andamento |

Apenas textos serão alterados, sem mudança de lógica ou layout.

