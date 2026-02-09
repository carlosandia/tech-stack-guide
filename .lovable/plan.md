
# Plano: Mascaras, Rota Publica, e Pos-Envio nos Botoes

## Status: ✅ IMPLEMENTADO

### O que foi feito:

1. **RLS policies anon** para formularios publicados (SELECT em formularios, campos_formularios, estilos_formularios + INSERT em submissoes_formularios)
2. **masks.ts** com maskCPF, maskCNPJ, maskCEP, maskTelefoneBR, maskTelefoneInternacional, maskMoeda
3. **FormularioPublicoPage.tsx** - pagina publica /f/:slug com UTMs, mascaras, submissao e pos-envio
4. **App.tsx** - rota /f/:slug adicionada
5. **FormPreview.tsx** - mascaras interativas no preview final via FinalPreviewFields
6. **BotaoConfigPanel.tsx** - aba "Pos-Envio" com mensagem sucesso/erro, acao e URL redirecionamento
7. **EditorTabsConfig.tsx** - ConfigPosEnvioForm removido (movido para BotaoConfigPanel)
