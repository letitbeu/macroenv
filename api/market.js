const YAHOO_HOSTS = ['https://query1.finance.yahoo.com','https://query2.finance.yahoo.com'];
const FRED_CSV = 'https://fred.stlouisfed.org/graph/fredgraph.csv';
const JGB_CSV = 'https://www.mof.go.jp/english/policy/jgbs/reference/interest_rate/historical/jgbcme_all.csv';

const MARKET_ASSETS = [
  ['Equity','Dow Jones','^DJI',1],['Equity','S&P 500','^GSPC',1],['Equity','NASDAQ','^IXIC',1],['Equity','Russell 2k','^RUT',1],['Equity','PHLX Semi','^SOX',1],['Equity','VIX','^VIX',1],
  ['Equity','Euro Stox','^STOXX50E',1],['Equity','UK','^FTSE',1],['Equity','France','^FCHI',1],['Equity','Germany','^GDAXI',1],['Equity','Swiss','^SSMI',1],['Equity','Nikkei','^N225',1],['Equity','Hang Seng','^HSI',1],['Equity','CSI 300','000300.SS',1],['Equity','Taiwan','^TWII',1],['Equity','Singapore','^STI',1],['Equity','India','^BSESN',1],['Equity','Australia','^AXJO',1],
  ['Currency','USD Index','DX-Y.NYB',2],['Currency','EUR','EURUSD=X',2],['Currency','GBP','GBPUSD=X',2],['Currency','CHF','CHF=X',2],['Currency','JPY','JPY=X',2],['Currency','AUD','AUDUSD=X',2],['Currency','HKD','HKD=X',2],['Currency','THB','THB=X',2],['Currency','MYR','MYR=X',2],['Currency','INR','INR=X',2],['Currency','IDR','IDR=X',2],['Currency','KRW','KRW=X',2],['Currency','CNH','CNH=X',2],
  ['Commodity','Gold','GC=F',1],['Commodity','Silver','SI=F',1],['Commodity','Copper','HG=F',1],['Commodity','Brent','BZ=F',1],['Commodity','WTI','CL=F',1],['Commodity','N.Gas','NG=F',2],['Commodity','BTC','BTC-USD',1],['Commodity','ETH','ETH-USD',1],['Commodity','SOL','SOL-USD',1]
].map(([group,name,symbol,decimals])=>({group,name,symbol,decimals}));

const FRED_SERIES = [
  ['US Treasury','3m','DGS3MO',2],['US Treasury','1y','DGS1',2],['US Treasury','2y','DGS2',2],['US Treasury','5y','DGS5',2],['US Treasury','10y','DGS10',2],['US Treasury','30y','DGS30',2],
  ['Credit Spread','US IG','BAMLC0A0CM',1,100],['Credit Spread','US HY','BAMLH0A0HYM2',1,100],
  ['DM Rates','UK 10y','IRLTLT01GBM156N',2],['DM Rates','DE 10y','IRLTLT01DEM156N',2],['DM Rates','Italy 10y','IRLTLT01ITM156N',2],['DM Rates','Aussie 10y','IRLTLT01AUM156N',2]
].map(([group,name,id,decimals,multiplier=1])=>({group,name,id,decimals,multiplier}));

function num(x){const n=Number(x);return Number.isFinite(n)?n:null}
function pct(a,b){return a!=null&&b!=null&&b!==0?(a/b-1)*100:null}
function previousBefore(points,ts){for(let i=points.length-1;i>=0;i--)if(points[i].t<ts&&points[i].v!=null)return points[i].v;return null}
function firstOnOrAfter(points,ts){for(const p of points)if(p.t>=ts&&p.v!=null)return p.v;return null}

function stats(points, mode='pct', multiplier=1){
  const p=points.filter(x=>x.v!=null).sort((a,b)=>a.t-b.t); if(!p.length)return {latest:null,d5:null,mtd:null,ytd:null,asOf:null};
  const last=p[p.length-1], latest=last.v*multiplier;
  const d5base=(p.length>=6?p[p.length-6]:p[0]).v;
  const d=new Date(last.t), ms=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1), ys=Date.UTC(d.getUTCFullYear(),0,1);
  let mb=previousBefore(p,ms); if(mb==null)mb=firstOnOrAfter(p,ms)??p[0].v;
  let yb=previousBefore(p,ys); if(yb==null)yb=firstOnOrAfter(p,ys)??p[0].v;
  const ch=b=>mode==='bps'?(last.v-b)*100:pct(last.v,b);
  return {latest,d5:ch(d5base),mtd:ch(mb),ytd:ch(yb),asOf:new Date(last.t).toISOString().slice(0,10)};
}

function timeoutSignal(ms){
  const c=new AbortController();
  const timer=setTimeout(()=>c.abort(),ms);
  return {signal:c.signal,clear:()=>clearTimeout(timer)};
}

async function fetchYahooOne(meta){
  let lastErr=null;
  for(const host of YAHOO_HOSTS){
    const url=`${host}/v8/finance/chart/${encodeURIComponent(meta.symbol)}?range=1y&interval=1d&includePrePost=false&events=div%2Csplits`;
    const t=timeoutSignal(6500);
    try{
      const r=await fetch(url,{signal:t.signal,headers:{
        'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
        'Accept':'application/json,text/plain,*/*',
        'Accept-Language':'en-US,en;q=0.9'
      }});
      if(!r.ok){lastErr=new Error(`Yahoo ${meta.symbol} HTTP ${r.status}`);continue;}
      const j=await r.json();
      const result=j?.chart?.result?.[0];
      if(!result){lastErr=new Error(`Yahoo ${meta.symbol} empty`);continue;}
      const ts=result.timestamp||[];
      const close=result?.indicators?.quote?.[0]?.close||[];
      const pts=ts.map((x,i)=>({t:x*1000,v:num(close[i])})).filter(x=>x.v!=null);
      if(!pts.length){lastErr=new Error(`Yahoo ${meta.symbol} no prices`);continue;}
      return {...meta,...stats(pts,'pct',1),provider:'Yahoo Finance'};
    }catch(e){lastErr=e;}
    finally{t.clear();}
  }
  throw lastErr||new Error(`Yahoo ${meta.symbol} failed`);
}

