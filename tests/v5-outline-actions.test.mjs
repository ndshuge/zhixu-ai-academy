import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.window={addEventListener(){}};
const {outline}=await import('../apple-editions/ai-academy-v5/views.js');
test('library outline does not claim non-functional static categories are clickable buttons',()=>{
 const html=outline('library',{tasks:()=>[{},{}]},{step:0,highest:0});
 assert.match(html,/资料分类/);
 assert.match(html,/待复习/);
 assert.match(html,/最近作答/);
 assert.doesNotMatch(html,/<button\b/,'without a real destination, categories remain non-interactive labels');
 assert.match(html,/class="outline-row/,'keep the existing visual row grammar');
});
test('today outline still exposes a real learning action and a real growth route',()=>{
 const html=outline('today',{tasks:()=>[]},{step:0,highest:0});
 assert.match(html,/data-action="enter-sensitivity"/);
 assert.match(html,/data-route="growth"/);
});
