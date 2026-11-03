import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const dir=new URL('../apple-editions/ai-academy-v5/',import.meta.url);
const read=p=>readFileSync(new URL(p,dir),'utf8');
test('V5 explicitly supports readable scientific helper copy',()=>{
 const html=read('index.html'),css=read('v5-science-legibility.css');
 assert.match(html,/v5-science-legibility\.css/);
 assert.match(css,/\.preview-note/);
 assert.match(css,/\.workshop-trust/);
 assert.match(css,/\.workshop-facts \.metric span/);
 assert.match(css,/\.preview-top/);
 assert.match(css,/\.method-steps span/);
 assert.match(css,/font-size:13px/);
});
test('scientific formulas wrap without truncation at mobile widths',()=>{
 const css=read('v5-science-legibility.css');
 assert.match(css,/overflow-wrap:anywhere/);
 assert.match(css,/@media\(max-width:700px\)/);
});