const HubI18n = {
  KEY: 'arcade_lang',

  strings: {
    de: {
      hero_sub: 'Drei kostenlose Spiele — direkt im Browser, ohne App.',
      stat_visits: 'Besuche (global)',
      stat_plays: 'Spiele (global)',
      sky_desc: 'Fliege geschickt durch Wolken und Rohre.',
      sky_tag: 'Arcade',
      gold_desc: 'Klicke, baue auf, werde zum Bergbau-Tycoon.',
      gold_tag: 'Strategie',
      stack_desc: 'Stapel die Blöcke präzise — wie hoch kommst du?',
      stack_tag: 'Geschicklichkeit',
      share: 'Teilen',
      share_text: 'Kostenlose Browser-Spiele — Sky Drift, Goldgräber & Neon Stack!',
      share_copied: 'Link kopiert!',
      share_failed: 'Teilen nicht möglich',
      privacy: 'Datenschutz',
      footer: 'Arcade Rush © 2026 · Made in Austria 🇦🇹',
    },
    en: {
      hero_sub: 'Three free games — play instantly in your browser, no app needed.',
      stat_visits: 'Visits (global)',
      stat_plays: 'Plays (global)',
      sky_desc: 'Glide through clouds and dodge the pipes.',
      sky_tag: 'Arcade',
      gold_desc: 'Tap, upgrade, and grow your mining empire.',
      gold_tag: 'Strategy',
      stack_desc: 'Stack blocks with precision — how high can you go?',
      stack_tag: 'Skill',
      share: 'Share',
      share_text: 'Free browser games — Sky Drift, Goldgräber & Neon Stack!',
      share_copied: 'Link copied!',
      share_failed: 'Could not share',
      privacy: 'Privacy',
      footer: 'Arcade Rush © 2026 · Made in Austria 🇦🇹',
    },
  },

  getLang() {
    const saved = localStorage.getItem(this.KEY);
    if (saved === 'en' || saved === 'de') return saved;
    return navigator.language?.startsWith('de') ? 'de' : 'en';
  },

  setLang(lang) {
    localStorage.setItem(this.KEY, lang);
    this.apply(lang);
  },

  t(key) {
    return this.strings[this.getLang()][key] ?? this.strings.de[key] ?? key;
  },

  apply(lang) {
    const s = this.strings[lang] || this.strings.de;
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (s[key] != null) el.textContent = s[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      if (s[key] != null) el.placeholder = s[key];
    });
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  },

  init() {
    const lang = this.getLang();
    this.apply(lang);
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => this.setLang(btn.dataset.lang));
    });
  },
};

window.HubI18n = HubI18n;