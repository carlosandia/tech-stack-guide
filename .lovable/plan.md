

# Redesign da Config Geral - UX/UI Melhorada

## Problemas Atuais
1. **3 secoes separadas** (Notificacoes, Automacao, Horario Comercial) sem contexto claro de como se relacionam
2. **Nomenclaturas vagas** - "Nova Oportunidade", "Tarefa Vencida" nao explicam QUEM recebe e ONDE aparece o alerta
3. **Alerta de inatividade** nao deixa claro onde o usuario vai ver esse alerta
4. **Restricao de admin** nao esta visivel - o usuario nao sabe que so admin pode alterar
5. **Horario Comercial** separado das notificacoes sendo que ambos controlam envio de email

## Solucao Recomendada

Reorganizar em **2 secoes claras** com descricoes explicitas:

### Estrutura Nova

```text
+--------------------------------------------------+
| Notificacoes por Email                            |
| Controle quais eventos enviam email automatico    |
| para os membros da equipe.                        |
| [Badge: Somente Administradores]                  |
|                                                   |
| [!] Banner email desconectado (se aplicavel)      |
|                                                   |
| -- Janela de envio --                             |
| Emails serao enviados apenas neste horario.       |
| Inicio: [08:00]   Fim: [18:00]                   |
|                                                   |
| -- Eventos --                                     |
| [x] Oportunidade criada                           |
|     Envia email ao responsavel quando uma nova    |
|     oportunidade for criada no pipeline.          |
|                                                   |
| [x] Tarefa vencida                                |
|     Envia email ao responsavel quando uma tarefa  |
|     ultrapassar a data de vencimento.             |
|                                                   |
| [ ] Oportunidade movida de etapa                  |
|     Envia email ao responsavel quando a           |
|     oportunidade mudar de etapa no funil.         |
|                                                   |
| [x] Oportunidade inativa                          |
|     Envia email ao responsavel quando a           |
|     oportunidade ficar sem atividade por:         |
|     [7] dias                                      |
|     Tambem destaca o card no Kanban com badge     |
|     visual de inatividade.                        |
+--------------------------------------------------+

+--------------------------------------------------+
| Automacoes do Pipeline                            |
| Configure acoes automaticas que acontecem ao      |
| movimentar oportunidades entre etapas.            |
| [Badge: Somente Administradores]                  |
|                                                   |
| [x] Criar tarefas automaticamente                 |
|     Ao mover uma oportunidade para uma nova       |
|     etapa, as tarefas configuradas naquela etapa  |
|     serao criadas automaticamente.                |
+--------------------------------------------------+
```

### Mudancas Especificas

**Arquivo**: `src/modules/configuracoes/pages/ConfigGeralPage.tsx`

1. **Unificar Notificacoes + Horario Comercial + Alerta de Inatividade** em uma unica secao "Notificacoes por Email"
   - Horario de envio fica no topo da secao como contexto
   - Alerta de inatividade vira um toggle igual aos outros (com input de dias inline quando ativo)
   - Cada toggle ganha descricao expandida explicando QUEM recebe e QUANDO dispara

2. **Renomear Automacao** para "Automacoes do Pipeline" com descricao clara

3. **Adicionar badge "Somente Administradores"** em cada secao, usando um badge discreto (bg-amber-50, text-amber-700) ao lado do titulo

4. **Melhorar nomenclaturas**:
   - "Nova Oportunidade" → "Oportunidade criada"
   - "Tarefa Vencida" → "Tarefa vencida"
   - "Mudanca de Etapa" → "Oportunidade movida de etapa"
   - Novo: "Oportunidade inativa" (move o campo de dias para dentro deste toggle)
   - "Criar Tarefa Automatica" → "Criar tarefas automaticamente"

5. **Descricoes expandidas** em cada toggle:
   - Ao inves de "Enviar email ao criar oportunidade" → "Envia email ao responsavel quando uma nova oportunidade for criada no pipeline"
   - Padroes: sempre dizer QUEM recebe + QUANDO dispara

6. **Usar o componente Switch do shadcn** (`@/components/ui/switch`) ao inves do toggle customizado, seguindo o design system

7. **Secoes restantes** (Localizacao, Assinatura, Widget WhatsApp) permanecem inalteradas

### Detalhes Tecnicos

- Remover a secao `Horario Comercial` como card separado
- Remover a secao `Automacao` como card separado com o campo de dias
- Mover inputs de horario para dentro da secao de Notificacoes
- Mover input de dias para inline dentro do toggle de "Oportunidade inativa"
- Adicionar novo campo boolean `notificar_inatividade` ao form state (derivado de `dias_alerta_inatividade > 0`)
- Importar e usar `Switch` de `@/components/ui/switch` e `Badge` se disponivel
- Adicionar icone `Shield` ou `Lock` do lucide para o badge de admin
