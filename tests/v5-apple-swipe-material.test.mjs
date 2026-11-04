import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(p)=>readFileSync(new URL('../apple-editions/ai-academy-v5/'+p,import.meta.url),'utf8');
test('Apple-like horizontal shelves and experiment buttons use native momentum and soft snap',()=>{
 const css=read('v5-apple-swipe.css');
 assert.match(css,/\.experiment-tabs/);
 assert.match(css,/\.shelf/);
 assert.match(css,/overflow-x:\s*auto/);
 assert.match(css,/scroll-snap-type:\s*x proximity/);
 assert.match(css,/-webkit-overflow-scrolling:\s*touch/);
 assert.match(css,/touch-action:\s*pan-x/);
 assert.match(css,/scroll-padding-inline/);
 assert.match(css,/prefers-reduced-motion:\s*reduce/);
});
test('one bottom-edge backdrop: do not stack dock backdrop blur on the edge',()=>{
 const css=read('v5-apple-swipe.css');
 assert.match(css,/body::after/);
 assert.match(css,/backdrop-filter:\s*blur\(14px\)/);
 assert.match(css,/mask-image:\s*linear-gradient/);
 assert.match(css,/\.mobile-native-tabs \.nav-optics/);
 assert.match(css,/backdrop-filter:\s*none\s*!important/);
 assert.match(css,/\.995\) 100%/);
 assert.match(read('index.html'),/v5-apple-swipe\.css/);
});
test('Duolingo-inspired buttons have faster downstroke, springy release and no layout jump',()=>{
 const css=read('v5-apple-swipe.css');
 assert.match(css,/\.toolbar-trailing \.doctor-launch/);
 assert.match(css,/\.workshop-actions \.primary/);
 assert.match(css,/\.learning-page \.primary/);
 assert.match(css,/cubic-bezier\(\.22,1\.32,\.35,1\)/);
 assert.match(css,/transition-duration:\s*90ms/);
 assert.match(css,/transition-duration:\s*240ms/);
 assert.doesNotMatch(css,/height:\s*calc\(100%/);
});
