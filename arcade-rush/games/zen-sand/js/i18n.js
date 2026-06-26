const ZenI18n = {
  KEY: 'arcade_lang',
  strings: {
    de: {
      title: 'Zen Rings',
      tagline: 'Kreise in den Sand ziehen — pure Entspannung',
      hint: 'Ziehe mit dem Finger oder der Maus durch den Sand',
      tool_rake: 'Harke',
      tool_pile: 'Hügel',
      tool_smooth: 'Glätten',
      tool_rings: 'Kreise',
      tool_reset: 'Neu',
      sound_on: 'Ton an',
      sound_off: 'Ton aus',
      back: 'Zurück',
      dismiss: 'Loslegen',
    },
    en: {
      title: 'Zen Rings',
      tagline: 'Rake calming circles in fine sand',
      hint: 'Drag your finger or mouse through the sand',
      tool_rake: 'Rake',
      tool_pile: 'Mound',
      tool_smooth: 'Smooth',
      tool_rings: 'Rings',
      tool_reset: 'Reset',
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