const isEn=location.pathname==='/en'||location.pathname.startsWith('/en/');
const L=isEn?{
  title:'Automated Macro Interpretation · Institutional Cross-Asset Framework',
  tones:{bull:'Constructive',neutral:'Neutral',bear:'Cautious'},
  dn:{liquidity:'Liquidity / Financial Conditions',growth:'Growth / Earnings',inflation:'Inflation / Commodities',credit:'Credit'},
  st:{supportive:'Supportive',neutral:'Neutral',tight:'Tightening',strong:'Resilient',soft:'Soft',hot:'Reflationary',cool:'Contained',healthy:'Healthy',watch:'Watch',stress:'Stressed'}
}:{
  title:'自动宏观点评 · 机构跨资产框架',
  tones:{bull:'偏乐观',neutral:'中性',bear:'偏谨慎'},
  dn:{liquidity:'流动性 / 金融条件',growth:'增长 / 盈利',inflation:'通胀 / 商品',credit:'信用'},
  st:{supportive:'宽松 / 支持',neutral:'中性',tight:'收紧',strong:'韧性偏强',soft:'偏弱',hot:'再通胀偏热',cool:'温和',healthy:'健康',watch:'观察',stress:'承压'}
};
document.documentElement.lang=isEn?'en':'zh-CN';
document.getElementById('lang').innerHTML=isEn?'<a href="/zh">中文</a><span> | </span><b>EN</b>':'<b>中文</b><span> | </span><a href="/en">EN</a>';

const frame=document.getElementById('marketFrame');
frame.src=isEn?'/en/base':'/zh/base';
frame.addEventListener('load',()=>{
  try{
    const d=frame.contentDocument;
    const old=d.querySelector('.analysis');if(old)old.style.display='none';
    const sheet=d.querySelector('.sheet');
    const fit=()=>frame.style.height=((sheet?.scrollHeight||d.body.scrollHeight)+14)+'px';
    fit();setTimeout(fit,350);setTimeout(fit,1200);
  }catch(e){frame.style.height='1100px'}
});

const row=(rows,g,n)=>rows.find(r=>r.group===g&&r.name===n)||{};
const v=(r,k)=>Number.isFinite(r?.[k])?r[k]:null;
const s=(x,d=1)=>Number.isFinite(x)?`${x>0?'+':''}${Number(x).toFixed(d)}`:'—';
const n=(x,d=0)=>Number.isFinite(x)?Number(x).toFixed(d):'—';
const clamp=x=>Math.max(-2,Math.min(2,x));
const tone=x=>x>=1.05?'bull':x<=-1.05?'bear':'neutral';

