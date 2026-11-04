/* One delegated V5 press timeline: feedback survives pointerup until the action fires.
   No animation loop or layout-changing DOM. Keyboard/programmatic clicks stay immediate. */
const actionSelector='button[data-action],button[data-core-action],button[data-route],button[data-experiment],form button[type="submit"],.toolbar-trailing .doctor-launch';
const raisedExclude='.experiment-tabs button,.shelf .book-tile';
const waiting=new WeakMap();
let active=null,scheduledNav=null;
const pending=new WeakMap();
const reduced=()=>document.documentElement.dataset.reduced==='true'||matchMedia('(prefers-reduced-motion:reduce)').matches;
function reset(button){
 if(!button)return;
 delete button.dataset.zxPress;
 const old=waiting.get(button);if(old)clearTimeout(old);
 waiting.delete(button);
}
function settle(button){
 if(!button)return;
 button.dataset.zxPress='release';
 const old=waiting.get(button);if(old)clearTimeout(old);
 waiting.set(button,setTimeout(()=>reset(button),350));
}
document.addEventListener('pointerdown',event=>{
 if(event.button!==0||reduced())return;
 const button=event.target.closest?.('button,a.primary');
 if(!button||button.disabled||!button.isConnected)return;
 reset(active);
 active=button;button.dataset.zxPress='down';
},{passive:true});
document.addEventListener('pointermove',event=>{
 if(!active||event.buttons!==1)return;
 const rect=active.getBoundingClientRect();
 if(event.clientX<rect.left-22||event.clientX>rect.right+22||event.clientY<rect.top-22||event.clientY>rect.bottom+22){
  settle(active);active=null;
 }
},{passive:true});
const release=()=>{if(active){settle(active);active=null}};
document.addEventListener('pointerup',release,{passive:true});
document.addEventListener('pointercancel',()=>{reset(active);active=null},{passive:true});
window.addEventListener('blur',()=>{reset(active);active=null;if(scheduledNav){clearTimeout(scheduledNav.timer);pending.delete(scheduledNav.button);scheduledNav=null}});
document.addEventListener('click',event=>{
 // Native keyboard activation / assistive tech / script-created clicks must not be delayed.
 if(reduced()||event.detail===0||!event.isTrusted)return;
 const button=event.target.closest?.('button,a.primary');
 if(!button||button.disabled||!button.isConnected)return;
 // Scrollable shelves keep native swipes and are never converted into raised buttons.
 event.preventDefault();event.stopImmediatePropagation();
 const target=button;
 const isNavigation=target.matches('[data-route],[data-experiment]');
 // Only mutually exclusive destinations replace each other; never cancel a
 // pending close/save/submit just because another control was tapped.
 if(isNavigation&&scheduledNav){
  clearTimeout(scheduledNav.timer);reset(scheduledNav.button);
  pending.delete(scheduledNav.button);scheduledNav=null;
 }
 const previous=pending.get(target);if(previous)clearTimeout(previous);
 target.dataset.zxPress='release';
 const isDockNavigation=target.matches('#mobile-tabs button[data-route],#zoom-more,.primary-menu button[data-route]');
 const delay=isDockNavigation?105:target.matches(raisedExclude)?120:target.matches(actionSelector)?190:150;
 const timer=setTimeout(()=>{
  if(isNavigation&&scheduledNav?.button===target)scheduledNav=null;
  pending.delete(target);
  if(target.isConnected&&!target.disabled)target.click();
  reset(target);
 },delay);
 pending.set(target,timer);
 if(isNavigation)scheduledNav={button:target,timer};
},true);
