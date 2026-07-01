/** Smoke test for analytics aggregation logic */
import { createRequire, createRequire as cr } from 'module';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const memory = new Map();
const mockStore = {
  async get(k) { return memory.get(k) || null; },
  async set(k, v) { memory.set(k, v); },
};

const blobsPath = join(__dirname, '../netlify/functions/_blobs.js');
require.cache[blobsPath] = {
  id: blobsPath,
  filename: blobsPath,
  loaded: true,
  exports: {
    openStore: () => mockStore,
    STORE_NAME: 'test',
  },
};

const handler = require('../netlify/functions/analytics.js').handler;

const mockContext = {
  site: { id: 'test-site' },
  netlify: { token: 'test-token' },
  geo: { country: { code: 'AT' } },
};

const events = [
  {
    e: 'page_view', t: Date.now(), s: 'sess1', page: '/',
    source: 'TikTok', referrerHost: 'tiktok.com', device: 'Mobil',
    browser: 'Safari', language: 'de-AT', timezone: 'Europe/Vienna', country: 'AT',
    utmKey: 'tiktok · social · launch',
  },
  {
    e: 'page_view', t: Date.now(), s: 'sess2', page: '/',
    source: 'Direkt', device: 'Desktop', browser: 'Chrome', country: 'DE',
  },
  {
    e: 'game_start', t: Date.now(), s: 'sess1', game: 'vatreni-bro', page: '/games/vatreni-bro/',
    source: 'TikTok', device: 'Mobil',
  },
];

async function run() {
  const postRes = await handler({
    httpMethod: 'POST',
    body: JSON.stringify({ events }),
    headers: {},
  }, mockContext);

  const post = JSON.parse(postRes.body);
  if (!post.ok || post.ingested !== 3) throw new Error('POST failed: ' + postRes.body);

  const getRes = await handler({ httpMethod: 'GET', headers: {} }, mockContext);
  const report = JSON.parse(getRes.body);

  const checks = [
    ['visits', report.visits === 2],
    ['sessions', report.sessions === 2],
    ['gameStarts', report.gameStarts === 1],
    ['sources TikTok', report.sources.some(s => s.name === 'TikTok')],
    ['referrers', report.referrers.some(r => r.name === 'tiktok.com')],
    ['utm', report.utm.length > 0],
    ['games', report.games.some(g => g.slug === 'vatreni-bro' && g.starts === 1)],
    ['recent', report.recent.length > 0],
    ['daily', report.last7.length > 0],
  ];

  const failed = checks.filter(([, ok]) => !ok);
  if (failed.length) {
    console.error('FAILED:', failed.map(([n]) => n));
    console.error(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  console.log('OK — analytics aggregation:', {
    visits: report.visits,
    sessions: report.sessions,
    sources: report.sources.map(s => s.name),
    games: report.games,
  });
}

run().catch((e) => { console.error(e); process.exit(1); });