/* Keep selected capsule stationary in a retained 3-way group; only its lens moves. */
function syncSegment(){
 const row=document.querySelector('#screen[data-page="learn"] .experiment-tabs');
 if(!row)return;
 const buttons=[...row.querySelectorAll('button[data-experiment]')];
 const chosen=buttons.findIndex(el=>el.classList.contains('is-active'));
 row.style.setProperty('--zx-segment-index',String(Math.max(0,chosen)));
}
window.addEventListener('zhixu:content-rendered',syncSegment);
document.addEventListener('DOMContentLoaded',syncSegment);
