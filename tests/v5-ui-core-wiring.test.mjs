import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const base=new URL('../apple-editions/ai-academy-v5/',import.meta.url);
const entry=readFileSync(new URL('v4.js',base),'utf8');
const html=readFileSync(new URL('index.html',base),'utf8');
test('the latest V5 app wires the new core behind its existing learning route',()=>{
 assert.match(entry,/makeCoreHost\(bridge\)/);
 assert.match(entry,/renderCore\(/);
 assert.match(entry,/coreHost\.submit\(/);
 assert.match(entry,/coreHost\.action\(/);
 assert.match(entry,/coreHost\.start\(/);
});
test('the core and page motion styles remain content-scoped and preserve Dock assets',()=>{
 assert.match(html,/v5-core-learning\.css/);
 assert.match(html,/v6-paired-pages\.js/);
 assert.match(html,/v5-focus-smoothing\.css/);
 assert.match(html,/v5-xiaoya-dock\.css\?v=20261104-xiaoya-a/);
});
