/* R2.1 · refinement in addition to the existing non-destructive R2 layer.
   The preview is computed locally from the actual Logistic equation.
   Grading, original experiments, credentials and persisted events are untouched. */
const scientificPreview=()=>{
 let x=.41200,y=.41201;const points=[];
 for(let n=0;n<66;n++){points.push({n,x,y});x=3.9*x*(1-x);y=3.9*y*(1-y)}
 const trace=key=>points.map((v,i)=>(i?'L':'M')+(31+i*5.67).toFixed(2)+','+(191-v[key]*130).toFixed(2)).join(' ');
 const grid=[0,.5,1].map(v=>{const line=(191-v*130).toFixed(2);return '<line x1="31" x2="402" y1="'+line+'" y2="'+line+'" stroke="#b1d6d3" opacity=".2"/><text x="7" y="'+(+line+4)+'" fill="#c3ddda" font-size="11">'+v+'</text>'}).join('');
 const ticks=[0,20,40,60].map(n=>'<text x="'+(31+n*5.67).toFixed(1)+'" y="212" text-anchor="middle" fill="#c2d8d5" font-size="10">'+n+'</text>').join('');
 return '<div class="r2-science" role="img" aria-label="Logistic 本地计算预览。r 等于 3.9，两条初值仅相差十万分之一的轨迹迭代 66 步">'+
 '<span class="r2-science-label">初值敏感性 · Logistic r = 3.9</span>'+
 '<svg viewBox="0 0 430 240" aria-hidden="true">'+grid+
 '<path d="'+trace('x')+'" fill="none" stroke="#f3d49e" stroke-width="2.1" stroke-linejoin="round"/>'+
 '<path d="'+trace('y')+'" fill="none" stroke="#8de2d4" stroke-width="2.1" stroke-linejoin="round"/>'+
 ticks+'<text x="406" y="232" text-anchor="end" fill="#c2d8d5" font-size="10">迭代次数 n</text></svg>'+
 '<div class="r2-science-note"><span><i></i>x₀ = 0.41200</span><span><i></i>x₀ = 0.41201</span></div></div>'
}
function refineR21(){
 const main=document.getElementById('main'); if(!main)return;
 // Preserve the accessible, readable server-rendered fallback while the main app is unavailable.
 if(main.querySelector('[data-initial-shell]'))return;
 const cover=main.querySelector('.reading-hero .reading-cover');
 if(!cover)return;
 // The computed scientific visualization is instructional content, not decorative art.
 cover.removeAttribute('aria-hidden');
 const title=main.querySelector('.page>.large-title');
 if(title&&title.textContent!=='继续学习')title.textContent='继续学习';
 if(cover.dataset.refinedR21)return;
 cover.dataset.refinedR21='true';
 cover.innerHTML=scientificPreview();
}
const mainR21=document.getElementById('main');
if(mainR21){refineR21();const obs=new MutationObserver(()=>{obs.disconnect();try{refineR21()}finally{obs.observe(mainR21,{childList:true})}});obs.observe(mainR21,{childList:true})}
