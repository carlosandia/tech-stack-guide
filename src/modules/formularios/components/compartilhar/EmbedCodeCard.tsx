/**
 * AIDEV-NOTE: Card de código embed dinâmico (inline, modal, sidebar) + iframe fallback
 * Script faz fetch da config via edge function e renderiza o formulário no DOM
 */

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Props {
  slug: string
  baseUrl: string
}

type EmbedType = 'inline' | 'modal' | 'sidebar'

const EMBED_LABELS: Record<EmbedType, string> = {
  inline: 'Padrão (embutido)',
  modal: 'Modal (popup)',
  sidebar: 'Sidebar (lateral)',
}

const SUPABASE_URL = 'https://ybzhlsalbnxwkfszkloa.supabase.co'

function generateEmbedCode(slug: string, _baseUrl: string, type: EmbedType): string {
  const configApi = `${SUPABASE_URL}/functions/v1/widget-formulario-config?slug=${slug}`
  const submitApi = `${SUPABASE_URL}/functions/v1/processar-submissao-formulario`

  // AIDEV-NOTE: Script embed dinâmico — busca config e renderiza no DOM do site
  const scriptBody = `(function(){
  var API='${configApi}';
  var SUBMIT='${submitApi}';
  var MODE='${type}';
  var el=document.currentScript||document.querySelector('script[data-form-slug="${slug}"]');
  var parent=el?el.parentNode:document.body;

  function inputType(t){switch(t){case'email':return'email';case'telefone':case'telefone_br':return'tel';case'numero':case'decimal':case'moeda':return'number';case'url':return'url';default:return'text'}}

  function isLayoutField(t){return['titulo','paragrafo','divisor','espacador','html_block'].indexOf(t)>=0}

  function maskFor(tipo){
    if(tipo==='telefone_br')return function(el){el.setAttribute('maxlength','16');el.addEventListener('input',function(){var v=this.value.replace(/\\D/g,'');if(v.length>11)v=v.slice(0,11);if(v.length>10)this.value='('+v.slice(0,2)+') '+v.slice(2,7)+'-'+v.slice(7);else if(v.length>6)this.value='('+v.slice(0,2)+') '+v.slice(2,6)+'-'+v.slice(6);else if(v.length>2)this.value='('+v.slice(0,2)+') '+v.slice(2);else if(v.length>0)this.value='('+v;else this.value=''})};
    if(tipo==='cpf')return function(el){el.setAttribute('maxlength','14');el.addEventListener('input',function(){var v=this.value.replace(/\\D/g,'');if(v.length>11)v=v.slice(0,11);if(v.length>9)this.value=v.slice(0,3)+'.'+v.slice(3,6)+'.'+v.slice(6,9)+'-'+v.slice(9);else if(v.length>6)this.value=v.slice(0,3)+'.'+v.slice(3,6)+'.'+v.slice(6);else if(v.length>3)this.value=v.slice(0,3)+'.'+v.slice(3);else this.value=v})};
    if(tipo==='cnpj')return function(el){el.setAttribute('maxlength','18');el.addEventListener('input',function(){var v=this.value.replace(/\\D/g,'');if(v.length>14)v=v.slice(0,14);if(v.length>12)this.value=v.slice(0,2)+'.'+v.slice(2,5)+'.'+v.slice(5,8)+'/'+v.slice(8,12)+'-'+v.slice(12);else if(v.length>8)this.value=v.slice(0,2)+'.'+v.slice(2,5)+'.'+v.slice(5,8)+'/'+v.slice(8);else if(v.length>5)this.value=v.slice(0,2)+'.'+v.slice(2,5)+'.'+v.slice(5);else if(v.length>2)this.value=v.slice(0,2)+'.'+v.slice(2);else this.value=v})};
    if(tipo==='cep')return function(el){el.setAttribute('maxlength','9');el.addEventListener('input',function(){var v=this.value.replace(/\\D/g,'');if(v.length>8)v=v.slice(0,8);if(v.length>5)this.value=v.slice(0,5)+'-'+v.slice(5);else this.value=v})};
    return null;
  }

  function getUtms(){var p=new URLSearchParams(window.location.search);var u={};['utm_source','utm_medium','utm_campaign','utm_term','utm_content'].forEach(function(k){if(p.get(k))u[k]=p.get(k)});return u}

  function buildForm(data,container){
    var form=data.formulario;
    var campos=data.campos;
    var estilos=data.estilos||{};
    var cS=estilos.container||{};
    var bS=estilos.botao||{};
    var hS=estilos.cabecalho||{};

    var wrapper=document.createElement('div');
    wrapper.style.cssText='font-family:-apple-system,BlinkMacSystemFont,\\'Segoe UI\\',Roboto,sans-serif;max-width:'+(cS.max_width||'600px')+';margin:0 auto;padding:'+(cS.padding||'24px')+';background:'+(cS.background_color||'#ffffff')+';border-radius:'+(cS.border_radius||'8px')+';border:1px solid '+(cS.border_color||'#e5e7eb')+';box-sizing:border-box';

    // Cabeçalho
    if(form.nome){
      var h=document.createElement('h2');
      h.textContent=form.titulo_pagina||form.nome;
      h.style.cssText='margin:0 0 4px 0;font-size:'+(hS.font_size||'20px')+';color:'+(hS.color||'#1f2937')+';text-align:'+(hS.text_align||'left');
      wrapper.appendChild(h);
    }
    if(form.descricao){
      var p=document.createElement('p');
      p.textContent=form.descricao;
      p.style.cssText='margin:0 0 16px 0;font-size:14px;color:#6b7280';
      wrapper.appendChild(p);
    }

    var formEl=document.createElement('form');
    formEl.style.cssText='display:flex;flex-direction:column;gap:12px';

    // Renderizar campos
    for(var i=0;i<campos.length;i++){
      var c=campos[i];
      if(isLayoutField(c.tipo))continue;

      var group=document.createElement('div');
      var label=document.createElement('label');
      label.textContent=c.label+(c.obrigatorio?' *':'');
      label.style.cssText='display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:4px';
      group.appendChild(label);

      var inp;
      if(c.tipo==='textarea'){
        inp=document.createElement('textarea');
        inp.rows=3;
      } else if(c.tipo==='select'&&c.opcoes){
        inp=document.createElement('select');
        var defOpt=document.createElement('option');
        defOpt.value='';defOpt.textContent=c.placeholder||'Selecione...';
        inp.appendChild(defOpt);
        var opts=Array.isArray(c.opcoes)?c.opcoes:(c.opcoes.opcoes||[]);
        for(var j=0;j<opts.length;j++){
          var o=document.createElement('option');
          var val=typeof opts[j]==='string'?opts[j]:(opts[j].valor||opts[j].label||opts[j]);
          var lbl=typeof opts[j]==='string'?opts[j]:(opts[j].label||opts[j].valor||opts[j]);
          o.value=val;o.textContent=lbl;
          inp.appendChild(o);
        }
      } else if(c.tipo==='checkbox'){
        inp=document.createElement('input');
        inp.type='checkbox';
      } else if(c.tipo==='radio'&&c.opcoes){
        inp=document.createElement('div');
        var rOpts=Array.isArray(c.opcoes)?c.opcoes:(c.opcoes.opcoes||[]);
        for(var r=0;r<rOpts.length;r++){
          var rLabel=document.createElement('label');
          rLabel.style.cssText='display:flex;align-items:center;gap:6px;font-size:14px;color:#374151;cursor:pointer';
          var rInp=document.createElement('input');
          rInp.type='radio';rInp.name=c.nome;
          var rVal=typeof rOpts[r]==='string'?rOpts[r]:(rOpts[r].valor||rOpts[r].label||rOpts[r]);
          rInp.value=rVal;
          rLabel.appendChild(rInp);
          rLabel.appendChild(document.createTextNode(typeof rOpts[r]==='string'?rOpts[r]:(rOpts[r].label||rOpts[r].valor||rOpts[r])));
          inp.appendChild(rLabel);
        }
      } else {
        inp=document.createElement('input');
        inp.type=inputType(c.tipo);
      }

      if(inp.tagName!=='DIV'){
        inp.name=c.nome;
        if(c.placeholder)inp.placeholder=c.placeholder;
        if(c.obrigatorio)inp.required=true;
        if(c.tipo!=='checkbox')inp.style.cssText='width:100%;height:40px;padding:0 12px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;outline:none;box-sizing:border-box;transition:border-color 0.2s';
        inp.addEventListener('focus',function(){this.style.borderColor='#3B82F6'});
        inp.addEventListener('blur',function(){this.style.borderColor='#d1d5db'});
        var mk=maskFor(c.tipo);
        if(mk)mk(inp);
      } else {
        inp.setAttribute('data-name',c.nome);
      }

      group.appendChild(inp);
      if(c.texto_ajuda){
        var help=document.createElement('span');
        help.textContent=c.texto_ajuda;
        help.style.cssText='font-size:11px;color:#9ca3af;margin-top:2px;display:block';
        group.appendChild(help);
      }
      formEl.appendChild(group);
    }

    // LGPD checkbox
    if(form.lgpd_ativo){
      var lgpdGroup=document.createElement('div');
      lgpdGroup.style.cssText='display:flex;align-items:flex-start;gap:8px;margin-top:4px';
      var lgpdCb=document.createElement('input');
      lgpdCb.type='checkbox';lgpdCb.name='_lgpd_consent';
      if(form.lgpd_checkbox_obrigatorio)lgpdCb.required=true;
      lgpdCb.style.cssText='margin-top:3px;flex-shrink:0';
      var lgpdLabel=document.createElement('label');
      lgpdLabel.style.cssText='font-size:12px;color:#6b7280;line-height:1.4';
      var lgpdText=form.lgpd_texto_consentimento||'Concordo com a política de privacidade';
      if(form.lgpd_url_politica){
        lgpdLabel.innerHTML=lgpdText.replace(/(pol[ií]tica de privacidade)/i,'<a href="'+form.lgpd_url_politica+'" target="_blank" style="color:#3B82F6;text-decoration:underline">$1</a>');
      } else {
        lgpdLabel.textContent=lgpdText;
      }
      lgpdGroup.appendChild(lgpdCb);
      lgpdGroup.appendChild(lgpdLabel);
      formEl.appendChild(lgpdGroup);
    }

    // Botão de envio
    var btnConfig=form.config_botoes||{};
    var btnText=btnConfig.texto_enviar||'Enviar';
    var btn=document.createElement('button');
    btn.type='submit';
    btn.textContent=btnText;
    btn.style.cssText='width:100%;padding:12px 24px;border:none;border-radius:'+(bS.border_radius||'6px')+';background:'+(bS.background_color||'#3B82F6')+';color:'+(bS.color||'#ffffff')+';font-size:'+(bS.font_size||'16px')+';font-weight:600;cursor:pointer;transition:opacity 0.2s;margin-top:4px';
    btn.addEventListener('mouseenter',function(){this.style.opacity='0.9'});
    btn.addEventListener('mouseleave',function(){this.style.opacity='1'});
    formEl.appendChild(btn);

    // Submit handler
    formEl.addEventListener('submit',function(e){
      e.preventDefault();
      btn.disabled=true;btn.textContent='Enviando...';btn.style.opacity='0.7';

      var formData={};
      var inputs=formEl.querySelectorAll('input,textarea,select');
      for(var k=0;k<inputs.length;k++){
        var inp=inputs[k];
        if(inp.name&&inp.name[0]!=='_'){
          if(inp.type==='checkbox')formData[inp.name]=inp.checked;
          else if(inp.type==='radio'){if(inp.checked)formData[inp.name]=inp.value}
          else formData[inp.name]=inp.value;
        }
      }
      // Collect radio from divs
      var radioDivs=formEl.querySelectorAll('div[data-name]');
      for(var r=0;r<radioDivs.length;r++){
        var checked=radioDivs[r].querySelector('input[type=radio]:checked');
        if(checked)formData[radioDivs[r].getAttribute('data-name')]=checked.value;
      }

      var payload={slug:'${slug}',dados:formData,metadata:{utms:getUtms(),url_origem:window.location.href,user_agent:navigator.userAgent}};

      fetch(SUBMIT,{method:'POST',headers:{'Content-Type':'application/json','apikey':'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inliemhsc2FsYm54d2tmc3prbG9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMDExNzAsImV4cCI6MjA4NTc3NzE3MH0.NyxN8T0XCpnFSF_-0grGGcvhSbwOif0qxxlC_PshA9M'},body:JSON.stringify(payload)})
      .then(function(r){return r.json()})
      .then(function(res){
        if(res.error){btn.disabled=false;btn.textContent=btnText;btn.style.opacity='1';alert('Erro: '+res.error);return}
        // Pós-envio
        var posEnvio=form.config_pos_envio||{};
        var tipo=posEnvio.tipo||'mensagem';
        if(tipo==='redirecionar'&&posEnvio.url_redirecionamento){
          window.location.href=posEnvio.url_redirecionamento;
        } else if(form.redirecionar_apos_envio&&form.url_redirecionamento){
          window.location.href=form.url_redirecionamento;
        } else {
          var msg=posEnvio.mensagem_sucesso||form.mensagem_sucesso||'Formulário enviado com sucesso!';
          formEl.innerHTML='<div style="text-align:center;padding:24px 0"><div style="font-size:32px;margin-bottom:8px">✅</div><p style="font-size:16px;color:#10B981;font-weight:600;margin:0">'+msg+'</p></div>';
        }
      })
      .catch(function(err){btn.disabled=false;btn.textContent=btnText;btn.style.opacity='1';alert('Erro ao enviar formulário')});
    });

    wrapper.appendChild(formEl);
    container.appendChild(wrapper);
  }

  fetch(API).then(function(r){return r.json()}).then(function(data){
    if(data.error){console.warn('CRM Renove Form:',data.error);return}

    if(MODE==='inline'){
      var div=document.createElement('div');
      div.id='crm-form-${slug}';
      parent.insertBefore(div,el?el.nextSibling:null);
      buildForm(data,div);
    }

    if(MODE==='modal'){
      var triggerBtn=document.createElement('button');
      var btnCfg=data.formulario.config_botoes||{};
      triggerBtn.textContent=btnCfg.texto_enviar||'Abrir Formulário';
      triggerBtn.style.cssText='padding:12px 24px;background:#3B82F6;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:600';
      parent.insertBefore(triggerBtn,el?el.nextSibling:null);
      triggerBtn.addEventListener('click',function(){
        var overlay=document.createElement('div');
        overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;animation:crmFadeIn 0.3s ease';
        var modal=document.createElement('div');
        modal.style.cssText='max-height:90vh;overflow-y:auto;width:100%;max-width:600px;position:relative';
        var closeBtn=document.createElement('button');
        closeBtn.textContent='✕';
        closeBtn.style.cssText='position:absolute;top:8px;right:8px;background:none;border:none;font-size:18px;cursor:pointer;color:#6b7280;z-index:1';
        closeBtn.addEventListener('click',function(){overlay.remove()});
        overlay.addEventListener('click',function(e){if(e.target===overlay)overlay.remove()});
        modal.appendChild(closeBtn);
        buildForm(data,modal);
        overlay.appendChild(modal);
        var style=document.createElement('style');
        style.textContent='@keyframes crmFadeIn{from{opacity:0}to{opacity:1}}';
        document.head.appendChild(style);
        document.body.appendChild(overlay);
      });
    }

    if(MODE==='sidebar'){
      var toggle=document.createElement('button');
      toggle.textContent='📋';
      toggle.style.cssText='position:fixed;right:0;top:50%;transform:translateY(-50%);z-index:99998;padding:12px;background:#3B82F6;color:#fff;border:none;border-radius:8px 0 0 8px;cursor:pointer;font-size:18px;box-shadow:-2px 0 10px rgba(0,0,0,0.1)';
      var panel=document.createElement('div');
      panel.style.cssText='position:fixed;right:-420px;top:0;width:400px;max-width:90vw;height:100%;z-index:99999;transition:right 0.3s ease;box-shadow:-4px 0 20px rgba(0,0,0,0.15);background:#fff;overflow-y:auto;padding:16px';
      var closePanel=document.createElement('button');
      closePanel.textContent='✕';
      closePanel.style.cssText='position:absolute;top:12px;right:12px;background:none;border:none;font-size:18px;cursor:pointer;color:#6b7280;z-index:1';
      var open=false;
      function togglePanel(){open=!open;panel.style.right=open?'0':'-420px'}
      toggle.addEventListener('click',togglePanel);
      closePanel.addEventListener('click',function(){open=false;panel.style.right='-420px'});
      panel.appendChild(closePanel);
      buildForm(data,panel);
      document.body.appendChild(toggle);
      document.body.appendChild(panel);
    }

  }).catch(function(err){console.warn('CRM Renove Form: erro ao carregar',err)});
})()`

  return `<!-- Formulário CRM Renove (dinâmico) -->
<script data-form-slug="${slug}">
${scriptBody}
</script>`
}

export function EmbedCodeCard({ slug, baseUrl }: Props) {
  const [type, setType] = useState<EmbedType>('inline')
  const [copied, setCopied] = useState(false)

  const code = generateEmbedCode(slug, baseUrl, type)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success('Código copiado!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Código Embed</h3>

      <div className="flex gap-1 flex-wrap">
        {(Object.keys(EMBED_LABELS) as EmbedType[]).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              type === t
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {EMBED_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="relative">
        <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto max-h-48 text-foreground">
          <code>{code}</code>
        </pre>
        <Button
          variant="outline"
          size="sm"
          className="absolute top-2 right-2 h-7 gap-1"
          onClick={handleCopy}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copiado' : 'Copiar'}
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground leading-tight">
        💡 O script é dinâmico — alterações no formulário refletem automaticamente no site. Pode levar até 1 minuto para atualizar.
      </p>
    </div>
  )
}
