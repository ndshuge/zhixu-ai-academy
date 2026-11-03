/* Apple V5 semantic navigation: one focus handoff per actual SPA route change.
   Intra-page lesson renders do not take focus away from forms or controls. */
const screen=document.getElementById('screen');
let previous=screen?.dataset.page||'today';
window.addEventListener('zhixu:content-rendered',()=>{
 const next=screen?.dataset.page;
 if(!next)return;
 if(next===previous)return;
 previous=next;
 const label=document.getElementById('toolbar-title')?.textContent?.trim()||next;
 document.title='知序 AI 学院 · '+label;
 screen.focus({preventScroll:true});
});
