import { createClient } from 'npm:@supabase/supabase-js@2'

/**
 * AIDEV-NOTE: Edge Function para gerar widget de planos embeddable
 * Retorna JavaScript vanilla que renderiza os planos em qualquer página HTML.
 * Padrão: mesmo de widget-formulario-loader (fetch dados → gera JS como string)
 *
 * Uso:
 *   <div id="renove-pricing-widget"></div>
 *   <script src="[URL]/functions/v1/pricing-widget-loader?periodo=mensal" async></script>
 *
 * Params opcionais:
 *   ?periodo=mensal|anual  → período padrão exibido
 *   ?ref=CODIGO            → código de parceiro pré-aplicado
 *   ?ocultar_trial=true    → ocultar plano trial
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const periodo = url.searchParams.get('periodo') || 'mensal'
  const ref = url.searchParams.get('ref') || ''
  const ocultarTrial = url.searchParams.get('ocultar_trial') === 'true'

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

  // deno-lint-ignore no-explicit-any
  const supabase = createClient<any>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Buscar planos ativos e visíveis
  const { data: planos, error: planosError } = await supabase
    .from('planos')
    .select('id, nome, descricao, preco_mensal, preco_anual, limite_usuarios, limite_oportunidades, limite_storage_mb, ativo, visivel, ordem, popular')
    .eq('ativo', true)
    .eq('visivel', true)
    .order('ordem', { ascending: true })

  if (planosError || !planos) {
    return new Response('// Error: failed to load plans', {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/javascript; charset=utf-8' },
    })
  }

  // Buscar config de trial
  const { data: configStripe } = await supabase
    .from('configuracoes_globais')
    .select('configuracoes')
    .eq('plataforma', 'stripe')
    .single()

  const stripeConfig = (configStripe?.configuracoes || {}) as Record<string, unknown>
  const trialHabilitado = stripeConfig.trial_habilitado !== false
  const trialDias = (stripeConfig.trial_dias as number) || 14

  // URL de checkout (para redirecionar ao flow existente)
  const checkoutBase = SUPABASE_URL + '/functions/v1/create-checkout-session'
  const appUrl = 'https://crm.renovedigital.com.br'

  const js = getPricingScript({
    planos,
    periodo,
    ref,
    ocultarTrial,
    trialHabilitado,
    trialDias,
    checkoutBase,
    appUrl,
    supabaseUrl: SUPABASE_URL,
    anonKey: ANON_KEY,
  })

  return new Response(js, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=60, s-maxage=60',
    },
  })
})

interface PricingScriptOptions {
  // deno-lint-ignore no-explicit-any
  planos: any[]
  periodo: string
  ref: string
  ocultarTrial: boolean
  trialHabilitado: boolean
  trialDias: number
  checkoutBase: string
  appUrl: string
  supabaseUrl: string
  anonKey: string
}

function getPricingScript(opts: PricingScriptOptions): string {
  const {
    planos,
    periodo,
    ref,
    ocultarTrial,
    trialHabilitado,
    trialDias,
    checkoutBase,
    appUrl,
    anonKey,
  } = opts

  const planosJson = JSON.stringify(planos)
  const parts: string[] = []

  parts.push('(function(){')
  parts.push("var PLANOS=" + planosJson + ";")
  parts.push("var PERIODO='" + periodo + "';")
  parts.push("var REF='" + ref + "';")
  parts.push("var OCULTAR_TRIAL=" + (ocultarTrial ? 'true' : 'false') + ";")
  parts.push("var TRIAL_HABILITADO=" + (trialHabilitado ? 'true' : 'false') + ";")
  parts.push("var TRIAL_DIAS=" + trialDias + ";")
  parts.push("var CHECKOUT_BASE='" + checkoutBase + "';")
  parts.push("var APP_URL='" + appUrl + "';")
  parts.push("var ANON='" + anonKey + "';")

  // Encontrar container
  parts.push("var container=document.getElementById('renove-pricing-widget');")
  parts.push("if(!container){var s=document.currentScript;container=document.createElement('div');s.parentNode.insertBefore(container,s.nextSibling);}")

  // Injetar estilos scoped
  parts.push("var style=document.createElement('style');")
  parts.push("style.textContent=" + JSON.stringify(getPricingStyles()) + ";")
  parts.push("document.head.appendChild(style);")

  // Estado
  parts.push("var periodo=PERIODO;")
  parts.push("var loadingId=null;")

  // Funções utilitárias
  parts.push("function fmt(n){return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:0}).format(n);}")
  parts.push("function fmtStorage(mb){if(!mb)return 'Ilimitado';if(mb>=1024)return(mb/1024).toFixed(0)+'GB';return mb+'MB';}")
  parts.push("function fmtLimit(n){if(!n||n>=999999)return 'Ilimitado';return n.toLocaleString('pt-BR');}")

  // Renderizar planos
  parts.push("function render(){")
  parts.push("  var planosVisiveis=PLANOS.filter(function(p){")
  parts.push("    if(OCULTAR_TRIAL&&(!p.preco_mensal||p.preco_mensal===0))return false;")
  parts.push("    if(!TRIAL_HABILITADO&&(!p.preco_mensal||p.preco_mensal===0))return false;")
  parts.push("    return true;")
  parts.push("  });")
  parts.push("  var planosComAnual=PLANOS.filter(function(p){return p.preco_mensal>0&&p.preco_anual>0;});")
  parts.push("  var desc=planosComAnual.length>0?Math.round(planosComAnual.reduce(function(a,p){return a+((p.preco_mensal*12-p.preco_anual)/(p.preco_mensal*12))*100;},0)/planosComAnual.length):0;")

  // HTML do toggle
  parts.push("  var toggleHtml='<div class=\"rnv-toggle\"><button class=\"rnv-btn-toggle'+(periodo===\"mensal\"?\" rnv-active\":\"\"+'\"') + ' onclick=\"window._rnvSetPeriodo(\\\"mensal\\\")\">Mensal</button><button class=\"rnv-btn-toggle'+(periodo===\"anual\"?\" rnv-active\":\"\")+'\">Anual'+(desc>0?'<span class=\"rnv-badge\">-'+desc+'%</span>':'')+'</button></div>';")

  // Cards HTML
  parts.push("  var cardsHtml='<div class=\"rnv-grid\">';")
  parts.push("  planosVisiveis.forEach(function(p){")
  parts.push("    var isTrial=!p.preco_mensal||p.preco_mensal===0;")
  parts.push("    var preco=periodo==='anual'&&p.preco_anual?p.preco_anual:p.preco_mensal;")
  parts.push("    var precoMensal=periodo==='anual'&&p.preco_anual?p.preco_anual/12:null;")
  parts.push("    var popular=p.popular?'rnv-card rnv-popular':'rnv-card';")
  parts.push("    var precoHtml=isTrial?'<span class=\"rnv-price\">Grátis</span>':preco?'<span class=\"rnv-price\">'+fmt(preco)+'</span><span class=\"rnv-period\">'+(periodo==='anual'?'/ano':'/mês')+'</span>'+(precoMensal?'<div class=\"rnv-price-sub\">'+fmt(precoMensal)+'/mês</div>':''):'<span class=\"rnv-price\">Sob consulta</span>';")
  parts.push("    var badge=p.popular?'<div class=\"rnv-badge-popular\">Popular</div>':'';")
  parts.push("    var trialBadge=isTrial?'<div class=\"rnv-trial-badge\">Teste grátis '+TRIAL_DIAS+' dias</div>':'';")
  parts.push("    var loadingThis=loadingId===p.id;")
  parts.push("    var btnText=loadingThis?'Aguarde...':(isTrial?'Iniciar teste grátis':'Assinar '+p.nome);")
  parts.push("    cardsHtml+='<div class=\"'+popular+'\">'+badge+'<h3 class=\"rnv-plan-name\">'+p.nome+'</h3>'+trialBadge+'<div class=\"rnv-price-wrap\">'+precoHtml+'</div><ul class=\"rnv-features\"><li>✓ '+fmtLimit(p.limite_usuarios)+' usuários</li><li>✓ '+fmtStorage(p.limite_storage_mb)+' storage</li>'+(p.limite_oportunidades?'<li>✓ '+fmtLimit(p.limite_oportunidades)+' oportunidades</li>':'')+'</ul><button class=\"rnv-btn'+(p.popular?' rnv-btn-primary':' rnv-btn-secondary')+'\" onclick=\"window._rnvCheckout(\\\"'+p.id+'\\\",\\\"'+p.nome+'\\\",'+isTrial+')\" '+(loadingThis?'disabled':'')+'>'+btnText+'</button></div>';")
  parts.push("  });")
  parts.push("  cardsHtml+='</div>';")

  // Rodapé
  parts.push("  var footer='<p class=\"rnv-footer\">Cancele quando quiser • Suporte incluído</p>';")

  // Injetar no container
  parts.push("  container.innerHTML='<div class=\"rnv-wrap\">'+toggleHtml+cardsHtml+footer+'</div>';")

  // Reativar botão anual (onclick inline não funciona bem com template, usar addEventListener)
  parts.push("  var btns=container.querySelectorAll('.rnv-btn-toggle');")
  parts.push("  btns[0].addEventListener('click',function(){window._rnvSetPeriodo('mensal');});")
  parts.push("  btns[1].addEventListener('click',function(){window._rnvSetPeriodo('anual');});")
  parts.push("}")

  // Ações globais
  parts.push("window._rnvSetPeriodo=function(p){periodo=p;render();};")

  parts.push("window._rnvCheckout=function(planoId,planoNome,isTrial){")
  parts.push("  if(loadingId)return;")
  parts.push("  if(isTrial){window.location.href=APP_URL+'/trial'+(REF?'?ref='+REF:'');return;}")
  parts.push("  loadingId=planoId;render();")
  parts.push("  var body=JSON.stringify({plano_id:planoId,periodo:periodo,is_trial:false,utms:{},codigo_parceiro:REF||undefined});")
  parts.push("  fetch(CHECKOUT_BASE,{method:'POST',headers:{'Content-Type':'application/json','apikey':ANON,'Authorization':'Bearer '+ANON},body:body})")
  parts.push("  .then(function(r){return r.json();})")
  parts.push("  .then(function(d){if(d.url){window.location.href=d.url;}else{alert('Erro ao iniciar checkout.');loadingId=null;render();};})")
  parts.push("  .catch(function(){alert('Erro ao iniciar checkout. Tente novamente.');loadingId=null;render();});")
  parts.push("};")

  parts.push("render();")
  parts.push("})()")

  return parts.join('\n')
}

function getPricingStyles(): string {
  return `
.rnv-wrap{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:1200px;margin:0 auto;padding:24px 16px;box-sizing:border-box;}
.rnv-toggle{display:flex;align-items:center;justify-content:center;gap:4px;background:#f1f5f9;border-radius:8px;padding:4px;margin-bottom:32px;}
.rnv-btn-toggle{background:transparent;border:none;padding:8px 20px;border-radius:6px;font-size:14px;font-weight:500;cursor:pointer;color:#64748b;transition:all .2s;}
.rnv-btn-toggle.rnv-active{background:#fff;color:#0f172a;box-shadow:0 1px 3px rgba(0,0,0,.1);}
.rnv-badge{display:inline-block;margin-left:6px;background:#3b82f6;color:#fff;font-size:11px;font-weight:700;border-radius:99px;padding:1px 6px;}
.rnv-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px;}
.rnv-card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;display:flex;flex-direction:column;position:relative;}
.rnv-popular{border-color:#3b82f6;box-shadow:0 4px 24px rgba(59,130,246,.15);}
.rnv-badge-popular{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#3b82f6;color:#fff;font-size:11px;font-weight:700;border-radius:99px;padding:3px 12px;white-space:nowrap;}
.rnv-plan-name{font-size:18px;font-weight:600;color:#0f172a;margin:0 0 4px;}
.rnv-trial-badge{font-size:12px;color:#64748b;margin-bottom:8px;}
.rnv-price-wrap{margin:16px 0;}
.rnv-price{font-size:28px;font-weight:700;color:#3b82f6;}
.rnv-period{font-size:13px;color:#94a3b8;margin-left:2px;}
.rnv-price-sub{font-size:12px;color:#94a3b8;margin-top:2px;}
.rnv-features{list-style:none;padding:0;margin:0 0 20px;flex:1;}
.rnv-features li{font-size:13px;color:#475569;padding:4px 0;}
.rnv-btn{width:100%;padding:10px;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;border:none;transition:all .2s;margin-top:auto;}
.rnv-btn:disabled{opacity:.6;cursor:not-allowed;}
.rnv-btn-primary{background:#3b82f6;color:#fff;}
.rnv-btn-primary:hover:not(:disabled){background:#2563eb;}
.rnv-btn-secondary{background:transparent;border:1px solid #e2e8f0;color:#0f172a;}
.rnv-btn-secondary:hover:not(:disabled){background:#f8fafc;}
.rnv-footer{text-align:center;font-size:12px;color:#94a3b8;margin-top:24px;}
@media(max-width:640px){.rnv-grid{grid-template-columns:1fr;}}
`
}
