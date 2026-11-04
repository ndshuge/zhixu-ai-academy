import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';
const read=f=>readFileSync(new URL('../apple-editions/ai-academy-v5/'+f,import.meta.url),'utf8');
test('V5 session API script is V5 scoped and shows actionable codes without storing credentials',()=>{
 const bridge=read('bridge.js'),script=read('v5-deepseek.js');
 assert.match(bridge,/v5-deepseek\.js/);
 assert.match(script,/sessionOnly/);
 assert.match(script,/allowedModels=new Set\(\['deepseek-flash','deepseek-v4-pro'\]\)/);
 for(const code of ['401','402','429','400','422','503'])assert.match(script,new RegExp(code));
 assert.match(script,/platform\.deepseek\.com/);
 assert.match(script,/连接诊断/);
});
test('dock bottom uses existing thick shade stretched beyond visual viewport with no second blur',()=>{
 const css=read('v5-bottom-shade.css');
 assert.match(read('index.html'),/v5-bottom-shade\.css/);
 assert.match(css,/body::after/);
 assert.match(css,/bottom:\s*calc\(-100px/);
 assert.match(css,/height:\s*calc\(350px/);
 assert.match(css,/\.98\) 70%/);
 assert.match(css,/backdrop-filter:\s*blur\(24px\)/);
 assert.doesNotMatch(css,/body::before/);
 assert.match(css,/keyboard-visible/);
});