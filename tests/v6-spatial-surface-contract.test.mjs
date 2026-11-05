import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const dir=new URL('../apple-editions/ai-academy-v5/',import.meta.url);
const read=f=>readFileSync(new URL(f,dir),'utf8');
test('real route push/pop preserves old reading layer briefly but never freezes Dock',()=>{
 const controller=read('v4.js'),motion=read('v6-paired-pages.js');
 assert.match(controller,/pageContinuity\.prepare\(previous,route\)/);
 assert.match(controller,/pageContinuity\.prepare\(previous,destination\)/);
 assert.match(motion,/zx-route-outgoing/);
 assert.match(motion,/zx-route-incoming/);
 assert.doesNotMatch(motion,/cloneNode/);
 assert.match(motion,/aria-hidden/);
 assert.match(motion,/inert/);
 assert.match(motion,/\.removeAttribute\('id'\)/);
 assert.doesNotMatch(motion,/#mobile-tabs|\.tab-lens/);
});
test('the doctor and settings dialogs use reversible surfaces with actual exit lifetimes',()=>{
 const controller=read('v4.js'),api=read('v5-native-api.js'),spatial=read('v5-surface-continuity.js');
 assert.match(controller,/enterSurface\(shade/);
 assert.match(controller,/exitSurface\(shade/);
 assert.match(api,/enterSurface\(shade/);
 assert.match(api,/exitSurface\(leaving/);
 assert.match(spatial,/transitionend/);
 assert.match(spatial,/requestAnimationFrame/);
});
test('new CSS exclusively styles outside fixed Dock',()=>{
 const css=read('v5-spatial-continuity.css');
 assert.match(css,/\.zx-nav-ghost/);
 assert.match(css,/\.zx-surface-open/);
 assert.match(css,/body\.doctor-open #screen/);
 assert.match(css,/#screen\[data-page="settings"\]/);
 assert.doesNotMatch(css,/#mobile-tabs|\.tab-lens|\.mobile-native-tabs|\.zx-progressive-underlay/);
});
test('the recorded reference is tied to actual sources and engineering constraints',()=>{
 const doc=readFileSync(new URL('../../docs/SHUGE_MOTION_REFERENCE_AND_VIDEO_20261104.md',dir),'utf8');
 assert.match(doc,/python\.html/);
 assert.match(doc,/apple-ui-动效实验室\.html/);
 assert.match(doc,/33 秒|32\.53 秒/);
 assert.match(doc,/Dock/);
});
