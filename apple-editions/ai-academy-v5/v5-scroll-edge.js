/**
 * Apple-style scroll-edge transition for Zhixu V5.
 * Intentionally changes ONLY the existing CSS overlay's opacity.
 * Geometry, docking, scrolling and navigation remain owned by V4 engine.
 */
export function edgeStrength({remaining=0,scrollRange=0,keyboardVisible=false}={}){
 if(keyboardVisible || !Number.isFinite(scrollRange) || scrollRange<=24)return 0;
 if(!Number.isFinite(remaining))return 0;
 return Math.max(0,Math.min(1,remaining/120));
}
export function installScrollEdge(win=window){
 const doc=win.document,root=doc.documentElement,stage=doc.querySelector('#screen');
 if(!stage)return ()=>{};
 let scheduled=false,stopped=false;
 const update=()=>{
  scheduled=false;
  if(stopped)return;
  const viewport=win.innerHeight;
  const height=root.scrollHeight;
  const scrollRange=Math.max(0,height-viewport);
  const remaining=Math.max(0,height-viewport-win.scrollY);
  root.style.setProperty('--zx-edge-opacity',String(edgeStrength({
   remaining,scrollRange,
   keyboardVisible:doc.body.classList.contains('keyboard-visible')
  })));
 };
 const schedule=()=>{
  if(scheduled||stopped)return;
  scheduled=true;win.requestAnimationFrame(update);
 };
 win.addEventListener('scroll',schedule,{passive:true});
 win.addEventListener('resize',schedule,{passive:true});
 win.addEventListener('zhixu:content-rendered',schedule);
 win.visualViewport?.addEventListener('resize',schedule,{passive:true});
 const resize=typeof win.ResizeObserver==='function'?new win.ResizeObserver(schedule):null;
 resize?.observe(stage);
 resize?.observe(doc.body);
 const changes=typeof win.MutationObserver==='function'?new win.MutationObserver(schedule):null;
 changes?.observe(stage,{childList:true});
 schedule();
 return ()=>{
  stopped=true;
  win.removeEventListener('scroll',schedule);
  win.removeEventListener('resize',schedule);
  win.removeEventListener('zhixu:content-rendered',schedule);
  win.visualViewport?.removeEventListener('resize',schedule);
  resize?.disconnect();
  changes?.disconnect();
  root.style.removeProperty('--zx-edge-opacity');
 };
}
if(typeof window!=='undefined')installScrollEdge(window);
