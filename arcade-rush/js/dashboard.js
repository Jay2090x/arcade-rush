const ADMIN_KEY = 'arcade_admin_unlock';

document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem(ADMIN_KEY) !== 'rush-at') {
    location.replace('index.html');
    return;
  }
  ArcadeAnalytics.init();
  render();

  document.getElementById('btn-export')?.addEventListener('click', () => {
    const blob = new Blob([ArcadeAnalytics.exportJSON()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `arcade-rush-stats-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  });

  document.getElementById('btn-reset')?.addEventListener('click', () => {
    if (confirm('Alle lokalen Statistiken löschen?')) {
      localStorage.removeItem(ArcadeAnalytics.STORAGE_KEY);
      location.reload();
    }
  });
});

function render() {
  const s = ArcadeAnalytics.getSummary();

  document.getElementById('kpis').innerHTML = `
    <div class="kpi highlight"><span class="kpi-val">${s.globalVisits ?? '…'}</span><span class="kpi-label">🌍 Besuche (global)</span></div>
    <div class="kpi highlight"><span class="kpi-val">${s.globalStarts ?? '…'}</span><span class="kpi-label">🌍 Spielstarts (global)</span></div>
    <div class="kpi"><span class="kpi-val">${s.visits}</span><span class="kpi-label">Besuche (dein Browser)</span></div>
    <div class="kpi"><span class="kpi-val">${s.uniqueSessions}</span><span class="kpi-label">Sessions</span></div>
    <div class="kpi"><span class="kpi-val">${s.visitsPerDay}</span><span class="kpi-label">Besuche/Tag Ø</span></div>
    <div class="kpi"><span class="kpi-val">${s.skyStarts}</span><span class="kpi-label">Sky Drift</span></div>
    <div class="kpi"><span class="kpi-val">${s.goldStarts}</span><span class="kpi-label">Goldgräber</span></div>
    <div class="kpi"><span class="kpi-val">${s.stackStarts || 0}</span><span class="kpi-label">Neon Stack</span></div>
    <div class="kpi highlight"><span class="kpi-val">${s.globalVatreniVisits ?? '…'}</span><span class="kpi-label">🔥 Vatreni Besuche (global)</span></div>
    <div class="kpi highlight"><span class="kpi-val">${s.globalVatreniStarts ?? '…'}</span><span class="kpi-label">🔥 Vatreni Starts (global)</span></div>
    <div class="kpi"><span class="kpi-val">${s.vatreniVisits || 0}</span><span class="kpi-label">Vatreni (dein Browser)</span></div>
    <div class="kpi"><span class="kpi-val">${s.vatreniStarts || 0}</span><span class="kpi-label">Vatreni Starts (lokal)</span></div>
    <div class="kpi"><span class="kpi-val">${s.avgSkyScore}</span><span class="kpi-label">Sky Drift Ø Score</span></div>
    <div class="kpi"><span class="kpi-val">${s.totalPlayMin}</span><span class="kpi-label">Spielzeit (Min)</span></div>
    <div class="kpi"><span class="kpi-val">${s.daysSinceFirst}</span><span class="kpi-label">Tage aktiv</span></div>
  `;

  const globalPerDay = s.globalVisits ? (s.globalVisits / Math.max(s.daysSinceFirst, 1)).toFixed(1) : '–';

  const checks = [
    { label: `Globale Besuche/Tag: ${globalPerDay}`, ok: parseFloat(globalPerDay) >= 10 },
    { label: `Lokale Besuche/Tag: ${s.visitsPerDay}`, ok: parseFloat(s.visitsPerDay) >= 5 },
    { label: `Spielstarts gesamt: ${s.totalStarts}`, ok: s.totalStarts >= 3 },
    { label: `Spielzeit: ${s.totalPlayMin} Min`, ok: s.totalPlayMin >= 1 },
    { label: `Erster Besuch: ${s.firstVisit}`, ok: true },
    { label: `Letzter Besuch: ${s.lastVisit}`, ok: true },
  ];

  document.getElementById('checklist').innerHTML = checks.map(c =>
    `<div class="check ${c.ok ? 'ok' : 'pending'}">${c.ok ? '✅' : '⏳'} ${c.label}</div>`
  ).join('');
}