import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../apple-editions/ai-academy-v5/',import.meta.url);
const read=name=>readFileSync(new URL(name,root),'utf8');
test('focus learning always keeps the same Dock and toolbar operable',()=>{
 const js=read('v4.js'),css=read('v6-paired-pages.css');
 assert.match(js,/nav\.inert=false/);
 assert.match(js,/toolbar\.inert=false/);
 assert.match(css,/body\[data-focus="true"\] #mobile-tabs\{[^}]*visibility:visible!important/s);
 assert.match(css,/body\[data-focus="true"\] \.reading-column > \.toolbar\{[^}]*height:67px!important/s);
});
test('paired transition moves two full-size fixed planes together with no opacity or scale changes',()=>{
 const js=read('v6-paired-pages.js');
 assert.match(js,/zx-route-outgoing/);
 assert.match(js,/zx-route-incoming/);
 assert.doesNotMatch(js,/cloneNode\(/);
 assert.doesNotMatch(js,/children\.slice\(/);
 assert.match(js,/startX = direction \* width/);
 assert.match(js,/endX = -direction \* width/);
 assert.match(js,/entering\.finished/);
});
test('settings is first-class Dock destination without a second top-right entry',()=>{
 const html=read('index.html'),app=read('v4.js');
 assert.match(html,/<button data-route="settings" class="tab-item"/);
 assert.doesNotMatch(html,/class="icon-button" data-route="settings" aria-label="设置"/);
 assert.match(app,/const moreRoutes=\/\^\(library\|growth\|settings\)\$\//);
 assert.doesNotMatch(app,/route==='settings' && state\.route==='settings'/);
});
test('press feedback retains a single click and no delayed re-dispatch',()=>{
 const js=read('v6-press-clock.js');
 assert.doesNotMatch(js,/target\.click\(\)/);
 assert.doesNotMatch(js,/stopImmediatePropagation/);
 assert.match(js,/dataset\.zxPress='down'/);
});
