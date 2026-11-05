/* V6.2: physically paired page panels. The two complete DOM pages
   translate by identical widths in opposite directions; their contents do
   not fade, scale or animate separately. Dock is never touched here. */
const ROUTES=['today','learn','library','growth','settings'];
export function routeDirection(from,to){return ROUTES.includes(from)&&ROUTES.includes(to)?Math.sign(ROUTES.indexOf(to)-ROUTES.indexOf(from)):0}
export function gestureRoute({route,width,startX,dx,dy}){
 if(width>700||!ROUTES.includes(route)||!Number.isFinite(dx)||!Number.isFinite(dy))return null;
 const edge=Math.min(45,width*.14),threshold=Math.max(72,width*.19);
 if(Math.abs(dx)<threshold||Math.abs(dx)<Math.abs(dy)*1.45)return null;
 const step=dx<0?1:-1;
 if(step>0&&startX<width-edge)return null;
 if(step<0&&startX>edge)return null;
 return ROUTES[ROUTES.indexOf(route)+step]||null;
}
export function installPageContinuity({stage,getRoute,navigate,reduced}){
 let pending=null,oldLayer=null,anims=[],timer=null,seq=0,swipe=null,snap=null,suppressUntil=0;
 function dispose(){
  ++seq;clearTimeout(timer);timer=null;
  for(const a of anims)a.cancel();anims=[];
  oldLayer?.remove();oldLayer=null;
  const current=stage.querySelector(':scope > .zx-route-incoming');
  if(current){while(current.firstChild)stage.insertBefore(current.firstChild,current);current.remove()}
  stage.classList.remove('zx-paired-moving');
  stage.style.removeProperty('--zx-paired-height');
  for(const key of ['--zx-paired-pad-t','--zx-paired-pad-r','--zx-paired-pad-l'])stage.style.removeProperty(key);
 }
 function prepare(from,to){
  dispose();pending=null;
  if(from===to||reduced()||!routeDirection(from,to))return;
  const old=document.createElement('div');old.className='zx-route-outgoing';
  old.dataset.from=from;old.setAttribute('aria-hidden','true');old.inert=true;
  while(stage.firstChild)old.appendChild(stage.firstChild);
  old.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
  pending=old;
 }
 function beforeRender(){if(!pending)dispose()}
 function animate(from,to){
  const direction=routeDirection(from,to),outgoing=pending;pending=null;
  if(!direction||reduced()){dispose();return}
  const computed=getComputedStyle(stage);
  stage.style.setProperty('--zx-paired-pad-t',computed.paddingTop);
  stage.style.setProperty('--zx-paired-pad-r',computed.paddingRight);
  stage.style.setProperty('--zx-paired-pad-l',computed.paddingLeft);
  const incoming=document.createElement('div');incoming.className='zx-route-incoming';
  while(stage.firstChild)incoming.appendChild(stage.firstChild);
  stage.appendChild(incoming);
  if(outgoing){stage.appendChild(outgoing);oldLayer=outgoing}
  stage.classList.add('zx-paired-moving');
  const width=Math.max(1,stage.clientWidth);
  const startX = direction * width;
  const endX = -direction * width;
  const duration=to==='learn'?480:420,easing='cubic-bezier(.22,.78,.26,1)';
  stage.style.setProperty('--zx-paired-height',Math.max(incoming.scrollHeight,outgoing?.scrollHeight||0)+'px');
  const mySeq=seq;
  const move=(node,a,b)=>node.animate([{transform:'translate3d('+a+'px,0,0)'},{transform:'translate3d('+b+'px,0,0)'}],
   {duration,easing,fill:'both'});
  const entering=move(incoming,startX,0);anims.push(entering);
  if(outgoing)anims.push(move(outgoing,0,endX));
  const finish=()=>{if(mySeq===seq)dispose()};
  entering.finished.then(finish).catch(()=>{});
  timer=setTimeout(finish,duration+120);
 }
 const blocked=t=>!!t?.closest?.('button,a,input,textarea,select,label,[role="slider"],[contenteditable],.shelf,.experiment-tabs,.core-point-actions,.core-bars,.core-figure');
 stage.addEventListener('pointerdown',e=>{
  if(e.button!==0||e.pointerType==='mouse'||innerWidth>700||blocked(e.target))return;
  const edge=Math.min(45,innerWidth*.14);
  if(e.clientX>edge&&e.clientX<innerWidth-edge)return;
  snap?.cancel();swipe={id:e.pointerId,x:e.clientX,y:e.clientY,node:null};
 },{passive:true});
 const releaseDrag=spring=>{
  const node=swipe?.node;if(!node)return;
  const old=node.style.transform;node.style.removeProperty('transform');node.style.removeProperty('will-change');
  if(spring&&!reduced()&&old&&node.isConnected){
   snap?.cancel();snap=node.animate([{transform:old},{transform:'translate3d(0,0,0)'}],
    {duration:260,easing:'cubic-bezier(.2,.85,.27,1)',fill:'none'});
   snap.finished.catch(()=>{});
  }
 };
 stage.addEventListener('pointermove',e=>{
  if(!swipe||swipe.id!==e.pointerId)return;
  const dx=e.clientX-swipe.x,dy=e.clientY-swipe.y;
  if(Math.abs(dy)>18&&Math.abs(dy)>Math.abs(dx)){releaseDrag(true);swipe=null;return}
  if(Math.abs(dx)<12||Math.abs(dx)<Math.abs(dy)*1.45)return;
  if(!gestureRoute({route:getRoute(),width:innerWidth,startX:swipe.x,dx:Math.sign(dx)*120,dy:0}))return;
  if(!swipe.node)swipe.node=stage.querySelector(':scope > .zx-route-incoming')||stage.firstElementChild;
  if(swipe.node){swipe.node.style.willChange='transform';swipe.node.style.transform='translate3d('+(Math.sign(dx)*Math.min(innerWidth*.4,Math.abs(dx)*.75)).toFixed(1)+'px,0,0)'}
 },{passive:true});
 const end=e=>{
  if(!swipe||(e.pointerId!==undefined&&e.pointerId!==swipe.id))return;
  const target=e.type==='pointercancel'?null:gestureRoute({route:getRoute(),width:innerWidth,startX:swipe.x,dx:(e.clientX??swipe.x)-swipe.x,dy:(e.clientY??swipe.y)-swipe.y});
  releaseDrag(!target);swipe=null;
  if(target){suppressUntil=performance.now()+200;navigate(target)}
 };
 stage.addEventListener('pointerup',end,{passive:true});
 stage.addEventListener('pointercancel',end,{passive:true});
 stage.addEventListener('click',e=>{if(performance.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation();suppressUntil=0}},true);
 return {prepare,beforeRender,animate};
}
