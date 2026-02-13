/**
 * AIDEV-NOTE: Gerador de script embed auto-contido para Widget WhatsApp
 * Gera HTML/CSS/JS vanilla IDENTICO ao WidgetWhatsAppPreview
 * Qualquer mudanca no preview deve refletir aqui e vice-versa
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
  // posicao usada apenas no CSS inline via posStyle
  const posStyle = posLeft ? 'left:20px' : 'right:20px'

  const inputType = (tipo: string) => {
    switch (tipo) {
      case 'email': return 'email'
      case 'telefone': return 'tel'
      case 'numero': case 'decimal': return 'number'
      case 'url': return 'url'
      default: return 'text'
    }
  }

  // AIDEV-NOTE: Mascaras para campos do formulario
  const maskAttr = (tipo: string, slug: string) => {
    const lower = slug.toLowerCase()
    if (tipo === 'telefone' || lower.includes('telefone') || lower.includes('celular') || lower.includes('whatsapp'))
      return ` oninput="var v=this.value.replace(/\\\\D/g,'');if(v.length>11)v=v.slice(0,11);if(v.length>10){this.value='('+v.slice(0,2)+') '+v.slice(2,7)+'-'+v.slice(7)}else if(v.length>6){this.value='('+v.slice(0,2)+') '+v.slice(2,6)+'-'+v.slice(6)}else if(v.length>2){this.value='('+v.slice(0,2)+') '+v.slice(2)}else if(v.length>0){this.value='('+v}else{this.value=''}" maxlength="16"`
    if (lower.includes('cpf'))
      return ` oninput="var v=this.value.replace(/\\\\D/g,'');if(v.length>11)v=v.slice(0,11);if(v.length>9){this.value=v.slice(0,3)+'.'+v.slice(3,6)+'.'+v.slice(6,9)+'-'+v.slice(9)}else if(v.length>6){this.value=v.slice(0,3)+'.'+v.slice(3,6)+'.'+v.slice(6)}else if(v.length>3){this.value=v.slice(0,3)+'.'+v.slice(3)}else{this.value=v}" maxlength="14"`
    if (lower.includes('cnpj'))
      return ` oninput="var v=this.value.replace(/\\\\D/g,'');if(v.length>14)v=v.slice(0,14);if(v.length>12){this.value=v.slice(0,2)+'.'+v.slice(2,5)+'.'+v.slice(5,8)+'/'+v.slice(8,12)+'-'+v.slice(12)}else if(v.length>8){this.value=v.slice(0,2)+'.'+v.slice(2,5)+'.'+v.slice(5,8)+'/'+v.slice(8)}else if(v.length>5){this.value=v.slice(0,2)+'.'+v.slice(2,5)+'.'+v.slice(5)}else if(v.length>2){this.value=v.slice(0,2)+'.'+v.slice(2)}else{this.value=v}" maxlength="18"`
    return ''
  }

  // AIDEV-NOTE: Campos do formulario - estilos identicos ao preview
  const obrigatorios = config.campos_obrigatorios || []
  const camposHTML = config.usar_formulario && camposSelecionados.length > 0
    ? camposSelecionados.map(c => {
        const isReq = obrigatorios.includes(c.id)
        return `
          <div>
            <label style="display:block;font-size:11px;color:#6b7280;margin-bottom:2px">${c.nome}${isReq ? ' *' : ''}</label>
            <input type="${inputType(c.tipo)}" name="${c.id}" placeholder="${c.placeholder || c.nome}"${isReq ? ' required' : ''}
              style="width:100%;height:32px;padding:0 12px;border:1px solid #e5e7eb;border-radius:8px;background:#f9fafb;font-size:14px;outline:none;box-sizing:border-box"
              onfocus="this.style.borderColor='${config.cor_botao}'" onblur="this.style.borderColor='#e5e7eb'"${maskAttr(c.tipo, c.nome)} />
          </div>`
      }).join('')
    : ''

  // AIDEV-NOTE: Avatar - identico ao preview (w-9 h-9 = 36px)
  const fotoHTML = config.foto_atendente_url
    ? `<img src="${config.foto_atendente_url}" alt="${config.nome_atendente}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0" />`
    : `<div style="width:36px;height:36px;border-radius:50%;background:#128C7E;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:14px;flex-shrink:0">${(config.nome_atendente || 'A')[0].toUpperCase()}</div>`

  // AIDEV-NOTE: SVG WhatsApp - mesmo usado no preview
  const whatsappSvg = `<svg width="SIZE" height="SIZE" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.612l4.458-1.495A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.35 0-4.514-.807-6.23-2.157l-.156-.124-3.244 1.088 1.088-3.244-.136-.17A9.96 9.96 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>`

  const svgBtn = whatsappSvg.replace(/SIZE/g, '28')
  const svgSmall = whatsappSvg.replace(/SIZE/g, '16')

  const formSection = config.usar_formulario && camposSelecionados.length > 0 ? `
      <form id="wa-widget-form" style="padding:12px;border-top:1px solid #f3f4f6;display:flex;flex-direction:column;gap:8px">
        ${camposHTML.replace(/`/g, "\\`")}
        <button type="submit" style="width:100%;padding:10px 0;border-radius:8px;background:\${cfg.cor};color:#fff;border:none;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:4px">
          ${svgSmall}
          Iniciar Conversa
        </button>
      </form>` : ''

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
      #wa-widget-btn{position:fixed;bottom:20px;${posStyle};z-index:9999;width:56px;height:56px;border-radius:50%;background:\${cfg.cor};border:none;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.2);display:flex;align-items:center;justify-content:center;transition:transform .2s}
      #wa-widget-btn:hover{transform:scale(1.1)}
      #wa-widget-chat{position:fixed;bottom:90px;${posStyle};z-index:9998;width:300px;max-width:calc(100vw - 40px);background:#fff;border-radius:16px;box-shadow:0 20px 25px -5px rgba(0,0,0,.1),0 8px 10px -6px rgba(0,0,0,.1);overflow:hidden;display:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;animation:wa-slide-up .3s ease;border:1px solid #e5e7eb}
      @keyframes wa-slide-up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      #wa-widget-chat *{box-sizing:border-box}
      #wa-widget-chat input:focus{outline:none}
    </style>
    <div id="wa-widget-chat">
      <div style="background:#075E54;padding:12px 16px;display:flex;align-items:center;gap:12px">
        ${fotoHTML.replace(/`/g, "\\`")}
        <div style="flex:1;min-width:0">
          <div style="color:#fff;font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">\${cfg.nome}</div>
          <div style="color:rgba(255,255,255,.6);font-size:12px">Online</div>
        </div>
      </div>
      <div style="background:#ECE5DD;padding:12px">
        <div style="background:#fff;padding:8px 12px;border-radius:0 12px 12px 12px;max-width:85%;font-size:14px;color:#1f2937;box-shadow:0 1px 1px rgba(0,0,0,.1)">
          \${cfg.msg}
          <div style="text-align:right;font-size:10px;color:#9ca3af;margin-top:4px">\${new Date().getHours().toString().padStart(2,'0')}:\${new Date().getMinutes().toString().padStart(2,'0')}</div>
        </div>
      </div>
      ${formSection.replace(/`/g, "\\`")}
    </div>
    <button id="wa-widget-btn" onclick="var c=document.getElementById('wa-widget-chat');${config.usar_formulario && camposSelecionados.length > 0 ? "var vis=window.getComputedStyle(c).display;c.style.display=vis==='none'?'block':'none'" : "window.open('https://wa.me/'+cfg.numero,'_blank')"}">
      ${svgBtn}
    </button>
  \`;
  d.body.appendChild(b);

  ${config.usar_formulario && camposSelecionados.length > 0 ? `
  var f=d.getElementById('wa-widget-form');
  if(f)f.onsubmit=function(e){
    e.preventDefault();
    var valid=true;
    var req=f.querySelectorAll('[required]');
    for(var i=0;i<req.length;i++){
      if(!req[i].value.trim()){
        req[i].style.borderColor='#ef4444';
        valid=false;
      }else{
        req[i].style.borderColor='#e5e7eb';
      }
    }
    if(!valid)return;
    var fd=new FormData(f);
    var parts=[];
    fd.forEach(function(v,k){if(v)parts.push(v)});
    var text=parts.length?encodeURIComponent(parts.join(' | ')):'';
    window.open('https://wa.me/'+cfg.numero+(text?'?text='+text:''),'_blank');
  };` : ''}
})();
</script>`
}
