const ADMIN_KEY = 'arcade_admin_unlock';

const SOURCE_COLORS = {
  Direkt: '#a29bfe',
  TikTok: '#ff0050',
  Instagram: '#e1306c',
  Facebook: '#1877f2',
  Google: '#34a853',
  WhatsApp: '#25d366',
  Intern: '#6b7280',
};

const GAME_LABELS = {
  'vatreni-bro': '🔥 Vatreni Bro',
  'sky-drift': '☁️ Sky Drift',
  'goldgraeber': '⛏️ Goldgräber',
  'neon-stack': '🟦 Neon Stack',
  'kopfball-karo': '⚽ Kopfball Karo',
  'checkered-keepy': '⚽ Checkered Keepy',
  'checker-kick': '⚽ Checker Kick',
};

document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem(ADMIN_KEY) !== 'rush-at') {
    location.replace('index.html');
    return;
  }

  ArcadeAnalytics.ensure();
  render();

  document.getElementById('btn-refresh')?.addEventListener('click', () => render());
  document.getElementById('btn-export-json')?.addEventListener('click', () => {
    const blob = new Blob([ArcadeAnalytics.exportJSON()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `arcade-rush-analytics-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  });
  document.getElementById('btn-export-csv')?.addEventListener('click', () => {
    const blob = new Blob([ArcadeAnalytics.exportCSV()], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `arcade-rush-quellen-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  });
  document.getElementById('btn-reset')?.addEventListener('click', () => {
    if (confirm('Alle lokalen Statistiken in diesem Browser löschen?')) {
      localStorage.removeItem(ArcadeAnalytics.STORAGE_KEY);
      location.reload();
    }
  });
});

function render() {
  const s = ArcadeAnalytics.getSummary();
  const g = ArcadeAnalytics.getLocalReport();
  const now = Date.now();

  setStatus('live', 'Lokale Daten');
  document.getElementById('last-updated').innerHTML =
    `<span>Aktualisiert: <strong>${fmtTime(now)}</strong></span>` +
    `<span>Letztes Event: <strong>${fmtTime(g.lastEvent)}</strong></span>` +
    `<span>Hinweis: nur dieser Browser · für globale Stats → Google Analytics / GoatCounter in <code>js/site-config.js</code></span>`;

  renderKpis(s, g);
  renderChart(g);
  renderSources(g);
  renderSimpleTable('referrers-table', g.referrers, 'Referrer');
  renderSimpleTable('utm-table', g.utm, 'Kampagne');
  renderSimpleTable('countries-table', g.countries, 'Land/Region', 'Länder');
  renderSimpleTable('languages-table', g.languages, 'Sprache', 'Sprachen');
  renderSimpleTable('devices-table', g.devices, 'Gerät', 'Geräte');
  renderSimpleTable('browsers-table', g.browsers, 'Browser', 'Browser');
  renderGames(g);
  renderPages(g);
  renderActivity(g);
  renderLocal(s);
}

function setStatus(mode, text) {
  const el = document.getElementById('live-status');
  if (!el) return;
  el.className = 'status ' + (mode === 'live' ? 'live' : '');
  el.querySelector('.status-text').textContent = text;
}

function fmt(n) {
  if (n == null || n === '–') return '–';
  return Number(n).toLocaleString('de-AT');
}

