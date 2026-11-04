import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';
const read=f=>readFileSync(new URL('../apple-editions/ai-academy-v5/'+f,import.meta.url),'utf8');
test('experiment control uses one retained sliding indicator, not a rebuilt horizontal strip',()=>{
 assert.match(read('views.js'),/experiment-lens/);
 assert.match(read('v4.js'),/retainedTabs/);
 assert.match(read('index.html'),/v5-segmented\.js/);
 const css=read('v5-segmented.css');
 assert.match(css,/\.experiment-lens/);
 assert.match(css,/overflow-x:hidden/);
 assert.match(css,/transform/);
 assert.match(css,/prefers-reduced-motion:\s*reduce/);
});
test('dock commits faster and API controls belong to V5, never Original iframe',()=>{
 assert.match(read('v5-press-feedback.js'),/isDockNavigation/);
 assert.match(read('v5-press-feedback.js'),/105/);
 assert.match(read('v5-native-api.js'),/zx-api-panel/);
 assert.match(read('bridge.js'),/nativeApi/);
 assert.match(read('v4.js'),/ZHIXU_NATIVE_API.open/);
 assert.doesNotMatch(read('v4.js'),/show-original-engine/);
 assert.match(read('v5-native-api.css'),/zx-api-panel/);
});