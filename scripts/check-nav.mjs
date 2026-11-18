/**
 * Static + hydrated nav checks. No browser screenshots.
 * Usage: node scripts/check-nav.mjs [previewOrigin]
 *        node scripts/check-nav.mjs --hydration [previewOrigin]
 *        node scripts/check-nav.mjs --hydration --block-init [previewOrigin]
 * Expects dist/ from `npm run build` and a preview server (default http://127.0.0.1:4173).
 * --hydration only checks client init. --block-init must exit non-zero.
 */
import assert from 'node:assert/strict';
import { execSync, spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sortTrips, tripIsPast } from '../js/hub-cards.js';
import { tripUrl } from '../js/load-trip.js';
import { esc } from '../js/photo.js';
import {
  navDayAnchorsHtml,
  navSectionAnchorsHtml,
  sectionIsVisible,
} from '../js/nav.js';
import { tripCanonicalUrl, tripPageMeta } from '../js/seo.js';
import { SITE_ORIGIN } from '../js/site.js';

const cliArgs = process.argv.slice(2);
const hydrationOnly = cliArgs.includes('--hydration');
const blockInit = cliArgs.includes('--block-init');
const INIT_TIMEOUT_MS = 8000;
const preview = (cliArgs.find((arg) => !arg.startsWith('--')) || 'http://127.0.0.1:4173').replace(/\/$/, '');
const manifest = JSON.parse(readFileSync('trips/manifest.json', 'utf8'));
const trips = manifest.trips;
const ATAMI = '2026_日本熱海長瀞_家族旅遊';

const failed = [];
let passed = 0;
function check(cond, msg) {
  if (!cond) {
    failed.push(msg);
    console.error('FAIL', msg);
  } else {
    passed += 1;
  }
}

function decode(text) {
  return String(text ?? '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function anchorsIn(html) {
  const out = [];
  const re = /<a\b([^>]*?)>/gi;
  let m;
  while ((m = re.exec(html))) {
    const tag = ` ${m[1]}`;
    const hrefM = /\shref="([^"]*)"/.exec(tag);
    const classM = /\sclass="([^"]*)"/.exec(tag);
    if (!hrefM) continue;
    out.push({
      href: decode(hrefM[1]),
      className: classM ? classM[1] : '',
      index: m.index,
    });
  }
  return out;
}

function hrefs(list, pred = () => true) {
  return list.filter(pred).map((a) => a.href);
}

function tagText(html, re) {
  const m = re.exec(html);
  return m ? decode(m[1]) : '';
}

function resolved(pageUrl, href) {
  return new URL(href, pageUrl).href;
}

function normHref(href) {
  if (!href) return '';
  const u = new URL(href, `${SITE_ORIGIN}/`);
  return `${u.pathname}${u.search}${u.hash}`;
}

function normList(list) {
  return list.map(normHref).join('|');
}

function readTrip(id) {
  return JSON.parse(readFileSync(join('trips', id, 'itinerary.json'), 'utf8'));
}

function expectedSectionHrefs(id, data) {
  return hrefs(anchorsIn(navSectionAnchorsHtml(id, (sectionId) => sectionIsVisible(data, sectionId))));
}

function expectedDayHrefs(id, data) {
  return hrefs(anchorsIn(navDayAnchorsHtml(id, data.days || [])));
}

