const Game = {
  state: null,
  renderer: null,
  tickInterval: null,
  lastTick: 0,
  onUpdate: null,
  combo: 0,
  lastTapTime: 0,

  defaultState() {
    return {
      gold: 15,
      gems: 10,
      totalGold: 0,
      totalTaps: 0,
      depth: 0,
      veinHp: 100,
      veinMaxHp: 100,
      miners: {},
      upgrades: {},
      gemUpgrades: {},
      boostEnd: 0,
      lastSave: Date.now(),
      lastOnline: Date.now(),
      settings: { sound: true, particles: true, vibration: true },
      stats: {
        playTime: 0,
        crits: 0,
        depthsUnlocked: 1,
        purchases: 0,
        boostsUsed: 0,
      },
      missionIndex: 0,
      completedMissions: [],
      goldRushEnd: 0,
      passiveAccumulator: 0,
    };
  },

  init(renderer) {
    this.renderer = renderer;
    this.load();
    this.initMiners();
    this.initUpgrades();
    this.lastTick = Date.now();
    this.startTick();
    this.checkOfflineEarnings();
    this.updateMinerVisuals();
  },

  initMiners() {
    CONFIG.MINERS.forEach(m => {
      if (this.state.miners[m.id] === undefined) this.state.miners[m.id] = 0;
    });
  },

  initUpgrades() {
    CONFIG.UPGRADES.forEach(u => {
      if (this.state.upgrades[u.id] === undefined) this.state.upgrades[u.id] = 0;
    });
    CONFIG.GEM_UPGRADES.forEach(u => {
      if (this.state.gemUpgrades[u.id] === undefined) this.state.gemUpgrades[u.id] = 0;
    });
  },

  load() {
    try {
      const saved = localStorage.getItem(CONFIG.SAVE_KEY);
      this.state = saved ? { ...this.defaultState(), ...JSON.parse(saved) } : this.defaultState();
      if (this.state.missionIndex === undefined) this.state.missionIndex = 0;
      if (!this.state.completedMissions) this.state.completedMissions = [];
      if (this.state.goldRushEnd === undefined) this.state.goldRushEnd = 0;
      if (this.state.passiveAccumulator === undefined) this.state.passiveAccumulator = 0;
      if (this.state.totalTaps < 5 && this.state.gold < CONFIG.STARTING_GOLD) {
        this.state.gold = CONFIG.STARTING_GOLD;
      }
    } catch {
      this.state = this.defaultState();
    }
  },

  save() {
    this.state.lastSave = Date.now();
    localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(this.state));
  },

  reset() {
    localStorage.removeItem(CONFIG.SAVE_KEY);
    this.state = this.defaultState();
    this.combo = 0;
    this.lastTapTime = 0;
    this.initMiners();
    this.initUpgrades();
    this.updateMinerVisuals();
    this.notify({ reset: true });
  },

  startTick() {
    if (this.tickInterval) clearInterval(this.tickInterval);
    this.tickInterval = setInterval(() => this.tick(), CONFIG.TICK_RATE);
  },

  tick() {
    const now = Date.now();
    const dt = (now - this.lastTick) / 1000;
    this.lastTick = now;
    this.state.stats.playTime += dt;

    const income = this.getPassiveIncome() * dt;
    if (income > 0) {
      this.addGold(income, false);
      this.state.passiveAccumulator += income;
      if (this.state.passiveAccumulator >= 1) {
        const payout = Math.floor(this.state.passiveAccumulator);
        this.state.passiveAccumulator -= payout;
        this.notify({ passiveTick: payout });
      }
    }

    if (this.maybeStartGoldRush()) {
      this.notify({ goldRush: true });
    }

    const autoTapLevel = this.state.gemUpgrades.auto_tap || 0;
    if (autoTapLevel > 0) {
      const autoRate = autoTapLevel * dt;
      if (autoRate >= 1) {
        for (let i = 0; i < Math.floor(autoRate); i++) this.tap(false, true);
      }
    }

    if (this.state.veinHp < this.state.veinMaxHp) {
      this.state.veinHp = Math.min(this.state.veinMaxHp, this.state.veinHp + dt * (100 / (CONFIG.VEIN_RESPAWN_MS / 1000)));
    }

    this.notify({ tick: true });
  },

  getBoostMultiplier() {
    let mult = Date.now() < this.state.boostEnd ? CONFIG.BOOST_MULTIPLIER : 1;
    if (Date.now() < this.state.goldRushEnd) mult *= 3;
    return mult;
  },

  getTotalMiners() {
    return Object.values(this.state.miners).reduce((a, b) => a + b, 0);
  },

  getCurrentMission() {
    while (this.state.missionIndex < CONFIG.MISSIONS.length) {
      const m = CONFIG.MISSIONS[this.state.missionIndex];
      if (!this.state.completedMissions.includes(m.id)) return m;
      this.state.missionIndex++;
    }
    return null;
  },

  getMissionProgress(mission) {
    if (!mission) return { current: 0, goal: 1 };
    switch (mission.type) {
      case 'taps': return { current: this.state.totalTaps, goal: mission.goal };
      case 'miners': return { current: this.getTotalMiners(), goal: mission.goal };
      case 'gold': return { current: Math.floor(this.state.totalGold), goal: mission.goal };
      case 'depth': return { current: this.state.depth, goal: mission.goal };
      default: return { current: 0, goal: 1 };
    }
  },

  checkMissions() {
    const mission = this.getCurrentMission();
    if (!mission) return null;
    const { current, goal } = this.getMissionProgress(mission);
    if (current >= goal) {
      this.state.completedMissions.push(mission.id);
      this.state.missionIndex++;
      this.addGold(mission.reward, false);
      this.save();
      return { completed: mission, reward: mission.reward };
    }
    return null;
  },

  maybeStartGoldRush() {
    if (Date.now() < this.state.goldRushEnd) return false;
    if (Math.random() < 0.002) {
      this.state.goldRushEnd = Date.now() + 15000;
      return true;
    }
    return false;
  },

  getClickPower() {
    const pickaxe = this.state.upgrades.pickaxe || 0;
    const vein = this.state.upgrades.vein || 0;
    const lantern = this.state.upgrades.lantern || 0;
    const depth = CONFIG.DEPTHS[this.state.depth];
    const base = CONFIG.BASE_CLICK_POWER + pickaxe * CONFIG.UPGRADES.find(u => u.id === 'pickaxe').effect;
    const veinMult = 1 + vein * 0.1;
    const depthMult = depth.multiplier * (1 + lantern * 0.08);
    const comboMult = 1 + Math.min(this.combo, CONFIG.COMBO_MAX) * 0.1;
    return base * veinMult * depthMult * comboMult * this.getBoostMultiplier();
  },

  getCritChance() {
    const luck = this.state.upgrades.luck || 0;
    return CONFIG.CRIT_CHANCE_BASE + luck * CONFIG.UPGRADES.find(u => u.id === 'luck').effect;
  },

  getPassiveIncome() {
    let income = 0;
    CONFIG.MINERS.forEach(m => {
      const owned = this.state.miners[m.id] || 0;
      income += owned * m.baseIncome;
    });

    const cart = this.state.upgrades.cart || 0;
    income *= 1 + cart * CONFIG.UPGRADES.find(u => u.id === 'cart').effect;

    const depth = CONFIG.DEPTHS[this.state.depth];
    income *= depth.multiplier;

    income *= this.getBoostMultiplier();
    return income;
  },

  tap(manual = true, silent = false) {
    const now = Date.now();
    if (manual && now - this.lastTapTime < CONFIG.COMBO_WINDOW_MS) {
      this.combo = Math.min(this.combo + 1, CONFIG.COMBO_MAX);
    } else if (manual) {
      this.combo = 0;
    }
    if (manual) this.lastTapTime = now;

    const critChance = this.getCritChance();
    const isCrit = Math.random() < critChance;
    let amount = this.getClickPower();
    if (isCrit) {
      amount *= CONFIG.CRIT_MULTIPLIER;
      this.state.stats.crits++;
    }

    const prevHp = this.state.veinHp;
    this.addGold(amount, manual);
    this.state.totalTaps++;
    this.state.veinHp = Math.max(0, this.state.veinHp - (8 + Math.random() * 7));

    let veinBroken = false;
    if (prevHp > 0 && this.state.veinHp <= 0) {
      const bonus = CONFIG.VEIN_BREAK_BONUS * CONFIG.DEPTHS[this.state.depth].multiplier;
      this.addGold(bonus, false);
      this.state.veinHp = this.state.veinMaxHp;
      veinBroken = true;
      amount += bonus;
    }

    if (manual && this.renderer) {
      const x = this.renderer.cx;
      const y = this.renderer.cy;
      this.renderer.emitGold(x, y, isCrit || veinBroken);
      this.renderer.pulseVein();
      this.renderer.shake(isCrit || veinBroken ? 10 : 5);

      if (this.state.settings.sound) AudioManager.play(isCrit || veinBroken ? 'crit' : 'tap');
      if (this.state.settings.vibration && navigator.vibrate) navigator.vibrate(isCrit ? 40 : 15);
    }

    if (!silent) {
      const missionDone = this.checkMissions();
      this.notify({
        tap: true, amount, isCrit, veinBroken,
        combo: this.combo, missionDone,
        x: this.renderer?.cx, y: this.renderer?.cy,
      });
    }
    return { amount, isCrit, veinBroken, combo: this.combo };
  },

  addGold(amount, showFloat = true) {
    this.state.gold += amount;
    this.state.totalGold += amount;
    if (showFloat && amount > 0) {
      this.notify({ goldAdded: amount });
    }
  },

  getMinerCost(minerId) {
    const miner = CONFIG.MINERS.find(m => m.id === minerId);
    const owned = this.state.miners[minerId] || 0;
    return Math.floor(miner.baseCost * Math.pow(miner.costScale, owned));
  },

  buyMiner(minerId) {
    const cost = this.getMinerCost(minerId);
    if (this.state.gold < cost) return false;

    this.state.gold -= cost;
    this.state.miners[minerId] = (this.state.miners[minerId] || 0) + 1;
    this.state.stats.purchases++;
    this.updateMinerVisuals();

    if (this.state.settings.sound) AudioManager.play('buy');
    const missionDone = this.checkMissions();
    this.save();
    this.notify({ purchased: true, minerBought: minerId, missionDone });
    return true;
  },

  getUpgradeCost(upgradeId) {
    const upgrade = CONFIG.UPGRADES.find(u => u.id === upgradeId);
    const level = this.state.upgrades[upgradeId] || 0;
    if (level >= upgrade.maxLevel) return Infinity;
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costScale, level));
  },

  buyUpgrade(upgradeId) {
    const cost = this.getUpgradeCost(upgradeId);
    if (this.state.gold < cost || cost === Infinity) return false;

    this.state.gold -= cost;
    this.state.upgrades[upgradeId] = (this.state.upgrades[upgradeId] || 0) + 1;
    this.state.stats.purchases++;

    if (this.state.settings.sound) AudioManager.play('buy');
    this.save();
    this.notify({ purchased: true });
    return true;
  },

  canUnlockDepth(depthId) {
    if (depthId <= this.state.depth) return false;
    if (depthId !== this.state.depth + 1) return false;
    const depth = CONFIG.DEPTHS[depthId];
    return this.state.gold >= depth.unlockCost;
  },

  unlockDepth(depthId) {
    if (!this.canUnlockDepth(depthId)) return false;

    const depth = CONFIG.DEPTHS[depthId];
    this.state.gold -= depth.unlockCost;
    this.state.depth = depthId;
    this.state.stats.depthsUnlocked = Math.max(this.state.stats.depthsUnlocked, depthId + 1);
    this.state.veinHp = 100;
    this.state.veinMaxHp = 100;
    this.updateMinerVisuals();

    if (this.state.settings.sound) AudioManager.play('levelup');
    this.save();
    this.notify({ levelUp: true, depth });
    return true;
  },

  activateBoost() {
    if (Date.now() < this.state.boostEnd) return false;
    this.state.boostEnd = Date.now() + CONFIG.BOOST_DURATION_MS;
    this.state.stats.boostsUsed++;
    this.save();
    this.notify({ boostActivated: true });
    return true;
  },

  buyGemUpgrade(upgradeId) {
    const upgrade = CONFIG.GEM_UPGRADES.find(u => u.id === upgradeId);
    if (!upgrade || this.state.gems < upgrade.gemCost) return false;

    this.state.gems -= upgrade.gemCost;
    this.state.gemUpgrades[upgradeId] = (this.state.gemUpgrades[upgradeId] || 0) + 1;

    if (upgradeId === 'mega_boost') {
      this.state.boostEnd = Date.now() + upgrade.effect;
    }

    if (this.state.settings.sound) AudioManager.play('buy');
    this.save();
    this.notify({ purchased: true });
    return true;
  },

  simulateAdReward(type) {
    switch (type) {
      case 'boost':
        this.state.boostEnd = Date.now() + CONFIG.BOOST_DURATION_MS;
        this.state.stats.boostsUsed++;
        break;
      case 'double_offline':
        return true;
      case 'gems':
        this.state.gems += 5;
        break;
    }
    this.save();
    this.notify();
    return true;
  },

  checkOfflineEarnings() {
    const offline = Date.now() - (this.state.lastOnline || Date.now());
    if (offline < 60000) return null;

    const maxMs = CONFIG.OFFLINE_CAP_HOURS * 3600000;
    const effectiveMs = Math.min(offline, maxMs);
    const seconds = effectiveMs / 1000;
    const earnings = this.getPassiveIncome() * seconds;

    if (earnings < 1) return null;
    return { earnings, seconds };
  },

  collectOfflineEarnings(double = false) {
    const offline = this.checkOfflineEarnings();
    if (!offline) return 0;

    let amount = offline.earnings;
    if (double) amount *= 2;
    const gemMult = this.state.gemUpgrades.offline_x2 ? 2 : 1;
    amount *= gemMult;

    this.addGold(amount, false);
    this.state.lastOnline = Date.now();
    this.save();
    this.notify();
    return amount;
  },

  updateMinerVisuals() {
    if (!this.renderer) return;
    const totalMiners = Object.values(this.state.miners).reduce((a, b) => a + b, 0);
    const depth = CONFIG.DEPTHS[this.state.depth];
    this.renderer.setMiners(totalMiners, depth.color);
  },

  formatNumber(n) {
    if (n < 1000) return Math.floor(n).toString();
    if (n < 1000000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    if (n < 1000000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n < 1000000000000) return (n / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    return (n / 1000000000000).toFixed(1).replace(/\.0$/, '') + 'T';
  },

  notify(extra = {}) {
    if (this.onUpdate) this.onUpdate(this.state, extra);
  },
};