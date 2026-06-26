const Meta = {
  KITS: {
    kit_default: { name: 'Vatreni Home', primary: '#C8102E', secondary: '#FFFFFF', shorts: '#EEEEEE', socks: '#C8102E' },
    kit_blue: { name: 'Blue Bro', primary: '#0D47A1', secondary: '#FFFFFF', shorts: '#E3EAF5', socks: '#0D47A1' },
    kit_away: { name: 'Away Stripes', primary: '#FFFFFF', secondary: '#C8102E', shorts: '#F5F5F5', socks: '#FFFFFF' },
    kit_gold: { name: 'Gold Trim', primary: '#C8102E', secondary: '#FFD54F', shorts: '#FFF8E1', socks: '#FFD54F' },
    kit_noir: { name: 'Night Bro', primary: '#4A0A12', secondary: '#1A1A1A', shorts: '#222', socks: '#4A0A12' },
  },

  BALLS: {
    ball_default: { name: 'Classic', c1: '#141414', c2: '#FFFFFF' },
    ball_gold: { name: 'Gold Cup', c1: '#FFD54F', c2: '#FF8F00' },
    ball_neon: { name: 'Neon', c1: '#00E5FF', c2: '#7C4DFF' },
    ball_fire: { name: 'Fireball', c1: '#FF3D00', c2: '#FFEA00' },
    ball_ice: { name: 'Ice', c1: '#B3E5FC', c2: '#FFFFFF' },
  },

  UNLOCK_RULES: [
    { id: 'kit_blue', req: 'score', val: 15 },
    { id: 'kit_away', req: 'score', val: 25 },
    { id: 'kit_gold', req: 'fever', val: 1 },
    { id: 'kit_noir', req: 'combo', val: 8 },
    { id: 'ball_gold', req: 'score', val: 30 },
    { id: 'ball_neon', req: 'games', val: 25 },
    { id: 'ball_fire', req: 'fever', val: 3 },
    { id: 'ball_ice', req: 'daily', val: 3 },
  ],

  defaultStats() {
    return {
      best: 0, games: 0, totalScore: 0,
      perfects: 0, feverCount: 0, maxCombo: 0,
      unlocked: ['kit_default', 'ball_default'],
      equipped: { kit: 'kit_default', ball: 'ball_default' },
      daily: { date: '', id: '', progress: 0, done: false },
      dailyWins: 0,
    };
  },

  todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  dailyChallenge() {
    const key = this.todayKey();
    const hash = key.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const pool = [
      { id: 'perfects', target: 6 + (hash % 6), track: 'perfects' },
      { id: 'score', target: 12 + (hash % 12), track: 'score' },
      { id: 'combo', target: 4 + (hash % 5), track: 'combo' },
      { id: 'fever', target: 1, track: 'fever' },
    ];
    const c = pool[hash % pool.length];
    return { ...c, date: key };
  },

  dailyLabel(ch, lang) {
    const de = GameI18n.lang === 'de';
    const labels = {
      perfects: de ? `${ch.target} Perfect-Kopfbälle` : `${ch.target} perfect headers`,
      score: de ? `${ch.target} Punkte erzielen` : `Score ${ch.target} points`,
      combo: de ? `Combo ${ch.target} erreichen` : `Reach combo ${ch.target}`,
      fever: de ? 'FEVER einmal auslösen' : 'Trigger FEVER once',
    };
    return labels[ch.track] || ch.track;
  },

  ensureDaily(stats) {
    const ch = this.dailyChallenge();
    if (stats.daily?.date !== ch.date) {
      stats.daily = { date: ch.date, id: ch.id, track: ch.track, target: ch.target, progress: 0, done: false };
    }
    return ch;
  },

  checkUnlocks(stats, run) {
    const newly = [];
    for (const rule of this.UNLOCK_RULES) {
      if (stats.unlocked.includes(rule.id)) continue;
      let ok = false;
      if (rule.req === 'score') ok = (stats.best || 0) >= rule.val || run.score >= rule.val;
      if (rule.req === 'combo') ok = (stats.maxCombo || 0) >= rule.val || run.bestCombo >= rule.val;
      if (rule.req === 'fever') ok = (stats.feverCount || 0) >= rule.val || run.hadFever;
      if (rule.req === 'games') ok = (stats.games || 0) >= rule.val;
      if (rule.req === 'daily') ok = (stats.dailyWins || 0) >= rule.val;
      if (ok) {
        stats.unlocked.push(rule.id);
        newly.push(rule.id);
      }
    }
    return newly;
  },

  updateDaily(stats, run) {
    const ch = this.ensureDaily(stats);
    if (stats.daily.done) return false;
    let p = stats.daily.progress;
    if (ch.track === 'perfects') p = run.perfects;
    if (ch.track === 'score') p = Math.max(p, run.score);
    if (ch.track === 'combo') p = Math.max(p, run.bestCombo);
    if (ch.track === 'fever') p = run.hadFever ? 1 : 0;
    stats.daily.progress = p;
    if (p >= ch.target) {
      stats.daily.done = true;
      stats.dailyWins = (stats.dailyWins || 0) + 1;
      return true;
    }
    return false;
  },

  async submitLeaderboard(entry) {
    if (!entry.score || entry.score < 5) return;
    try {
      await fetch(`${CONFIG.LEADERBOARD_URL}?game=vatreni-bro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
    } catch (_) {}
  },

  async fetchLeaderboard() {
    try {
      const res = await fetch(`${CONFIG.LEADERBOARD_URL}?game=vatreni-bro`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.entries || [];
    } catch (_) {
      return [];
    }
  },
};