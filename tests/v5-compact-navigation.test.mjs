import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const r=new URL('../apple-editions/ai-academy-v5/',import.meta.url);
const read=f=>readFileSync(new URL(f,r),'utf8');
test('extreme narrow zoom retains accessible More navigation, rather than five 30px tabs',()=>{
 const html=read('index.html');
 assert.match(html,/id="zoom-more"/);
 assert.match(html,/id="zoom-more-menu"/);
 assert.match(html,/aria-haspopup="menu"/);
 assert.doesNotMatch(html,/\\\\n<link/,'stylesheets must be separate real HTML elements');
});
test('narrow zoom uses 44px controls and a hidden by default accessible sheet',()=>{
 const css=read('v5-zoom-navigation.css');
 assert.match(css,/@media\s*\(max-width:260px\)/);
 assert.match(css,/min-width:44px/);
 assert.match(css,/#zoom-more-menu\[hidden\]/);
});
test('More navigation maps hidden destinations, closes on Escape, and remains in sync with route',()=>{
 const js=read('v4.js');
 assert.match(js,/function closeZoomMenu\(/);
 assert.match(js,/toggle-more/);
 assert.match(js,/zoom-more-menu/);
 assert.match(js,/if\(event\.key==='Escape'/);
 assert.ok(js.includes('const moreRoutes=/^(library|growth)$/;'));
});