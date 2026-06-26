const GameI18n = {
  KEY: 'vatreni_lang',
  lang: 'en',

  strings: {
    de: {
      points: 'PUNKTE', combo: 'COMBO', best: 'BEST', goal: 'ZIEL',
      goal_left: 'bis Ziel', chase: 'Jag den Rekord!',
      tap_play: 'Tippen zum Spielen', tagline: 'Perfektes Timing · Combo-Fever 🇭🇷',
      hint: 'Warte auf Bro · Tap PERFECT! · Combos bauen',
      ready: 'Bereit?', ready_sub: 'Triff PERFECT! für Combos!',
      game_over: 'Game Over', play_again: 'Nochmal', share: 'Score teilen 🔗',
      copied: 'Kopiert! ✓', new_record: '🎉 Neuer Rekord!',
      games: 'Spiele', best_combo: 'Best Combo',
      daily: 'Tages-Challenge', daily_done: '✓ Geschafft!',
      all_games: '← Alle Spiele',
      skip_tutorial: 'Tutorial überspringen',
      wait: 'Warte…', too_far: 'Zu weit!', perfect: 'PERFECT!', good: 'GOOD', late: 'LATE…',
      too_early: 'ZU FRÜH!', fever: 'FEVER!', run: 'RUN…', tap: 'TAP',
      fast: '⚡ SCHNELL', curve: '↪ KURVE',
      reasons: { miss: 'Kopfball-Fenster verpasst.', ground: 'Ball auf dem Boden.', out: 'Ball aus dem Spielfeld.', whiff: 'Nicht rechtzeitig erreicht.' },
      context_record: 'Neuer persönlicher Rekord!',
      context_one: 'Nur 1 Punkt bis zum Rekord — so knapp!',
      context_best: 'Punkte bis Bestwert',
      context_goal: 'Punkte bis Ziel',
    },
    en: {
      points: 'POINTS', combo: 'COMBO', best: 'BEST', goal: 'GOAL',
      goal_left: 'to goal', chase: 'Chase the record!',
      tap_play: 'Tap to Play', tagline: 'Perfect timing · Combo fever 🇭🇷',
      hint: 'Wait for Bro · Tap PERFECT! · Build combos',
      ready: 'Ready?', ready_sub: 'Hit PERFECT! for combos!',
      game_over: 'Game Over', play_again: 'Play Again', share: 'Share Score 🔗',
      copied: 'Copied! ✓', new_record: '🎉 New Record!',
      games: 'Games', best_combo: 'Best Combo',
      daily: 'Daily Challenge', daily_done: '✓ Done!',
      all_games: '← All Games',
      skip_tutorial: 'Skip tutorial',
      wait: 'Wait…', too_far: 'Too far!', perfect: 'PERFECT!', good: 'GOOD', late: 'LATE…',
      too_early: 'TOO EARLY!', fever: 'FEVER!', run: 'RUN…', tap: 'TAP',
      fast: '⚡ FAST', curve: '↪ CURVE',
      reasons: { miss: 'Missed the header window.', ground: 'Ball hit the ground.', out: 'Ball went out of play.', whiff: 'Couldn\'t reach in time.' },
      context_record: 'New personal record!',
      context_one: 'Just 1 point off your best — so close!',
      context_best: 'points to beat best',
      context_goal: 'points to goal',
    },
  },

  init() {
    try {
      this.lang = localStorage.getItem(this.KEY) || (navigator.language?.startsWith('de') ? 'de' : 'en');
    } catch (_) {}
    this.apply();
  },

  t(key) {
    return this.strings[this.lang]?.[key] ?? this.strings.en[key] ?? key;
  },

  tr(key, sub) {
    const m = this.strings[this.lang]?.reasons?.[key] ?? this.strings.en.reasons?.[key];
    return m || key;
  },

  toggle() {
    this.lang = this.lang === 'de' ? 'en' : 'de';
    try { localStorage.setItem(this.KEY, this.lang); } catch (_) {}
    this.apply();
    return this.lang;
  },

  apply() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const k = el.getAttribute('data-i18n');
      if (k) el.textContent = this.t(k);
    });
    const btn = document.getElementById('btn-lang');
    if (btn) btn.textContent = this.lang === 'de' ? 'EN' : 'DE';
  },
};