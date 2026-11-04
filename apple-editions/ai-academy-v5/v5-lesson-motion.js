/* Content-only learning step continuity. Never animates the Dock or an app shell.
   Each replaced article owns its entrance; interrupted changes dispose of old nodes. */
export function settleLessonStep(stage,{before,after,reduced=false,scrollTop}={}){
 if(!Number.isInteger(before)||!Number.isInteger(after)||before===after)return false;
 const paper=stage?.querySelector?.('.learning-paper');
 if(!paper)return false;
 const backward=after<before;
 paper.dataset.stepDirection=backward?'backward':'forward';
 if(typeof scrollTop==='function')scrollTop();
 const title=stage.querySelector('.page-intro h1');
 if(title){
  title.setAttribute('tabindex','-1');
  title.focus({preventScroll:true});
 }
 if(!reduced&&typeof paper.animate==='function'){
  const x=backward?-14:14;
  paper.animate([
   {transform:'translate3d('+x+'px,0,0)',opacity:.96},
   {transform:'translate3d(0,0,0)',opacity:1}
  ],{duration:300,easing:'cubic-bezier(.16,.88,.28,1)',fill:'none'});
 }
 return true;
}
