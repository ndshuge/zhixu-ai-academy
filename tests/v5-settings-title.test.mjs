import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
globalThis.window={addEventListener(){}};
const {settings}=await import('../apple-editions/ai-academy-v5/views.js');
const css=readFileSync(new URL('../apple-editions/ai-academy-v5/v5-learning-continuity.css',import.meta.url),'utf8');
test('settings retains a semantic h1 while visually hiding the duplicate toolbar title',()=>{
 const markup=settings({bridge:{status:{mentorMode:'rules'}},prefs:{textScale:100,reduceMotion:false}});
 assert.match(markup,/<header class="page-intro"><h1>设置<\/h1><\/header>/);
 assert.match(css,/#screen\[data-page="settings"\] > \.page-intro\s*\{/);
 assert.match(css,/clip-path:inset\(50%\)/);
});
test('settings content polish cannot change frozen Dock selectors',()=>{
 const settingsOnly=css.split('/* Settings page heading cleanup */')[1]||'';
 assert.doesNotMatch(settingsOnly,/#mobile-tabs|\.tab-item|\.tab-lens|\.mobile-native-tabs|body::after/);
});
