

# Analise de Gaps - PRD-11: Caixa de Entrada de Email

## Resumo da Situacao Atual

O modulo foi parcialmente implementado. As bases de backend (tabelas, RLS, indices, rotas, service) e o frontend basico (layout split-view, lista, visualizacao, composer) estao funcionais. Porem, ao comparar item a item com o PRD-11, existem **gaps significativos** em funcionalidades Must-have e Should-have.

---

## O que JA esta implementado (OK)

| Requisito | Status |
|-----------|--------|
| RF-001: Layout split-view desktop | OK |
| RF-001: Responsivo mobile (lista vs leitura) | OK |
| RF-001: Contador nao lidos no menu | OK (hook existe, mas badge no menu falta) |
| RF-002: 5 pastas (Inbox, Sent, Drafts, Archived, Trash) | OK |
| RF-002: Navegacao entre pastas via tabs | OK |
| RF-003: Lista com remetente, assunto, preview, data | OK |
| RF-003: Indicador nao lido (bolinha azul + negrito) | OK |
| RF-003: Favorito (estrela) | OK |
| RF-003: Icone de anexo (clip) | OK |
| RF-003: Selecao multipla com checkbox | OK |
| RF-004: Cabecalho (De, Para, Cc, Data) | OK |
| RF-004: Renderizacao de HTML | OK (mas sem sanitizacao!) |
| RF-004: Botoes de acao (Responder, Encaminhar, Arquivar, Deletar) | OK |
| RF-004: Marcar como lido/nao lido | OK |
| RF-005: Responder email pre-preenchendo destinatario e assunto | OK |
| RF-006: Botao "Escrever" abre modal composicao | OK |
| RF-008: Sync Gmail API (inicial + incremental) | OK |
| RF-008: Deduplicacao por Message-ID | OK |
| RF-010: Acoes em lote (marcar lido, arquivar, deletar, favoritar) | OK |
| RF-012: Backend assinatura (CRUD) | OK |
| DB: 5 tabelas criadas com RLS | OK |
| DB: Indices (incluindo GIN full-text) | OK |
| Backend: 17 rotas definidas | OK |
| Modulo registrado no Super Admin | OK |

---

## GAPS Identificados

### GAPS CRITICOS (Must-have)

#### 1. Sanitizacao HTML (XSS) - RF-004, RNF-002
**Severidade:** CRITICA (seguranca)
- O `EmailViewer.tsx` usa `dangerouslySetInnerHTML` direto sem sanitizar o HTML
- Nao ha `dompurify` instalado no projeto
- Qualquer email malicioso pode executar scripts no navegador
- **Acao:** Instalar `dompurify` e sanitizar todo `corpo_html` antes de renderizar

#### 2. Composer nao envia de fato - RF-005, RF-006
**Severidade:** CRITICA (funcionalidade core)
- O `handleSend` no `EmailsPage.tsx` (linha 153-159) tem um `TODO` e mostra apenas um toast
- O frontend nao esta integrado com o backend `/api/v1/emails/enviar`
- O composer usa `<textarea>` simples em vez do TipTap (ja instalado no projeto)
- **Acao:** Integrar `onSend` com a API de envio; usar editor TipTap para formatacao rich text

#### 3. "Responder Todos" ausente - RF-005
**Severidade:** ALTA
- PRD exige 3 acoes: Responder, Responder Todos, Encaminhar
- Apenas Responder e Encaminhar estao implementados
- **Acao:** Adicionar botao "Responder Todos" que inclui todos os destinatarios Cc no campo Para

#### 4. Card do Contato Vinculado ausente - RF-007
**Severidade:** ALTA (Must-have no PRD)
- Componente `ContatoCard.tsx` nao foi criado
- Nao ha exibicao do contato vinculado no painel de leitura
- Nao ha botao "Criar Contato" se remetente nao for contato CRM
- Nao ha botao "Criar Tarefa" a partir do email
- Nao ha listagem de oportunidades vinculadas ao contato
- **Acao:** Criar componente `ContatoCard` que busca contato pelo `contato_id` ou `de_email`, exibe informacoes e oportunidades

