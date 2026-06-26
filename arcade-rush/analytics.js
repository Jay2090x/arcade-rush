/** Arcade Rush — anonyme Statistik (lokal + Netlify serverless) */
const ArcadeAnalytics = {
  STORAGE_KEY: 'arcade_rush_analytics',
  SESSION_KEY: 'arcade_rush_session',
  STATS_URL: '/.netlify/functions/stats',
  globalVisits: null,
  globalStarts: null,
  globalGameStats: {},

  _ready: false,

  init() {
    if (this._ready) return;
    this._ready = true;
    this.session = this.getSession();
    this.data = this.load();
    const game = this.gameFromPath(location.pathname);
    this.track('page_view', { page: location.pathname, game });
    this.fetchGlobalCounts();
    this.flush();
  },

  ensure() {
    if (!this._ready) this.init();
  },

  gameFromPath(path) {
    const m = (path || '').match(/\/games\/([a-z0-9-]+)/);
    return m ? m[1] : null;
  },

  async fetchStat(key) {
    const res = await fetch(`${this.STATS_URL}?key=${encodeURIComponent(key)}`);
    const data = await res.json();
    return data.value;
  },

  async fetchGlobalCounts() {
    const keys = [
      'visits', 'game-starts',
      'game-vatreni-bro-visits', 'game-vatreni-bro-starts',
      'game-zen-sand-visits', 'game-zen-sand-starts',
    ];
    try {
      const results = await Promise.all(keys.map(k => this.fetchStat(k).catch(() => null)));
      const map = Object.fromEntries(keys.map((k, i) => [k, results[i]]));
      this.globalVisits = map.visits ?? 0;
      this.globalStarts = map['game-starts'] ?? 0;
      this.globalGameStats = {
        'vatreni-bro': {
          visits: map['game-vatreni-bro-visits'],
          starts: map['game-vatreni-bro-starts'],
        },
        'zen-sand': {
          visits: map['game-zen-sand-visits'],
          starts: map['game-zen-sand-starts'],
        },
      };
      this.updateGlobalUI();
    } catch (_) {
      this.updateGlobalUI();
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

  async hitGlobal(key) {
    try {
      const res = await fetch(`${this.STATS_URL}?key=${encodeURIComponent(key)}`, { method: 'POST' });
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
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || this.empty();
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
      firstVisit: Date.now(),
      lastVisit: Date.now(),
    };
  },

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (_) {}
  },

  track(event, props = {}) {
    this.ensure();
    const entry = {
      e: event,
      t: Date.now(),
      s: this.session,
      p: location.pathname,
      ...props,
    };

    this.data.lastVisit = Date.now();
    if (event === 'page_view') {
      this.data.visits++;
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
    }
    if (event === 'game_start' && props.game) {
      this.data.gameStarts[props.game] = (this.data.gameStarts[props.game] || 0) + 1;
      this.hitGlobal('game-starts');
      this.hitGlobal(`game-${props.game}-starts`);
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
    window.addEventListener('beforeunload', () => {
      const start = parseInt(sessionStorage.getItem('arcade_play_start') || '0', 10);
      if (start) {
        const sec = Math.round((Date.now() - start) / 1000);
        if (sec > 2) this.track('play_time', { seconds: sec });
      }
    });
  },

  getSummary() {
    const d = this.data;
    const unique = d.uniqueSessions.length;
    const skyStarts = d.gameStarts['sky-drift'] || 0;
    const goldStarts = d.gameStarts['goldgraeber'] || 0;
    const stackStarts = d.gameStarts['neon-stack'] || 0;
    const vatreniStarts = d.gameStarts['vatreni-bro'] || 0;
    const vatreniVisits = d.gameVisits?.['vatreni-bro'] || 0;
    const zenStarts = d.gameStarts['zen-sand'] || 0;
    const zenVisits = d.gameVisits?.['zen-sand'] || 0;
    const skyScores = (d.gameOvers['sky-drift'] || []).map(g => g.score);
    const avgSky = skyScores.length ? (skyScores.reduce((a, b) => a + b, 0) / skyScores.length).toFixed(1) : '–';
    const daysSinceFirst = Math.max(1, Math.ceil((Date.now() - d.firstVisit) / 86400000));
    const vb = this.globalGameStats['vatreni-bro'] || {};
    const zs = this.globalGameStats['zen-sand'] || {};

    return {
      visits: d.visits,
      globalVisits: this.globalVisits,
      globalStarts: this.globalStarts,
      globalVatreniVisits: vb.visits,
      globalVatreniStarts: vb.starts,
      globalZenVisits: zs.visits,
      globalZenStarts: zs.starts,
      zenStarts,
      zenVisits,
      uniqueSessions: unique,
      skyStarts,
      goldStarts,
      stackStarts,
      vatreniStarts,
      vatreniVisits,
      totalStarts: skyStarts + goldStarts + stackStarts + vatreniStarts + zenStarts,
      avgSkyScore: avgSky,
      totalPlayMin: Math.round(d.totalPlayTimeSec / 60),
      visitsPerDay: (d.visits / daysSinceFirst).toFixed(1),
      daysSinceFirst,
      firstVisit: new Date(d.firstVisit).toLocaleDateString('de-AT'),
      lastVisit: new Date(d.lastVisit).toLocaleString('de-AT'),
    };
  },

  exportJSON() {
    return JSON.stringify(this.data, null, 2);
  },
};

window.ArcadeAnalytics = ArcadeAnalytics;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ArcadeAnalytics.init());
} else {
  ArcadeAnalytics.init();
}