async function runHydrationProbe() {
  const head = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  const enc = encodeURIComponent(ATAMI);
  const sample = [
    { kind: 'hub', file: 'dist/index.html', path: '/' },
    { kind: 'trip', file: join('dist/trips', ATAMI, 'index.html'), path: `/trips/${enc}/` },
    { kind: 'stories', file: join('dist/trips', ATAMI, 'stories.html'), path: `/trips/${enc}/stories.html` },
    { kind: 'food', file: join('dist/trips', ATAMI, 'food.html'), path: `/trips/${enc}/food.html` },
  ];
  const absent = {
    hub: ['welcome-card', 'leaflet-container'],
    trip: ['data-ticket-status-bound', 'ph-lightbox'],
    stories: ['ph-lightbox'],
    food: ['ph-lightbox'],
  };
  const staticProblems = [];
  for (const page of sample) {
    const html = readFileSync(page.file, 'utf8');
    for (const needle of absent[page.kind]) {
      if (html.includes(needle)) staticProblems.push(`${page.kind} initial HTML contains ${needle}`);
    }
  }
  if (staticProblems.length) {
    console.error(staticProblems.join('\n'));
    console.log(JSON.stringify({ head, hydrationMatches: 0, failed: staticProblems.length, blockInit, pages: sample.map((p) => p.kind) }));
    process.exit(1);
  }

  const failures = [];
  let hydrationMatches = 0;
  await withChrome(async ({ send, events }) => {
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    await send('Page.enable', {}, sessionId);
    await send('Runtime.enable', {}, sessionId);
    for (const page of sample) {
      try {
        await openPage(send, sessionId, events, preview + page.path, !blockInit);
        const evidence = await waitForClientInit(send, sessionId, page.kind);
        if (blockInit) {
          const reason = `${page.kind}: init marker appeared while scripts blocked ${JSON.stringify(evidence)}`;
          failures.push(reason);
          console.error(`FAIL ${reason}`);
        } else {
          hydrationMatches += 1;
          console.log(`ok ${page.kind} ${JSON.stringify(evidence)}`);
        }
      } catch (err) {
        const reason = `${page.kind}: ${String(err.message || err).split('\n')[0]}`;
        failures.push(reason);
        if (blockInit) console.log(`blocked ${reason}`);
        else console.error(`FAIL ${reason}`);
      }
    }
  });

  const summary = { head, hydrationMatches, failed: failures.length, blockInit, pages: sample.map((p) => p.kind) };
  console.log(JSON.stringify(summary));
  if (blockInit) {
    console.error(failures.join('\n'));
    process.exit(1);
  }
  if (failures.length || hydrationMatches !== sample.length) {
    console.error(failures.join('\n'));
    process.exit(1);
  }
  console.log('check-nav hydration: ok');
  process.exit(0);
}

if (hydrationOnly) {
  await runHydrationProbe();
  process.exit(failed.length ? 1 : 0);
}

const homeHtml = readFileSync('dist/index.html', 'utf8');
const homePage = `${SITE_ORIGIN}/`;
check(tagText(homeHtml, /<title>([^<]*)<\/title>/) === '宇宙碎片集散地', 'home title');
check(
  tagText(homeHtml, /<meta\s+name="description"\s+content="([^"]*)"/) ===
    '日本自由行真實行程筆記：北海道、四國、沖繩、東北等路線、交通與美食，給正在排行程的人參考。',
  'home description'
);
check(tagText(homeHtml, /<link\s+rel="canonical"\s+href="([^"]*)"/) === homePage, 'home canonical');
check((homeHtml.match(/<section\b/g) || []).length === 3, 'home section count stays 3');
check(homeHtml.includes('關於這個集散地') && homeHtml.includes('碎片寶箱') && homeHtml.includes('碎片漂泊地'), 'home headings');
check(!/<a\b[^>]*class="featured-popup-cta"/.test(homeHtml), 'map popup link is not a standing block');
check((homeHtml.match(/class="route-chip"/g) || []).length === 0, 'home has no route chips');

