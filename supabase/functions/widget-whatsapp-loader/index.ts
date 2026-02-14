/**
 * AIDEV-NOTE: Edge Function que serve o JS do Widget WhatsApp como arquivo cacheável.
 * O script embed do usuário fica com ~200 bytes e carrega este JS via <script src="...">.
 * Cache-Control: 1h no browser para performance máxima.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function getWidgetScript(): string {
  return `(function(){
  var el=document.currentScript;
  if(!el)return;
  var org=el.getAttribute('data-org');
  if(!org){console.warn('Widget WhatsApp: atributo data-org ausente');return}
  var API=el.src.split('/functions/v1/')[0]+'/functions/v1/widget-whatsapp-config?org='+org;

  function inputType(t){switch(t){case'email':return'email';case'telefone':return'tel';case'numero':case'decimal':return'number';case'url':return'url';default:return'text'}}

  function maskFor(tipo,nome){
    var l=nome.toLowerCase();
    if(tipo==='telefone'||l.indexOf('telefone')>=0||l.indexOf('celular')>=0||l.indexOf('whatsapp')>=0)
      return function(el){el.setAttribute('maxlength','16');el.addEventListener('input',function(){var v=this.value.replace(/\\D/g,'');if(v.length>11)v=v.slice(0,11);if(v.length>10)this.value='('+v.slice(0,2)+') '+v.slice(2,7)+'-'+v.slice(7);else if(v.length>6)this.value='('+v.slice(0,2)+') '+v.slice(2,6)+'-'+v.slice(6);else if(v.length>2)this.value='('+v.slice(0,2)+') '+v.slice(2);else if(v.length>0)this.value='('+v;else this.value=''})};
    if(l.indexOf('cpf')>=0)
      return function(el){el.setAttribute('maxlength','14');el.addEventListener('input',function(){var v=this.value.replace(/\\D/g,'');if(v.length>11)v=v.slice(0,11);if(v.length>9)this.value=v.slice(0,3)+'.'+v.slice(3,6)+'.'+v.slice(6,9)+'-'+v.slice(9);else if(v.length>6)this.value=v.slice(0,3)+'.'+v.slice(3,6)+'.'+v.slice(6);else if(v.length>3)this.value=v.slice(0,3)+'.'+v.slice(3);else this.value=v})};
    if(l.indexOf('cnpj')>=0)
      return function(el){el.setAttribute('maxlength','18');el.addEventListener('input',function(){var v=this.value.replace(/\\D/g,'');if(v.length>14)v=v.slice(0,14);if(v.length>12)this.value=v.slice(0,2)+'.'+v.slice(2,5)+'.'+v.slice(5,8)+'/'+v.slice(8,12)+'-'+v.slice(12);else if(v.length>8)this.value=v.slice(0,2)+'.'+v.slice(2,5)+'.'+v.slice(5,8)+'/'+v.slice(8);else if(v.length>5)this.value=v.slice(0,2)+'.'+v.slice(2,5)+'.'+v.slice(5);else if(v.length>2)this.value=v.slice(0,2)+'.'+v.slice(2);else this.value=v})};
    return null;
  }

  var svgWa='<svg width="SS" height="SS" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.612l4.458-1.495A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.35 0-4.514-.807-6.23-2.157l-.156-.124-3.244 1.088 1.088-3.244-.136-.17A9.96 9.96 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>';

  fetch(API).then(function(r){return r.json()}).then(function(data){
    if(!data.ativo)return;
    var cfg=data.config;
    var campos=data.campos||[];
    var numero=(cfg.numero||'').replace(/\\D/g,'');
    var pos=cfg.posicao==='esquerda'?'left':'right';
    var cor=cfg.cor_botao||'#25D366';
    var nome=cfg.nome_atendente||'Atendente';
    var msg=cfg.mensagem_boas_vindas||'Olá!';
    var foto=cfg.foto_atendente_url||'';
    var usarForm=cfg.usar_formulario&&campos.length>0;
    var obrigatorios=cfg.campos_obrigatorios||[];
    var h=new Date().getHours().toString().padStart(2,'0');
    var m=new Date().getMinutes().toString().padStart(2,'0');

    var avatarHtml=foto
      ?'<img src="'+foto+'" alt="'+nome+'" style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0" />'
      :'<div style="width:36px;height:36px;border-radius:50%;background:#128C7E;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:14px;flex-shrink:0">'+nome[0].toUpperCase()+'</div>';

    var camposHtml='';
    if(usarForm){
      for(var i=0;i<campos.length;i++){
        var c=campos[i];
        var req=obrigatorios.indexOf(c.id)>=0;
        camposHtml+='<div><label style="display:block;font-size:11px;color:#6b7280;margin-bottom:2px">'+c.nome+(req?' *':'')+'</label>'
          +'<input type="'+inputType(c.tipo)+'" name="'+c.id+'" placeholder="'+(c.placeholder||c.nome)+'"'+(req?' required':'')
          +' data-tipo="'+c.tipo+'" data-nome="'+c.nome+'"'
          +' style="width:100%;height:32px;padding:0 12px;border:1px solid #e5e7eb;border-radius:8px;background:#f9fafb;font-size:14px;outline:none;box-sizing:border-box" /></div>';
      }
    }

    var formHtml=usarForm
      ?'<form id="wa-widget-form" style="padding:12px;border-top:1px solid #f3f4f6;display:flex;flex-direction:column;gap:8px">'
        +camposHtml
        +'<button type="submit" style="width:100%;padding:10px 0;border-radius:8px;background:'+cor+';color:#fff;border:none;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:4px">'
        +svgWa.replace(/SS/g,'16')+' Iniciar Conversa</button></form>'
      :'';

    var style=document.createElement('style');
    style.textContent='#wa-widget-btn{position:fixed;bottom:20px;'+pos+':20px;z-index:9999;width:56px;height:56px;border-radius:50%;background:'+cor+';border:none;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.2);display:flex;align-items:center;justify-content:center;transition:transform .2s}'
      +'#wa-widget-btn:hover{transform:scale(1.1)}'
      +'#wa-widget-chat{position:fixed;bottom:90px;'+pos+':20px;z-index:9998;width:300px;max-width:calc(100vw - 40px);background:#fff;border-radius:16px;box-shadow:0 20px 25px -5px rgba(0,0,0,.1),0 8px 10px -6px rgba(0,0,0,.1);overflow:hidden;display:none;font-family:-apple-system,BlinkMacSystemFont,\\'Segoe UI\\',Roboto,sans-serif;animation:wa-slide-up .3s ease;border:1px solid #e5e7eb}'
      +'@keyframes wa-slide-up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}'
      +'#wa-widget-chat *{box-sizing:border-box}#wa-widget-chat input:focus{outline:none}';
    document.head.appendChild(style);

    var root=document.createElement('div');
    root.id='wa-widget-root';
    root.innerHTML='<div id="wa-widget-chat">'
      +'<div style="background:#075E54;padding:12px 16px;display:flex;align-items:center;gap:12px">'
      +avatarHtml
      +'<div style="flex:1;min-width:0"><div style="color:#fff;font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+nome+'</div><div style="color:rgba(255,255,255,.6);font-size:12px">Online</div></div>'
      +'</div>'
      +'<div style="background:#ECE5DD;padding:12px"><div style="background:#fff;padding:8px 12px;border-radius:0 12px 12px 12px;max-width:85%;font-size:14px;color:#1f2937;box-shadow:0 1px 1px rgba(0,0,0,.1)">'+msg+'<div style="text-align:right;font-size:10px;color:#9ca3af;margin-top:4px">'+h+':'+m+'</div></div></div>'
      +formHtml
      +'</div>'
      +'<button id="wa-widget-btn">'+svgWa.replace(/SS/g,'28')+'</button>';
    document.body.appendChild(root);

    var btn=document.getElementById('wa-widget-btn');
    var chat=document.getElementById('wa-widget-chat');
    btn.addEventListener('click',function(){
      if(usarForm){
        var vis=window.getComputedStyle(chat).display;
        chat.style.display=vis==='none'?'block':'none';
      }else{
        window.open('https://wa.me/'+numero,'_blank');
      }
    });

    var inputs=root.querySelectorAll('input');
    for(var j=0;j<inputs.length;j++){
      (function(inp){
        inp.addEventListener('focus',function(){this.style.borderColor=cor});
        inp.addEventListener('blur',function(){this.style.borderColor='#e5e7eb'});
        var mk=maskFor(inp.getAttribute('data-tipo'),inp.getAttribute('data-nome'));
        if(mk)mk(inp);
      })(inputs[j]);
    }

    var form=document.getElementById('wa-widget-form');
    if(form)form.addEventListener('submit',function(e){
      e.preventDefault();
      var valid=true;
      var reqs=form.querySelectorAll('[required]');
      for(var k=0;k<reqs.length;k++){
        if(!reqs[k].value.trim()){reqs[k].style.borderColor='#ef4444';valid=false}
        else{reqs[k].style.borderColor='#e5e7eb'}
      }
      if(!valid)return;
      var fd=new FormData(form);
      var parts=[];
      var dadosObj={};
      var formInputs=form.querySelectorAll('input[name]');
      for(var ki=0;ki<formInputs.length;ki++){
        var inp=formInputs[ki];
        var label=inp.getAttribute('data-nome')||inp.name;
        if(inp.value)dadosObj[label]=inp.value;
      }
      fd.forEach(function(v){if(v)parts.push(v)});
      try{
        fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dados:dadosObj,config:cfg})}).catch(function(){});
      }catch(ex){}
      var text=parts.length?encodeURIComponent(parts.join(' | ')):'';
      window.open('https://wa.me/'+numero+(text?'?text='+text:''),'_blank');
    });

  }).catch(function(err){console.warn('Widget WhatsApp: erro ao carregar config',err)});
})();`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const jsContent = getWidgetScript();

  return new Response(jsContent, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
});