async function mapLimit(items,limit,fn){
  const out=new Array(items.length); let next=0;
  async function worker(){
    while(true){
      const i=next++; if(i>=items.length)return;
      try{out[i]=await fn(items[i]);}
      catch(e){out[i]={...items[i],latest:null,d5:null,mtd:null,ytd:null,asOf:null,error:e?.message||String(e)};}
    }
  }
  await Promise.all(Array.from({length:Math.min(limit,items.length)},worker));
  return out;
}

async function fetchYahoo(){return mapLimit(MARKET_ASSETS,6,fetchYahooOne)}

function parseFred(text){
  return text.trim().split(/\r?\n/).slice(1).map(line=>{const i=line.indexOf(',');if(i<0)return null;const date=line.slice(0,i),v=num(line.slice(i+1));return v==null?null:{t:Date.parse(date+'T00:00:00Z'),v}}).filter(Boolean);
}
async function fetchFred(meta){
  const start=new Date(); start.setUTCFullYear(start.getUTCFullYear()-2); const cosd=start.toISOString().slice(0,10);
  const t=timeoutSignal(6500);
  try{
    const r=await fetch(`${FRED_CSV}?id=${encodeURIComponent(meta.id)}&cosd=${cosd}`,{signal:t.signal,headers:{'User-Agent':'Mozilla/5.0'}}); if(!r.ok)throw new Error(`FRED ${meta.id} HTTP ${r.status}`);
    const pts=parseFred(await r.text()); const s=stats(pts,'bps',meta.multiplier);
    return {...meta,...s,provider:'FRED'};
  }finally{t.clear();}
}

function curves(rows){
  const m=Object.fromEntries(rows.filter(x=>x.group==='US Treasury').map(x=>[x.name,x]));
  return [['2y10y','2y','10y'],['5y30y','5y','30y'],['10y30y','10y','30y']].map(([name,a,b])=>{
    const s=m[a],l=m[b]; const val=(x,y)=>x==null||y==null?null:y-x;
    return {group:'Curvature',name,decimals:1,latest:s&&l?val(s.latest,l.latest)*100:null,d5:s&&l?val(s.d5,l.d5):null,mtd:s&&l?val(s.mtd,l.mtd):null,ytd:s&&l?val(s.ytd,l.ytd):null,asOf:l?.asOf||s?.asOf||null};
  });
}

async function fetchJgb20(){
  const t=timeoutSignal(6500);
  try{
    const r=await fetch(JGB_CSV,{signal:t.signal,headers:{'User-Agent':'Mozilla/5.0'}}); if(!r.ok)throw new Error('JGB HTTP '+r.status);
    const text=await r.text(); const lines=text.split(/\r?\n/).filter(Boolean); let header=-1,idx=-1;
    for(let i=0;i<Math.min(lines.length,8);i++){const cols=lines[i].split(',').map(s=>s.trim().replace(/^"|"$/g,'')); const k=cols.findIndex(x=>x==='20Y'||x==='20'); if(k>=0){header=i;idx=k;break}}
    if(header<0)throw new Error('JGB 20Y column not found');
    const pts=[]; for(let i=header+1;i<lines.length;i++){const c=lines[i].split(',').map(s=>s.trim().replace(/^"|"$/g,'')); if(!c[0])continue; const v=num(c[idx]); if(v==null)continue; const parts=c[0].split('/').map(Number); if(parts.length!==3)continue; pts.push({t:Date.UTC(parts[0],parts[1]-1,parts[2]),v});}
    return {group:'DM Rates',name:'Japan 20y',decimals:2,...stats(pts,'bps',1),provider:'MOF Japan'};
  }catch(e){return {group:'DM Rates',name:'Japan 20y',decimals:2,latest:null,d5:null,mtd:null,ytd:null,asOf:null,error:e?.message||String(e)};}
  finally{t.clear();}
}

module.exports=async function handler(req,res){
  try{
    const [yahoo,fredSettled,japan]=await Promise.all([
      fetchYahoo(),
      Promise.allSettled(FRED_SERIES.map(fetchFred)),
      fetchJgb20()
    ]);
    const fred=fredSettled.map((x,i)=>x.status==='fulfilled'?x.value:{...FRED_SERIES[i],latest:null,d5:null,mtd:null,ytd:null,asOf:null,error:x.reason?.message||String(x.reason)});
    const order=['UK 10y','DE 10y','Italy 10y','Japan 20y','Aussie 10y'];
    const dm=[...fred.filter(x=>x.group==='DM Rates'),japan].sort((a,b)=>order.indexOf(a.name)-order.indexOf(b.name));
    const core=fred.filter(x=>x.group!=='DM Rates');
    const rows=[...core,...curves(core),...dm,...yahoo];
    const failures=rows.filter(x=>x.error).map(x=>({name:x.name,error:x.error}));
    res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=900');
    res.status(200).json({generatedAt:new Date().toISOString(),rows,failures});
  }catch(e){
    res.status(500).json({error:e?.message||String(e)});
  }
}