function fmtTime(ts) {
  if (!ts) return '–';
  return new Date(ts).toLocaleString('de-AT', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

function fmtDateShort(iso) {
  if (!iso) return '';
  const [, m, d] = iso.split('-');
  return `${d}.${m}.`;
}

function renderKpis(s, g) {
  document.getElementById('kpis').innerHTML = `
    <div class="kpi highlight"><span class="kpi-val">${fmt(g.visits)}</span><span class="kpi-label">Besuche (lokal)</span></div>
    <div class="kpi highlight"><span class="kpi-val">${fmt(g.sessions)}</span><span class="kpi-label">Sessions</span></div>
    <div class="kpi highlight"><span class="kpi-val">${fmt(g.gameStarts)}</span><span class="kpi-label">Spielstarts</span></div>
    <div class="kpi"><span class="kpi-val">${g.conversionRate}%</span><span class="kpi-label">Conversion</span></div>
    <div class="kpi"><span class="kpi-val">${s.visitsPerDay}</span><span class="kpi-label">Besuche/Tag Ø</span></div>
    <div class="kpi"><span class="kpi-val">${s.totalPlayMin}</span><span class="kpi-label">Spielzeit (Min)</span></div>
  `;
}

function renderChart(g) {
  const el = document.getElementById('chart-7d');
  const days = g.last7 || [];
  if (!days.some(d => d.visits || d.starts)) {
    el.innerHTML = '<div class="empty-state">Noch keine Tagesdaten in diesem Browser.</div>';
    return;
  }
  const maxV = Math.max(...days.map(d => d.visits), 1);
  el.innerHTML = days.map(d => {
    const h = Math.round((d.visits / maxV) * 100);
    const h2 = Math.round((d.starts / maxV) * 100);
    return `
      <div class="chart-col">
        <div class="chart-val">${d.visits}</div>
        <div class="chart-bar-wrap"><div class="chart-bar" style="height:${Math.max(h, 4)}%"></div></div>
        <div class="chart-bar-wrap" style="height:40px"><div class="chart-bar starts" style="height:${Math.max(h2, 2)}%;width:50%"></div></div>
        <div class="chart-label">${fmtDateShort(d.date)}</div>
      </div>`;
  }).join('') + `<div class="chart-legend" style="width:100%;margin-top:8px">
    <span><span class="legend-dot visits"></span>Besuche</span>
    <span><span class="legend-dot starts"></span>Spielstarts</span>
  </div>`;
}

function renderSources(g) {
  const el = document.getElementById('sources-table');
  const sources = g.sources || [];
  document.getElementById('sources-total').textContent = sources.length ? `${sources.length} Quellen` : '';
  if (!sources.length) {
    el.innerHTML = '<div class="empty-state">Noch keine Quellen — teile Links mit ?utm_source=tiktok für besseres Tracking.</div>';
    return;
  }
  const max = sources[0]?.count || 1;
  el.innerHTML = `<table class="data-table"><thead><tr>
    <th>Quelle</th><th class="bar-cell">Anteil</th><th class="num">Besuche</th><th class="pct">%</th>
  </tr></thead><tbody>${sources.map(row => {
    const color = SOURCE_COLORS[row.name] || '#7c6cf0';
    return `<tr>
      <td class="name"><span class="source-icon" style="background:${color}"></span>${esc(row.name)}</td>
      <td class="bar-cell"><div class="bar-track"><div class="bar-fill" style="width:${Math.round((row.count / max) * 100)}%"></div></div></td>
      <td class="num">${fmt(row.count)}</td>
      <td class="pct">${row.pct}%</td>
    </tr>`;
  }).join('')}</tbody></table>`;
}

function renderSimpleTable(id, rows, colName, emptyLabel) {
  const el = document.getElementById(id);
  if (!rows?.length) {
    el.innerHTML = `<div class="empty-state">Keine ${emptyLabel || colName}-Daten</div>`;
    return;
  }
  const max = rows[0]?.count || 1;
  el.innerHTML = `<table class="data-table"><thead><tr>
    <th>${colName}</th><th></th><th class="num">Anzahl</th>
  </tr></thead><tbody>${rows.map(r => `<tr>
    <td class="name">${esc(r.name)}</td>
    <td class="bar-cell"><div class="bar-track"><div class="bar-fill" style="width:${Math.round((r.count / max) * 100)}%"></div></div></td>
    <td class="num">${fmt(r.count)}</td>
  </tr>`).join('')}</tbody></table>`;
}

function renderGames(g) {
  const el = document.getElementById('games-table');
  const games = g.games || [];
  if (!games.length) {
    el.innerHTML = '<div class="empty-state">Noch keine Spieldaten</div>';
    return;
  }
  el.innerHTML = `<table class="data-table"><thead><tr>
    <th>Spiel</th><th class="num">Besuche</th><th class="num">Starts</th><th class="pct">Conversion</th>
  </tr></thead><tbody>${games.map(gm => `<tr>
    <td>${GAME_LABELS[gm.slug] || gm.slug}</td>
    <td class="num">${fmt(gm.visits)}</td>
    <td class="num">${fmt(gm.starts)}</td>
    <td class="pct">${gm.conversion}%</td>
  </tr>`).join('')}</tbody></table>`;
}

function renderPages(g) {
  renderSimpleTable('pages-table', g.pages, 'Seite', 'Seiten');
  const landing = document.getElementById('landing-table');
  if (landing) landing.innerHTML = '<div class="empty-state">Einstiegsseiten nur mit globalem Tracking</div>';
}

function renderActivity(g) {
  const el = document.getElementById('activity-feed');
  const items = g.recent || [];
  if (!items.length) {
    el.innerHTML = '<div class="empty-state">Noch keine Aktivität</div>';
    return;
  }
  const eventLabel = { page_view: 'Besuch', game_start: 'Spielstart', game_over: 'Spielende' };
  el.innerHTML = items.map(it => `
    <div class="activity-item">
      <span class="activity-time">${fmtTime(it.t)}</span>
      <span class="activity-event">${eventLabel[it.e] || it.e}</span>
      <span class="activity-source">${esc(it.source)}</span>
      <span class="activity-page">${esc(it.page)}</span>
      <span class="activity-device">${esc(it.device)}</span>
    </div>
  `).join('');
}

function renderLocal(s) {
  const panel = document.getElementById('local-panel');
  const srcRows = s.localSources.map(r => `<div class="local-row"><span>${esc(r.name)}</span><span>${r.count}</span></div>`).join('');
  panel.innerHTML = `
    <div class="local-grid">
      <div class="local-row"><span>Erste Quelle</span><span>${esc(s.firstSource)}</span></div>
      <div class="local-row"><span>Erster Besuch</span><span>${s.firstVisit}</span></div>
      <div class="local-row"><span>Letzter Besuch</span><span>${s.lastVisit}</span></div>
      ${srcRows ? `<p class="hint" style="margin:12px 0 4px">Top-Quellen</p>${srcRows}` : ''}
    </div>`;
}

function esc(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}