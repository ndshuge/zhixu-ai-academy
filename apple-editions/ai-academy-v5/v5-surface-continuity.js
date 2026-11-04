/* Reversible sheet lifecycle shared by native BYOK and safety confirmations.
   The content remains mounted until the closing animation completes.
   Does not animate Dock or use its stacking context. */
const reduced=()=>document.documentElement.dataset.reduced==='true'||window.matchMedia('(prefers-reduced-motion:reduce)').matches;
const clocks=new WeakMap();
export function enterSurface(shade,trigger){
 if(!shade?.isConnected)return;
 const old=clocks.get(shade);if(old){clearTimeout(old);clocks.delete(shade)}
 shade.inert=false;shade.classList.add('zx-surface');
 const panel=shade.querySelector('.modal');
 if(trigger?.isConnected&&panel){
  const source=trigger.getBoundingClientRect(),dest=panel.getBoundingClientRect();
  const x=Math.max(-92,Math.min(92,(source.left+source.width/2-dest.left-dest.width/2)*.27));
  const y=Math.max(-95,Math.min(95,(source.top+source.height/2-dest.top-dest.height/2)*.23));
  panel.style.setProperty('--zx-surface-from-x',x.toFixed(1)+'px');
  panel.style.setProperty('--zx-surface-from-y',y.toFixed(1)+'px');
 }
 if(reduced()){shade.classList.add('zx-surface-open');return}
 // A first painted state is essential for mobile Safari to interpolate rather than pop.
 void shade.offsetWidth;
 requestAnimationFrame(()=>{if(shade.isConnected&&!shade.inert)shade.classList.add('zx-surface-open')});
}
export function exitSurface(shade,{done}={}){
 if(!shade)return;
 const old=clocks.get(shade);if(old){clearTimeout(old);clocks.delete(shade)}
 shade.inert=true;shade.classList.remove('zx-surface-open');
 const finish=()=>{
  const timer=clocks.get(shade);if(timer){clearTimeout(timer);clocks.delete(shade)}
  shade.removeEventListener('transitionend',ended);
  if(typeof done==='function')done();
 };
 const ended=e=>{if(e.target===shade&&e.propertyName==='opacity')finish()};
 if(reduced()||!shade.isConnected){finish();return}
 shade.addEventListener('transitionend',ended);
 clocks.set(shade,setTimeout(finish,360));
}
