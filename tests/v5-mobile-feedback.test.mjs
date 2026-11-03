import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const dir=new URL('../apple-editions/ai-academy-v5/',import.meta.url);
const source=(name)=>readFileSync(new URL(name,dir),'utf8');
test('library review arrow must have a constrained icon class, not an intrinsic unbounded SVG',()=>{
 const view=source('views.js');
 assert.ok(view.includes('class="simple-row review-task"'));
 assert.ok(view.includes('class="row-chevron"'));
 assert.doesNotMatch(view,/glyph\('i-chevron'\.replace\('i-',''\)\)/);
});
test('V5 review layout preserves the reading column and multiline Chinese text',()=>{
 const css=source('v5-recording-fixes.css');
 assert.match(css,/#screen\[data-page="library"\] \.review-task/);
 assert.match(css,/#screen\[data-page="library"\] \.review-task \.row-chevron/);
 assert.match(css,/overflow-wrap:anywhere/);
 assert.match(css,/max-inline-size:100%/);
});
test('V5 Toast is measured relative to the actual floating dock edge and survives browser chrome changes',()=>{
 const js=source('v4.js');
 const css=source('v5-recording-fixes.css');
 assert.match(js,/function syncToastPosition\(\)/);
 assert.match(js,/getBoundingClientRect\(\)\.top/);
 assert.match(js,/--zx-toast-bottom/);
 assert.match(css,/bottom:var\(--zx-toast-bottom/);
 assert.match(css,/#toast\.show/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});
test('Toast is a live region, keeping full readable feedback instead of clipping instructions',()=>{
 const html=source('index.html'),js=source('v4.js');
 assert.match(html,/id="toast"[^>]*role="status"/);
 assert.match(html,/id="toast"[^>]*aria-live="polite"/);
 assert.match(js,/toast\.textContent=String\(message\)/);
});
