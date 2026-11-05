import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const root=new URL('../apple-editions/ai-academy-v5/',import.meta.url),read=f=>readFileSync(new URL(f,root),'utf8');
test('the Settings tab owns its Dock lens, without a duplicated toolbar gear',()=>{
 const page=read('index.html'),app=read('v4.js');
 assert.match(page,/<button data-route="settings" class="tab-item"/);
 assert.doesNotMatch(page,/class="icon-button" data-route="settings"/);
 assert.match(app,/nav\.querySelector\('button\[data-route=/);
});
