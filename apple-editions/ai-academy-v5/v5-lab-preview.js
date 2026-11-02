/* V5 scientific preview: transparent deterministic Logistic computation.
 * This is a live math preview, NOT a recorded Original science run. */
const ns='http://www.w3.org/2000/svg';
export function logisticPair(r=3.9,x0=.412,delta=.00001,steps=66){
 const rate=Math.max(3.3,Math.min(4,Number(r)||3.9));
 let a=x0,b=x0+delta;const first=[],second=[];
 for(let i=0;i<steps;i++){
  first.push([i,a]);second.push([i,b]);
  a=rate*a*(1-a);b=rate*b*(1-b);
 }
 return {first,second};
}
function toPath(points){
 const width=390,height=134;
 return points.map(([i,y],j)=>(j?'L':'M')+(24+i*width/65).toFixed(2)+','+(12+(1-y)*height).toFixed(2)).join(' ');
}
export function refreshLabPreview(root=document){
 const svg=root.querySelector('#v5-preview-plot');
 if(!svg)return;
 const value=root.querySelector('#v5-r-value');
 const control=root.querySelector('#v5-r-control');
 const r=Number(control?.value||3.9);
 const {first,second}=logisticPair(r);
 svg.querySelector('[data-curve="first"]')?.setAttribute('d',toPath(first));
 svg.querySelector('[data-curve="second"]')?.setAttribute('d',toPath(second));
 if(value)value.textContent=r.toFixed(2);
}
if(typeof document!=='undefined')document.addEventListener('input',event=>{
 if(event.target?.id==='v5-r-control')refreshLabPreview();
});