const sorted = sortTrips(trips);
const past = sorted.filter((t) => tripIsPast(t));
const upcoming = sorted.filter((t) => !tripIsPast(t));
const pastSlice = homeHtml.slice(homeHtml.indexOf('id="hub-past"'), homeHtml.indexOf('id="featured"'));
const upcomingSlice = homeHtml.slice(homeHtml.indexOf('id="hub-upcoming"'), homeHtml.indexOf('id="hub-past-wrap"'));
const pastHrefs = hrefs(anchorsIn(pastSlice), (a) => a.className.split(/\s+/).includes('trip-card'));
const upcomingHrefs = hrefs(anchorsIn(upcomingSlice), (a) => a.className.split(/\s+/).includes('trip-card'));
check(upcomingHrefs.join('|') === upcoming.map((t) => tripUrl(t.id)).join('|'), `upcoming cards ${upcomingHrefs.length}`);
check(pastHrefs.join('|') === past.map((t) => tripUrl(t.id)).join('|'), `past cards ${pastHrefs.length}`);
check(/id="hub-upcoming-wrap"[^>]*\shidden\b/.test(homeHtml) === (upcoming.length === 0), 'upcoming wrap hidden matches data');
check(/id="hub-past-wrap"[^>]*\shidden\b/.test(homeHtml) === (past.length === 0), 'past wrap hidden matches data');
check(new Set(pastHrefs.concat(upcomingHrefs)).size === trips.length, 'one card per trip');

const atamiCard = pastHrefs.find((h) => h.includes(encodeURIComponent(ATAMI)));
check(Boolean(atamiCard && atamiCard.includes('%E7%80%9E') && atamiCard.endsWith('/')), 'atami card encoding and slash');
check(Boolean(atamiCard) && resolved(homePage, atamiCard) === tripCanonicalUrl(ATAMI, 'trip'), 'atami card resolves to canonical');
for (const t of trips) {
  const href = [...upcomingHrefs, ...pastHrefs].find((h) => h === tripUrl(t.id));
  check(href === tripUrl(t.id), `card href ${t.id}`);
  check(resolved(homePage, href || 'about:blank') === tripCanonicalUrl(t.id, 'trip'), `card canonical ${t.id}`);
}

