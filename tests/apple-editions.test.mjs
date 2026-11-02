import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const html=readFileSync(join(root,'docs/index.html'),'utf8');
const code=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(code,'the judge router has an executable head script');
function resolve(path){
  const u=new URL(path,'https://ndshuge.github.io');
  let destination=null;
  const location={href:u.href,origin:u.origin,search:u.search,hash:u.hash,replace(s){destination=String(s)}};
  runInNewContext(code,{location,URL,URLSearchParams},{timeout:1000});
  return destination;
}
const base='https://ndshuge.github.io/zhixu-ai-academy/';
test('official judge homepage stays in original repo and opens Apple V5',()=>{
  assert.equal(resolve('/zhixu-ai-academy/?judge=1#learn'),base+'apple-editions/ai-academy-v5/?judge=1#learn');
});
test('R3 and Original remain independently addressable',()=>{
  assert.equal(resolve('/zhixu-ai-academy/?edition=r3'),base+'apple-editions/ai-academy-apple/');
  assert.equal(resolve('/zhixu-ai-academy/?edition=original&judge=1'),base+'original.html?judge=1');
});
test('both Apple frontends are part of the official source repo',()=>{
  assert.ok(existsSync(join(root,'apple-editions/ai-academy-v4/index.html')));
  assert.ok(existsSync(join(root,'apple-editions/ai-academy-v5/index.html')));
  assert.ok(existsSync(join(root,'apple-editions/ai-academy-v4/bridge.js')));
  assert.ok(existsSync(join(root,'apple-editions/ai-academy-apple/index.html')));
  assert.ok(existsSync(join(root,'apple-editions/ai-academy-apple/assets/LICENSE-liquidglass.txt')));
});
test('Pages deployment packages both versions next to original science runtime',()=>{
  const yaml=readFileSync(join(root,'.github/workflows/deploy-pages.yml'),'utf8');
  assert.match(yaml,/apple-editions/);
  assert.match(yaml,/original\.html/);
});
