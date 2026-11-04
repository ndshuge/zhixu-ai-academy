import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../apple-editions/ai-academy-v5/',import.meta.url);
const code=(name)=>readFileSync(new URL(name,root),'utf8');
test('production V5 loads fresh UI entry, views and content stylesheet after UI release',()=>{
 const html=code('index.html'),entry=code('v4.js');
 assert.match(html,/\.\/v4\.js\?v=20261104-ui-release-a/);
 assert.match(html,/\.\/v5-learning-continuity\.css\?v=20261104-ui-release-a/);
 assert.match(entry,/\.\/views\.js\?v=20261104-ui-release-a/);
 assert.match(entry,/\.\/v5-lesson-motion\.js/);
});
test('release identifiers never touch fixed Dock assets',()=>{
 const html=code('index.html');
 assert.match(html,/v5-xiaoya-dock\.css\?v=20261104-xiaoya-a/);
 assert.match(html,/v5-dock-near-clear\.css\?v=20261104-xiaoya-b/);
});
