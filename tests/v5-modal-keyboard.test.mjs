import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../apple-editions/ai-academy-v5/v4.js',import.meta.url),'utf8');
test('destructive confirmation supports Escape and Tab cycling, returning focus to triggering control',()=>{
 assert.match(src,/function confirmModal\(title,message,action,triggerEl\)/);
 assert.match(src,/const trigger=triggerEl\|\|document\.activeElement/);
 assert.match(src,/shade\.addEventListener\('keydown'/);
 assert.match(src,/event\.key==='Escape'/);
 assert.match(src,/event\.key==='Tab'/);
 assert.match(src,/trigger\.focus\(\{preventScroll:true\}\)/);
 assert.ok(src.includes('aria-describedby="confirm-description"'));
});
