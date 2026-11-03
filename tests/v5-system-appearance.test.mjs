import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const dir=new URL('../apple-editions/ai-academy-v5/',import.meta.url);
const html=readFileSync(new URL('index.html',dir),'utf8');
test('V5 declares system light and dark color appearance without touching historical editions',()=>{
 assert.match(html,/v5-system-appearance\.css/);
 assert.match(html,/name="theme-color" media="\(prefers-color-scheme: dark\)"/);
});
test('dark system mode uses meaningful text, surface and focus-color roles',()=>{
 const css=readFileSync(new URL('v5-system-appearance.css',dir),'utf8');
 assert.match(css,/@media\s*\(prefers-color-scheme:\s*dark\)/);
 assert.match(css,/\.reading-column/);
 assert.match(css,/\.learning-paper/);
 assert.match(css,/\.setting-group/);
 assert.match(css,/\.doctor-panel/);
 assert.match(css,/#mobile-tabs/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/prefers-contrast:\s*more/);
});
