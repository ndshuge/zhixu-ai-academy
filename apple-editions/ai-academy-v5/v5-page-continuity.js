/* Spatial continuity inspired by the real Shuge Academy edge-pop prototype.
   Only reads/animates #screen content; never touches Dock, its geometry or lenses. */
const ROUTES=['today','learn','library','growth'];
export function routeDirection(from,to){
 if(from==='settings'&&ROUTES.includes(to))return -1;
 if(to==='settings'&&ROUTES.includes(from))return 1;
 if(!ROUTES.includes(from)||!ROUTES.includes(to))return 0;
 return Math.sign(ROUTES.indexOf(to)-ROUTES.indexOf(from));
}
export function gestureRoute({route,width,startX,dx,dy,reduced}){
 if(!ROUTES.includes(route)||width>700)return null;
 const edge=Math.min(45,width*.14);
 if(!Number.isFinite(dx)||!Number.isFinite(dy)||Math.abs(dx)<Math.max(70,width*.19)||Math.abs(dx)<Math.abs(dy)*1.35)return null;
 const step=dx<0?1:-1;
 if(step>0&&startX<width-edge)return null;
 if(step<0&&startX>edge)return null;
 return ROUTES[ROUTES.indexOf(route)+step]||null;
}
export function installPageContinuity({stage,getRoute,navigate,reduced}){
 let pointer=null,lastMotion=null,dragAnimation=null,suppressClicksUntil=0;
 let pendingLayer=null,activeLayer=null,contentAnimations=[],ghostTimer=null;
 function clearSpatial(){
  clearTimeout(ghostTimer);ghostTimer=null;
  for(const animation of contentAnimations)animation.cancel();
  contentAnimations=[];activeLayer?.remove();activeLayer=null;
  stage.classList.remove('zx-spatial-nav');
 }
 function prepare(from,to){
  clearSpatial();pendingLayer=null;
  if(reduced()||from===to||!routeDirection(from,to))return;
  const layer=document.createElement('div');
  layer.className='zx-nav-ghost';layer.dataset.from=from;layer.setAttribute('aria-hidden','true');layer.inert=true;
  for(const child of [...stage.children]){
   if(child.classList.contains('zx-nav-ghost'))continue;
   const copy=child.cloneNode(true);
   for(const element of [copy,...copy.querySelectorAll('[id]')])element.removeAttribute('id');
   layer.append(copy);
  }
  if(layer.childElementCount)pendingLayer=layer;
 }
 const protectedTarget=t=>!!t?.closest?.('input,textarea,select,button,a,label,[role="slider"],[contenteditable],.shelf,.experiment-tabs,.core-point-actions,.core-bars,.core-figure');
 stage.addEventListener('pointerdown',e=>{
  if(e.button!==0||protectedTarget(e.target)||innerWidth>700||e.pointerType==='mouse')return;
  const edge=Math.min(45,innerWidth*.14);
  if(e.clientX>edge&&e.clientX<innerWidth-edge)return;
  dragAnimation?.cancel();
  pointer={x:e.clientX,y:e.clientY,t:performance.now(),id:e.pointerId,node:null};
 },{passive:true});
 const releaseDrag=(springBack=true)=>{
  const node=pointer?.node;
  if(!node)return;
  const old=node.style.transform;
  node.style.removeProperty('transform');node.style.removeProperty('will-change');
  stage.style.removeProperty('overflow-x');
  if(springBack&&old&&!reduced()&&node.isConnected){
   dragAnimation?.cancel();
   dragAnimation=node.animate([{transform:old},{transform:'translate3d(0,0,0)'}],{duration:300,easing:'cubic-bezier(.18,1.16,.3,1)',fill:'none'});
   dragAnimation.finished.catch(()=>{});
  }
 };
 stage.addEventListener('pointermove',e=>{
  if(!pointer||pointer.id!==e.pointerId)return;
  const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;
  if(Math.abs(dy)>20&&Math.abs(dy)>Math.abs(dx)){releaseDrag();pointer=null;return;}
  if(Math.abs(dx)<12||Math.abs(dx)<Math.abs(dy)*1.5)return;
  const canMove=gestureRoute({route:getRoute(),width:innerWidth,startX:pointer.x,dx:Math.sign(dx)*Math.max(85,innerWidth*.23),dy:0});
  if(!canMove)return;
  if(!pointer.node)pointer.node=stage.firstElementChild;
  if(!pointer.node)return;
  stage.style.overflowX='clip';
  pointer.node.style.willChange='transform';
  pointer.node.style.transform='translate3d('+(Math.sign(dx)*Math.min(34,Math.abs(dx)*.24)).toFixed(1)+'px,0,0)';
 },{passive:true});
 stage.addEventListener('pointercancel',()=>{releaseDrag();pointer=null;},{passive:true});
 stage.addEventListener('pointerup',e=>{
  if(!pointer||e.pointerId!==pointer.id)return;
  const start=pointer;
  const target=gestureRoute({route:getRoute(),width:innerWidth,startX:start.x,dx:e.clientX-start.x,dy:e.clientY-start.y});
  releaseDrag(!target);pointer=null;
  if(!target)return;
  suppressClicksUntil=performance.now()+270;
  navigate(target);
 },{passive:true});
 stage.addEventListener('click',e=>{if(performance.now()<suppressClicksUntil){e.preventDefault();e.stopImmediatePropagation();suppressClicksUntil=0;}},true);
 return {
  prepare,
  animate(from,to){
   clearSpatial();
   if(reduced()){pendingLayer=null;return;}
   const direction=routeDirection(from,to);
   if(!direction){pendingLayer=null;return;}
   const ghost=pendingLayer;pendingLayer=null;
   stage.classList.add('zx-spatial-nav');
   const duration=390,ease='cubic-bezier(.22,.82,.25,1)';
   if(ghost){
    stage.append(ghost);activeLayer=ghost;
    const old=ghost.animate([
     {transform:'translate3d(0,0,0) scale(1)',opacity:1},
     {transform:'translate3d('+(-direction*26)+'px,0,0) scale(.985)',opacity:0}
    ],{duration,easing:ease,fill:'forwards'});
    contentAnimations.push(old);
    const removeGhost=()=>{if(activeLayer===ghost){ghost.remove();activeLayer=null;stage.classList.remove('zx-spatial-nav')}clearTimeout(ghostTimer);ghostTimer=null};
    old.finished.then(removeGhost).catch(()=>{});
    // WebKit may not settle WAAPI.finished during rapid compositor changes.
    // Keep the non-interactive outgoing layer bounded even if it never resolves.
    ghostTimer=setTimeout(removeGhost,duration+260);
   }
   const children=[...stage.children].filter(el=>el!==ghost);
   children.slice(0,6).forEach((child,i)=>{
    const anim=child.animate([
     {transform:'translate3d('+(direction*(i===0?22:14))+'px,0,0)',opacity:i===0?.87:.91},
     {transform:'translate3d(0,0,0)',opacity:1}
    ],{duration:duration+Math.min(i*22,70),delay:Math.min(i*17,55),easing:ease,fill:'none'});
    contentAnimations.push(anim);
    anim.finished.catch(()=>{});
   });
   if(!ghost)setTimeout(()=>stage.classList.remove('zx-spatial-nav'),duration+95);
  }
 };
}
