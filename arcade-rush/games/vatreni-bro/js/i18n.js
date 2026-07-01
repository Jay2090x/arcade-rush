const GameI18n = {
  KEY: 'vatreni_lang',
  LANGS: ['hr', 'en', 'de'],
  lang: 'hr',

  strings: {
    hr: {
      points: 'BODOVI', combo: 'COMBO', best: 'REKORD', goal: 'CILJ',
      goal_left: 'do cilja', chase: 'Juri rekord!',
      tap_play: 'Tapni za igru', tagline: 'Savršen timing · Combo fever 🇭🇷',
      hint: 'Čekaj Brta · Tapni PERFECT! · Gradi combo',
      ready: 'Spreman?', ready_sub: 'Pogodi PERFECT! za combo!',
      game_over: 'Kraj igre', play_again: 'Igraj opet', share: 'Podijeli rezultat 🔗',
      copied: 'Kopirano! ✓', new_record: '🎉 Novi rekord!',
      games: 'Igre', best_combo: 'Najbolji combo',
      daily: 'Dnevni izazov', daily_done: '✓ Gotovo!',
      all_games: '← Sve igre',
      skip_tutorial: 'Preskoči tutorial',
      wait: 'Čekaj…', too_far: 'Predaleko!', perfect: 'PERFECT!', good: 'GOOD', late: 'KASNO…',
      too_early: 'PRERANO!', fever: 'FEVER!', run: 'TRČI…', tap: 'TAP',
      fast: '⚡ BRZO', curve: '↪ KRIVINA',
      reasons: { miss: 'Promašio si priliku za glavom.', ground: 'Lopta na tlu.', out: 'Lopta izvan terena.', whiff: 'Nisi stigao na vrijeme.' },
      context_record: 'Novi osobni rekord!',
      context_one: 'Samo 1 bod do rekorda — tako blizu!',
      context_best: 'bodova do rekorda',
      context_goal: 'bodova do cilja',
      try_more: 'Probaj i ova dva!',
      sky_teaser: 'Let kroz oblake',
      stack_teaser: 'Slagaj blokove',
      share_beat: 'Možeš li ti bolje?',
    },
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
      try_more: 'Probier auch diese zwei!',
      sky_teaser: 'Flug durch Wolken',
      stack_teaser: 'Stapel die Blöcke',
      share_beat: 'Schaffst du mehr?',
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
      try_more: 'Try these two next!',
      sky_teaser: 'Fly through clouds',
      stack_teaser: 'Stack the bricks',
      share_beat: 'Can you beat me?',
    },
  },

  init() {
    try {
      const saved = localStorage.getItem(this.KEY);
      this.lang = saved && this.strings[saved] ? saved : 'hr';
    } catch (_) {
      this.lang = 'hr';
    }
    this.apply();
  },

  t(key) {
    return this.strings[this.lang]?.[key] ?? this.strings.hr[key] ?? this.strings.en[key] ?? key;
  },

  tr(key) {
    const m = this.strings[this.lang]?.reasons?.[key] ?? this.strings.hr.reasons?.[key] ?? this.strings.en.reasons?.[key];
    return m || key;
  },

  toggle() {
    const i = this.LANGS.indexOf(this.lang);
    this.lang = this.LANGS[(i + 1) % this.LANGS.length];
    try { localStorage.setItem(this.KEY, this.lang); } catch (_) {}
    this.apply();
    return this.lang;
  },

  nextLangLabel() {
    const i = this.LANGS.indexOf(this.lang);
    const next = this.LANGS[(i + 1) % this.LANGS.length];
    return next.toUpperCase();
  },

  apply() {
    document.documentElement.lang = this.lang === 'hr' ? 'hr' : this.lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const k = el.getAttribute('data-i18n');
      if (k) el.textContent = this.t(k);
    });
    const btn = document.getElementById('btn-lang');
    if (btn) btn.textContent = this.nextLangLabel();
  },
};