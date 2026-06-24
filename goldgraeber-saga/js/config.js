const CONFIG = {
  SAVE_KEY: 'goldgraeber_saga_v2',
  TICK_RATE: 100,
  OFFLINE_CAP_HOURS: 8,
  BOOST_DURATION_MS: 300000,
  BOOST_MULTIPLIER: 2,
  CRIT_CHANCE_BASE: 0.06,
  CRIT_MULTIPLIER: 4,
  BASE_CLICK_POWER: 4,
  COMBO_WINDOW_MS: 1200,
  COMBO_MAX: 15,
  VEIN_BREAK_BONUS: 20,
  VEIN_RESPAWN_MS: 4000,
  STARTING_GOLD: 15,

  /* Wirtschaft: Kosten ≈ 2–4 Min aktives Klicken, Amortisation ≈ 3–5 Min */
  DEPTHS: [
    { id: 0, name: 'Oberfläche',     multiplier: 1,   unlockCost: 0,        color: '#8B7355', icon: '🏔️' },
    { id: 1, name: 'Steinschicht',   multiplier: 1.4, unlockCost: 2000,     color: '#6B5B4E', icon: '🪨' },
    { id: 2, name: 'Kupferader',     multiplier: 2,   unlockCost: 12000,    color: '#B87333', icon: '🟤' },
    { id: 3, name: 'Eisenschacht',   multiplier: 3.2, unlockCost: 75000,   color: '#71797E', icon: '⚙️' },
    { id: 4, name: 'Silbergrube',    multiplier: 5.5, unlockCost: 400000,  color: '#C0C0C0', icon: '✨' },
    { id: 5, name: 'Goldader',       multiplier: 9,   unlockCost: 2500000,  color: '#FFD700', icon: '💛' },
    { id: 6, name: 'Diamanthöhle',   multiplier: 15,  unlockCost: 15000000, color: '#B9F2FF', icon: '💎' },
    { id: 7, name: 'Kristallkern',   multiplier: 25,  unlockCost: 100000000, color: '#E040FB', icon: '🔮' },
  ],

  MISSIONS: [
    { id: 'taps80',   type: 'taps',   goal: 80,    reward: 120,  icon: '👆', text: 'Schlage 80× auf die Goldader' },
    { id: 'miner2',   type: 'miners', goal: 2,     reward: 200,  icon: '👷', text: 'Heuere 2 Bergleute an' },
    { id: 'gold5k',   type: 'gold',   goal: 5000,  reward: 450, icon: '💰', text: 'Verdiene 5.000 Gold gesamt' },
    { id: 'miner6',   type: 'miners', goal: 6,     reward: 700,  icon: '👨‍🏭', text: 'Habe 6 Bergleute im Team' },
    { id: 'gold25k',  type: 'gold',   goal: 25000, reward: 1500, icon: '🏆', text: 'Verdiene 25.000 Gold gesamt' },
    { id: 'depth2',   type: 'depth',  goal: 2,     reward: 3000, icon: '⛏️', text: 'Erreiche Kupferader-Tiefe' },
  ],

  MINERS: [
    { id: 'apprentice',  name: 'Lehrling',        icon: '👷', desc: 'Hilft beim manuellen Abbau',        baseCost: 200,     baseIncome: 0.8,  costScale: 1.15 },
    { id: 'digger',      name: 'Schaufler',       icon: '⛏️', desc: 'Gräbt stetig ins Gestein',          baseCost: 1200,    baseIncome: 4,    costScale: 1.16 },
    { id: 'driller',     name: 'Bohrer',          icon: '🔩', desc: 'Tiefenbohrung mit Druckluft',       baseCost: 6500,    baseIncome: 18,   costScale: 1.17 },
    { id: 'dynamite',    name: 'Sprengmeister',   icon: '💥', desc: 'Spart ganze Felswände ein',         baseCost: 35000,   baseIncome: 75,   costScale: 1.18 },
    { id: 'engineer',    name: 'Ingenieur',       icon: '🔧', desc: 'Optimiert Förderketten',            baseCost: 180000,  baseIncome: 320,  costScale: 1.19 },
    { id: 'foreman',     name: 'Vorarbeiter',     icon: '👨‍🏭', desc: 'Koordiniert ganze Schichten',       baseCost: 900000,  baseIncome: 1400, costScale: 1.20 },
    { id: 'robot',       name: 'Bergbau-Roboter', icon: '🤖', desc: '24/7 autonomer Tiefenabbau',        baseCost: 6000000, baseIncome: 7500, costScale: 1.21 },
  ],

  UPGRADES: [
    { id: 'pickaxe',    name: 'Goldspitzhacke',   icon: '⛏️', desc: '+Gold pro Klick',          baseCost: 120,   effect: 1,    costScale: 1.18, maxLevel: 40 },
    { id: 'luck',       name: 'Glücksbringer',    icon: '🍀', desc: '+Krit-Chance',             baseCost: 500,   effect: 0.008, costScale: 1.22, maxLevel: 15 },
    { id: 'vein',       name: 'Ader-Scanner',     icon: '📡', desc: '+Ader-Multiplikator',      baseCost: 2500,  effect: 0.08, costScale: 1.25, maxLevel: 25 },
    { id: 'cart',       name: 'Goldkarren',       icon: '🛒', desc: '+Passives Einkommen',        baseCost: 1500,  effect: 0.04, costScale: 1.20, maxLevel: 20 },
    { id: 'lantern',    name: 'Magische Laterne', icon: '🏮', desc: '+Tiefen-Bonus',           baseCost: 8000,  effect: 0.06, costScale: 1.24, maxLevel: 15 },
  ],

  SHOP: [
    { id: 'gems_small',  name: 'Edelsteinbeutel',  icon: '💎', gems: 50,   price: '0,99 €',  desc: '50 Edelsteine' },
    { id: 'gems_medium', name: 'Edelsteinkiste',   icon: '💎', gems: 300,  price: '4,99 €',  desc: '300 Edelsteine (+20%)' },
    { id: 'gems_large',  name: 'Edelsteintrophäe', icon: '💎', gems: 1500, price: '19,99 €', desc: '1500 Edelsteine (+50%)' },
    { id: 'starter',     name: 'Starterpaket',     icon: '🎁', gems: 0,    price: '2,99 €',  desc: '100K Gold + 5 Min 3× Boost', special: true },
    { id: 'vip',         name: 'VIP Pass (30 Tage)', icon: '👑', gems: 0, price: '9,99 €', desc: 'Dauerhaft +25% Einkommen', special: true },
  ],

  GEM_UPGRADES: [
    { id: 'auto_tap',   name: 'Auto-Klicker',    icon: '👆', desc: 'Klickt automatisch 1×/s',  gemCost: 25,  effect: 1 },
    { id: 'mega_boost', name: 'Mega-Boost',      icon: '⚡', desc: 'Boost dauert 10 Min',       gemCost: 50,  effect: 600000 },
    { id: 'offline_x2', name: 'Offline-Verdoppler', icon: '🌙', desc: '2× Offline-Einnahmen', gemCost: 100, effect: 2 },
  ],
};