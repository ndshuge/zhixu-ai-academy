import {screenPoint,projection,zoomAt,hitLives,clamp} from './visual-model.mjs';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={birth:'出生',death:'死亡',harvest:'采集',cooperation:'协作采集',share:'能量分享',signal:'发布资源坐标',action:'动作变化',competition:'同格资源结算'};
export function installWorldInteraction({$,camera,ecology,getView,getTransform,getSelected,select,send,notify}){
 const canvas=$('world-canvas'),stage=canvas.parentElement,points=new Map();let pointer=null,pinch=null,cardId=null,located=null,lastEvent='',hover=null,holdTimer;
 const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
 const scene=()=>{const r=canvas.getBoundingClientRect();return {w:r.width,h:r.height};};
 const follow=value=>{ecology.options.follow=value;$('follow-selected').checked=value;};
 function fit(){Object.assign(camera,{zoom:1,x:0,y:0});ecology.cameraMotion.reset(camera);follow(false);located=null;}
 function zoom(value,p){const v=getView();if(!v)return;const {w,h}=scene();Object.assign(camera,zoomAt(camera,value,p||{x:w/2,y:h/2},w,h,v.config));follow(false);}
 function focus(id=getSelected()){const a=getView()?.agents.find(a=>a.id===id);if(!a){notify('此个体当前不存活；可看保留历史位置。');return;}camera.zoom=Math.max(innerWidth<560?4.5:2.6,camera.zoom);follow(true);openLife(id);}
 function openLife(id){cardId=id;located=null;ecology.replayFrame=null;$('replay-map-note').hidden=true;$('life-popover').hidden=false;$('life-popover').dataset.life=String(id);if(getView()?.selected?.id!==id)$('life-now').innerHTML='<p>读取 #'+id+' 的真实状态…</p>';$('life-hover').hidden=true;}
 function locateEvent(e){if(!e||!Number.isFinite(e.x)||!Number.isFinite(e.y)){notify('该事件没有保留空间位置；仅查看实际证据。');return;}send('running',{value:false});const v=getView(),{w,h}=scene();camera.zoom=Math.max(2.6,camera.zoom);const t=projection(w,h,v.config,{zoom:camera.zoom,x:0,y:0});camera.x=w/2-e.x*t.scale-t.x;camera.y=h/2-e.y*t.scaleY-t.y;follow(false);located=e;cardId=null;$('life-popover').hidden=false;$('life-now').innerHTML='<h3>tick '+e.tick+' · #'+e.id+' '+(names[e.type]||e.type)+'</h3><p>'+esc(e.detail||'真实模拟记录')+'</p><p>位置 ('+e.x.toFixed(2)+', '+e.y.toFixed(2)+') · 当前资源场，事件位置来自保留记录。</p><details><summary>实际证据</summary><pre>'+esc(JSON.stringify(e,null,2))+'</pre></details>';$('life-story').innerHTML='';ecology.replayFrame={...e};}
 $('zoom-in').onclick=()=>zoom(camera.zoom*1.25);$('zoom-out').onclick=()=>zoom(camera.zoom/1.25);$('fit-world').onclick=fit;$('focus-selected').onclick=()=>focus();
 $('popover-focus').onclick=()=>focus(cardId||getSelected());$('popover-close').onclick=()=>{$('life-popover').hidden=true;cardId=null;located=null;};
 $('observer-toggle').onclick=()=>{const drawer=$('observer-drawer'),open=drawer.hidden;drawer.hidden=!open;document.querySelector('.world-layout').classList.toggle('inspector-open',open);$('observer-toggle').setAttribute('aria-expanded',String(open));};
 $('popover-detail').onclick=()=>{if($('observer-drawer').hidden)$('observer-toggle').click();document.querySelector('.deep-inspector').open=true;$('observer-drawer').scrollIntoView({behavior:reduced()?'auto':'smooth',block:'nearest'});};
 $('popover-history').onclick=()=>{document.querySelector('.deep-timeline').open=true;document.querySelector('.life-timeline').scrollIntoView({behavior:reduced()?'auto':'smooth',block:'start'});};
 $('field-event').onclick=()=>{const events=getView()?.observation?.recent||[],e=events.find(e=>e.tick+':'+e.type+':'+e.id===$('field-event').dataset.event);locateEvent(e);};
 function local(e){const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
 function hit(p){return hitLives([...ecology.positions.values()],p,getTransform(),innerWidth<560?24:18);}
 canvas.addEventListener('wheel',e=>{e.preventDefault();zoom(camera.zoom*Math.exp(-e.deltaY*.0016),local(e));},{passive:false});
 canvas.addEventListener('pointerdown',e=>{
  points.set(e.pointerId,local(e));canvas.setPointerCapture(e.pointerId);$('life-hover').hidden=true;
  if(points.size===2){const [a,b]=[...points.values()];pinch={distance:Math.hypot(a.x-b.x,a.y-b.y),zoom:camera.zoom};if(pointer)pointer.moved=true;clearTimeout(holdTimer);follow(false);return;}
  pointer={id:e.pointerId,start:local(e),last:local(e),moved:false,held:false};
  if(e.pointerType==='touch')holdTimer=setTimeout(()=>{if(pointer&&!pointer.moved){const a=hit(pointer.last)[0];if(a){select(a.id);pointer.held=true;}}},480);
 });
 canvas.addEventListener('pointermove',e=>{
  const p=local(e);if(points.has(e.pointerId))points.set(e.pointerId,p);
  if(pinch&&points.size===2){const [a,b]=[...points.values()];zoom(pinch.zoom*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,pinch.distance),{x:(a.x+b.x)/2,y:(a.y+b.y)/2});return;}
  if(pointer&&pointer.id===e.pointerId){if(Math.hypot(p.x-pointer.start.x,p.y-pointer.start.y)>6){pointer.moved=true;clearTimeout(holdTimer);follow(false);ecology.options.dragging=true;}if(pointer.moved){camera.x+=p.x-pointer.last.x;camera.y+=p.y-pointer.last.y;}pointer.last=p;return;}
  if(e.pointerType!=='touch'){hover=hit(p)[0]||null;if(hover&&hover.id!==cardId){$('life-hover').hidden=false;$('life-hover').textContent='#'+hover.id+' · '+hover.action+' · 能量 '+hover.energy.toFixed(1);$('life-hover').style.left=clamp(p.x+14,10,scene().w-210)+'px';$('life-hover').style.top=clamp(p.y-28,42,scene().h-35)+'px';}else $('life-hover').hidden=true;}
 });
 function release(e,cancel=false){clearTimeout(holdTimer);points.delete(e.pointerId);if(pointer?.id===e.pointerId&&!pinch&&!pointer.moved&&!pointer.held&&!cancel){const candidates=hit(local(e));if(candidates[0]){select(candidates[0].id);$('overlap-choices').innerHTML=candidates.length>1?'同处附近：'+candidates.slice(0,5).map(a=>'<button data-near-life="'+a.id+'">#'+a.id+'</button>').join(''):'';}else{$('life-popover').hidden=true;cardId=null;}}if(points.size<2)pinch=null;pointer=null;ecology.options.dragging=false;}
 canvas.addEventListener('pointerup',e=>release(e));canvas.addEventListener('pointercancel',e=>release(e,true));canvas.addEventListener('lostpointercapture',()=>{clearTimeout(holdTimer);points.clear();pointer=null;pinch=null;ecology.options.dragging=false;});
 canvas.addEventListener('pointerleave',()=>{$('life-hover').hidden=true;hover=null;});canvas.addEventListener('dblclick',e=>{const a=hit(local(e))[0];if(a){select(a.id);focus(a.id);}});
 canvas.addEventListener('keydown',e=>{const steps={ArrowLeft:[28,0],ArrowRight:[-28,0],ArrowUp:[0,28],ArrowDown:[0,-28]};if(steps[e.key]){e.preventDefault();follow(false);camera.x+=steps[e.key][0];camera.y+=steps[e.key][1];}if(e.key==='+'||e.key==='=')zoom(camera.zoom*1.25);if(e.key==='-')zoom(camera.zoom/1.25);if(e.key==='Escape'){$('life-popover').hidden=true;$('life-hover').hidden=true;cardId=null;}});
 document.addEventListener('click',e=>{const b=e.target.closest('[data-near-life]');if(b)select(Number(b.dataset.nearLife));const event=e.target.closest('[data-field-record]');if(event){const [tick,type,id]=event.dataset.fieldRecord.split(':');locateEvent(getView()?.observation?.recent.find(x=>x.tick===Number(tick)&&x.type===type&&x.id===Number(id)));}});
 document.addEventListener('life-record-frame',e=>{ecology.replayFrame=e.detail;$('replay-map-note').hidden=!e.detail;});
 $('world-minimap').onpointerdown=e=>{const v=getView();if(!v)return;const r=$('world-minimap').getBoundingClientRect(),a={x:(e.clientX-r.left)/r.width*v.config.width,y:(e.clientY-r.top)/r.height*v.config.height},{w,h}=scene(),t=projection(w,h,v.config,{zoom:camera.zoom,x:0,y:0});follow(false);camera.x=w/2-a.x*t.scale-t.x;camera.y=h/2-a.y*t.scaleY-t.y;};
 function update(view){
  if(!view.observation)return;
  if(located){const e=located;$('life-now').innerHTML='<h3>tick '+e.tick+' · #'+e.id+' '+(names[e.type]||e.type)+'</h3><p>'+esc(e.detail||'真实模拟记录')+'</p><p>位置 ('+e.x.toFixed(2)+', '+e.y.toFixed(2)+') · 当前资源场，事件位置来自保留记录。</p><details><summary>实际证据</summary><pre>'+esc(JSON.stringify(e,null,2))+'</pre></details>';}
  const events=view.observation.recent.filter(e=>e.tick>0&&Number.isFinite(e.x)&&(['birth','death'].includes(e.type)||e.id===getSelected()&&['harvest','cooperation','share'].includes(e.type))),recent=events.at(-1);
  if(recent){const key=recent.tick+':'+recent.type+':'+recent.id;if(key!==lastEvent){lastEvent=key;$('field-event').hidden=false;$('field-event').dataset.event=key;$('field-event').textContent='tick '+recent.tick+' · #'+recent.id+' '+names[recent.type]+' · 定位记录';}}
  if(cardId&&view.selected?.id===cardId){const o=view.observation,a=o.individual,subset=o.recent.filter(e=>e.id===cardId||e.related===cardId).slice(-4);$('life-story').innerHTML='<p>出生 tick '+(a?.birthTick??'未保留')+' · '+(a?.parentId?'父代 #'+a.parentId:'创始个体')+' · 已记录 '+(view.selected.children||0)+' 个后代</p><ol>'+subset.map(e=>'<li><button data-field-record="'+e.tick+':'+e.type+':'+e.id+'">tick '+e.tick+' · '+names[e.type]+'</button></li>').join('')+'</ol><small>此窗口从 tick '+o.startTick+' 开始，不补造缺失过程。</small>';}
  if(cardId&&!view.agents.some(a=>a.id===cardId)){const death=view.observation.recent.find(e=>e.id===cardId&&e.type==='death');if(death)locateEvent(death);}
  window.evoEvidence.visual={selected:cardId,event:lastEvent,pulses:ecology.pulses.map(e=>({id:e.id,type:e.type,tick:e.tick})),retainedFrames:view.observation.frames.length};
 }
 function frame(){const v=getView(),t=getTransform();if(!v||!t)return;const r=scene(),a=located||ecology.positions.get(cardId);if(a&&!$('life-popover').hidden){const p=screenPoint(a,t);if(innerWidth>560){const card=$('life-popover');card.style.left=clamp(p.x+22,12,r.w-card.offsetWidth-12)+'px';card.style.top=clamp(p.y-card.offsetHeight*.6,42,r.h-card.offsetHeight-12)+'px';}else{$('life-popover').style.left='';$('life-popover').style.top='';}}
  const mini=$('world-minimap'),ctx=mini.getContext('2d');ctx.clearRect(0,0,96,64);ctx.fillStyle='#244d3e';ctx.fillRect(0,0,96,64);for(const a of v.agents){ctx.fillStyle=a.controller==='rule'?'#a2d8dc':'#edc084';ctx.fillRect(a.x/v.config.width*96,a.y/v.config.height*64,1.3,1.3);}ctx.strokeStyle='#f0e0b6';ctx.lineWidth=1;ctx.strokeRect(-t.x/t.scale/v.config.width*96,-t.y/t.scaleY/v.config.height*64,r.w/t.scale/v.config.width*96,r.h/t.scaleY/v.config.height*64);
 }
 function reset(){cardId=null;located=null;lastEvent='';$('life-popover').hidden=true;$('field-event').hidden=true;ecology.replayFrame=null;ecology.cameraMotion.reset(camera);}
 return {openLife,update,frame,reset,locateEvent};
}