const pages = [{ kind: 'hub', id: null, file: 'dist/index.html', path: '/' }];
for (const t of trips) {
  const data = readTrip(t.id);
  const enc = encodeURIComponent(t.id);
  const tripFile = join('dist/trips', t.id, 'index.html');
  const storiesFile = join('dist/trips', t.id, 'stories.html');
  const foodFile = join('dist/trips', t.id, 'food.html');
  const tripHtml = readFileSync(tripFile, 'utf8');
  const storiesHtml = readFileSync(storiesFile, 'utf8');
  const foodHtml = readFileSync(foodFile, 'utf8');
  const tripMeta = tripPageMeta(data.meta, 'trip');
  const storiesMeta = tripPageMeta(data.meta, 'stories');
  const foodMeta = tripPageMeta(data.meta, 'food');
  check(tagText(tripHtml, /<title>([^<]*)<\/title>/) === tripMeta.title, `title trip ${t.id}`);
  check(tagText(storiesHtml, /<title>([^<]*)<\/title>/) === storiesMeta.title, `title stories ${t.id}`);
  check(tagText(foodHtml, /<title>([^<]*)<\/title>/) === foodMeta.title, `title food ${t.id}`);
  check(tagText(tripHtml, /<meta\s+name="description"\s+content="([^"]*)"/) === tripMeta.description, `desc trip ${t.id}`);
  check(tagText(storiesHtml, /<meta\s+name="description"\s+content="([^"]*)"/) === storiesMeta.description, `desc stories ${t.id}`);
  check(tagText(foodHtml, /<meta\s+name="description"\s+content="([^"]*)"/) === foodMeta.description, `desc food ${t.id}`);
  check(tagText(tripHtml, /<link\s+rel="canonical"\s+href="([^"]*)"/) === tripCanonicalUrl(t.id, 'trip'), `canonical trip ${t.id}`);
  check(tagText(storiesHtml, /<link\s+rel="canonical"\s+href="([^"]*)"/) === tripCanonicalUrl(t.id, 'stories'), `canonical stories ${t.id}`);
  check(tagText(foodHtml, /<link\s+rel="canonical"\s+href="([^"]*)"/) === tripCanonicalUrl(t.id, 'food'), `canonical food ${t.id}`);

  for (const day of data.days || []) {
    check(tripHtml.includes(esc(day.title)), `day title kept ${t.id} ${day.id}`);
  }
  for (const story of data.stories || []) {
    check(storiesHtml.includes(esc(story.title)), `story title kept ${t.id} ${story.title}`);
    const snippet = String(story.body || '').slice(0, 24);
    if (snippet) check(storiesHtml.includes(esc(snippet)), `story body kept ${t.id} ${story.title}`);
  }
  for (const food of data.foods || []) {
    check(foodHtml.includes(esc(food.title)), `food title kept ${t.id} ${food.title}`);
    const snippet = String(food.body || '').slice(0, 24);
    if (snippet) check(foodHtml.includes(esc(snippet)), `food body kept ${t.id} ${food.title}`);
  }

  const navStart = tripHtml.indexOf('id="nav-container"');
  const dayStart = tripHtml.indexOf('id="nav-days"');
  const mainStart = tripHtml.indexOf('<main');
  const sectionHrefs = hrefs(anchorsIn(tripHtml.slice(navStart, dayStart)));
  const dayHrefs = hrefs(anchorsIn(tripHtml.slice(dayStart, mainStart)), (a) => a.className.includes('nav-link--day'));
  check(sectionHrefs.join('|') === expectedSectionHrefs(t.id, data).join('|'), `section nav ${t.id}`);
  check(dayHrefs.join('|') === expectedDayHrefs(t.id, data).join('|'), `day nav ${t.id}`);
  check((tripHtml.match(/class="nav-shell"/g) || []).length === 1, `one nav shell ${t.id}`);
  check(sectionHrefs.includes(tripUrl(t.id, 'stories')), `stories link ${t.id}`);
  check(sectionHrefs.includes(tripUrl(t.id, 'food')), `food link ${t.id}`);
  const tripPage = tripCanonicalUrl(t.id, 'trip');
  check(resolved(tripPage, tripUrl(t.id, 'stories')) === tripCanonicalUrl(t.id, 'stories'), `stories canonical resolve ${t.id}`);
  check(resolved(tripPage, tripUrl(t.id, 'food')) === tripCanonicalUrl(t.id, 'food'), `food canonical resolve ${t.id}`);
  check(resolved(tripPage, '/') === `${SITE_ORIGIN}/`, `hero home resolve ${t.id}`);
  const hero = hrefs(anchorsIn(tripHtml), (a) => a.className.split(/\s+/).includes('hero-back'));
  check(hero.length === 1 && hero[0] === '/', `trip hero back once ${t.id}`);

  const storyBack = hrefs(anchorsIn(storiesHtml), (a) => a.className.split(/\s+/).includes('hero-back'));
  const foodBack = hrefs(anchorsIn(foodHtml), (a) => a.className.split(/\s+/).includes('hero-back'));
  check(storyBack.length === 1 && storyBack[0] === tripUrl(t.id), `stories back ${t.id}`);
  check(foodBack.length === 1 && foodBack[0] === tripUrl(t.id), `food back ${t.id}`);
  check(resolved(tripCanonicalUrl(t.id, 'stories'), storyBack[0] || '') === tripCanonicalUrl(t.id, 'trip'), `stories back canonical ${t.id}`);
  check(resolved(tripCanonicalUrl(t.id, 'food'), foodBack[0] || '') === tripCanonicalUrl(t.id, 'trip'), `food back canonical ${t.id}`);
  check(!anchorsIn(storiesHtml).some((a) => a.href.includes('/food.html')), `no new stories→food ${t.id}`);
  check(!anchorsIn(foodHtml).some((a) => a.href.includes('/stories.html')), `no new food→stories ${t.id}`);
  check(storiesHtml.indexOf('class="hero-back"') < storiesHtml.indexOf('id="stories-root"'), `stories back above chapters ${t.id}`);
  check(foodHtml.indexOf('class="hero-back"') < foodHtml.indexOf('id="food-root"'), `food back above chapters ${t.id}`);
  // route-chip 與購物頁不在這次靜態導航範圍，不斷言它們必須一直維持 JS-only。

  pages.push(
    { kind: 'trip', id: t.id, file: tripFile, path: `/trips/${enc}/` },
    { kind: 'stories', id: t.id, file: storiesFile, path: `/trips/${enc}/stories.html` },
    { kind: 'food', id: t.id, file: foodFile, path: `/trips/${enc}/food.html` }
  );
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function withChrome(run) {
  const chrome = spawn('/usr/bin/google-chrome', [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--remote-debugging-port=9344',
    'about:blank',
  ], { stdio: 'ignore' });
  try {
    let ver;
    for (let i = 0; i < 40; i++) {
      try {
        const res = await fetch('http://127.0.0.1:9344/json/version');
        if (res.ok) {
          ver = await res.json();
          break;
        }
      } catch { /* retry */ }
      await sleep(150);
    }
    if (!ver) throw new Error('chrome debug port not ready');
    const ws = new WebSocket(ver.webSocketDebuggerUrl);
    await new Promise((res, rej) => {
      ws.addEventListener('open', res);
      ws.addEventListener('error', rej);
    });
    let seq = 0;
    const pending = new Map();
    const events = [];
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const p = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) p.reject(new Error(JSON.stringify(msg.error)));
        else p.resolve(msg.result);
      } else if (msg.method) events.push(msg);
    });
    function send(method, params = {}, sessionId) {
      const id = ++seq;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        const payload = { id, method, params };
        if (sessionId) payload.sessionId = sessionId;
        ws.send(JSON.stringify(payload));
      });
    }
    await run({ send, events, ws });
  } finally {
    chrome.kill();
  }
}

