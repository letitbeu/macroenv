const isEn=location.pathname==='/en'||location.pathname.startsWith('/en/');
const L=isEn?{
  title:'Automated Macro Interpretation',tones:{bull:'Constructive',neutral:'Neutral',bear:'Cautious'},
  dn:{liquidity:'Liquidity / Financial Conditions',growth:'Growth / Earnings',inflation:'Inflation / Commodities',credit:'Credit'},
  st:{supportive:'Supportive',neutral:'Neutral',tight:'Tightening',strong:'Resilient',soft:'Soft',hot:'Elevated',cool:'Contained',healthy:'Healthy',watch:'Watch',stress:'Stressed'}
}:{
  title:'自动宏观点评',tones:{bull:'偏乐观',neutral:'中性',bear:'偏谨慎'},
  dn:{liquidity:'流动性/金融条件',growth:'增长/盈利',inflation:'通胀/商品',credit:'信用'},
  st:{supportive:'宽松/支持',neutral:'中性',tight:'收紧',strong:'偏强',soft:'偏弱',hot:'偏热',cool:'温和',healthy:'健康',watch:'观察',stress:'承压'}
};
document.documentElement.lang=isEn?'en':'zh-CN';
document.getElementById('lang').innerHTML=isEn?'<a href="/zh">中文</a> &nbsp;|&nbsp; <b>EN</b>':'<b>中文</b> &nbsp;|&nbsp; <a href="/en">EN</a>';

const frame=document.getElementById('marketFrame');
frame.src=isEn?'/en/base':'/zh/base';
frame.addEventListener('load',()=>{
  try{
    const d=frame.contentDocument;
    const old=d.querySelector('.analysis'); if(old)old.style.display='none';
    const sw=d.querySelector('.lang-switch'); if(sw)sw.style.display='none';
    const sheet=d.querySelector('.sheet');
    const fit=()=>{frame.style.height=((sheet?.scrollHeight||d.body.scrollHeight)+12)+'px'};
    fit(); setTimeout(fit,500); setTimeout(fit,1800);
  }catch(e){frame.style.height='1000px'}
});

const row=(rows,g,n)=>rows.find(r=>r.group===g&&r.name===n)||{};
const val=(r,k)=>Number.isFinite(r?.[k])?r[k]:null;
const sign=(x,d=1)=>Number.isFinite(x)?`${x>0?'+':''}${Number(x).toFixed(d)}`:'—';
const num=(x,d=0)=>Number.isFinite(x)?Number(x).toFixed(d):'—';
const clamp=x=>Math.max(-2,Math.min(2,x));
const classify=x=>x>=1.1?'bull':x<=-1.1?'bear':'neutral';

