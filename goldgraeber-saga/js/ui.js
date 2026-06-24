const UI = {
  els: {},
  activePanel: 'miners',
  saveTimer: null,
  animFrame: null,
  panelRefreshTimer: 0,
  lastMinerCount: 0,

  init() {
    this.cacheElements();
    this.bindEvents();
    this.startRenderLoop();
    this.startAutoSave();
  },

  cacheElements() {
    const ids = [
      'splash', 'game', 'gold-amount', 'gems-amount', 'depth-level',
      'income-rate', 'vein-hp-fill', 'vein-hp-text', 'tap-zone', 'tap-hint',
      'miners-list', 'upgrades-list', 'shop-list', 'stats-content',
      'panel-overlay', 'btn-boost', 'boost-timer', 'boost-progress',
      'floating-numbers', 'toast-container', 'load-text',
      'modal-settings', 'modal-offline', 'modal-levelup',
      'offline-amount', 'new-depth-name', 'new-depth-bonus',
      'toggle-sound', 'toggle-particles', 'toggle-vibration',
      'quick-buy-btn', 'qb-icon', 'qb-name', 'qb-desc', 'qb-cost',
      'mission-bar', 'mission-icon', 'mission-title', 'mission-progress-fill', 'mission-reward',
      'event-banner', 'worker-layer', 'activity-feed',
    ];
    ids.forEach(id => { this.els[id] = document.getElementById(id); });
    this.els.mineCanvas = document.getElementById('mine-canvas');
    this.els.panels = {
      miners: document.getElementById('panel-miners'),
      upgrades: document.getElementById('panel-upgrades'),
      shop: document.getElementById('panel-shop'),
      stats: document.getElementById('panel-stats'),
    };
    this.els.navBtns = document.querySelectorAll('.nav-btn');
  },

  bindEvents() {
    this.els.tapZone = this.els['tap-zone'];
    this.els.tapZone.addEventListener('click', (e) => this.handleTap(e));
    this.els.tapZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleTap(e.touches[0]);
    }, { passive: false });

    this.els.navBtns.forEach(btn => {
      btn.addEventListener('click', () => this.switchPanel(btn.dataset.panel));
    });

    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => this.closePanels());
    });

    this.els['panel-overlay'].addEventListener('click', () => this.closePanels());

    document.getElementById('btn-settings').addEventListener('click', () => {
      this.els['modal-settings'].classList.add('visible');
    });

    document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
      el.addEventListener('click', () => {
        el.closest('.modal')?.classList.remove('visible');
      });
    });

    document.getElementById('btn-boost').addEventListener('click', () => {
      if (Game.getBoostMultiplier() > 1) return;
      this.showAdPrompt('boost', () => {
        Game.simulateAdReward('boost');
        this.toast('2× Boost aktiviert!', 'success');
      });
    });

    document.getElementById('btn-collect-offline').addEventListener('click', () => {
      Game.collectOfflineEarnings(false);
      this.els['modal-offline'].classList.remove('visible');
    });

    document.getElementById('btn-double-offline').addEventListener('click', () => {
      this.showAdPrompt('double_offline', () => {
        Game.collectOfflineEarnings(true);
        this.els['modal-offline'].classList.remove('visible');
        this.toast('Offline-Einnahmen verdoppelt!', 'success');
      });
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
      if (confirm('Wirklich alles zurücksetzen?')) {
        Game.reset();
        this.lastMinerCount = 0;
        this.els['modal-settings'].classList.remove('visible');
        this.updateQuickBuy(Game.state);
        this.updateMission(Game.state);
        this.updateWorkers(Game.state);
        this.toast('Spiel zurückgesetzt', 'info');
      }
    });

    ['toggle-sound', 'toggle-particles', 'toggle-vibration'].forEach(id => {
      this.els[id].addEventListener('change', (e) => {
        const key = id.replace('toggle-', '');
        Game.state.settings[key] = e.target.checked;
        if (key === 'sound') AudioManager.setEnabled(e.target.checked);
        if (key === 'particles' && Game.renderer) Game.renderer.particles.setEnabled(e.target.checked);
        Game.save();
      });
    });

    this.els['quick-buy-btn']?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleQuickBuy();
    });

    ['miners-list', 'upgrades-list'].forEach(id => {
      this.els[id]?.addEventListener('click', (e) => {
        const card = e.target.closest('.card[data-type]');
        if (card) {
          e.stopPropagation();
          this.handleCardAction(card);
        }
      });
    });
  },

  handleQuickBuy() {
    if (!Game.state) return;
    const miner = CONFIG.MINERS[0];
    const cost = Game.getMinerCost(miner.id);
    if (Game.state.gold < cost) {
      this.toast(`Noch ${Game.formatNumber(cost - Game.state.gold)} Gold — tippe auf den Brocken!`, 'info');
      this.logActivity(`💡 Noch ${Game.formatNumber(cost - Game.state.gold)} Gold bis zum Lehrling`);
      return;
    }
    const ok = Game.buyMiner(miner.id);
    if (!ok) return;
    this.logActivity(`✅ ${miner.name} angeheuert! +${miner.baseIncome} Gold/Sek`, true);
  },

  getNextBuyableMiner() {
    return CONFIG.MINERS.find(m => true) || null;
  },

  handleCardAction(card) {
    if (card.classList.contains('disabled')) return;
    const type = card.dataset.type;
    const id = card.dataset.id;
    let ok = false;

    switch (type) {
      case 'miner': ok = Game.buyMiner(id); break;
      case 'upgrade': ok = Game.buyUpgrade(id); break;
      case 'depth': ok = Game.unlockDepth(parseInt(id, 10)); break;
      case 'gem': ok = Game.buyGemUpgrade(id); break;
    }

    if (!ok) {
      this.toast('Nicht genug Gold!', 'info');
      return;
    }

    if (type === 'upgrade') this.toast('Upgrade gekauft!', 'success');
    if (type === 'depth') {
      const depth = CONFIG.DEPTHS[Game.state.depth];
      this.els['new-depth-name'].textContent = depth.name;
      this.els['new-depth-bonus'].textContent = `×${depth.multiplier} Gold-Multiplikator`;
      this.els['modal-levelup'].classList.add('visible');
    }

    this.renderPanel(this.activePanel);
    this.updateQuickBuy(Game.state);
    this.updateWorkers(Game.state);
  },

  logActivity(text, important = false, type = '') {
    const feed = this.els['activity-feed'];
    if (!feed) return;
    const item = document.createElement('div');
    item.className = 'activity-item' + (important ? ' important' : '') + (type ? ' ' + type : '');
    item.textContent = text;
    feed.prepend(item);
    while (feed.children.length > 2) feed.lastChild.remove();
    setTimeout(() => item.remove(), 8000);
  },

  spawnWorkerBurst() {
    const layer = this.els['worker-layer'];
    if (!layer) return;
    for (let i = 0; i < 6; i++) {
      const coin = document.createElement('div');
      coin.className = 'flying-coin';
      coin.textContent = '🪙';
      coin.style.left = (30 + Math.random() * 40) + '%';
      coin.style.top = (40 + Math.random() * 20) + '%';
      coin.style.animationDelay = (i * 0.08) + 's';
      layer.appendChild(coin);
      setTimeout(() => coin.remove(), 1200);
    }
  },

  handleTap(e) {
    const result = Game.tap(true);
    const vein = document.getElementById('gold-vein-visual');
    const tapZone = this.els.tapZone;

    vein?.classList.remove('hit', 'crit', 'break');
    void vein?.offsetWidth;
    vein?.classList.add('hit');
    if (result?.isCrit) vein?.classList.add('crit');
    if (result?.veinBroken) vein?.classList.add('break');
    const flash = document.getElementById('impact-flash');
    if (flash) {
      flash.classList.remove('active');
      void flash.offsetWidth;
      flash.classList.add('active');
      setTimeout(() => flash.classList.remove('active'), 250);
    }

    tapZone?.classList.add('pressed');
    setTimeout(() => tapZone?.classList.remove('pressed'), 120);

    if (this.els['tap-hint'] && !this.els['tap-hint'].classList.contains('hidden')) {
      this.els['tap-hint'].classList.add('hidden');
    }

    if (result?.missionDone) {
      this.updateMission(Game.state, result.missionDone);
    }

    if (result) {
      const area = this.els['floating-numbers'].getBoundingClientRect();
      const cx = e.clientX ?? area.left + area.width / 2;
      const cy = e.clientY ?? area.top + area.height / 2;
      const x = cx - area.left;
      const y = cy - area.top;
      this.showFloatingNumber(result.amount, result.isCrit, result.veinBroken, x, y);
      this.showRipple(x, y);
      this.updateCombo(result.combo);
      if (result.veinBroken) {
        this.toast('💥 Ader durchbrochen! Bonus-Gold!', 'success');
        this.logActivity('💥 Goldader durchbrochen — Bonusschub!', true);
      }
    }
  },

  showFloatingNumber(amount, isCrit, veinBroken, x, y) {
    const el = document.createElement('div');
    let cls = 'float-num';
    if (isCrit) cls += ' crit';
    if (veinBroken) cls += ' break';
    el.className = cls;
    const prefix = veinBroken ? 'BOOM! ' : isCrit ? 'KRIT! ' : '+';
    el.textContent = prefix + Game.formatNumber(amount);
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    this.els['floating-numbers'].appendChild(el);
    setTimeout(() => el.remove(), 1200);
  },

  showRipple(x, y) {
    const container = document.getElementById('tap-ripples');
    if (!container) return;
    const ripple = document.createElement('div');
    ripple.className = 'tap-ripple';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    container.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  },

  updateCombo(combo) {
    const el = document.getElementById('combo-display');
    if (!el) return;
    if (combo >= 1) {
      const mult = (1 + combo * 0.1).toFixed(1);
      el.textContent = `COMBO ×${mult}`;
      el.classList.add('visible');
    } else {
      el.classList.remove('visible');
    }
  },

  showAdPrompt(type, onComplete) {
    onComplete();
  },

  switchPanel(name) {
    if (this.activePanel === name && this.els.panels[name]?.classList.contains('active')) {
      this.closePanels();
      return;
    }

    this.activePanel = name;
    this.els.navBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.panel === name);
    });

    Object.entries(this.els.panels).forEach(([key, panel]) => {
      panel.classList.toggle('active', key === name);
    });

    this.els['panel-overlay'].classList.add('visible');
    this.renderPanel(name);
  },

  closePanels() {
    Object.values(this.els.panels).forEach(p => p.classList.remove('active'));
    this.els['panel-overlay'].classList.remove('visible');
  },

  renderPanel(name) {
    switch (name) {
      case 'miners': this.renderMiners(); break;
      case 'upgrades': this.renderUpgrades(); break;
      case 'shop': this.renderShop(); break;
      case 'stats': this.renderStats(); break;
    }
  },

  renderMiners() {
    const container = this.els['miners-list'];
    let html = '';

    const nextDepth = CONFIG.DEPTHS[Game.state.depth + 1];
    if (nextDepth) {
      const canUnlock = Game.canUnlockDepth(nextDepth.id);
      html += this.cardHTML({
        icon: nextDepth.icon,
        title: `${nextDepth.name} freischalten`,
        desc: `×${nextDepth.multiplier} Gold-Multiplikator`,
        cost: Game.formatNumber(nextDepth.unlockCost),
        affordable: canUnlock,
        type: 'depth',
        id: String(nextDepth.id),
      });
    }

    CONFIG.MINERS.forEach(miner => {
      const owned = Game.state.miners[miner.id] || 0;
      const cost = Game.getMinerCost(miner.id);
      const affordable = Game.state.gold >= cost;
      html += this.cardHTML({
        icon: miner.icon,
        title: miner.name,
        desc: miner.desc,
        cost: Game.formatNumber(cost) + ' G',
        affordable,
        type: 'miner',
        id: miner.id,
        level: owned > 0 ? `${owned}×` : null,
        income: `+${miner.baseIncome}/s`,
      });
    });

    container.innerHTML = html;
  },

  renderUpgrades() {
    const container = this.els['upgrades-list'];
    let html = '';

    CONFIG.UPGRADES.forEach(upgrade => {
      const level = Game.state.upgrades[upgrade.id] || 0;
      const maxed = level >= upgrade.maxLevel;
      const cost = Game.getUpgradeCost(upgrade.id);
      const affordable = !maxed && Game.state.gold >= cost;
      html += this.cardHTML({
        icon: upgrade.icon,
        title: upgrade.name,
        desc: upgrade.desc,
        cost: maxed ? 'MAX' : Game.formatNumber(cost),
        affordable,
        disabled: maxed,
        type: 'upgrade',
        id: upgrade.id,
        level: `Lv. ${level}/${upgrade.maxLevel}`,
      });
    });

    if (Game.state.gems > 0) {
      html += '<div class="stat-section"><h3>Edelstein-Upgrades</h3></div>';
      CONFIG.GEM_UPGRADES.forEach(upgrade => {
        const owned = Game.state.gemUpgrades[upgrade.id] || 0;
        const affordable = Game.state.gems >= upgrade.gemCost;
        html += this.cardHTML({
          icon: upgrade.icon,
          title: upgrade.name,
          desc: upgrade.desc + (owned ? ` (${owned}×)` : ''),
          cost: upgrade.gemCost + ' 💎',
          affordable,
          isGems: true,
          type: 'gem',
          id: upgrade.id,
        });
      });
    }

    container.innerHTML = html;
  },

  renderShop() {
    const container = this.els['shop-list'];
    let html = '<p style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:12px;text-align:center;">Unterstütze das Spiel und erhalte Edelsteine!</p>';

    CONFIG.SHOP.forEach(item => {
      html += `
        <div class="card shop-card" data-shop="${item.id}">
          <div class="card-icon">${item.icon}</div>
          <div class="card-info">
            <div class="card-title">${item.name}</div>
            <div class="card-desc">${item.desc}</div>
          </div>
          <div class="card-action">
            <div class="card-cost">${item.price}</div>
          </div>
        </div>`;
    });

    html += `
      <div class="card" data-shop="ad_gems">
        <div class="card-icon">📺</div>
        <div class="card-info">
          <div class="card-title">Gratis Edelsteine</div>
          <div class="card-desc">Schaue ein kurzes Video</div>
        </div>
        <div class="card-action">
          <div class="card-cost" style="color:var(--accent-green)">+5 💎</div>
        </div>
      </div>`;

    container.innerHTML = html;
    container.querySelectorAll('[data-shop]').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.shop;
        if (id === 'ad_gems') {
          this.showAdPrompt('gems', () => {
            Game.simulateAdReward('gems');
            this.toast('+5 Edelsteine erhalten!', 'success');
            this.renderShop();
          });
        } else {
          this.toast('In-App-Kauf: Demo-Modus aktiv', 'info');
          Game.state.gems += CONFIG.SHOP.find(s => s.id === id)?.gems || 50;
          Game.save();
          this.updateHUD(Game.state);
          this.renderShop();
        }
      });
    });
  },

  renderStats() {
    const s = Game.state;
    const st = s.stats;
    const hours = Math.floor(st.playTime / 3600);
    const mins = Math.floor((st.playTime % 3600) / 60);

    this.els['stats-content'].innerHTML = `
      <div class="stat-section">
        <h3>Allgemein</h3>
        <div class="stat-row"><span>Gesamt-Gold verdient</span><span>${Game.formatNumber(s.totalGold)}</span></div>
        <div class="stat-row"><span>Aktuelles Gold</span><span>${Game.formatNumber(s.gold)}</span></div>
        <div class="stat-row"><span>Edelsteine</span><span>${s.gems} 💎</span></div>
        <div class="stat-row"><span>Spielzeit</span><span>${hours}h ${mins}m</span></div>
      </div>
      <div class="stat-section">
        <h3>Abbau</h3>
        <div class="stat-row"><span>Gesamt-Klicks</span><span>${Game.formatNumber(st.totalTaps)}</span></div>
        <div class="stat-row"><span>Kritische Treffer</span><span>${st.crits}</span></div>
        <div class="stat-row"><span>Aktuelle Tiefe</span><span>${CONFIG.DEPTHS[s.depth].name}</span></div>
        <div class="stat-row"><span>Gold pro Klick</span><span>${Game.formatNumber(Game.getClickPower())}</span></div>
        <div class="stat-row"><span>Passives Einkommen</span><span>${Game.formatNumber(Game.getPassiveIncome())}/s</span></div>
      </div>
      <div class="stat-section">
        <h3>Fortschritt</h3>
        <div class="stat-row"><span>Ebenen freigeschaltet</span><span>${st.depthsUnlocked}/${CONFIG.DEPTHS.length}</span></div>
        <div class="stat-row"><span>Käufe gesamt</span><span>${st.purchases}</span></div>
        <div class="stat-row"><span>Boosts genutzt</span><span>${st.boostsUsed}</span></div>
      </div>`;
  },

  cardHTML({ icon, title, desc, cost, affordable, disabled, type, id, level, income, isGems }) {
    const classes = ['card'];
    if (disabled) classes.push('disabled');
    else if (affordable) classes.push('affordable');

    return `
      <div class="${classes.join(' ')}" data-type="${type || ''}" data-id="${id || ''}">
        <div class="card-icon">${icon}</div>
        <div class="card-info">
          <div class="card-title">${title}</div>
          <div class="card-desc">${desc}</div>
          <div class="card-meta">
            ${income ? `<span>${income}</span>` : ''}
            ${level ? `<span class="card-owned">${level}</span>` : ''}
          </div>
        </div>
        <div class="card-action">
          <div class="card-cost ${isGems ? 'gems' : ''}">${cost}</div>
          ${type === 'miner' ? '<div class="card-buy-label">KAUFEN</div>' : ''}
        </div>
      </div>`;
  },

  updateQuickBuy(state) {
    const miner = CONFIG.MINERS[0];
    const cost = Game.getMinerCost(miner.id);
    const owned = state.miners[miner.id] || 0;
    const affordable = state.gold >= cost;
    const income = Game.getPassiveIncome();

    if (this.els['qb-icon']) this.els['qb-icon'].textContent = miner.icon;
    if (this.els['qb-name']) {
      this.els['qb-name'].textContent = owned > 0
        ? `+1 ${miner.name} (${owned} aktiv)`
        : `${miner.name} anheuern`;
    }
    if (this.els['qb-desc']) {
      const payback = Math.ceil(cost / miner.baseIncome / 60);
      this.els['qb-desc'].textContent = income > 0
        ? `Team verdient +${Game.formatNumber(income)} Gold/Sek`
        : `+${miner.baseIncome} G/s · Amortisation ~${payback} Min`;
    }
    if (this.els['qb-cost']) this.els['qb-cost'].textContent = Game.formatNumber(cost) + ' G';

    const btn = this.els['quick-buy-btn'];
    if (!btn) return;
    btn.classList.toggle('affordable', affordable);
    btn.classList.toggle('pulse', affordable);
    btn.disabled = false;
  },

  updateMission(state, missionDone) {
    const mission = Game.getCurrentMission();
    const bar = this.els['mission-bar'];
    if (!mission) {
      bar.style.display = 'none';
      return;
    }
    bar.style.display = 'flex';
    const { current, goal } = Game.getMissionProgress(mission);
    const pct = Math.min(100, (current / goal) * 100);

    this.els['mission-icon'].textContent = mission.icon;
    this.els['mission-title'].textContent = `${mission.text} (${Math.min(current, goal)}/${goal})`;
    this.els['mission-progress-fill'].style.width = pct + '%';
    this.els['mission-reward'].textContent = '+' + mission.reward + 'G';

    if (missionDone) {
      bar.classList.add('completed');
      this.toast(`🎯 Mission geschafft! +${missionDone.reward} Gold!`, 'success');
      if (Game.state.settings.sound) AudioManager.play('levelup');
      setTimeout(() => bar.classList.remove('completed'), 800);
    }
  },

  updateWorkers(state) {
    const total = Game.getTotalMiners();
    const layer = this.els['worker-layer'];
    if (!layer) return;

    if (total !== this.lastMinerCount) {
      this.lastMinerCount = total;
      layer.innerHTML = '';
      const positions = [
        { left: '8%', bottom: '18%' },
        { left: '78%', bottom: '22%' },
        { left: '15%', bottom: '8%' },
        { left: '70%', bottom: '10%' },
        { left: '42%', bottom: '5%' },
        { left: '55%', bottom: '15%' },
      ];
      for (let i = 0; i < Math.min(total, 6); i++) {
        const w = document.createElement('div');
        w.className = 'scene-worker';
        w.style.left = positions[i].left;
        w.style.bottom = positions[i].bottom;
        w.style.animationDelay = (i * 0.3) + 's';
        w.innerHTML = '<span class="sw-body">👷</span><span class="sw-pick">⛏️</span>';
        layer.appendChild(w);
      }
    }
  },

  showGoldRush() {
    const banner = this.els['event-banner'];
    if (!banner) return;
    banner.textContent = '🌟 GOLDRAUSCH! 3× Gold für 15 Sekunden!';
    banner.classList.add('visible');
    this.toast('🌟 GOLDRAUSCH! 3× Einkommen!', 'success');
    setTimeout(() => banner.classList.remove('visible'), 15000);
  },

  showPassiveTick(amount) {
    const rate = this.els['income-rate'];
    if (!rate) return;
    const el = document.createElement('div');
    el.className = 'passive-pop';
    el.textContent = '+' + Game.formatNumber(amount);
    rate.appendChild(el);
    setTimeout(() => el.remove(), 900);
  },

  updateHUD(state, extra = {}) {
    const isMeaningful = extra.tap || extra.purchased || extra.passiveTick || extra.missionDone || extra.goldRush || extra.tick === false;

    if (extra.tap) {
      const vein = document.getElementById('gold-vein-visual');
      if (vein && state.veinHp < 30) vein.classList.add('low');
      else if (vein) vein.classList.remove('low');
    }

    if (this.els['gold-amount']) {
      this.els['gold-amount'].textContent = Game.formatNumber(state.gold);
      if (extra.tap || extra.purchased || extra.passiveTick || extra.missionDone) {
        this.els['gold-amount'].classList.add('bump');
        setTimeout(() => this.els['gold-amount']?.classList.remove('bump'), 200);
      }
    }

    if (this.els['gems-amount']) this.els['gems-amount'].textContent = state.gems;
    if (this.els['depth-level']) this.els['depth-level'].textContent = CONFIG.DEPTHS[state.depth].name;

    const income = Game.getPassiveIncome();
    const rateEl = this.els['income-rate']?.querySelector('.rate-value');
    if (rateEl) {
      rateEl.textContent = '+' + Game.formatNumber(income) + '/s';
      if (income > 0) rateEl.parentElement.classList.add('earning');
      else rateEl.parentElement.classList.remove('earning');
    }

    if (this.els['vein-hp-fill']) this.els['vein-hp-fill'].style.width = (state.veinHp / state.veinMaxHp) * 100 + '%';
    if (this.els['vein-hp-text']) this.els['vein-hp-text'].textContent = Math.round(state.veinHp) + '%';

    const boostActive = Date.now() < state.boostEnd || Date.now() < state.goldRushEnd;
    const boostBtn = this.els['btn-boost'];
    if (boostBtn) boostBtn.classList.toggle('active', Date.now() < state.boostEnd);

    if (extra.goldRush) this.showGoldRush();
    if (extra.passiveTick) {
      this.showPassiveTick(extra.passiveTick);
      this.logActivity(`⛏️ Bergleute +${Game.formatNumber(extra.passiveTick)} Gold`, false, 'income');
    }
    if (extra.minerBought) {
      this.spawnWorkerBurst();
      this.updateWorkers(state);
      if (Game.state.settings?.sound) AudioManager.play('levelup');
    }
    if (extra.purchased && extra.minerBought) {
      const m = CONFIG.MINERS.find(x => x.id === extra.minerBought);
      if (m) this.logActivity(`✅ ${m.name} angeheuert! +${m.baseIncome} Gold/Sek`, true);
    }
    if (extra.missionDone) this.updateMission(state, extra.missionDone);

    if (isMeaningful || !this._lastQuickBuyUpdate || Date.now() - this._lastQuickBuyUpdate > 500) {
      this.updateQuickBuy(state);
      this._lastQuickBuyUpdate = Date.now();
    }

    if (extra.tap || extra.minerBought) {
      this.updateWorkers(state);
      this.updateMission(state, extra.missionDone);
    }

    if (this.els.panels[this.activePanel]?.classList.contains('active') && (extra.purchased || extra.tap)) {
      this.renderPanel(this.activePanel);
    }
  },

  toast(message, type = 'info') {
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.textContent = message;
    this.els['toast-container'].appendChild(el);
    setTimeout(() => el.remove(), 3000);
  },

  showOfflineModal(earnings) {
    this.els['offline-amount'].textContent = '+' + Game.formatNumber(earnings) + ' Gold';
    this.els['modal-offline'].classList.add('visible');
  },

  startRenderLoop() {
    const loop = () => {
      if (Game.renderer && Game.state) {
        Game.renderer.render(Game.state);
      }
      this.animFrame = requestAnimationFrame(loop);
    };
    this.animFrame = requestAnimationFrame(loop);
  },

  startAutoSave() {
    this.saveTimer = setInterval(() => {
      Game.state.lastOnline = Date.now();
      Game.save();
    }, 30000);
  },

  showSplash(onComplete) {
    const loadText = this.els['load-text'];
    const texts = ['Lade Bergwerk...', 'Sprenge Felsen...', 'Poliere Gold...', 'Wecken Bergleute...'];
    let i = 0;
    const textInterval = setInterval(() => {
      i = (i + 1) % texts.length;
      if (loadText) loadText.textContent = texts[i];
    }, 500);

    setTimeout(() => {
      clearInterval(textInterval);
      try {
        this.els['splash']?.classList.remove('active');
        this.els['game']?.classList.add('active');
        onComplete?.();
      } catch (err) {
        console.error('Splash-Fehler:', err);
        this.els['splash']?.classList.remove('active');
        this.els['game']?.classList.add('active');
        onComplete?.();
      }
    }, 2200);
  },
};