/**
 * AIDEV-NOTE: Gerador de script embed auto-contido para Widget WhatsApp
 * Gera HTML/CSS/JS vanilla sem dependências externas
 */

import type { WidgetWhatsAppConfig } from './types'

interface CampoInfo {
  id: string
  nome: string
  tipo: string
  placeholder?: string | null
}

export function generateWidgetScript(
  config: WidgetWhatsAppConfig,
  campos: CampoInfo[]
): string {
  const camposSelecionados = campos.filter(c => config.campos_formulario.includes(c.id))
  const posLeft = config.posicao === 'esquerda'
  const posStyle = posLeft ? 'left:20px' : 'right:20px'
  const posStyleChat = posLeft ? 'left:20px' : 'right:20px'

  const inputType = (tipo: string) => {
    switch (tipo) {
      case 'email': return 'email'
      case 'telefone': return 'tel'
      case 'numero': case 'decimal': return 'number'
      case 'url': return 'url'
      default: return 'text'
    }
  }

  const camposHTML = config.usar_formulario
    ? camposSelecionados.map(c => `
      <div style="margin-bottom:10px">
        <label style="display:block;font-size:12px;color:#666;margin-bottom:3px">${c.nome}</label>
        <input type="${inputType(c.tipo)}" name="${c.id}" placeholder="${c.placeholder || c.nome}"
          style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:8px;font-size:14px;outline:none;box-sizing:border-box"
          onfocus="this.style.borderColor='${config.cor_botao}'" onblur="this.style.borderColor='#ddd'" />
      </div>`).join('')
    : ''

  const fotoHTML = config.foto_atendente_url
    ? `<img src="${config.foto_atendente_url}" alt="${config.nome_atendente}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0" />`
    : `<div style="width:40px;height:40px;border-radius:50%;background:#128C7E;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:16px;flex-shrink:0">${(config.nome_atendente || 'A')[0].toUpperCase()}</div>`

  return `<!-- Widget WhatsApp - Gerado automaticamente -->
<script>
(function(){
  var cfg=${JSON.stringify({
    numero: config.numero.replace(/\D/g, ''),
    posicao: config.posicao,
    usarForm: config.usar_formulario,
    nome: config.nome_atendente || 'Atendente',
    msg: config.mensagem_boas_vindas,
    cor: config.cor_botao,
  })};

  var d=document,b=d.createElement('div');
  b.id='wa-widget-root';
  b.innerHTML=\`
    <style>
      #wa-widget-btn{position:fixed;bottom:20px;${posStyle};z-index:9999;width:60px;height:60px;border-radius:50%;background:\${cfg.cor};border:none;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.2);display:flex;align-items:center;justify-content:center;transition:transform .2s}
      #wa-widget-btn:hover{transform:scale(1.1)}
      #wa-widget-btn svg{width:32px;height:32px;fill:#fff}
      #wa-widget-chat{position:fixed;bottom:90px;${posStyleChat};z-index:9998;width:360px;max-width:calc(100vw - 40px);background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.18);overflow:hidden;display:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;animation:wa-slide-up .3s ease}
      @keyframes wa-slide-up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      #wa-widget-chat *{box-sizing:border-box}
    </style>
    <div id="wa-widget-chat">
      <div style="background:#075E54;padding:16px;display:flex;align-items:center;gap:12px">
        ${fotoHTML.replace(/`/g, "\\`")}
        <div style="flex:1;min-width:0">
          <div style="color:#fff;font-weight:600;font-size:15px">\${cfg.nome}</div>
          <div style="color:rgba(255,255,255,.7);font-size:12px">Online</div>
        </div>
        <button onclick="document.getElementById('wa-widget-chat').style.display='none'" style="background:none;border:none;color:#fff;font-size:22px;cursor:pointer;padding:4px">✕</button>
      </div>
      <div style="background:#ECE5DD;padding:16px;min-height:80px">
        <div style="background:#fff;padding:10px 14px;border-radius:0 12px 12px 12px;max-width:85%;font-size:14px;color:#333;box-shadow:0 1px 1px rgba(0,0,0,.1)">
          \${cfg.msg}
          <div style="text-align:right;font-size:11px;color:#999;margin-top:4px">\${new Date().getHours().toString().padStart(2,'0')}:\${new Date().getMinutes().toString().padStart(2,'0')}</div>
        </div>
      </div>
      ${config.usar_formulario && camposSelecionados.length > 0 ? `
      <form id="wa-widget-form" style="padding:16px;border-top:1px solid #eee">
        ${camposHTML.replace(/`/g, "\\`")}
        <button type="submit" style="width:100%;padding:12px;background:\${cfg.cor};color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:4px">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.612l4.458-1.495A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.35 0-4.514-.807-6.23-2.157l-.156-.124-3.244 1.088 1.088-3.244-.136-.17A9.96 9.96 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
          Iniciar Conversa
        </button>
      </form>` : ''}
    </div>
    <button id="wa-widget-btn" onclick="var c=document.getElementById('wa-widget-chat');${config.usar_formulario ? "c.style.display=c.style.display==='none'?'block':'none'" : "window.open('https://wa.me/'+cfg.numero,'_blank')"}">
      <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.612l4.458-1.495A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.35 0-4.514-.807-6.23-2.157l-.156-.124-3.244 1.088 1.088-3.244-.136-.17A9.96 9.96 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
    </button>
  \`;
  d.body.appendChild(b);

  ${config.usar_formulario ? `
  var f=d.getElementById('wa-widget-form');
  if(f)f.onsubmit=function(e){
    e.preventDefault();
    var fd=new FormData(f);
    var parts=[];
    fd.forEach(function(v,k){if(v)parts.push(v)});
    var text=parts.length?encodeURIComponent(parts.join(' | ')):'';
    window.open('https://wa.me/'+cfg.numero+(text?'?text='+text:''),'_blank');
  };` : ''}
})();
</script>`
}
