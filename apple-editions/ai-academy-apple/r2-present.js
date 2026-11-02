/* Science-first presentation, executed synchronously in the real application's render.
   Motion Lab R2.4 insight: single visual owner; no competing MutationObservers.
   Does not implement or alter grading, teacher calls, Original bridge, or V2 storage. */
const previewLogistic=()=>{
 const rows=[];let a=.41200,b=.41201;
 for(let i=0;i<66;i++){rows.push([i,a,b]);a=3.9*a*(1-a);b=3.9*b*(1-b)}
 const trace=(idx)=>rows.map((r,i)=>(i?'L':'M')+(31+r[0]*5.67).toFixed(2)+','+(191-r[idx]*130).toFixed(2)).join(' ');
 const grid=[0,.5,1].map(v=>{const y=(191-v*130).toFixed(2);return '<line x1="31" x2="402" y1="'+y+'" y2="'+y+'" stroke="#b1d6d3" opacity=".2"/><text x="7" y="'+(+y+4)+'" fill="#c3ddda" font-size="11">'+v+'</text>'}).join('');
 const ticks=[0,20,40,60].map(n=>'<text x="'+(31+n*5.67).toFixed(1)+'" y="212" text-anchor="middle" fill="#c2d8d5" font-size="10">'+n+'</text>').join('');
 return '<div class="r2-science" role="img" aria-label="Logistic 迭代数值预览：参数 r 为 3.9，两个初始值为 0.41200 和 0.41201，66 次迭代">'+
 '<span class="r2-science-label">初值敏感性 · Logistic r = 3.9</span>'+
 '<svg viewBox="0 0 430 240" aria-hidden="true">'+grid+
 '<path d="'+trace(1)+'" fill="none" stroke="#f3d49e" stroke-width="2.1" stroke-linejoin="round"/>'+
 '<path d="'+trace(2)+'" fill="none" stroke="#8de2d4" stroke-width="2.1" stroke-linejoin="round"/>'+ticks+'</svg>'+
 '<div class="r2-science-note"><span><i></i>x₀ = 0.41200</span><span><i></i>x₀ = 0.41201</span></div></div>'
};
const courseArt=(kind)=>{
 if(kind==='logistic'){
  const pts=[];let a=.41;
  for(let n=0;n<48;n++){pts.push((n?'L':'M')+(n*5.8+10).toFixed(1)+','+(118-a*96).toFixed(1));a=3.9*a*(1-a)}
  return '<svg viewBox="0 0 300 130" role="img" aria-label="根据 Logistic 方程计算的曲线"><path d="'+pts.join(' ')+'" fill="none" stroke="#a6e8dc" stroke-width="2.2"/></svg>'
 }
 return '<svg viewBox="0 0 300 130" role="img" aria-label="演化模拟课程关系示意"><g stroke="#b6c7fa" fill="none" stroke-width="2"><path d="M45 85L95 34 150 94 210 48 261 84"/><circle cx="45" cy="85" r="13"/><circle cx="95" cy="34" r="17"/><circle cx="150" cy="94" r="15"/><circle cx="210" cy="48" r="17"/><circle cx="261" cy="84" r="13"/></g></svg>'
};
export function decorateZhixuR2(main){
 const hero=main.querySelector('.reading-hero');
 if(hero){
  const heading=main.querySelector('.page>.large-title');
  if(heading)heading.textContent='继续学习';
  const cover=hero.querySelector('.reading-cover');
  if(cover){cover.removeAttribute('aria-hidden');cover.innerHTML=previewLogistic();}
 }
 main.querySelectorAll('.course-world .big-symbol').forEach((el,i)=>{
  el.innerHTML=courseArt(i%2?'evo':'logistic');
 });
}
