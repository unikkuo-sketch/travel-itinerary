/**
 * ponytail: one assert file for non-trivial path / prefecture logic.
 * Upgrade: add cases here; do not introduce a test framework.
 */
import assert from 'node:assert/strict';
import { tripIdFromPath, tripUrl } from '../js/load-trip.js';
import { isJapanTrip, manholeMapUrl, resolvePrefectures } from '../js/manhole.js';
import { tripPageMeta } from '../js/seo.js';
import { SITE_ORIGIN } from '../js/site.js';

assert.equal(tripIdFromPath('/trips/foo_bar/', ''), 'foo_bar');
assert.equal(tripIdFromPath('/trips/foo_bar', ''), 'foo_bar');
assert.equal(tripIdFromPath('/trips/manifest.json', ''), null);
assert.equal(tripIdFromPath('/trips/_template/', ''), null);
assert.equal(tripIdFromPath('/shopping.html', '?trip=abc'), 'abc');
assert.equal(
  tripIdFromPath(`/trips/${encodeURIComponent('2026_日本熱海長瀞_家族旅遊')}/`, ''),
  '2026_日本熱海長瀞_家族旅遊'
);

assert.equal(tripUrl('x'), '/trips/x/');
assert.equal(tripUrl('x', 'shopping'), '/shopping.html?trip=x');
assert.equal(tripUrl('x', 'stories'), '/trips/x/stories.html');
assert.equal(tripUrl('x', 'food'), '/trips/x/food.html');

assert.equal(isJapanTrip({}, '2026_日本熱海長瀞_家族旅遊'), true);
assert.equal(isJapanTrip({ title: 'Tuscany' }, '2027_義大利托斯卡尼_蜜月'), false);

const prefs = resolvePrefectures({ routeRegions: '宮城・青森' });
assert.deepEqual(
  prefs.map((p) => p.code),
  ['04', '02']
);
assert.match(manholeMapUrl('04'), /prefecture=04/);

assert.equal(SITE_ORIGIN, 'https://universum-sliver.vercel.app');

const fallback = tripPageMeta(
  { title: '範例行程', subtitle: 'A × B', badge: '2023年' },
  'trip'
);
assert.equal(fallback.title, '範例行程 | 2023年');
assert.equal(fallback.description, 'A × B');
assert.equal(
  tripPageMeta({ title: '範例行程', subtitle: 'A × B' }, 'stories').title,
  '風土 | 範例行程'
);
const seoMeta = {
  title: '顯示用標題',
  subtitle: '副標',
  badge: '2023年',
  seo: {
    title: 'SEO 行程標題',
    description: 'SEO 行程描述',
    stories: { title: 'SEO 風土標題', description: 'SEO 風土描述' },
    food: { title: 'SEO 飲食標題', description: 'SEO 飲食描述' },
  },
};
assert.deepEqual(tripPageMeta(seoMeta, 'trip'), {
  title: 'SEO 行程標題',
  description: 'SEO 行程描述',
});
assert.deepEqual(tripPageMeta(seoMeta, 'stories'), {
  title: 'SEO 風土標題',
  description: 'SEO 風土描述',
});
assert.deepEqual(tripPageMeta(seoMeta, 'food'), {
  title: 'SEO 飲食標題',
  description: 'SEO 飲食描述',
});

console.log('check: ok');
