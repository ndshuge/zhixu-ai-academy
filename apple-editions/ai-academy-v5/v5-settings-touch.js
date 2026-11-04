/* V5 Settings: independent compositor-friendly held feedback.
   Touch geometry never changes; only the button's painted transform does. */
export function attachSettingsTouch(doc=document,win=window){
 const button=doc.querySelector('.toolbar-trailing button[data-route="settings"]');
 if(!button)return ()=>{};
 let holdTimer=null,origin=null;
 const settle=()=>{
  clearTimeout(holdTimer);holdTimer=null;origin=null;
  delete button.dataset.pressing;delete button.dataset.holding;
 };
 const down=event=>{
  if(event.button!==0||win.matchMedia('(prefers-reduced-motion:reduce)').matches||
     doc.documentElement.dataset.reduced==='true')return;
  settle();
  origin={id:event.pointerId,x:event.clientX,y:event.clientY};
  button.dataset.pressing='true';
  holdTimer=win.setTimeout(()=>{if(origin)button.dataset.holding='true'},190);
 };
 const move=event=>{
  if(!origin||event.pointerId!==origin.id)return;
  if(Math.hypot(event.clientX-origin.x,event.clientY-origin.y)>17)settle();
 };
 button.addEventListener('pointerdown',down,{passive:true});
 doc.addEventListener('pointermove',move,{passive:true});
 doc.addEventListener('pointerup',settle,{passive:true});
 doc.addEventListener('pointercancel',settle,{passive:true});
 win.addEventListener('blur',settle);
 return ()=>{
  settle();
  button.removeEventListener('pointerdown',down);
  doc.removeEventListener('pointermove',move);
  doc.removeEventListener('pointerup',settle);
  doc.removeEventListener('pointercancel',settle);
  win.removeEventListener('blur',settle);
 };
}
if(typeof window!=='undefined')attachSettingsTouch();
