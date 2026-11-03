import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const source=path=>readFileSync(new URL(path,root),'utf8');
const html=source('apple-editions/ai-academy-v5/index.html');
const views=source('apple-editions/ai-academy-v5/views.js');
const app=source('apple-editions/ai-academy-v5/v4.js');
const byok=source('pages-overlay/original-pages-byok.js');
test('V5 text sizes offer meaningful choice and remain independent of learning records',()=>{
 assert.match(views,/data-action="set-type-scale"/);
 assert.match(views,/aria-pressed=/);
 assert.match(app,/--zx-type-scale/);
 assert.match(app,/textScale/);
 assert.match(html,/v5-type-motion\.css/);
 assert.match(source('apple-editions/ai-academy-v5/v5-type-motion.css'),/text-size-adjust:auto/);
});
test('user or system reduced motion suppresses entrances and long press motion',()=>{
 const css=source('apple-editions/ai-academy-v5/v5-type-motion.css');
 assert.match(css,/prefers-reduced-motion:\s*reduce/);
 assert.match(css,/data-reduced="true"/);
 assert.match(css,/animation-duration/);
 assert.match(app,/reduced\(\).*?restoreTab/s);
});
test('V5 science iframe requests session-only BYOK without changing Original default mode',()=>{
 assert.match(html,/learning\.html\?zhixu-v5-session=1/);
 assert.match(byok,/zhixu-v5-session/);
 assert.match(byok,/if\s*\(sessionOnly\)\s*return\s*['"]{2}/);
 assert.match(byok,/if\s*\(sessionOnly\)\s*return true/);
 assert.match(byok,/pages-ai-save-row/);
});
