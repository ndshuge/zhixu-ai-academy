import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('apple-editions/ai-academy-v5');
test('scroll-edge strength responds to document overflow rather than always covering content', async()=>{
 const {edgeStrength}=await import('../apple-editions/ai-academy-v5/v5-scroll-edge.js');
 assert.equal(edgeStrength({remaining:900,scrollRange:1200}),1);
 assert.equal(edgeStrength({remaining:60,scrollRange:1200}),.5);
 assert.equal(edgeStrength({remaining:0,scrollRange:1200}),0);
 assert.equal(edgeStrength({remaining:600,scrollRange:0}),0);
 assert.equal(edgeStrength({remaining:100,scrollRange:500,keyboardVisible:true}),0);
});
test('V5 retains the historical scroll-edge utility but ships a static feathered iPhone edge',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const css=fs.readFileSync(path.join(root,'v5-scroll-edge.css'),'utf8');
 assert.doesNotMatch(html,/src="\.\/v5-scroll-edge\.js/);
 assert.match(fs.readFileSync(path.join(root,'v4.js'),'utf8'),/zhixu:content-rendered/);
 assert.match(fs.readFileSync(path.join(root,'v5-scroll-edge.js'),'utf8'),/addEventListener\('zhixu:content-rendered'/);
 assert.match(css,/--zx-edge-opacity/);
 assert.match(css,/pointer-events:\s*none/);
 assert.match(css,/prefers-reduced-transparency/);
});
test('original V4 and scientific bridge stay unaffected',()=>{
 assert.ok(fs.existsSync('apple-editions/ai-academy-v4/index.html'));
 assert.ok(fs.existsSync('apple-editions/ai-academy-v5/bridge.js'));
});