#### 5. Sync IMAP nao implementado - RF-008
**Severidade:** MEDIA-ALTA
- O service backend tem apenas `logger.warn('Sync IMAP ainda nao implementado')` (linha 568)
- PRD exige suporte a IMAP para provedores nao-Gmail
- Dependencia `imapflow` nao esta instalada
- **Acao:** Implementar sync IMAP usando `imapflow` ou marcar como v1.1

#### 6. Download de Anexos nao funciona no frontend - RF-004
**Severidade:** ALTA
- O `AnexoItem` no `EmailViewer.tsx` apenas exibe o nome, nao tem botao/link de download
- Nao ha integracao com a rota `GET /api/v1/emails/:id/anexos/:anexoId`
- **Acao:** Adicionar funcao de download nos itens de anexo

---

### GAPS IMPORTANTES (Should-have)

#### 7. Filtros rapidos ausentes - RF-009
- Faltam filtros rapidos: "Nao lidos", "Com anexos", "Favoritos", "De contatos CRM", "Periodo"
- Componente `EmailFilters.tsx` nao foi criado
- A busca nao tem debounce de 300ms
- **Acao:** Criar barra de filtros combinaveis abaixo da busca

#### 8. Assinatura de Email sem UI - RF-012
- Backend esta completo (CRUD), mas nao existe componente `AssinaturaConfig.tsx`
- Nao ha como o usuario configurar ou editar sua assinatura no frontend
- Deveria usar editor TipTap para editar a assinatura
- **Acao:** Criar modal/pagina de configuracao de assinatura

#### 9. Badge de nao lidos no menu - RF-011
- O hook `useContadorNaoLidos` existe, mas o `AppLayout.tsx` nao exibe badge ao lado do item "Emails"
- **Acao:** Adicionar badge com contador de nao lidos no item do menu

#### 10. Toast de novo email - RF-011
- Nao ha notificacao toast quando novos emails chegam via polling
- **Acao:** Comparar contagem anterior vs atual e mostrar toast se houver novos

#### 11. Confirmacao para acoes destrutivas - RF-010
- Nao ha modal de confirmacao ao deletar emails (lote ou individual)
- PRD exige confirmacao para acoes destrutivas
- **Acao:** Adicionar dialog de confirmacao antes de deletar

#### 12. Paginacao infinita (scroll) - RF-003
- A lista usa paginacao tradicional (botoes anterior/proximo)
- PRD pede "paginacao infinita (carregar mais ao scroll)"
- **Acao:** Substituir por scroll infinito com `IntersectionObserver`

---

### GAPS MENORES (Could-have / Nice-to-have)

#### 13. Rastreamento de abertura (Tracking) - RF-013
- Tabela `emails_tracking` existe e o backend registra evento "enviado"
- Falta: checkbox "Rastrear abertura" no composer
- Falta: inserir pixel 1x1 no HTML do email
- Falta: rota publica `GET /t/:trackingId.gif`
- Falta: indicadores visuais (check azul) nos emails enviados
- **Acao:** Implementar em versao futura (Could-have)

#### 14. Timeline do Contato - RF-014
- Emails nao aparecem na timeline/historico do contato
- PRD marca como Must-have para integracao com contatos
- **Acao:** Quando o modulo de contatos tiver timeline, integrar emails

#### 15. Upload de anexos no envio - RF-005, RF-006
- Rota `POST /api/v1/emails/upload` definida no PRD mas nao implementada
- Composer nao tem botao de anexar
- **Acao:** Implementar upload temporario e anexar ao envio

#### 16. Autocomplete de contatos no Composer - RF-006
- Campo "Para" e um input simples, sem autocomplete
- PRD pede busca em contatos do CRM com sugestoes
- **Acao:** Integrar busca de contatos na digitacao do campo "Para"

