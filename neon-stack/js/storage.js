const Storage = {
  _mem: {},

  get(key) {
    try {
      const v = localStorage.getItem(key);
      if (v != null) return v;
    } catch (_) {}
    return this._mem[key] ?? null;
  },

  set(key, value) {
    this._mem[key] = value;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (_) {
      return false;
    }
  },
};