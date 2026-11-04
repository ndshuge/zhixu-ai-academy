import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';
const read=f=>readFileSync(new URL('../apple-editions/ai-academy-v5/'+f,import.meta.url),'utf8');
test('V5 API is a native session-only connection sheet, never Original iframe setup',()=>{
 const bridge=read('bridge.js'),script=read('v5-native-api.js');
 assert.match(bridge,/nativeApi/);
 assert.doesNotMatch(bridge,/v5-deepseek\.js/);
 assert.match(script,/allowedModels=new Set\(\['deepseek-flash','deepseek-v4-pro'\]\)/);
 for(const code of ['401','402','429','400','422','503'])assert.match(script,new RegExp(code));
 assert.match(script,/platform\.deepseek\.com/);
 assert.match(script,/zx-api-panel/);
 assert.doesNotMatch(script,/localStorage\.(setItem|getItem)/);
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