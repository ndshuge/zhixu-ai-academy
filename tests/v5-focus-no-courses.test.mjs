import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(f)=>readFileSync(new URL('../apple-editions/ai-academy-v5/'+f,import.meta.url),'utf8');
test('Courses is no longer a V5 route or Dock destination',()=>{
 const html=read('index.html'),view=read('views.js'),app=read('v4.js');
 assert.doesNotMatch(html,/data-route="courses"/);
 assert.doesNotMatch(view,/courses:'课程'/);
 assert.doesNotMatch(view,/screens=\{today,courses/);
 assert.doesNotMatch(app,/courses\|library\|growth/);
 assert.match(app,/if\(!titles\[route\]\)/);
});
test('Learn keeps one visible exit and no distracting experiment switcher',()=>{
 const view=read('views.js');
 assert.doesNotMatch(view,/class="experiment-tabs"/);
 assert.match(view,/click\('退出学习','exit-focus'\)/);
 assert.match(view,/data-action="enter-logistic"/);
 const app=read('v4.js');
 assert.match(app,/document\.body\.dataset\.focus/);
 assert.match(app,/a==='exit-focus'/);
 assert.match(app,/a==='enter-logistic'/);
});
test('mobile Dock slides below viewport while learning, respects reduced motion and accessibility',()=>{
 const css=read('v5-focus-navigation.css'),html=read('index.html');
 assert.match(html,/v5-focus-navigation\.css/);
 assert.match(css,/body\[data-focus="true"\] #mobile-tabs/);
 assert.match(css,/translate3d\(0,calc\(100% \+ 48px/);
 assert.match(css,/body\[data-focus="true"\] \.zx-progressive-underlay/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/\.master-sidebar/);
});
