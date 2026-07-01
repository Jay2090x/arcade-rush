/** Browser test for dashboard rendering */
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.addInitScript(() => {
    sessionStorage.setItem('arcade_admin_unlock', 'rush-at');
    localStorage.setItem('arcade_rush_analytics', JSON.stringify({
      visits: 12,
      uniqueSessions: ['abc', 'def'],
      gameVisits: { 'vatreni-bro': 5 },
      gameStarts: { 'vatreni-bro': 3, 'sky-drift': 2 },
      gameOvers: {},
      totalPlayTimeSec: 600,
      events: [],
      sources: { TikTok: 5, Direkt: 7 },
      referrers: { 'tiktok.com': 5 },
      utm: { 'tiktok · social · promo': 5 },
      devices: { Mobil: 8, Desktop: 4 },
      browsers: { Safari: 6, Chrome: 6 },
      countries: { AT: 10, DE: 2 },
      firstVisit: Date.now() - 86400000 * 5,
      lastVisit: Date.now(),
      firstSource: 'TikTok',
      firstReferrer: 'https://tiktok.com/',
    }));
  });

  await page.route('**/.netlify/functions/analytics', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        visits: 142,
        sessions: 89,
        gameStarts: 56,
        conversionRate: '39.4',
        firstEvent: Date.now() - 86400000 * 7,
        lastEvent: Date.now(),
        last7: [
          { date: '2026-06-22', visits: 8, starts: 3, sessions: 6 },
          { date: '2026-06-23', visits: 12, starts: 5, sessions: 9 },
          { date: '2026-06-24', visits: 15, starts: 7, sessions: 11 },
          { date: '2026-06-25', visits: 18, starts: 8, sessions: 13 },
          { date: '2026-06-26', visits: 22, starts: 10, sessions: 16 },
          { date: '2026-06-27', visits: 28, starts: 12, sessions: 20 },
          { date: '2026-06-28', visits: 39, starts: 11, sessions: 24 },
        ],
        sources: [
          { name: 'TikTok', count: 58, pct: '40.8' },
          { name: 'Direkt', count: 42, pct: '29.6' },
          { name: 'Instagram', count: 22, pct: '15.5' },
          { name: 'WhatsApp', count: 12, pct: '8.5' },
        ],
        referrers: [
          { name: 'tiktok.com', count: 58 },
          { name: 'l.instagram.com', count: 18 },
        ],
        utm: [{ name: 'tiktok · social · launch', count: 45 }],
        countries: [{ name: 'AT', count: 72 }, { name: 'DE', count: 38 }],
        languages: [{ name: 'de-AT', count: 80 }],
        devices: [{ name: 'Mobil', count: 98 }, { name: 'Desktop', count: 44 }],
        browsers: [{ name: 'Safari', count: 62 }, { name: 'Chrome', count: 48 }],
        pages: [{ name: '/', count: 90 }, { name: '/games/vatreni-bro/', count: 52 }],
        landingPages: [{ name: '/', count: 110 }],
        games: [
          { slug: 'vatreni-bro', visits: 52, starts: 38, conversion: '73.1' },
          { slug: 'sky-drift', visits: 20, starts: 10, conversion: '50.0' },
        ],
        recent: [
          { t: Date.now(), e: 'page_view', source: 'TikTok', page: '/', game: null, device: 'Mobil', country: 'AT' },
          { t: Date.now() - 60000, e: 'game_start', source: 'Direkt', page: '/games/vatreni-bro/', game: 'vatreni-bro', device: 'Desktop', country: 'DE' },
        ],
      }),
    });
  });

  await page.route('**/.netlify/functions/stats**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ value: 142, key: 'visits' }),
    });
  });

  await page.goto(`file://${join(ROOT, 'dashboard.html')}`, { waitUntil: 'networkidle' });

  const checks = [
    ['title', await page.title(), 'Arcade Rush — Analytics'],
    ['kpi count', await page.locator('.kpi').count(), 8],
    ['live status', await page.locator('#live-status.live').count(), 1],
    ['sources table', await page.locator('#sources-table tbody tr').count(), 4],
    ['chart cols', await page.locator('.chart-col').count(), 7],
    ['games rows', await page.locator('#games-table tbody tr').count(), 2],
    ['activity items', await page.locator('.activity-item').count(), 2],
    ['traffic heading', await page.locator('h2:has-text("Traffic-Quellen")').count(), 1],
  ];

  const failed = checks.filter(([, actual, expected]) => actual !== expected);
  if (failed.length) {
    console.error('FAILED checks:');
    for (const [name, actual, expected] of failed) {
      console.error(`  ${name}: got ${actual}, expected ${expected}`);
    }
    await page.screenshot({ path: join(ROOT, 'scripts/dashboard-test-fail.png'), fullPage: true });
    await browser.close();
    process.exit(1);
  }

  console.log('OK — dashboard UI renders all sections');
  await browser.close();
}

run().catch((e) => { console.error(e); process.exit(1); });