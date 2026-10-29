import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { join, dirname } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const index = readFileSync(join(here, '../docs/index.html'), 'utf8');
const script = index.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'The contest landing page must have an inline head redirect');

function route(pathname) {
  const url = new URL(pathname, 'https://ndshuge.github.io');
  let redirect = null;
  const location = {
    href: url.href,
    origin: url.origin,
    search: url.search,
    hash: url.hash,
    replace(next) { redirect = String(next); },
  };
  runInNewContext(script, { location, URL, URLSearchParams }, { timeout: 1000 });
  assert.ok(redirect, 'The landing page must redirect without displaying the legacy UI');
  return redirect;
}

const apple = 'https://ndshuge.github.io/ndshuge-galaxy/little-works/ai-academy-apple/';
const original = 'https://ndshuge.github.io/zhixu-ai-academy/original.html';

test('contest root opens the latest Apple Edition', () => {
  assert.equal(route('/zhixu-ai-academy/'), apple);
});
test('judge links open the Apple Edition instead of the old experience', () => {
  assert.equal(route('/zhixu-ai-academy/?judge=1'), apple + '?judge=1');
  assert.equal(route('/zhixu-ai-academy/index.html?judge=1#courses'), apple + '?judge=1#courses');
});
test('existing competition QR links preserve their query and hash', () => {
  assert.equal(route('/zhixu-ai-academy/?utm_source=competition#learn'), apple + '?utm_source=competition#learn');
});
test('explicit Original Edition opt-in keeps the original accessible', () => {
  assert.equal(route('/zhixu-ai-academy/?edition=original'), original);
  assert.equal(route('/zhixu-ai-academy/?judge=1&edition=original#learn'), original + '?judge=1#learn');
  assert.ok(readFileSync(join(here, '../docs/original.html')).length > 100);
});
