import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const root=new URL('../apple-editions/ai-academy-v5/',import.meta.url);
const read=f=>readFileSync(new URL(f,root),'utf8');
test('both paired route planes share a single app background token',()=>{
 const css=read('v6-paired-pages.css');
 assert.match(css,/background:var\(--ground/);
 assert.doesNotMatch(css,/background:var\(--white/);
});
test('native DeepSeek and confirm sheets enter from the bottom and reverse on same transform',()=>{
 const css=read('v6-sheet-continuity.css'),js=read('v5-surface-continuity.js'),html=read('index.html');
 assert.match(html,/v6-sheet-continuity\.css/);
 assert.match(css,/\.modal-shade\.zx-surface \.modal/);
 assert.match(css,/translate3d\(0,calc\(100%/);
 assert.match(css,/\.zx-surface-open \.modal/);
 assert.match(js,/transitionend/);
 assert.match(js,/propertyName==='transform'/);
 assert.doesNotMatch(js,/source\.left/);
});
test('settings toggle updates the same physical node without redrawing its whole page',()=>{
 const app=read('v4.js'),css=read('v6-control-continuity.css');
 assert.match(app,/a==='toggle-reduced'/);
 assert.match(app,/el\.setAttribute\('aria-checked'/);
 assert.match(app,/document\.documentElement\.dataset\.reduced/);
 assert.doesNotMatch(app,/if\(a==='toggle-reduced'\)[^\n]*render\(\)/);
 assert.match(css,/\.switch\[aria-checked="true"\]::before/);
 assert.match(css,/transform:translate3d/);
 assert.match(css,/transition:transform/);
});
test('type-scale control is in place with no settings DOM teardown',()=>{
 const app=read('v4.js');const action=app.match(/if\(a==='set-type-scale'\)\{[\s\S]*?\n\s*\}/)?.[0];
 assert.ok(action);
 assert.doesNotMatch(action,/render\(\)/);
 assert.match(action,/aria-pressed/);
});
