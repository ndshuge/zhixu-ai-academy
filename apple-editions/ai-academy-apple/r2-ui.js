/* R2 visual enhancement: presentation only, original API/answer/event model untouched */
const plot=()=>{
 const pts=[];let a=.412,b=.41201;const r=3.9;
 for(let i=0;i<74;i++){pts.push([i,a,b]);a=r*a*(1-a);b=r*b*(1-b)}
 const path=(idx)=>pts.map((p,i)=>(i?'L':'M')+(27+p[0]*5.05).toFixed(1)+' '+(175-p[idx]*132).toFixed(1)).join(' ');
 const grid=[0,1,2,3].map(i=>'<line x1="27" x2="400" y1="'+(43+i*44)+'" y2="'+(43+i*44)+'" stroke="#8ac5bb" opacity=".15"/>').join('');
 return '<div class="r2-science" role="img" aria-label="Logistic 真实数值计算预览，两条几乎相同初值的轨迹逐步分离"><span class="r2-science-label">LOGISTIC MAP · r = 3.9</span><svg viewBox="0 0 426 220" aria-hidden="true"><g>'+grid+'</g><path d="'+path(1)+'" fill="none" stroke="#f5d49d" stroke-width="2.3" stroke-linejoin="round" opacity=".9"/><path d="'+path(2)+'" fill="none" stroke="#91e5d7" stroke-width="2.3" stroke-linejoin="round" opacity=".93"/><text x="28" y="209" fill="#cde7e2" font-size="11">n = 0</text><text x="350" y="209" fill="#cde7e2" font-size="11">n = 73</text></svg></div>';
};
function enhance(){
 const cover=document.querySelector('.reading-cover');
 if(cover&&!cover.querySelector('.r2-science')){cover.innerHTML=plot()}
 document.querySelectorAll('.course-world .big-symbol').forEach((el,i)=>{
  if(el.dataset.r2)return;el.dataset.r2='1';
  if(i%2===0){let a=.41;const points=[];for(let n=0;n<48;n++){points.push((n===0?'M':'L')+(n*5.8+10).toFixed(1)+','+(118-a*96).toFixed(1));a=3.9*a*(1-a)}
   el.innerHTML='<svg viewBox="0 0 300 130" role="img" aria-label="Logistic 计算曲线"><path d="'+points.join(' ')+'" fill="none" stroke="#a6e8dc" stroke-width="2.2"/></svg>';
  }else{el.innerHTML='<svg viewBox="0 0 300 130" role="img" aria-label="演化模型概念关系"><g stroke="#b6c7fa" fill="none" stroke-width="2"><path d="M45 85L95 34 150 94 210 48 261 84"/><circle cx="45" cy="85" r="13"/><circle cx="95" cy="34" r="17"/><circle cx="150" cy="94" r="15"/><circle cx="210" cy="48" r="17"/><circle cx="261" cy="84" r="13"/></g></svg>'}
 });
}
const observer=new MutationObserver(()=>{observer.disconnect();try{enhance()}finally{observer.observe(document.querySelector('#main'),{childList:true,subtree:false})}});
const main=document.querySelector('#main');if(main){enhance();observer.observe(main,{childList:true,subtree:false})}
