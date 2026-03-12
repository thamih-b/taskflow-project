const storageManager = {
  TASKS_KEY: 'organizator-tasks',
  LANG_KEY: 'organizator-lang',
  THEME_KEY: 'theme',

  loadTasks() {
    try {
      const raw = localStorage.getItem(this.TASKS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveTasks(tasks) {
    try {
      localStorage.setItem(this.TASKS_KEY, JSON.stringify(tasks));
    } catch {
      // ignore quota / storage errors
    }
  },

  loadLanguage(defaultLang = 'es') {
    const saved = localStorage.getItem(this.LANG_KEY);
    return saved || defaultLang;
  },

  saveLanguage(lang) {
    try {
      localStorage.setItem(this.LANG_KEY, lang);
    } catch {
      // ignore
    }
  },

  loadTheme(defaultTheme = 'light') {
    return localStorage.getItem(this.THEME_KEY) || defaultTheme;
  },

  saveTheme(theme) {
    try {
      localStorage.setItem(this.THEME_KEY, theme);
    } catch {
      // ignore
    }
  }
};