const COLLECT = `(() => {
  const hrefs = (sel) => [...document.querySelectorAll(sel)].map((a) => a.getAttribute('href'));
  return {
    tripCards: hrefs('a.trip-card'),
    sections: hrefs('#nav-container a'),
    days: hrefs('#nav-days a.nav-link--day'),
    heroBack: hrefs('a.hero-back'),
    shells: document.querySelectorAll('.nav-shell').length,
    sectionsCount: document.querySelectorAll('section').length,
    controls: document.querySelectorAll('input,select,textarea').length,
    storyChapters: document.querySelectorAll('#stories-root > section, #stories-root > .stories-empty').length,
    foodChapters: document.querySelectorAll('#food-root > section, #food-root > .stories-empty').length,
    routeChips: document.querySelectorAll('a.route-chip').length,
    title: document.title,
  };
})()`;

// Markers are created by client init and are absent from prerendered HTML.
// Static <a href> values are not init evidence.
function clientInitExpr(kind) {
  if (kind === 'hub') {
    return `({ welcome: !!document.querySelector('#welcome-grid .welcome-card'), leaflet: !!document.querySelector('#featured-map.leaflet-container') })`;
  }
  if (kind === 'trip') {
    return `({ ticketBound: document.querySelector('#ticket-grid')?.getAttribute('data-ticket-status-bound') === '1', lightbox: !!document.querySelector('dialog.ph-lightbox') })`;
  }
  if (kind === 'stories' || kind === 'food') {
    return `({ lightbox: !!document.querySelector('dialog.ph-lightbox') })`;
  }
  return 'null';
}

function clientReady(kind, evidence) {
  if (!evidence || typeof evidence !== 'object') return false;
  if (kind === 'hub') return evidence.welcome === true && evidence.leaflet === true;
  if (kind === 'trip') return evidence.ticketBound === true && evidence.lightbox === true;
  if (kind === 'stories' || kind === 'food') return evidence.lightbox === true;
  return false;
}

function waitExpr(kind) {
  return `new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      const evidence = ${clientInitExpr(kind)};
      if (${kind === 'hub' ? 'evidence.welcome && evidence.leaflet' : kind === 'trip' ? 'evidence.ticketBound && evidence.lightbox' : 'evidence.lightbox'}) resolve(evidence);
      else if (Date.now() - start > ${INIT_TIMEOUT_MS}) reject(new Error('init marker timeout: ${kind}'));
      else setTimeout(tick, 50);
    };
    tick();
  })`;
}

