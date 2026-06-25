const HubI18n = {
  KEY: 'arcade_lang',

  strings: {
    de: {
      hero_sub: 'Drei kostenlose Spiele — direkt im Browser, ohne App.',
      stat_visits: 'Besuche (gesamt)',
      stat_plays: 'Spiele (gesamt)',
      sky_desc: 'Fliege geschickt durch Wolken und Rohre.',
      sky_tag: 'Arcade',
      gold_desc: 'Klicke, baue auf, werde zum Bergbau-Tycoon.',
      gold_tag: 'Strategie',
      stack_desc: 'Stapel die Blöcke präzise — wie hoch kommst du?',
      stack_tag: 'Geschicklichkeit',
      share: 'Teilen',
      share_title: 'Link teilen',
      share_hint: 'Link kopieren oder direkt weiterleiten:',
      share_copy: 'Link kopieren',
      share_whatsapp: 'WhatsApp',
      share_close: 'Schließen',
      share_text: 'Kostenlose Browser-Spiele — Sky Drift, Goldgräber & Neon Stack!',
      share_copied: 'Link kopiert!',
      share_failed: 'Tippe den Link oben an und wähle „Kopieren“',
      privacy: 'Datenschutz',
      footer: 'Arcade Rush © 2026 · Made in Austria 🇦🇹',
    },
    en: {
      hero_sub: 'Three free games — play instantly in your browser, no app needed.',
      stat_visits: 'Visits (total)',
      stat_plays: 'Plays (total)',
      sky_desc: 'Glide through clouds and dodge the pipes.',
      sky_tag: 'Arcade',
      gold_desc: 'Tap, upgrade, and grow your mining empire.',
      gold_tag: 'Strategy',
      stack_desc: 'Stack blocks with precision — how high can you go?',
      stack_tag: 'Skill',
      share: 'Share',
      share_title: 'Share link',
      share_hint: 'Copy the link or share directly:',
      share_copy: 'Copy link',
      share_whatsapp: 'WhatsApp',
      share_close: 'Close',
      share_text: 'Free browser games — Sky Drift, Goldgräber & Neon Stack!',
      share_copied: 'Link copied!',
      share_failed: 'Tap the link above and choose Copy',
      privacy: 'Privacy',
      footer: 'Arcade Rush © 2026 · Made in Austria 🇦🇹',
    },
  },

  getLang() {
    try {
      const saved = localStorage.getItem(this.KEY);
      if (saved === 'en' || saved === 'de') return saved;
    } catch (_) {}
    return navigator.language?.startsWith('de') ? 'de' : 'en';
  },

  setLang(lang) {
    try { localStorage.setItem(this.KEY, lang); } catch (_) {}
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
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
      btn.setAttribute('aria-pressed', btn.dataset.lang === lang ? 'true' : 'false');
    });
    if (typeof updateWhatsAppLink === 'function') updateWhatsAppLink();
  },

  bindButton(el, handler) {
    let lastTap = 0;
    const run = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const now = Date.now();
      if (now - lastTap < 400) return;
      lastTap = now;
      handler(e);
    };
    el.addEventListener('click', run);
    el.addEventListener('touchend', run, { passive: false });
  },

  init() {
    const lang = this.getLang();
    this.apply(lang);
    document.querySelectorAll('.lang-btn').forEach(btn => {
      this.bindButton(btn, () => this.setLang(btn.dataset.lang));
    });
  },
};

window.HubI18n = HubI18n;