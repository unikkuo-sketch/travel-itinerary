/**
 * Re-run: node scripts/check-affiliate-links.mjs
 * Extracts every kqzyfj.com affiliate link and checks the CJ deep-link shape.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PID = '101911030';
const AID = '17293139';
const JAQ = 'https://www.booking.com/hotel/jp/hostel-jaq-takamatsu.zh-tw.html';
const EXPECTED = [
  'https://www.booking.com/hotel/jp/long-nai-jia-bie-guan-yu-nai-tang.zh-tw.html',
  'https://www.booking.com/hotel/jp/hotel-torifito-otaru-channel.zh-tw.html',
  'https://www.booking.com/hotel/jp/jozankei-view.zh-tw.html',
  JAQ,
  JAQ,
  'https://www.booking.com/hotel/jp/hoterurizopiaatami.zh-tw.html',
  'https://www.booking.com/hotel/jp/route-inn-grand-chichibu.zh-tw.html',
  'https://www.booking.com/hotel/jp/ooedo-onsen-monogatari-sohkan.zh-tw.html',
];

const SKIP = new Set(['node_modules', 'dist', 'build', '.git', '.vercel']);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
}

function extract(text) {
  return text.match(/https:\/\/www\.kqzyfj\.com\/click-[^"'\s<>]+/g) || [];
}

const links = walk('.').flatMap((path) =>
  extract(readFileSync(path, 'utf8')).map((url) => ({ path, url }))
);

assert.equal(links.length, 8, `expected 8 kqzyfj links, found ${links.length}`);

const jaq = links.filter((item) => item.url.includes('hostel-jaq-takamatsu'));
assert.equal(jaq.length, 2, 'JAQ should appear twice');
assert.equal(jaq[0].url, jaq[1].url, 'the two JAQ links must be identical');

const dests = links.map(({ path, url }) => {
  const parsed = new URL(url);
  assert.equal(parsed.protocol, 'https:');
  assert.equal(parsed.hostname, 'www.kqzyfj.com');
  assert.equal(parsed.pathname, `/click-${PID}-${AID}`, `${path} PID/AID`);
  assert.deepEqual([...parsed.searchParams.keys()], ['url'], `${path} query keys`);
  const dest = parsed.searchParams.get('url');
  const hotel = new URL(dest);
  assert.equal(hotel.search, '', `${path} destination query`);
  assert.equal(hotel.hash, '', `${path} destination hash`);
  assert.equal(hotel.href, dest, `${path} destination must be the clean page`);
  const clickBase = ['https://www.kqzyfj.com', `click-${PID}-${AID}`].join('/');
  assert.equal(url, `${clickBase}?url=${encodeURIComponent(dest)}`);
  return dest;
});

assert.deepEqual([...dests].sort(), [...EXPECTED].sort());

console.log('affiliate-links: ok');
console.log(`count ${links.length}; JAQ identical; PID ${PID}; AID ${AID}`);
for (const dest of dests) console.log(dest);
