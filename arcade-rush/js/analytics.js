/** Arcade Rush — anonyme Statistik (lokal + Netlify serverless) */
const ArcadeAnalytics = {
  STORAGE_KEY: 'arcade_rush_analytics',
  SESSION_KEY: 'arcade_rush_session',
  STATS_URL: '/.netlify/functions/stats',
  globalVisits: null,
  globalStarts: null,

  _ready: false,

  init() {
    if (this._ready) return;
    this._ready = true;
    this.session = this.getSession();
    this.data = this.load();
    this.track('page_view', { page: location.pathname });
    this.fetchGlobalCounts();
    this.flush();
  },

  ensure() {
    if (!this._ready) this.init();
  },

  async fetchGlobalCounts() {
    try {
      const [v, s] = await Promise.all([
        fetch(`${this.STATS_URL}?key=visits`).then(r => r.json()),
        fetch(`${this.STATS_URL}?key=game-starts`).then(r => r.json()),
      ]);
      this.globalVisits = v.value ?? 0;
      this.globalStarts = s.value ?? 0;
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
  },

  async hitGlobal(key) {
    try {
      const res = await fetch(`${this.STATS_URL}?key=${encodeURIComponent(key)}`, { method: 'POST' });
      const data = await res.json();
      if (key === 'visits') this.globalVisits = data.value ?? this.globalVisits;
      if (key === 'game-starts') this.globalStarts = data.value ?? this.globalStarts;
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
    }
    if (event === 'game_start' && props.game) {
      this.data.gameStarts[props.game] = (this.data.gameStarts[props.game] || 0) + 1;
      this.hitGlobal('game-starts');
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
    const skyScores = (d.gameOvers['sky-drift'] || []).map(g => g.score);
    const avgSky = skyScores.length ? (skyScores.reduce((a, b) => a + b, 0) / skyScores.length).toFixed(1) : '–';
    const daysSinceFirst = Math.max(1, Math.ceil((Date.now() - d.firstVisit) / 86400000));

    return {
      visits: d.visits,
      globalVisits: this.globalVisits,
      globalStarts: this.globalStarts,
      uniqueSessions: unique,
      skyStarts,
      goldStarts,
      stackStarts,
      totalStarts: skyStarts + goldStarts + stackStarts,
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