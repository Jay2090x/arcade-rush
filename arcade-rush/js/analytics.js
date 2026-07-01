/** Lokale Statistik (LocalStorage) — kein Server, keine Credits. */
const ArcadeAnalytics = {
  STORAGE_KEY: 'arcade_rush_analytics',
  SESSION_KEY: 'arcade_rush_session',
  GAMES: ['vatreni-bro', 'sky-drift', 'goldgraeber', 'neon-stack', 'kopfball-karo', 'checkered-keepy', 'checker-kick'],
  _ready: false,
  _context: null,

  init() {
    if (this._ready) return;
    this._ready = true;
    this.session = this.getSession();
    this.data = this.load();
    this._context = this.captureContext();
    const game = this.gameFromPath(location.pathname);
    this.track('page_view', { page: location.pathname, game });
    this.flush();
  },

  ensure() {
    if (!this._ready) this.init();
  },

  gameFromPath(path) {
    const m = (path || '').match(/\/games\/([a-z0-9-]+)/);
    return m ? m[1] : null;
  },

  parseUtm() {
    const p = new URLSearchParams(location.search);
    const utm = {
      source: p.get('utm_source') || '',
      medium: p.get('utm_medium') || '',
      campaign: p.get('utm_campaign') || '',
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
      if (s.includes('whatsapp') || s === 'wa') return 'WhatsApp';
      return utmSource;
    }
    if (!referrer) return 'Direkt';
    try {
      const host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, '');
      if (host === location.hostname.replace(/^www\./, '')) return 'Intern';
      if (host.includes('tiktok')) return 'TikTok';
      if (host.includes('instagram')) return 'Instagram';
      if (host.includes('facebook') || host.includes('fb.com')) return 'Facebook';
      if (host.includes('google')) return 'Google';
      if (host.includes('whatsapp') || host === 'wa.me') return 'WhatsApp';
      return host;
    } catch {
      return 'Unbekannt';
    }
  },

  getDevice() {
    const w = window.innerWidth;
    const ua = navigator.userAgent.toLowerCase();
    if (w < 768 || /mobile|android|iphone/.test(ua)) return 'Mobil';
    if (w < 1024) return 'Tablet';
    return 'Desktop';
  },

  getBrowser() {
    const ua = navigator.userAgent;
    if (/edg\//i.test(ua)) return 'Edge';
    if (/firefox/i.test(ua)) return 'Firefox';
    if (/chrome/i.test(ua)) return 'Chrome';
    if (/safari/i.test(ua)) return 'Safari';
    return 'Sonstige';
  },

  captureContext() {
    const referrer = document.referrer || '';
    const { utm, utmKey } = this.parseUtm();
    return {
      referrer,
      referrerHost: referrer ? new URL(referrer).hostname.replace(/^www\./, '') : '',
      source: this.classifySource(referrer, utm.source),
      utmKey,
      device: this.getDevice(),
      browser: this.getBrowser(),
      language: navigator.language || '–',
    };
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
      for (const k of ['sources', 'devices', 'referrers', 'utm', 'browsers', 'countries', 'languages']) {
        if (!d[k]) d[k] = {};
      }
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
      languages: {},
      firstVisit: Date.now(),
      lastVisit: Date.now(),
      firstSource: null,
      firstReferrer: '',
    };
  },

  bump(map, key) {
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
    const entry = { e: event, t: Date.now(), s: this.session, p: location.pathname, source: ctx.source, device: ctx.device, ...props };

    this.data.lastVisit = Date.now();

    if (event === 'page_view') {
      this.data.visits++;
      if (!this.data.firstSource) {
        this.data.firstSource = ctx.source;
        this.data.firstReferrer = ctx.referrer;
      }
      this.bump(this.data.sources, ctx.source);
      if (ctx.referrerHost) this.bump(this.data.referrers, ctx.referrerHost);
      if (ctx.utmKey) this.bump(this.data.utm, ctx.utmKey);
      this.bump(this.data.devices, ctx.device);
      this.bump(this.data.browsers, ctx.browser);
      this.bump(this.data.languages, ctx.language);

      if (!this.data.uniqueSessions.includes(this.session)) {
        this.data.uniqueSessions.push(this.session);
      }
      const game = props.game || this.gameFromPath(location.pathname);
      if (game) {
        const sk = `arcade_game_visit_${game}`;
        if (!sessionStorage.getItem(sk)) {
          sessionStorage.setItem(sk, '1');
          this.data.gameVisits[game] = (this.data.gameVisits[game] || 0) + 1;
        }
      }
    }

    if (event === 'game_start' && props.game) {
      this.data.gameStarts[props.game] = (this.data.gameStarts[props.game] || 0) + 1;
    }

    if (event === 'game_over' && props.game) {
      if (!this.data.gameOvers[props.game]) this.data.gameOvers[props.game] = [];
      this.data.gameOvers[props.game].push({ score: props.score || 0, t: Date.now() });
      if (this.data.gameOvers[props.game].length > 100) {
        this.data.gameOvers[props.game] = this.data.gameOvers[props.game].slice(-100);
      }
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
    });
  },

  topLocal(map, n = 8) {
    return Object.entries(map || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([name, count]) => ({ name, count }));
  },

  withPct(rows) {
    const total = rows.reduce((a, r) => a + r.count, 0) || 1;
    return rows.map(r => ({ ...r, pct: ((r.count / total) * 100).toFixed(1) }));
  },

  getLocalReport() {
    const d = this.data;
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().slice(0, 10);
      const day = d.events.filter(e => new Date(e.t).toISOString().slice(0, 10) === key);
      last7.push({
        date: key,
        visits: day.filter(e => e.e === 'page_view').length,
        starts: day.filter(e => e.e === 'game_start').length,
      });
    }

    const pages = {};
    d.events.forEach(e => { if (e.p) pages[e.p] = (pages[e.p] || 0) + 1; });

    const gameStarts = Object.values(d.gameStarts).reduce((a, b) => a + b, 0);
    const games = this.GAMES.map(slug => {
      const visits = d.gameVisits[slug] || 0;
      const starts = d.gameStarts[slug] || 0;
      return {
        slug,
        visits,
        starts,
        conversion: visits ? ((starts / visits) * 100).toFixed(1) : '0',
      };
    }).filter(g => g.visits || g.starts);

    return {
      visits: d.visits,
      sessions: d.uniqueSessions.length,
      gameStarts,
      conversionRate: d.visits ? ((gameStarts / d.visits) * 100).toFixed(1) : '0',
      sources: this.withPct(this.topLocal(d.sources)),
      referrers: this.topLocal(d.referrers),
      utm: this.topLocal(d.utm),
      countries: this.topLocal(d.countries),
      languages: this.topLocal(d.languages),
      devices: this.topLocal(d.devices),
      browsers: this.topLocal(d.browsers),
      last7,
      games,
      pages: Object.entries(pages).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([name, count]) => ({ name, count })),
      recent: [...d.events].reverse().slice(0, 25).map(e => ({
        e: e.e, t: e.t, source: e.source, page: e.p, device: e.device,
      })),
      lastEvent: d.events.length ? d.events[d.events.length - 1].t : null,
    };
  },

  getSummary() {
    const d = this.data;
    const gameStarts = { ...d.gameStarts };
    for (const game of this.GAMES) {
      if (gameStarts[game] == null) gameStarts[game] = 0;
    }
    const daysSinceFirst = Math.max(1, Math.ceil((Date.now() - d.firstVisit) / 86400000));

    return {
      visits: d.visits,
      uniqueSessions: d.uniqueSessions.length,
      gameStarts,
      totalStarts: Object.values(gameStarts).reduce((a, b) => a + b, 0),
      totalPlayMin: Math.round(d.totalPlayTimeSec / 60),
      visitsPerDay: (d.visits / daysSinceFirst).toFixed(1),
      firstVisit: new Date(d.firstVisit).toLocaleDateString('de-AT'),
      lastVisit: new Date(d.lastVisit).toLocaleString('de-AT'),
      firstSource: d.firstSource || '–',
      firstReferrer: d.firstReferrer || '–',
      localSources: this.topLocal(d.sources),
      localDevices: this.topLocal(d.devices),
      localBrowsers: this.topLocal(d.browsers),
    };
  },

  exportJSON() {
    return JSON.stringify({ local: this.data, report: this.getLocalReport() }, null, 2);
  },

  exportCSV() {
    const r = this.getLocalReport();
    const rows = [['Kategorie', 'Name', 'Anzahl', 'Anteil %']];
    for (const s of r.sources || []) rows.push(['Quelle', s.name, s.count, s.pct || '']);
    for (const ref of r.referrers || []) rows.push(['Referrer', ref.name, ref.count, '']);
    return rows.map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  },
};

window.ArcadeAnalytics = ArcadeAnalytics;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ArcadeAnalytics.init());
} else {
  ArcadeAnalytics.init();
}