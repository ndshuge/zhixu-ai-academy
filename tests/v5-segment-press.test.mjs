import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';
const read=f=>readFileSync(new URL('../apple-editions/ai-academy-v5/'+f,import.meta.url),'utf8');
test('learning focuses without global experiment tabs while home retains model choice',()=>{
 const views=read('views.js'),app=read('v4.js'),css=read('v5-focus-navigation.css');
 assert.doesNotMatch(views,/experiment-lens/);
 assert.match(views,/enter-logistic/);
 assert.match(views,/exit-focus/);
 assert.match(app,/document.body.dataset.focus/);
 assert.match(css,/body\[data-focus="true"\] #mobile-tabs/);
});
test('dock commits faster and API controls belong to V5, never Original iframe',()=>{
 assert.match(read('v6-press-clock.js'),/#mobile-tabs button/);
 assert.doesNotMatch(read('v6-press-clock.js'),/target\.click\(\)/);
 assert.match(read('v5-native-api.js'),/zx-api-panel/);
 assert.match(read('bridge.js'),/nativeApi/);
 assert.match(read('v4.js'),/ZHIXU_NATIVE_API.open/);
 assert.doesNotMatch(read('v4.js'),/show-original-engine/);
 assert.match(read('v5-native-api.css'),/zx-api-panel/);
});