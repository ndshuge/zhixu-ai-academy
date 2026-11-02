/* Adapter for the proven Apple Motion Lab R2.4 press-and-scrub module.
 * Reuses the exact source algorithm + the existing Liquid Glass createSpring.
 * Navigation targets are Zhixu's five actual views (not Motion Lab's three).
 */
import {installNavbarScrub} from './assets/motionlab-nav-scrub.js';
customElements.whenDefined('lg-navbar').then(()=>{
 const nav=document.getElementById('mobile-nav');
 if(!nav || typeof nav.setCurrent!=='function')return;
 const buttons=Array.from(nav.querySelectorAll(':scope > button[data-view]'));
 const state=installNavbarScrub(nav,{
  onCommit(view){
   const idx=buttons.findIndex(b=>b.dataset.view===view);
   if(idx<0)return;
   // Call the original app's navigation, which keeps learning session data intact.
   window.ZHIXU_APPLE_NAVIGATE?.(view);
   nav.setCurrent(idx);
  },
  onPressChange(index){
   // Preview is optical only. Actual route changes solely after release.
   nav.dataset.previewIndex=String(index);
  }
 });
 window.ZHIXU_APPLE_NAV_SCRUB=state;
}).catch(e=>console.warn('[Zhixu] Navigation optical gesture unavailable:',e));
