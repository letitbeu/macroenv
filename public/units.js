(function(){
  const frame=document.getElementById('marketFrame');
  if(!frame)return;
  function applyUnits(){
    try{
      const d=frame.contentDocument;
      if(!d)return;
      const isEn=location.pathname==='/en'||location.pathname.startsWith('/en/');
      const bpsLabels=isEn?['5Day (bps)','MTD (bps)','YTD (bps)']:['5日 (bps)','月初至今 (bps)','年初至今 (bps)'];
      const rateSections=isEn?['US Treasury','Curvature','Credit Spread','DM Rates']:['美国国债','收益率曲线','信用利差','发达市场利率'];
      d.querySelectorAll('.section').forEach(sec=>{
        const name=(sec.querySelector('.section-name')?.textContent||'').trim();
        if(!rateSections.includes(name))return;
        const th=sec.querySelectorAll('thead th');
        if(th.length<5)return;
        th[2].textContent=bpsLabels[0];
        th[3].textContent=bpsLabels[1];
        th[4].textContent=bpsLabels[2];
      });
    }catch(e){}
  }
  frame.addEventListener('load',()=>{applyUnits();setTimeout(applyUnits,300);setTimeout(applyUnits,1200)});
})();