function drivers(rows,key){
  const y10=val(row(rows,'US Treasury','10y'),key),hy=val(row(rows,'Credit Spread','US HY'),key),
    usd=val(row(rows,'Currency','USD Index'),key),vix=val(row(rows,'Equity','VIX'),key),
    sp=val(row(rows,'Equity','S&P 500'),key),rut=val(row(rows,'Equity','Russell 2k'),key),
    semi=val(row(rows,'Equity','PHLX Semi'),key),cu=val(row(rows,'Commodity','Copper'),key),
    brent=val(row(rows,'Commodity','Brent'),key);
  let liquidity=0,growth=0,inflation=0;
  if(y10!=null)liquidity+=y10<=-5?1:y10>=5?-1:0;
  if(hy!=null)liquidity+=hy<=-5?1:hy>=5?-1:0;
  if(usd!=null)liquidity+=usd<=-.5?.5:usd>=.5?-.5:0;
  if(vix!=null)liquidity+=vix<=-5?.4:vix>=5?-.4:0;
  if(cu!=null)growth+=cu>=1?1:cu<=-1?-1:0;
  if(rut!=null)growth+=rut>0?.5:-.5;
  if(sp!=null)growth+=sp>0?.4:-.4;
  if(semi!=null)growth+=semi>=1?.4:semi<=-1?-.4:0;
  if(brent!=null)inflation+=brent>=7?1.5:brent>=3?1:brent<=-5?-.8:brent<=-3?-.5:0;
  return {liquidity:clamp(liquidity),growth:clamp(growth),inflation:clamp(inflation)};
}
function credit(rows){
  const x=val(row(rows,'Credit Spread','US HY'),'latest');
  return x==null?'watch':x<300?'healthy':x<400?'watch':'stress';
}
function state(t,x){
  if(t==='liquidity')return x>=.75?'supportive':x<=-.75?'tight':'neutral';
  if(t==='growth')return x>=.75?'strong':x<=-.75?'soft':'neutral';
  return x>=.75?'hot':x<=-.5?'cool':'neutral';
}
function view(rows,key){
  const d=drivers(rows,key),c=credit(rows);
  let s=1.1*d.liquidity+.9*d.growth-.9*d.inflation-(c==='stress'?1.5:c==='watch'?.4:0);
  const weights={liquidity:Math.abs(d.liquidity)*1.1,growth:Math.abs(d.growth)*.9,inflation:Math.abs(d.inflation)*.9,credit:c==='stress'?1.5:c==='watch'?.4:.2};
  const primary=Object.entries(weights).sort((a,b)=>b[1]-a[1])[0][0];
  return {d,c,tone:classify(s),primary};
}
function driverSentence(rows,key){
  const v=view(rows,key);
  if(!isEn){
    if(v.primary==='liquidity')return v.d.liquidity<0?'主要约束来自流动性/金融条件收紧，而不是经济增长恶化':'主要支撑来自流动性/金融条件改善';
    if(v.primary==='growth')return v.d.growth<0?'主要约束来自市场隐含的增长/盈利预期走弱':'主要支撑来自增长与盈利韧性';
    if(v.primary==='inflation')return v.d.inflation>0?'主要约束来自能源与再通胀压力':'主要支撑来自通胀压力缓和';
    return v.c==='healthy'?'信用仍健康，系统性风险暂低':'信用条件正在成为主要风险源';
  }
  if(v.primary==='liquidity')return v.d.liquidity<0?'The main constraint is tighter liquidity/financial conditions, not a collapse in economic growth':'The main support comes from easier liquidity/financial conditions';
  if(v.primary==='growth')return v.d.growth<0?'The main constraint is softer market-implied growth/earnings momentum':'The main support comes from resilient growth and earnings';
  if(v.primary==='inflation')return v.d.inflation>0?'The main constraint is energy-led reflation pressure':'The main support comes from easing inflation pressure';
  return v.c==='healthy'?'Credit remains healthy, limiting systemic downside':'Credit deterioration is becoming the dominant risk';
}
function cards(rows){
  const d=drivers(rows,'d5'),c=credit(rows),y10=row(rows,'US Treasury','10y'),hy=row(rows,'Credit Spread','US HY'),
    cu=row(rows,'Commodity','Copper'),sp=row(rows,'Equity','S&P 500'),br=row(rows,'Commodity','Brent');
  const items=[
    ['liquidity',state('liquidity',d.liquidity),isEn?`US 10Y ${sign(y10.d5,0)}bp; HY ${sign(hy.d5,0)}bp`:`10年美债 ${sign(y10.d5,0)}bp；HY ${sign(hy.d5,0)}bp`],
    ['growth',state('growth',d.growth),isEn?`Copper ${sign(cu.d5)}%; S&P 500 ${sign(sp.d5)}%`:`铜 ${sign(cu.d5)}%；标普500 ${sign(sp.d5)}%`],
    ['inflation',state('inflation',d.inflation),isEn?`Brent 5D ${sign(br.d5)}%`:`Brent 5日 ${sign(br.d5)}%`],
    ['credit',c,isEn?`US HY ${num(hy.latest)}bp`:`美国HY ${num(hy.latest)}bp`]
  ];
  return items.map(x=>`<div class="driver"><small>${L.dn[x[0]]}</small><strong>${L.st[x[1]]}</strong><span>${x[2]}</span></div>`).join('');
}
function longTone(rows){
  const sp=row(rows,'Equity','S&P 500'),semi=row(rows,'Equity','PHLX Semi'),cu=row(rows,'Commodity','Copper'),
    hy=row(rows,'Credit Spread','US HY'),y10=row(rows,'US Treasury','10y'),br=row(rows,'Commodity','Brent');
  let s=0;
  if(Number.isFinite(sp.ytd))s+=sp.ytd>0?1:-1;
  if(Number.isFinite(semi.ytd))s+=semi.ytd>0?.6:-.6;
  if(Number.isFinite(cu.ytd))s+=cu.ytd>0?.5:-.5;
  if(Number.isFinite(hy.ytd))s+=hy.ytd<0?.8:-.8;
  if(Number.isFinite(y10.ytd))s+=y10.ytd>50?-.7:y10.ytd<0?.4:0;
  if(Number.isFinite(br.ytd))s+=br.ytd>30?-.7:0;
  return classify(s);
}
function regime(rows){
  const st=view(rows,'d5'),y10=row(rows,'US Treasury','10y'),br=row(rows,'Commodity','Brent'),
    cu=row(rows,'Commodity','Copper'),semi=row(rows,'Equity','PHLX Semi'),c=credit(rows);
  if(!isEn){
    const bias=st.tone==='bear'?'短期偏谨慎':st.tone==='bull'?'短期偏乐观':'短期中性';
    const cr=c==='healthy'?'信用利差仍低，暂不支持衰退或系统性风险叙事':c==='watch'?'信用进入观察区，需要监测金融条件向基本面传导':'信用明显承压，风险已从估值问题向基本面问题升级';
    return `${bias}：${driverSentence(rows,'d5')}。10年美债5日 ${sign(y10.d5,0)}bp、Brent ${sign(br.d5)}%、铜 ${sign(cu.d5)}%、费城半导体 ${sign(semi.d5)}%；${cr}。`;
  }
  const bias=st.tone==='bear'?'Cautious near term':st.tone==='bull'?'Constructive near term':'Neutral near term';
  const cr=c==='healthy'?'Credit spreads remain low and do not confirm a recession/systemic-risk regime':c==='watch'?'Credit is in a watch zone; transmission from financial conditions into fundamentals must be monitored':'Credit is clearly stressed, shifting the problem from valuation to fundamentals';
  return `${bias}: ${driverSentence(rows,'d5')}. US 10Y 5D ${sign(y10.d5,0)}bp, Brent ${sign(br.d5)}%, copper ${sign(cu.d5)}%, PHLX Semis ${sign(semi.d5)}%; ${cr}.`;
}
function narratives(rows){
  const y10=row(rows,'US Treasury','10y'),hy=row(rows,'Credit Spread','US HY'),br=row(rows,'Commodity','Brent'),
    sp=row(rows,'Equity','S&P 500'),btc=row(rows,'Commodity','BTC'),vix=row(rows,'Equity','VIX'),usd=row(rows,'Currency','USD Index'),
    curve=row(rows,'Curvature','2y10y'),cu=row(rows,'Commodity','Copper'),semi=row(rows,'Equity','PHLX Semi'),c=credit(rows),
    st=view(rows,'d5'),mt=view(rows,'mtd'),lt=longTone(rows);
  if(!isEn){
    const a=`${driverSentence(rows,'d5')}。过去5个交易日，10年美债 ${sign(y10.d5,0)}bp、HY利差 ${sign(hy.d5,0)}bp、Brent ${sign(br.d5)}%、铜 ${sign(cu.d5)}%、标普500 ${sign(sp.d5)}%、费城半导体 ${sign(semi.d5)}%。${c==='healthy'?'信用仍稳，因此当前更像估值/久期压力，而不是信用杀。':'信用不再完全稳定，需要提高对基本面传导的权重。'}`;
    const b=`${driverSentence(rows,'mtd')}。本月至今，10年美债 ${sign(y10.mtd,0)}bp、HY利差 ${sign(hy.mtd,0)}bp、Brent ${sign(br.mtd)}%、美元指数 ${sign(usd.mtd)}%、VIX ${sign(vix.mtd)}%。中期要看利率—能源—信用是否形成共振；若长端利率和油价继续上行且HY同步走阔，风险将从贴现率冲击升级为基本面/信用冲击。`;
    const ld=lt==='bull'?'长期偏乐观主要来自盈利与增长韧性，而不是流动性宽松':lt==='bear'?'长期偏谨慎主要来自高资本成本与再通胀约束，而不是短期波动本身':'长期处于盈利韧性与高资本成本相互抵消的状态';
    const d=`${ld}。年初至今标普500 ${sign(sp.ytd)}%、费城半导体 ${sign(semi.ytd)}%、铜 ${sign(cu.ytd)}%、BTC ${sign(btc.ytd)}%、HY利差 ${sign(hy.ytd,0)}bp；2年-10年曲线当前 ${num(curve.latest)}bp。只要信用维持稳定，长期定价核心仍是EPS/ROIC能否覆盖更高的无风险利率与期限溢价。`;
    return [['短期（1–2周）',L.tones[st.tone],st.primary,a],['中期（1–3个月）',L.tones[mt.tone],mt.primary,b],['长期（6–12个月）',L.tones[lt],'growth',d]];
  }
  const a=`${driverSentence(rows,'d5')}. Over 5 trading days, US 10Y ${sign(y10.d5,0)}bp, HY spread ${sign(hy.d5,0)}bp, Brent ${sign(br.d5)}%, copper ${sign(cu.d5)}%, S&P 500 ${sign(sp.d5)}%, PHLX Semis ${sign(semi.d5)}%. ${c==='healthy'?'Credit remains stable, so this still looks more like a valuation/duration shock than a credit event.':'Credit is no longer fully benign, so the weight on fundamental transmission should rise.'}`;
  const b=`${driverSentence(rows,'mtd')}. MTD: US 10Y ${sign(y10.mtd,0)}bp, HY spread ${sign(hy.mtd,0)}bp, Brent ${sign(br.mtd)}%, DXY ${sign(usd.mtd)}%, VIX ${sign(vix.mtd)}%. The medium-term question is whether rates, energy and credit reinforce one another; if they do, the regime shifts from discount-rate pressure to fundamental/credit tightening.`;
  const ld=lt==='bull'?'The long-term constructive case is driven by earnings and growth resilience, not by easy liquidity':lt==='bear'?'The long-term cautious case is driven by high capital costs and reflation constraints, not by short-term volatility alone':'The long-term balance is between resilient earnings and persistently high capital costs';
  const d=`${ld}. YTD: S&P 500 ${sign(sp.ytd)}%, PHLX Semis ${sign(semi.ytd)}%, copper ${sign(cu.ytd)}%, BTC ${sign(btc.ytd)}%, HY spread ${sign(hy.ytd,0)}bp; the 2Y-10Y curve is ${num(curve.latest)}bp. As long as credit remains contained, the core question is whether EPS/ROIC can outrun the higher risk-free rate and term premium.`;
  return [['Short term (1–2 weeks)',L.tones[st.tone],st.primary,a],['Medium term (1–3 months)',L.tones[mt.tone],mt.primary,b],['Long term (6–12 months)',L.tones[lt],'growth',d]];
}
function render(rows){
  document.getElementById('analysisTitle').textContent=L.title;
  document.getElementById('regime').textContent=regime(rows);
  document.getElementById('drivers').innerHTML=cards(rows);
  document.getElementById('rows').innerHTML=narratives(rows).map(x=>`<div class="row"><div class="h">${x[0]}<br>${x[1]}<br><span class="tag">${L.dn[x[2]]}</span></div><div>${x[3]}</div></div>`).join('');
  document.getElementById('analysis').style.display='block';
}
fetch('/data/market.json',{cache:'no-store'}).then(r=>r.json().then(j=>({ok:r.ok,j}))).then(({ok,j})=>{if(!ok)throw new Error(j.error||'API error');render(j.rows)}).catch(()=>{});