function creditState(rows){
  const hy=v(row(rows,'Credit Spread','US HY'),'latest');
  return hy==null?'watch':hy<300?'healthy':hy<400?'watch':'stress';
}
function drivers(rows,key){
  const y10=v(row(rows,'US Treasury','10y'),key),hy=v(row(rows,'Credit Spread','US HY'),key),usd=v(row(rows,'Currency','USD Index'),key),vix=v(row(rows,'Equity','VIX'),key);
  const sp=v(row(rows,'Equity','S&P 500'),key),rut=v(row(rows,'Equity','Russell 2k'),key),semi=v(row(rows,'Equity','PHLX Semi'),key),cu=v(row(rows,'Commodity','Copper'),key),br=v(row(rows,'Commodity','Brent'),key);
  let liquidity=0,growth=0,inflation=0;
  if(y10!=null)liquidity+=y10<=-7?1:y10>=7?-1:y10<=-3?.5:y10>=3?-.5:0;
  if(hy!=null)liquidity+=hy<=-7?1:hy>=7?-1:hy<=-3?.5:hy>=3?-.5:0;
  if(usd!=null)liquidity+=usd<=-.75?.6:usd>=.75?-.6:0;
  if(vix!=null)liquidity+=vix<=-7?.5:vix>=7?-.5:0;
  if(cu!=null)growth+=cu>=2?1:cu<=-2?-1:cu>=.7?.5:cu<=-.7?-.5:0;
  if(rut!=null)growth+=rut>=1?.6:rut<=-1?-.6:0;
  if(sp!=null)growth+=sp>=.7?.5:sp<=-.7?-.5:0;
  if(semi!=null)growth+=semi>=2?.7:semi<=-2?-.7:0;
  if(br!=null)inflation+=br>=7?1.5:br>=3?1:br<=-5?-.8:br<=-3?-.5:0;
  return {liquidity:clamp(liquidity),growth:clamp(growth),inflation:clamp(inflation)};
}
function state(type,x){
  if(type==='liquidity')return x>=.7?'supportive':x<=-.7?'tight':'neutral';
  if(type==='growth')return x>=.7?'strong':x<=-.7?'soft':'neutral';
  return x>=.7?'hot':x<=-.5?'cool':'neutral';
}
function view(rows,key){
  const d=drivers(rows,key),c=creditState(rows);
  const score=1.15*d.liquidity+.95*d.growth-.95*d.inflation-(c==='stress'?1.5:c==='watch'?.35:0);
  const w={liquidity:Math.abs(d.liquidity)*1.15,growth:Math.abs(d.growth)*.95,inflation:Math.abs(d.inflation)*.95,credit:c==='stress'?1.5:c==='watch'?.35:.15};
  const primary=Object.entries(w).sort((a,b)=>b[1]-a[1])[0][0];
  return {d,c,score,tone:tone(score),primary};
}
function primaryText(rows,key){
  const x=view(rows,key);
  if(!isEn){
    if(x.primary==='liquidity')return x.d.liquidity<0?'主要约束来自流动性与金融条件收紧，而不是经济增长崩塌':'主要支撑来自流动性与金融条件改善';
    if(x.primary==='growth')return x.d.growth<0?'主要约束来自市场隐含的增长与盈利预期走弱':'主要支撑来自增长与盈利韧性';
    if(x.primary==='inflation')return x.d.inflation>0?'主要约束来自能源驱动的再通胀压力':'主要支撑来自通胀与商品压力缓和';
    return x.c==='stress'?'主要风险已转向信用收紧':'信用仍健康，系统性风险暂低';
  }
  if(x.primary==='liquidity')return x.d.liquidity<0?'The main constraint is tighter liquidity and financial conditions, not a collapse in growth':'The main support comes from easier liquidity and financial conditions';
  if(x.primary==='growth')return x.d.growth<0?'The main constraint is softer market-implied growth and earnings momentum':'The main support comes from resilient growth and earnings';
  if(x.primary==='inflation')return x.d.inflation>0?'The main constraint is energy-led reflation':'The main support comes from easing inflation and commodity pressure';
  return x.c==='stress'?'Credit tightening has become the dominant risk':'Credit remains healthy, limiting systemic downside';
}
function crossAsset(rows){
  const y10=row(rows,'US Treasury','10y'),usd=row(rows,'Currency','USD Index'),semi=row(rows,'Equity','PHLX Semi'),sp=row(rows,'Equity','S&P 500'),btc=row(rows,'Commodity','BTC'),jpy=row(rows,'Currency','JPY');
  const out=[];
  if(Number.isFinite(y10.d5)&&Number.isFinite(usd.d5)&&y10.d5>=3&&usd.d5<=-.5)out.push(isEn?'Long-end yields are rising while the dollar is weakening, pointing more to term-premium/fiscal/reflation pressure than a pure Fed-hawkish shock.':'长端利率上行而美元走弱，压力更偏期限溢价、财政供给与再通胀，而非单纯“美联储更鹰”。');
  if(Number.isFinite(semi.d5)&&Number.isFinite(sp.d5)&&semi.d5-sp.d5>=1.5)out.push(isEn?'Semiconductors are materially outperforming the broad index, indicating concentrated earnings leadership rather than broad-based risk appetite.':'半导体显著跑赢大盘，说明权益上涨更依赖盈利确定性与集中度，而不是全面风险偏好扩张。');
  if(Number.isFinite(btc.d5)&&Number.isFinite(semi.d5)&&btc.d5<0&&semi.d5>1)out.push(isEn?'Bitcoin is lagging high-beta technology, arguing against a broad liquidity-driven risk-on regime.':'BTC落后于高贝塔科技，说明当前并非广谱流动性驱动的 Risk-on。');
  if(Number.isFinite(jpy.d5)&&jpy.d5<=-2)out.push(isEn?'A sharp fall in USD/JPY signals yen appreciation and potential pressure on carry-trade leverage.':'美元兑日元显著下跌意味着日元升值，全球套息交易杠杆存在收缩压力。');
  return out;
}
function cards(rows){
  const d=drivers(rows,'d5'),c=creditState(rows),y10=row(rows,'US Treasury','10y'),hy=row(rows,'Credit Spread','US HY'),cu=row(rows,'Commodity','Copper'),sp=row(rows,'Equity','S&P 500'),br=row(rows,'Commodity','Brent');
  const items=[
    ['liquidity',state('liquidity',d.liquidity),isEn?`US 10Y ${s(y10.d5,0)}bp · HY ${s(hy.d5,0)}bp`:`10年美债 ${s(y10.d5,0)}bp · HY ${s(hy.d5,0)}bp`],
    ['growth',state('growth',d.growth),isEn?`Copper ${s(cu.d5)}% · S&P 500 ${s(sp.d5)}%`:`铜 ${s(cu.d5)}% · 标普500 ${s(sp.d5)}%`],
    ['inflation',state('inflation',d.inflation),isEn?`Brent 5D ${s(br.d5)}%`:`Brent 5日 ${s(br.d5)}%`],
    ['credit',c,isEn?`US HY ${n(hy.latest)}bp`:`美国高收益利差 ${n(hy.latest)}bp`]
  ];
  return items.map(x=>`<div class="driver"><small>${L.dn[x[0]]}</small><strong>${L.st[x[1]]}</strong><span>${x[2]}</span></div>`).join('');
}
function longTone(rows){
  const sp=row(rows,'Equity','S&P 500'),semi=row(rows,'Equity','PHLX Semi'),cu=row(rows,'Commodity','Copper'),hy=row(rows,'Credit Spread','US HY'),y10=row(rows,'US Treasury','10y'),br=row(rows,'Commodity','Brent');
  let x=0;
  if(Number.isFinite(sp.ytd))x+=sp.ytd>0?1:-1;
  if(Number.isFinite(semi.ytd))x+=semi.ytd>20?.8:semi.ytd>0?.4:-.6;
  if(Number.isFinite(cu.ytd))x+=cu.ytd>0?.5:-.5;
  if(Number.isFinite(hy.latest))x+=hy.latest<300?.8:hy.latest>=400?-1:0;
  if(Number.isFinite(y10.latest))x+=y10.latest>=5?-.8:y10.latest<4.4?.4:0;
  if(Number.isFinite(br.ytd)&&br.ytd>35)x-=.6;
  return tone(x);
}
function headline(rows){
  const st=view(rows,'d5'),c=creditState(rows),d=st.d;
  const g=state('growth',d.growth),l=state('liquidity',d.liquidity),i=state('inflation',d.inflation);
  const bias=L.tones[st.tone];
  if(!isEn){
    const regime=`当前组合：增长/盈利${L.st[g]}，流动性/金融条件${L.st[l]}，通胀/商品${L.st[i]}，信用${L.st[c]}。`;
    const credit=c==='healthy'?'信用尚未确认系统性风险，因此当前更像估值与久期压力，而不是信用杀。':c==='watch'?'信用进入观察区，需要确认金融条件是否向企业基本面传导。':'信用已明显承压，风险从估值问题升级为基本面与融资问题。';
    return `${regime} 短期${bias}：${primaryText(rows,'d5')}。${credit}`;
  }
  const regime=`Current mix: growth/earnings ${L.st[g].toLowerCase()}, liquidity/financial conditions ${L.st[l].toLowerCase()}, inflation/commodities ${L.st[i].toLowerCase()}, credit ${L.st[c].toLowerCase()}.`;
  const credit=c==='healthy'?'Credit does not confirm systemic stress, so the pressure is still primarily valuation/duration rather than credit.':c==='watch'?'Credit is in a watch zone; the key question is whether tighter financial conditions transmit into fundamentals.':'Credit is stressed, shifting the problem from valuation into fundamentals and financing.';
  return `${regime} Near-term stance: ${bias}. ${primaryText(rows,'d5')}. ${credit}`;
}
function narratives(rows){
  const y10=row(rows,'US Treasury','10y'),hy=row(rows,'Credit Spread','US HY'),br=row(rows,'Commodity','Brent'),sp=row(rows,'Equity','S&P 500'),semi=row(rows,'Equity','PHLX Semi'),btc=row(rows,'Commodity','BTC'),vix=row(rows,'Equity','VIX'),usd=row(rows,'Currency','USD Index'),curve=row(rows,'Curvature','2y10y'),cu=row(rows,'Commodity','Copper');
  const st=view(rows,'d5'),mt=view(rows,'mtd'),lt=longTone(rows),c=creditState(rows),cross=crossAsset(rows);
  if(!isEn){
    const short=`${primaryText(rows,'d5')}。过去5个交易日，10年美债 ${s(y10.d5,0)}bp、HY利差 ${s(hy.d5,0)}bp、Brent ${s(br.d5)}%、铜 ${s(cu.d5)}%、标普500 ${s(sp.d5)}%、费城半导体 ${s(semi.d5)}%、BTC ${s(btc.d5)}%。${c==='healthy'?'信用仍稳，当前更像“估值杀/久期杀”，而不是“信用杀”。':'信用不再完全稳定，需提高对基本面传导的警惕。'}${cross.length?' '+cross.join(' '):''}`;
    const medium=`${primaryText(rows,'mtd')}。本月至今，10年美债 ${s(y10.mtd,0)}bp、HY利差 ${s(hy.mtd,0)}bp、Brent ${s(br.mtd)}%、美元指数 ${s(usd.mtd)}%、VIX ${s(vix.mtd)}%。中期最重要的是“油价—长端利率—信用利差”是否共振：若 Brent 站上100–105美元、10年美债接近或突破5%、同时HY利差升向325bp以上，风险将从贴现率冲击升级为基本面/信用冲击；反之，若油价与长端利率回落且HY维持300bp以下，则更偏向高利率环境下的结构性震荡。`;
    const ltLead=lt==='bull'?'长期偏乐观主要来自盈利与增长韧性，而不是流动性宽松':lt==='bear'?'长期偏谨慎主要来自高资本成本与再通胀约束，而不是短期价格波动':'长期处于盈利韧性与高资本成本相互抵消的均衡';
    const long=`${ltLead}。年初至今标普500 ${s(sp.ytd)}%、费城半导体 ${s(semi.ytd)}%、铜 ${s(cu.ytd)}%、BTC ${s(btc.ytd)}%；美国HY利差当前 ${n(hy.latest)}bp，2年-10年曲线 ${n(curve.latest)}bp，10年美债 ${n(y10.latest,2)}%。只要信用保持稳定，长期核心不是“何时重新回到低利率”，而是EPS/ROIC能否持续覆盖更高的无风险利率与期限溢价；这意味着未来回报更依赖盈利兑现，而非PE扩张。`;
    return [['短期（1–2周）',L.tones[st.tone],st.primary,short],['中期（1–3个月）',L.tones[mt.tone],mt.primary,medium],['长期（6–12个月）',L.tones[lt],'growth',long]];
  }
  const short=`${primaryText(rows,'d5')}. Over 5 trading days: US 10Y ${s(y10.d5,0)}bp, HY spread ${s(hy.d5,0)}bp, Brent ${s(br.d5)}%, copper ${s(cu.d5)}%, S&P 500 ${s(sp.d5)}%, PHLX Semis ${s(semi.d5)}%, BTC ${s(btc.d5)}%. ${c==='healthy'?'Credit remains stable, so this is still a valuation/duration shock rather than a credit event.':'Credit is no longer fully benign, so the risk of transmission into fundamentals is rising.'}${cross.length?' '+cross.join(' '):''}`;
  const medium=`${primaryText(rows,'mtd')}. MTD: US 10Y ${s(y10.mtd,0)}bp, HY spread ${s(hy.mtd,0)}bp, Brent ${s(br.mtd)}%, DXY ${s(usd.mtd)}%, VIX ${s(vix.mtd)}%. The key medium-term test is whether oil, long-end rates and credit spreads reinforce one another. Brent above $100–105, US 10Y near/above 5%, and HY above ~325bp would mark a shift from discount-rate pressure into fundamental/credit tightening; falling oil and yields with HY below 300bp would favor a high-rate but non-systemic range regime.`;
  const ltLead=lt==='bull'?'The long-term constructive case is driven by earnings and growth resilience, not easy liquidity':lt==='bear'?'The long-term cautious case is driven by a high cost of capital and reflation, not short-term volatility':'The long-term regime reflects an offset between earnings resilience and a high cost of capital';
  const long=`${ltLead}. YTD: S&P 500 ${s(sp.ytd)}%, PHLX Semis ${s(semi.ytd)}%, copper ${s(cu.ytd)}%, BTC ${s(btc.ytd)}%; US HY is ${n(hy.latest)}bp, the 2Y-10Y curve is ${n(curve.latest)}bp, and US 10Y is ${n(y10.latest,2)}%. As long as credit remains stable, the core question is whether EPS/ROIC can outrun the higher risk-free rate and term premium. Future returns should therefore depend more on earnings delivery than multiple expansion.`;
  return [['Short term (1–2 weeks)',L.tones[st.tone],st.primary,short],['Medium term (1–3 months)',L.tones[mt.tone],mt.primary,medium],['Long term (6–12 months)',L.tones[lt],'growth',long]];
}
function render(rows){
  document.getElementById('analysisTitle').textContent=L.title;
  document.getElementById('regime').textContent=headline(rows);
  document.getElementById('drivers').innerHTML=cards(rows);
  document.getElementById('rows').innerHTML=narratives(rows).map(x=>`<div class="row"><div class="h">${x[0]}<br>${x[1]}<br><span class="tag">${L.dn[x[2]]}</span></div><div>${x[3]}</div></div>`).join('');
  document.getElementById('analysis').style.display='block';
}
fetch('/data/market.json?v=20260909-1105',{cache:'no-store'}).then(r=>r.json().then(j=>({ok:r.ok,j}))).then(({ok,j})=>{if(!ok)throw new Error(j.error||'API error');render(j.rows)}).catch(()=>{});
