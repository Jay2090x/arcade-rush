/** Arcade Rush — anonyme Statistik (lokal; Remote aus wegen Netlify-Credit-Limit) */
const ArcadeAnalytics = {
  REMOTE_ENABLED: false,
  STORAGE_KEY: 'arcade_rush_analytics',
  SESSION_KEY: 'arcade_rush_session',
  LANDING_KEY: 'arcade_rush_landing',
  STATS_URL: '/.netlify/functions/stats',
  REPORT_URL: '/.netlify/functions/analytics',
  GAMES: ['vatreni-bro', 'sky-drift', 'goldgraeber', 'neon-stack', 'kopfball-karo', 'checkered-keepy', 'checker-kick'],
  globalVisits: null,
  globalStarts: null,
  globalGameStats: {},
  globalReport: null,

  _ready: false,
  _context: null,
  _syncTimer: null,
  _syncDebounce: null,
  _syncInterval: null,
  SYNC_INTERVAL_MS: 12000,
  REMOTE_QUEUE_KEY: 'arcade_remote_q',

  init() {
    if (this._ready) return;
    this._ready = true;
    this.session = this.getSession();
    this.data = this.load();
    this._context = this.captureContext();
    const game = this.gameFromPath(location.pathname);
    this.track('page_view', { page: location.pathname, game });
    if (this.REMOTE_ENABLED) {
      this.fetchGlobalCounts();
      this.fetchGlobalReport();
      this.scheduleSync();
    }
    this.flush();
  },

  ensure() {
    if (!this._ready) this.init();
  },

  gameFromPath(path) {
    const m = (path || '').match(/\/games\/([a-z0-9-]+)/);
    return m ? m[1] : null;
  },

  getLandingPage() {
    let landing = sessionStorage.getItem(this.LANDING_KEY);
    if (!landing) {
      landing = location.pathname + location.search;
      sessionStorage.setItem(this.LANDING_KEY, landing);
    }
    return landing;
  },

  parseUtm() {
    const p = new URLSearchParams(location.search);
    const utm = {
      source: p.get('utm_source') || '',
      medium: p.get('utm_medium') || '',
      campaign: p.get('utm_campaign') || '',
      content: p.get('utm_content') || '',
      term: p.get('utm_term') || '',
    };
    const parts = [utm.source, utm.medium, utm.campaign].filter(Boolean);
    return { utm, utmKey: parts.length ? parts.join(' · ') : '' };
  },

  classifySource(referrer, utmSource) {
    if (utmSource) {
      const s = utmSource.toLowerCase();
      if (s.includes('tiktok')) return 'TikTok';
      if (s.includes('instagram') || s === 'ig') return 'Instagram';
      if (s.includes('facebook') || s === 'fb') return 'Facebook';
      if (s.includes('google')) return 'Google';
      if (s.includes('youtube') || s === 'yt') return 'YouTube';
      if (s.includes('whatsapp') || s === 'wa') return 'WhatsApp';
      return utmSource;
    }
    if (!referrer) return 'Direkt';
    try {
      const host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, '');
      if (host === location.hostname.replace(/^www\./, '')) return 'Intern';
      if (host.includes('tiktok')) return 'TikTok';
      if (host.includes('instagram') || host === 'l.instagram.com') return 'Instagram';
      if (host.includes('facebook') || host.includes('fb.com') || host === 'm.facebook.com') return 'Facebook';
      if (host.includes('twitter') || host === 't.co' || host === 'x.com') return 'X / Twitter';
      if (host.includes('youtube') || host === 'youtu.be') return 'YouTube';
      if (host.includes('google')) return 'Google';
      if (host.includes('bing')) return 'Bing';
      if (host.includes('whatsapp') || host === 'wa.me') return 'WhatsApp';
      if (host.includes('reddit')) return 'Reddit';
      if (host.includes('discord')) return 'Discord';
      if (host.includes('telegram') || host === 't.me') return 'Telegram';
      if (host.includes('linkedin')) return 'LinkedIn';
      return host;
    } catch {
      return 'Unbekannt';
    }
  },

  getReferrerHost(referrer) {
    if (!referrer) return '';
    try {
      return new URL(referrer).hostname.toLowerCase().replace(/^www\./, '');
    } catch {
      return '';
    }
  },

  getDevice() {
    const w = window.innerWidth;
    const ua = navigator.userAgent.toLowerCase();
    if (/ipad|tablet/.test(ua) || (w >= 768 && w < 1024 && 'ontouchstart' in window)) return 'Tablet';
    if (w < 768 || /mobile|android|iphone|ipod/.test(ua)) return 'Mobil';
    return 'Desktop';
  },

  getBrowser() {
    const ua = navigator.userAgent;
    if (/edg\//i.test(ua)) return 'Edge';
    if (/firefox/i.test(ua)) return 'Firefox';
    if (/opr\//i.test(ua) || /opera/i.test(ua)) return 'Opera';
    if (/chrome/i.test(ua) && !/edg/i.test(ua)) return 'Chrome';
    if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'Safari';
    return 'Sonstige';
  },

  countryFromTimezone(tz) {
    const map = {
      'Europe/Vienna': 'AT',
      'Europe/Berlin': 'DE',
      'Europe/Zurich': 'CH',
      'Europe/Ljubljana': 'SI',
      'Europe/Zagreb': 'HR',
      'Europe/Belgrade': 'RS',
      'Europe/Prague': 'CZ',
      'Europe/Budapest': 'HU',
      'Europe/London': 'GB',
      'Europe/Paris': 'FR',
      'Europe/Rome': 'IT',
      'Europe/Madrid': 'ES',
      'Europe/Amsterdam': 'NL',
      'Europe/Warsaw': 'PL',
      'America/New_York': 'US',
      'America/Los_Angeles': 'US',
      'America/Chicago': 'US',
    };
    return map[tz] || (tz.startsWith('Europe/') ? 'EU' : tz.split('/')[0] || '–');
  },

  captureContext() {
    const referrer = document.referrer || '';
    const { utm, utmKey } = this.parseUtm();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    return {
      referrer,
      referrerHost: this.getReferrerHost(referrer),
      source: this.classifySource(referrer, utm.source),
      utm,
      utmKey,
      device: this.getDevice(),
      browser: this.getBrowser(),
      language: navigator.language || '–',
      timezone,
      country: this.countryFromTimezone(timezone),
      screen: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
      landing: this.getLandingPage(),
    };
  },

  async fetchStat(key) {
    const res = await fetch(`${this.STATS_URL}?key=${encodeURIComponent(key)}&_=${Date.now()}`, {
      cache: 'no-store',
    });
    const data = await res.json();
    return data.value;
  },

  async fetchGlobalCounts() {
    const keys = ['visits', 'game-starts'];
    for (const game of this.GAMES) {
      keys.push(`game-${game}-visits`, `game-${game}-starts`);
    }
    try {
      const results = await Promise.all(keys.map(k => this.fetchStat(k).catch(() => null)));
      const map = Object.fromEntries(keys.map((k, i) => [k, results[i]]));
      this.globalVisits = map.visits ?? 0;
      this.globalStarts = map['game-starts'] ?? 0;
      this.globalGameStats = {};
      for (const game of this.GAMES) {
        this.globalGameStats[game] = {
          visits: map[`game-${game}-visits`],
          starts: map[`game-${game}-starts`],
        };
      }
      this.updateGlobalUI();
    } catch (_) {
      this.updateGlobalUI();
    }
  },

  async fetchGlobalReport(force = false) {
    try {
      const url = force
        ? `${this.REPORT_URL}?_=${Date.now()}`
        : this.REPORT_URL;
      const res = await fetch(url, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      });
      if (!res.ok) return null;
      this.globalReport = await res.json();
      this.globalReport._fetchedAt = Date.now();
      window.dispatchEvent(new CustomEvent('arcade-analytics-report', { detail: this.globalReport }));
      return this.globalReport;
    } catch (_) {
      return null;
    }
  },

  updateGlobalUI() {
    const v = this.globalVisits;
    const s = this.globalStarts;
    document.querySelectorAll('[data-global-visits]').forEach(el => {
      el.textContent = v != null ? v : '–';
    });
    document.querySelectorAll('[data-global-starts]').forEach(el => {
      el.textContent = s != null ? s : '–';
    });
    document.querySelectorAll('[data-game-visits]').forEach(el => {
      const game = el.getAttribute('data-game-visits');
      const val = this.globalGameStats[game]?.visits;
      el.textContent = val != null ? val : '–';
    });
  },

  buildStatsMeta(extra = {}) {
    const ctx = this._context || this.captureContext();
    return {
      session: this.session,
      page: location.pathname,
      game: this.gameFromPath(location.pathname),
      source: ctx.source,
      referrerHost: ctx.referrerHost,
      utmKey: ctx.utmKey,
      device: ctx.device,
      browser: ctx.browser,
      language: ctx.language,
      timezone: ctx.timezone,
      country: ctx.country,
      landing: ctx.landing,
      ...extra,
    };
  },

  async hitGlobal(key, extra = {}) {
    if (!this.REMOTE_ENABLED) return;
    try {
      const res = await fetch(`${this.STATS_URL}?key=${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meta: this.buildStatsMeta(extra) }),
        keepalive: true,
      });
      const data = await res.json();
      if (data.value == null) return;
      if (key === 'visits') this.globalVisits = data.value;
      if (key === 'game-starts') this.globalStarts = data.value;
      const gm = key.match(/^game-([a-z0-9-]+)-(visits|starts)$/);
      if (gm) {
        const game = gm[1];
        const field = gm[2];
        if (!this.globalGameStats[game]) this.globalGameStats[game] = {};
        this.globalGameStats[game][field] = data.value;
      }
      this.updateGlobalUI();
    } catch (_) {}
  },

  buildRemotePayload(event, props) {
    const ctx = this._context || this.captureContext();
    return {
      e: event,
      t: Date.now(),
      s: this.session,
      page: props.page || location.pathname,
      game: props.game || this.gameFromPath(location.pathname) || null,
      source: ctx.source,
      referrer: ctx.referrer,
      referrerHost: ctx.referrerHost,
      utm: ctx.utm,
      utmKey: ctx.utmKey,
      device: ctx.device,
      browser: ctx.browser,
      language: ctx.language,
      timezone: ctx.timezone,
      country: ctx.country,
      screen: ctx.screen,
      landing: ctx.landing,
      ...props,
    };
  },

  readRemoteQueue() {
    try {
      return JSON.parse(sessionStorage.getItem(this.REMOTE_QUEUE_KEY) || '[]');
    } catch {
      return [];
    }
  },

  writeRemoteQueue(q) {
    try {
      sessionStorage.setItem(this.REMOTE_QUEUE_KEY, JSON.stringify(q.slice(-50)));
    } catch (_) {}
  },

  enqueueRemote(payload) {
    const q = this.readRemoteQueue();
    q.push(payload);
    this.writeRemoteQueue(q);
  },

  remoteTrack(event, props = {}) {
    if (!this.REMOTE_ENABLED) return;
    const payload = this.buildRemotePayload(event, props);
    this.enqueueRemote(payload);
    this.syncRemoteSoon();
    this.pushRemoteNow([payload]);
  },

  syncRemoteSoon() {
    clearTimeout(this._syncDebounce);
    this._syncDebounce = setTimeout(() => this.syncRemote(), 400);
  },

  pushRemoteNow(events) {
    if (!events?.length) return;
    fetch(this.REPORT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
      keepalive: true,
    }).then(res => {
      if (res.ok) this.removeRemoteEvents(events);
    }).catch(() => {});
  },

  eventKey(ev) {
    return `${ev.e}|${ev.t}|${ev.s}|${ev.page || ''}`;
  },

  removeRemoteEvents(sent) {
    const drop = new Set(sent.map(e => this.eventKey(e)));
    const q = this.readRemoteQueue().filter(e => !drop.has(this.eventKey(e)));
    if (q.length) this.writeRemoteQueue(q);
    else {
      try { sessionStorage.removeItem(this.REMOTE_QUEUE_KEY); } catch (_) {}
    }
  },

  beaconRemote() {
    const q = this.readRemoteQueue();
    if (!q.length || !navigator.sendBeacon) return false;
    try {
      const ok = navigator.sendBeacon(
        this.REPORT_URL,
        new Blob([JSON.stringify({ events: q })], { type: 'application/json' })
      );
      if (ok) sessionStorage.removeItem(this.REMOTE_QUEUE_KEY);
      return ok;
    } catch {
      return false;
    }
  },

  async syncRemote() {
    const q = this.readRemoteQueue();
    if (!q.length) return;

    try {
      const res = await fetch(this.REPORT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: q }),
        keepalive: true,
      });
      if (res.ok) sessionStorage.removeItem(this.REMOTE_QUEUE_KEY);
    } catch (_) {}
  },

  scheduleSync() {
    this.syncRemote();
    clearTimeout(this._syncTimer);
    this._syncTimer = setTimeout(() => this.syncRemote(), 3000);
    if (!this._syncInterval) {
      this._syncInterval = setInterval(() => this.syncRemote(), this.SYNC_INTERVAL_MS);
    }
    if (!this._onVis) {
      this._onVis = () => {
        if (document.visibilityState === 'hidden') {
          if (!this.beaconRemote()) this.syncRemote();
        }
      };
      document.addEventListener('visibilitychange', this._onVis);
    }
  },

  getSession() {
    let s = sessionStorage.getItem(this.SESSION_KEY);
    if (!s) {
      s = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      sessionStorage.setItem(this.SESSION_KEY, s);
    }
    return s;
  },

  load() {
    try {
      const d = JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || this.empty();
      if (!d.sources) d.sources = {};
      if (!d.devices) d.devices = {};
      if (!d.referrers) d.referrers = {};
      if (!d.utm) d.utm = {};
      return d;
    } catch {
      return this.empty();
    }
  },

  empty() {
    return {
      visits: 0,
      uniqueSessions: [],
      gameVisits: {},
      gameStarts: {},
      gameOvers: {},
      totalPlayTimeSec: 0,
      events: [],
      sources: {},
      referrers: {},
      utm: {},
      devices: {},
      browsers: {},
      countries: {},
      firstVisit: Date.now(),
      lastVisit: Date.now(),
      firstSource: null,
      firstReferrer: '',
    };
  },

  bumpLocal(map, key) {
    if (!key) return;
    map[key] = (map[key] || 0) + 1;
  },

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (_) {}
  },

  track(event, props = {}) {
    this.ensure();
    const ctx = this._context || this.captureContext();
    const entry = {
      e: event,
      t: Date.now(),
      s: this.session,
      p: location.pathname,
      source: ctx.source,
      device: ctx.device,
      ...props,
    };

    this.data.lastVisit = Date.now();
    if (event === 'page_view') {
      this.data.visits++;
      if (!this.data.firstSource) {
        this.data.firstSource = ctx.source;
        this.data.firstReferrer = ctx.referrer;
      }
      this.bumpLocal(this.data.sources, ctx.source);
      if (ctx.referrerHost) this.bumpLocal(this.data.referrers, ctx.referrerHost);
      if (ctx.utmKey) this.bumpLocal(this.data.utm, ctx.utmKey);
      this.bumpLocal(this.data.devices, ctx.device);
      this.bumpLocal(this.data.browsers, ctx.browser);
      this.bumpLocal(this.data.countries, ctx.country);

      if (!this.data.uniqueSessions.includes(this.session)) {
        this.data.uniqueSessions.push(this.session);
        this.hitGlobal('visits');
      }
      const game = props.game || this.gameFromPath(location.pathname);
      if (game) {
        const sk = `arcade_game_visit_${game}`;
        if (!sessionStorage.getItem(sk)) {
          sessionStorage.setItem(sk, '1');
          this.data.gameVisits[game] = (this.data.gameVisits[game] || 0) + 1;
          this.hitGlobal(`game-${game}-visits`);
        }
      }
      this.remoteTrack('page_view', { page: location.pathname, game: props.game });
    }
    if (event === 'game_start' && props.game) {
      this.data.gameStarts[props.game] = (this.data.gameStarts[props.game] || 0) + 1;
      this.hitGlobal('game-starts');
      this.hitGlobal(`game-${props.game}-starts`, { game: props.game });
      this.remoteTrack('game_start', { game: props.game, ...props });
    }
    if (event === 'game_over' && props.game) {
      if (!this.data.gameOvers[props.game]) this.data.gameOvers[props.game] = [];
      this.data.gameOvers[props.game].push({ score: props.score || 0, t: Date.now() });
      if (this.data.gameOvers[props.game].length > 100) {
        this.data.gameOvers[props.game] = this.data.gameOvers[props.game].slice(-100);
      }
      this.remoteTrack('game_over', { game: props.game, score: props.score || 0, ...props });
    }
    if (event === 'play_time' && props.seconds) {
      this.data.totalPlayTimeSec += props.seconds;
    }

    this.data.events.push(entry);
    if (this.data.events.length > 500) this.data.events = this.data.events.slice(-500);
    this.save();
  },

  flush() {
    window.addEventListener('pagehide', () => {
      const start = parseInt(sessionStorage.getItem('arcade_play_start') || '0', 10);
      if (start) {
        const sec = Math.round((Date.now() - start) / 1000);
        if (sec > 2) this.track('play_time', { seconds: sec });
      }
      if (this.REMOTE_ENABLED && !this.beaconRemote()) this.syncRemote();
    });
  },

  topLocal(map, n = 8) {
    return Object.entries(map || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([name, count]) => ({ name, count }));
  },

  getSummary() {
    const d = this.data;
    const unique = d.uniqueSessions.length;
    const gameStarts = { ...d.gameStarts };
    for (const game of this.GAMES) {
      if (gameStarts[game] == null) gameStarts[game] = 0;
    }
    const totalStarts = Object.values(gameStarts).reduce((a, b) => a + b, 0);
    const skyScores = (d.gameOvers['sky-drift'] || []).map(g => g.score);
    const avgSky = skyScores.length ? (skyScores.reduce((a, b) => a + b, 0) / skyScores.length).toFixed(1) : '–';
    const daysSinceFirst = Math.max(1, Math.ceil((Date.now() - d.firstVisit) / 86400000));

    return {
      visits: d.visits,
      globalVisits: this.globalVisits,
      globalStarts: this.globalStarts,
      globalGameStats: this.globalGameStats,
      globalReport: this.globalReport,
      uniqueSessions: unique,
      gameStarts,
      totalStarts,
      avgSkyScore: avgSky,
      totalPlayMin: Math.round(d.totalPlayTimeSec / 60),
      visitsPerDay: (d.visits / daysSinceFirst).toFixed(1),
      daysSinceFirst,
      firstVisit: new Date(d.firstVisit).toLocaleDateString('de-AT'),
      lastVisit: new Date(d.lastVisit).toLocaleString('de-AT'),
      firstSource: d.firstSource || '–',
      firstReferrer: d.firstReferrer || '–',
      localSources: this.topLocal(d.sources),
      localReferrers: this.topLocal(d.referrers),
      localUtm: this.topLocal(d.utm),
      localDevices: this.topLocal(d.devices),
      localBrowsers: this.topLocal(d.browsers),
      localCountries: this.topLocal(d.countries),
    };
  },

  exportJSON() {
    return JSON.stringify({ local: this.data, globalReport: this.globalReport }, null, 2);
  },

  exportCSV(report) {
    const rows = [['Kategorie', 'Name', 'Anzahl', 'Anteil %']];
    const r = report || this.globalReport;
    if (!r) return 'Keine globalen Daten';
    for (const s of r.sources || []) {
      rows.push(['Quelle', s.name, s.count, s.pct || '']);
    }
    for (const ref of r.referrers || []) {
      rows.push(['Referrer', ref.name, ref.count, '']);
    }
    return rows.map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  },
};

window.ArcadeAnalytics = ArcadeAnalytics;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ArcadeAnalytics.init());
} else {
  ArcadeAnalytics.init();
}