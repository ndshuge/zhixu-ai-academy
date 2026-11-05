/* Course-only visualization affordance: no science engine calls or V2 writes.
   The cursor reads ONLY points already returned by the official engine. */
/** Build an SVG path from ACTUAL observed points only. Missing data breaks a
 * segment and no point beyond the requested time index is shown. */
export function buildObservedPath(points,bounds,untilIndex){
 const toX=x=>20+360*(x-bounds.minX)/(bounds.maxX-bounds.minX||1);
 const toY=y=>165-145*(y-bounds.minY)/(bounds.maxY-bounds.minY||1);
 let d='',connected=false;
 (points||[]).forEach((p,i)=>{
  if(i>untilIndex)return;
  if(!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)){
   connected=false;return;
  }
  d+=(connected?'L':'M')+toX(p[0]).toFixed(2)+','+toY(p[1]).toFixed(2)+' ';
  connected=true;
 });
 return d.trim();
}

export function installExplorationScrubber(root){
 if(!root?.addEventListener)return;
 root.addEventListener('input',event=>{
  const slider=event.target.closest?.('[data-studio-scrub]');
  if(!slider||!root.contains(slider))return;
  const graph=slider.closest('.studio-graph'),svg=graph?.querySelector('svg');
  const line=svg?.querySelector('.studio-cursor-line'),dot=svg?.querySelector('.studio-cursor-dot');
  const output=graph?.querySelector('.studio-readout');
  if(!graph||!svg||!line||!dot||!output)return;
  let samples,bounds;
  try{samples=JSON.parse(slider.dataset.studioSamples);bounds=JSON.parse(slider.dataset.studioBounds)}
  catch{return}
  const idx=Number(slider.value),point=samples[idx];
  // Reveal genuine recorded points on every trace up to this step. No
  // synthetic samples, no interpolating a gap, no engine call.
  for(const trace of graph.querySelectorAll('[data-studio-trace]')){
   let values;
   try{values=JSON.parse(trace.dataset.studioSeries)}catch{continue}
   trace.setAttribute('d',buildObservedPath(values,bounds,idx));
  }
  if(!Array.isArray(point)||point.length!==2||!point.every(Number.isFinite)){
   line.style.visibility='hidden';dot.style.visibility='hidden';
   output.textContent='第 '+idx+' 项 · 原始数据缺失（未插值）';
   return;
  }
  const toX=x=>20+360*(x-bounds.minX)/(bounds.maxX-bounds.minX||1);
  const toY=y=>165-145*(y-bounds.minY)/(bounds.maxY-bounds.minY||1);
  const x=toX(point[0]),y=toY(point[1]);
  line.style.visibility='visible';dot.style.visibility='visible';
  line.setAttribute('x1',x.toFixed(2));line.setAttribute('x2',x.toFixed(2));
  dot.setAttribute('cx',x.toFixed(2));dot.setAttribute('cy',y.toFixed(2));
  output.textContent='第 '+point[0]+' 步 · '+slider.dataset.studioLabel+' = '+Number(point[1]).toPrecision(5);
 },{passive:true});
}
