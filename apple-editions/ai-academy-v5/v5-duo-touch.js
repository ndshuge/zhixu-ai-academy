/* Low-overhead raised press: one CSS transform and no frame-by-frame JS.
   Works for dynamically rendered learning actions and the fixed Doctor control. */
const touchSelector='.toolbar-trailing .doctor-launch, #screen .workshop-actions .primary, #screen[data-page="learn"] .learning-page .primary';
let pressed=null;
const clear=()=>{
 if(pressed){delete pressed.dataset.duoPress;pressed=null}
};
document.addEventListener('pointerdown',event=>{
 if(event.button!==0||document.documentElement.dataset.reduced==='true'||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
 const b=event.target.closest?.(touchSelector);
 if(!b||b.disabled)return;
 clear();pressed=b;pressed.dataset.duoPress='true';
},{passive:true});
document.addEventListener('pointerup',clear,{passive:true});
document.addEventListener('pointercancel',clear,{passive:true});
document.addEventListener('pointermove',event=>{
 if(!pressed||!event.buttons)return;
 const r=pressed.getBoundingClientRect();
 if(event.clientX<r.left-18||event.clientX>r.right+18||event.clientY<r.top-18||event.clientY>r.bottom+18)clear();
},{passive:true});
window.addEventListener('blur',clear);