async function waitLoad(events) {
  const start = Date.now();
  while (!events.some((e) => e.method === 'Page.loadEventFired') && Date.now() - start < 20000) {
    await sleep(50);
  }
}

function evalError(result) {
  const details = result?.exceptionDetails;
  if (!details) return null;
  return details.exception?.description || details.text || 'evaluate failed';
}

async function waitForClientInit(send, sessionId, kind) {
  const result = await Promise.race([
    send('Runtime.evaluate', {
      expression: waitExpr(kind),
      awaitPromise: true,
      returnByValue: true,
    }, sessionId),
    sleep(INIT_TIMEOUT_MS + 2000).then(() => {
      throw new Error(`init marker timeout: ${kind}`);
    }),
  ]);
  const error = evalError(result);
  if (error) throw new Error(String(error).replace(/^Error:\s*/, '').split('\n')[0]);
  const evidence = result.result?.value;
  if (!clientReady(kind, evidence)) throw new Error(`init marker missing: ${kind}`);
  return evidence;
}

async function openPage(send, sessionId, events, url, allowPageScripts) {
  events.length = 0;
  await send('Network.enable', {}, sessionId);
  await send('Network.setBlockedURLs', { urls: allowPageScripts ? [] : ['*.js'] }, sessionId);
  await send('Emulation.setScriptExecutionDisabled', { value: !allowPageScripts }, sessionId);
  await send('Page.navigate', { url }, sessionId);
  await waitLoad(events);
}

async function readDom(send, sessionId, events, url, kind, scripts) {
  await openPage(send, sessionId, events, url, scripts);
  let initEvidence = null;
  if (scripts) initEvidence = await waitForClientInit(send, sessionId, kind);
  const result = await send('Runtime.evaluate', { expression: COLLECT, returnByValue: true }, sessionId);
  const error = evalError(result);
  if (error) throw new Error(error);
  return { ...result.result.value, initEvidence, initOk: Boolean(scripts && clientReady(kind, initEvidence)) };
}

let browserPages = 0;
let hydrationMatches = 0;

