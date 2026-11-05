/* Exactly one button press clock, with native clicks and no replay delay.
   Dock keeps its existing Motion lens; list rows keep their Motion value. */
const active=new Map();
const excluded='#mobile-tabs button,.primary-menu button,.menu-item,.simple-row,.book-tile,.experiment-tabs button';
const reduced=()=>document.documentElement.dataset.reduced==='true'||matchMedia('(prefers-reduced-motion:reduce)').matches;
function clear(button){const state=active.get(button);if(state?.timer)clearTimeout(state.timer);active.delete(button);if(button)delete button.dataset.zxPress}
function release(button){
 const state=active.get(button);if(!state)return;
 if(state.timer)clearTimeout(state.timer);
 button.dataset.zxPress='release';
 state.timer=setTimeout(()=>clear(button),260);
}
document.addEventListener('pointerdown',event=>{
 if(event.button!==0||reduced())return;
 const el=event.target.closest?.('button,a.primary');
 if(!el||el.disabled||!el.isConnected||el.matches(excluded))return;
 clear(el);
 const state={id:event.pointerId,x:event.clientX,y:event.clientY,timer:null};
 active.set(el,state);el.dataset.zxPress='down';
},{passive:true});
document.addEventListener('pointermove',event=>{
 for(const [el,s] of active){
  if(s.id===event.pointerId&&Math.hypot(event.clientX-s.x,event.clientY-s.y)>24)release(el);
 }
},{passive:true});
document.addEventListener('pointerup',event=>{
 for(const [el,s] of active)if(s.id===event.pointerId)release(el);
},{passive:true});
document.addEventListener('pointercancel',event=>{
 for(const [el,s] of active)if(s.id===event.pointerId)clear(el);
},{passive:true});
window.addEventListener('blur',()=>{for(const el of active.keys())clear(el)});
