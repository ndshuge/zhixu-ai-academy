/* One browser-gesture policy for the interactive learning web app.
   Keep single-finger scroll, interactive graph scrubbing, keyboard zoom and
   the in-app type-size control. Avoid unreliable user-scalable=no viewport. */
export function installGestureGuard(doc=document){
 const stop=e=>{if(e.cancelable)e.preventDefault()};
 const touch=e=>{if(e.touches?.length>=2)stop(e)};
 const wheel=e=>{if(e.ctrlKey)stop(e)};
 const opts={capture:true,passive:false};
 // Safari's proprietary two-finger zoom events.
 doc.addEventListener('gesturestart',stop,opts);
 doc.addEventListener('gesturechange',stop,opts);
 // Android/Chrome and WKWebView fallback: reject only MULTI touch motion.
 doc.addEventListener('touchmove',touch,opts);
 // Trackpad pinch may be delivered as ctrl-wheel; normal wheel scroll survives.
 doc.addEventListener('wheel',wheel,opts);
 return ()=>{
  doc.removeEventListener('gesturestart',stop,opts);
  doc.removeEventListener('gesturechange',stop,opts);
  doc.removeEventListener('touchmove',touch,opts);
  doc.removeEventListener('wheel',wheel,opts);
 };
}
installGestureGuard();