#### 17. Auto-save de rascunho a cada 30s - RF-005
- Hooks de rascunho existem (`useSalvarRascunho`), mas nao sao usados no Composer
- **Acao:** Adicionar `useEffect` com intervalo de 30s no modal de composicao

#### 18. Lixeira esvazia automaticamente apos 30 dias - RF-002
- Nao ha job/cron para limpar emails na lixeira com mais de 30 dias
- **Acao:** Criar funcao scheduled ou cron no backend

#### 19. Links abrem em nova aba - RF-004
- O HTML renderizado nao forca `target="_blank"` nos links
- **Acao:** Adicionar `target="_blank" rel="noopener"` via DOMPurify hooks

#### 20. Double-click abre em modal/fullscreen - RF-003
- Nao ha handler de double-click no `EmailItem`
- **Acao:** Implementar modo fullscreen para visualizacao

---

## Plano de Correcao por Prioridade

### Prioridade 1 - Correcoes Criticas (implementar agora)

1. **Instalar `dompurify`** e sanitizar HTML no `EmailViewer.tsx`
2. **Integrar envio real** no `ComposeEmailModal` com a API backend
3. **Usar TipTap** como editor no Composer (ja instalado no projeto)
4. **Adicionar "Responder Todos"** no `EmailViewer`
5. **Criar `ContatoCard`** com informacoes do contato vinculado, oportunidades, botoes "Criar Contato" e "Criar Tarefa"
6. **Habilitar download de anexos** nos itens de anexo

### Prioridade 2 - Melhorias Importantes (implementar em seguida)

7. **Criar barra de filtros rapidos** (nao lidos, com anexos, favoritos, periodo)
8. **Debounce 300ms** na busca
9. **Badge de nao lidos** no menu do `AppLayout`
10. **Modal de assinatura** com editor TipTap
11. **Confirmacao de exclusao** com dialog
12. **Toast de novo email** ao detectar novas mensagens no polling

### Prioridade 3 - Refinamentos (backlog)

13. Scroll infinito na lista
14. Auto-save de rascunho a cada 30s
15. Autocomplete de contatos no campo "Para"
16. Links com `target="_blank"` via DOMPurify
17. Upload de anexos no envio
18. Tracking de abertura (pixel)
19. Integracao com timeline do contato
20. Limpeza automatica da lixeira (30 dias)
21. Sync IMAP com `imapflow`

---

## Detalhes Tecnicos das Correcoes

### Sanitizacao HTML (Gap 1)
- Instalar: `dompurify` + `@types/dompurify`
- No `EmailViewer.tsx`, importar DOMPurify e usar:
```typescript
const cleanHtml = DOMPurify.sanitize(email.corpo_html, {
  ADD_ATTR: ['target'],
  ALLOW_TAGS: ['a','p','br','b','i','u','strong','em','h1','h2','h3','ul','ol','li','table','tr','td','th','img','blockquote','hr','span','div'],
})
```

### Editor TipTap no Composer (Gap 2)
- TipTap ja esta instalado (`@tiptap/react`, `@tiptap/starter-kit`, extensions)
- Substituir `<textarea>` por componente com `useEditor` e toolbar basica
- Toolbar: Bold, Italic, Underline, Link, Lista

### ContatoCard (Gap 4)
- Buscar contato pelo `contato_id` do email ou pelo `de_email` na tabela `contatos`
- Exibir: avatar, nome, cargo, empresa
- Listar oportunidades vinculadas ao contato
- Botoes: "Ver Contato", "Ver Oportunidade", "Criar Contato" (se nao existe), "Criar Tarefa"

### Badge no Menu (Gap 9)
- O `AppLayout.tsx` ja tem o item "Emails" com icone Mail
- Adicionar hook `useContadorNaoLidos` e renderizar badge similar ao da pasta inbox no EmailList

