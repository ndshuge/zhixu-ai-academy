/* One reversible, interruptible bottom-sheet lifecycle for DeepSeek and
   every safety confirmation. No trigger-based zoom or duplicate Motion owner. */
const reduced=()=>document.documentElement.dataset.reduced==='true'||matchMedia('(prefers-reduced-motion:reduce)').matches;
const closing=new WeakMap();
function cancelClosing(shade){
 const pending=closing.get(shade);
 if(!pending)return;
 clearTimeout(pending.timer);
 pending.panel?.removeEventListener('transitionend',pending.ended);
 closing.delete(shade);
}
export function enterSurface(shade){
 if(!shade?.isConnected)return;
 cancelClosing(shade);
 shade.inert=false;
 shade.classList.add('zx-surface');
 if(reduced()){shade.classList.add('zx-surface-open');return}
 // Ensure the fully below-viewport position is committed before interpolation.
 void shade.offsetHeight;
 requestAnimationFrame(()=>{
  if(shade.isConnected&&!shade.inert)shade.classList.add('zx-surface-open');
 });
}
export function exitSurface(shade,{done}={}){
 if(!shade)return;
 cancelClosing(shade);
 shade.inert=true;
 const panel=shade.querySelector('.modal');
 let finished=false;
 const finish=()=>{
  if(finished)return;
  finished=true;
  cancelClosing(shade);
  if(typeof done==='function')done();
 };
 const ended=e=>{if(e.target===panel&&e.propertyName==='transform')finish()};
 // Start the exact reverse path. Remove the element only after it has left.
 shade.classList.remove('zx-surface-open');
 if(reduced()||!shade.isConnected){finish();return}
 panel?.addEventListener('transitionend',ended);
 closing.set(shade,{panel,ended,timer:setTimeout(finish,740)});
}
