import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const base=new URL('../apple-editions/ai-academy-v5/',import.meta.url);
const read=p=>readFileSync(new URL(p,base),'utf8');
test('same-route learning reset triggers a fresh render',()=>{
 const src=read('v4.js');
 assert.ok(src.includes("if(a==='reset-lesson'){"));
 assert.ok(src.includes("if(state.route==='learn')render();else goto('learn')"));
});
test('setting actions keep legible minimum touch boxes',()=>{
 const html=read('index.html'),css=read('v5-product-design.css');
 assert.ok(html.includes('v5-product-design.css'));
 for(const x of ['.setting-row .quiet-button','.setting-row .link-action','min-width:64px','min-height:44px','white-space:nowrap','.setting-row>div'])
  assert.ok(css.includes(x),x);
});
test('learning primary CTA and slider offer 44px hitboxes',()=>{
 const css=read('v5-product-design.css');
 assert.ok(css.includes('#v5-r-control{min-height:44px'));
 assert.ok(css.includes('#screen[data-page="learn"] .learning-paper .primary{min-height:44px'));
});
test('settings switch has a rounded 30px track inside its 44px hitbox',()=>{
 const css=read('v5-product-design.css');
 assert.ok(css.includes('.setting-row .switch::after'));
 assert.ok(css.includes('border-radius:15px'));
 assert.ok(css.includes('.setting-row .switch[aria-checked=true]::after'));
});
test('settings no longer suggests that the last tab is selected or duplicates its gear',()=>{
 const css=read('v5-product-design.css'),views=read('views.js');
 assert.ok(css.includes('#mobile-tabs .tab-lens{opacity:0'));
 assert.ok(css.includes('#mobile-tabs button.tab-item{color:#515e64!important'));
 assert.ok(css.includes('.toolbar-trailing button[data-route="settings"]{display:none'));
 assert.ok(!views.includes("heading('个人中心','设置','把学习空间调整为适合你自己的节奏。')"));
});
test('desktop collapses inert secondary columns but leaves active navigation intact',()=>{
 const css=read('v5-product-design.css');
 for(const route of ['settings','library','growth'])
  assert.ok(css.includes('body:has(#screen[data-page="'+route+'"]) .outline-sidebar'),route);
 assert.ok(css.includes('.outline-sidebar{display:none'));
 assert.ok(!css.includes('body:has(#screen[data-page="courses"])'));
 assert.ok(!css.includes('body:has(#screen[data-page="learn"])'));
});