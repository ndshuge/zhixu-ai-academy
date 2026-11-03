import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const base=new URL('../apple-editions/ai-academy-v5/',import.meta.url),js=readFileSync(new URL('v4.js',base),'utf8'),css=readFileSync(new URL('v5-product-design.css',base),'utf8');
test('settings route clears the floating Dock selection without claiming another tab',()=>{assert.match(js,/nav\.classList\.toggle\('has-no-tab',!active\)/);assert.match(js,/if\(!active\)\{\s*navAnimation\?\.stop\?\.\(\);\s*return;/);assert.match(css,/\.mobile-native-tabs\.has-no-tab \.tab-lens/);});
