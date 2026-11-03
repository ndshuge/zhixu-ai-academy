import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const dir=path.resolve('apple-editions/ai-academy-v5');
const read=name=>fs.readFileSync(path.join(dir,name),'utf8');
test('navigation uses the same short labels across phone and desktop',()=>{
 const html=read('index.html'),views=read('views.js');
 for(const [route,label] of [['learn','学习'],['library','资料'],['growth','进度']]){
  assert.match(views,new RegExp(route+":'"+label+"'"));
  assert.match(html,new RegExp('data-route="'+route+'" class="menu-item"[^>]*>[\\s\\S]*?<span>'+label+'</span>'));
 }
});
test('learning starts with a clear student action, not developer/engine copy',()=>{
 const src=read('views.js');
 assert.match(src,/开始前测/);
 assert.doesNotMatch(src,/加载原版前测题|加载原版迁移题|此界面不改变评分方式/);
});
test('home removes ornament labels and repeated giant title',()=>{
 const src=read('views.js'),html=read('index.html');
 for(const unnecessary of ['PERSONAL LEARNING STUDIO','LIVE MATH PREVIEW','THE METHOD','CHOOSE A WORLD','YOUR EVIDENCE','01 / CHAOS','02 / EVOLUTION']){
  assert.doesNotMatch(src,new RegExp(unnecessary));
  assert.doesNotMatch(html,new RegExp(unnecessary));
 }
 assert.match(src,/<h1>只差十万分之一/);
 assert.match(html,/<h1>只差十万分之一/);
 assert.match(src,/亲手调节参数/);
});
test('mobile reading copy and controls meet a deliberate size hierarchy',()=>{
 const html=read('index.html'),css=read('v5-ui-polish.css');
 assert.match(html,/v5-ui-polish\.css\?v=20261103b/,'new CSS release must invalidate cached pre-iPad stylesheet');
 assert.match(css,/.workshop-hero-copy>p/);
 assert.match(css,/font-size:14px/);
 assert.match(css,/.preview-note/);
 assert.match(css,/font-size:12px/);
 assert.match(css,/min-height:44px/);
 assert.match(css,/@media\(max-width:700px\)/);
});
test('tablet landscape/narrow viewport switches scientific hero to full-width layout',()=>{
 const css=read('v5-ui-polish.css');
 assert.match(css,/@media\s*\(min-width:701px\)\s*and\s*\(max-width:990px\)/);
 assert.match(css,/\.workshop-hero\s*\{\s*grid-template-columns:1fr/);
 assert.match(css,/\.workshop-preview\s*\{[^}]*border-left:0/);
});
test('mobile header icon and avatar meet minimum 44px touch geometry',()=>{
 const css=read('v5-ui-polish.css');
 assert.match(css,/\.toolbar-trailing \.doctor-launch\s*\{[^}]*width:44px/);
 assert.match(css,/\.toolbar-trailing \.icon-button\s*\{[^}]*width:44px/);
});
test('same-route taps do not rerender or jump and navigation is stable',()=>{
 const js=read('v4.js');
 assert.match(js,/if\(!changed&&!replace\)return/);
 assert.doesNotMatch(js,/window\.scrollTo\(\{top:0,behavior:'instant'\}\)/);
});
