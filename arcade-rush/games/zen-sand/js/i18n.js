const ZenI18n = {
  KEY: 'arcade_lang',
  strings: {
    de: {
      title: 'Zen Rings',
      tagline: 'Wie im Sand-Video — Stab dreht Kreise',
      hint: 'Häufe Sand auf, tippe Play — der Stab dreht sich und streicht perfekte Kreise wie im Video.',
      tool_pile: 'Sand',
      tool_spin: 'Stab',
      tool_rake: 'Harke',
      tool_smooth: 'Glätten',
      tool_rings: 'Kreise',
      tool_reset: 'Neu',
      play_start: 'Play',
      play_pause: 'Pause',
      sound_on: 'Ton an',
      sound_off: 'Ton aus',
      back: 'Zurück',
      dismiss: 'Loslegen',
    },
    en: {
      title: 'Zen Rings',
      tagline: 'Like the sand video — spinning circles',
      hint: 'Pile sand, tap Play — the stick spins and rakes perfect circles like the video.',
      tool_pile: 'Sand',
      tool_spin: 'Stick',
      tool_rake: 'Rake',
      tool_smooth: 'Smooth',
      tool_rings: 'Rings',
      tool_reset: 'Reset',
      play_start: 'Play',
      play_pause: 'Pause',
      sound_on: 'Sound on',
      sound_off: 'Sound off',
      back: 'Back',
      dismiss: 'Begin',
    },
  },

  getLang() {
    try {
      const s = localStorage.getItem(this.KEY);
      if (s === 'en' || s === 'de') return s;
    } catch (_) {}
    return navigator.language?.startsWith('de') ? 'de' : 'en';
  },

  t(key) {
    const lang = this.getLang();
    return this.strings[lang][key] ?? this.strings.de[key] ?? key;
  },

  apply() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const k = el.dataset.i18n;
      const text = this.t(k);
      if (text) el.textContent = text;
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      el.title = this.t(el.dataset.i18nTitle);
    });
  },
};

window.ZenI18n = ZenI18n;