await withChrome(async ({ send, events }) => {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Page.enable', {}, sessionId);
  await send('Runtime.enable', {}, sessionId);
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);

  for (const page of pages) {
    const url = preview + page.path;
    const html = readFileSync(page.file, 'utf8');
    const off = await readDom(send, sessionId, events, url, page.kind, false);
    let on;
    try {
      on = await readDom(send, sessionId, events, url, page.kind, true);
    } catch (err) {
      check(false, `client init ${page.kind} ${page.id || 'home'}: ${String(err.message || err).split('\n')[0]}`);
      continue;
    }
    browserPages += 1;
    const staticCards = hrefs(anchorsIn(html), (a) => a.className.split(/\s+/).includes('trip-card'));
    const staticSections = hrefs(anchorsIn(html.slice(html.indexOf('id="nav-container"'), html.indexOf('id="nav-days"') === -1 ? html.length : html.indexOf('id="nav-days"'))));
    const dayAt = html.indexOf('id="nav-days"');
    const staticDays = dayAt === -1 ? [] : hrefs(anchorsIn(html.slice(dayAt, html.indexOf('<main'))), (a) => a.className.includes('nav-link--day'));
    const staticBack = hrefs(anchorsIn(html), (a) => a.className.split(/\s+/).includes('hero-back'));
    const label = `${page.kind} ${page.id || 'home'}`;
    const expectSections = page.kind === 'trip' ? normList(staticSections) : '';
    const expectDays = normList(staticDays);
    check(normList(off.tripCards) === normList(staticCards), `js-off cards ${label}`);
    check(normList(on.tripCards) === normList(staticCards), `js-on cards ${label}`);
    check(normList(off.sections) === expectSections, `js-off sections ${label}`);
    check(normList(on.sections) === expectSections, `js-on sections ${label}`);
    check(normList(off.days) === expectDays, `js-off days ${label}`);
    check(normList(on.days) === expectDays, `js-on days ${label}`);
    check(normList(off.heroBack) === normList(staticBack), `js-off back ${label}`);
    check(normList(on.heroBack) === normList(staticBack), `js-on back ${label}`);
    check(on.shells === off.shells, `shell count stable ${label}`);
    check(on.shells <= 1, `at most one nav shell ${label}`);
    check(on.controls === 0 && off.controls === 0, `no new form controls ${label}`);
    check(on.title === off.title, `title stable after js ${label}`);
    if (page.kind === 'hub') {
      check(off.sectionsCount === 3 && on.sectionsCount === 3, 'hub section count after js');
    }
    if (page.kind === 'stories') {
      check(on.storyChapters === off.storyChapters && on.storyChapters > 0, `story chapter count ${label}`);
      check(on.sections.join('|') === '' && !on.tripCards.length, `stories has no second nav ${label}`);
    }
    if (page.kind === 'food') {
      check(on.foodChapters === off.foodChapters && on.foodChapters > 0, `food chapter count ${label}`);
    }
    check(on.initOk === true, `client init ${label}`);
    if (on.initOk) hydrationMatches += 1;
  }

  const atami = encodeURIComponent(ATAMI);
  const tripUrlLocal = `${preview}/trips/${atami}/`;
  await readDom(send, sessionId, events, tripUrlLocal, 'trip', true);
  const day = await send('Runtime.evaluate', {
    expression: `(() => new Promise((resolve) => {
      const link = document.querySelector('a.nav-link--day[data-day="day3"]');
      link.click();
      const start = Date.now();
      const tick = () => {
        const top = document.getElementById('day3').getBoundingClientRect().top;
        if ((top > 70 && top < 170) || Date.now() - start > 2500) resolve({ top, hash: location.hash });
        else requestAnimationFrame(tick);
      };
      tick();
    }))()`,
    awaitPromise: true,
    returnByValue: true,
  }, sessionId);
  const dayTop = day.result.value.top;
  check(dayTop > 70 && dayTop < 170, `day3 scroll top ${dayTop}`);

  const ticket = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('[data-ticket-status]');
      const before = btn.getAttribute('data-ticket-status');
      btn.click();
      return { before, after: btn.getAttribute('data-ticket-status'), text: btn.textContent };
    })()`,
    returnByValue: true,
  }, sessionId);
  check(ticket.result.value.before && ticket.result.value.after !== ticket.result.value.before, `ticket pill ${ticket.result.value.before}->${ticket.result.value.after}`);

  const details = await send('Runtime.evaluate', {
    expression: `(() => {
      const d = document.querySelector('#lodging details');
      d.querySelector('summary').click();
      return d.open;
    })()`,
    returnByValue: true,
  }, sessionId);
  check(details.result.value === true, 'lodging details open');

  await readDom(send, sessionId, events, `${preview}/`, 'hub', true);
  const popup = await send('Runtime.evaluate', {
    expression: `(() => new Promise((resolve) => {
      const marker = document.querySelector('.hub-map-marker');
      const before = document.querySelectorAll('a.trip-card').length;
      marker.click();
      setTimeout(() => {
        resolve({
          before,
          cards: document.querySelectorAll('a.trip-card').length,
          popup: document.querySelectorAll('a.featured-popup-cta').length,
        });
      }, 300);
    }))()`,
    awaitPromise: true,
    returnByValue: true,
  }, sessionId);
  check(popup.result.value.cards === popup.result.value.before && popup.result.value.cards === trips.length, `map click keeps ${popup.result.value.cards} cards`);
  check(popup.result.value.popup === 1, `map popup still one cta (${popup.result.value.popup})`);
});

console.log(JSON.stringify({
  passed,
  failed: failed.length,
  trips: trips.length,
  browserPages,
  hydrationMatches,
  upcoming: upcoming.length,
  past: past.length,
}, null, 2));
assert.equal(failed.length, 0, failed.slice(0, 12).join('\n'));
console.log('check-nav: ok');
