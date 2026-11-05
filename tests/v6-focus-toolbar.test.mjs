import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const root=new URL('../apple-editions/ai-academy-v5/',import.meta.url),read=f=>readFileSync(new URL(f,root),'utf8');
test('learning keeps toolbar and Dock interactive instead of setting inert',()=>{
 const js=read('v4.js');
 assert.match(js,/nav\.inert=false/);
 assert.match(js,/toolbar\.inert=false/);
 assert.match(js,/nav\.removeAttribute\('aria-hidden'\)/);
});
test('focus mode preserves full toolbar height and Dock visibility',()=>{
 const css=read('v6-paired-pages.css');
 assert.match(css,/body\[data-focus="true"\] #mobile-tabs\{[^}]*visibility:visible!important/s);
 assert.match(css,/body\[data-focus="true"\] \.reading-column > \.toolbar\{[^}]*height:67px!important/s);
});
