const storageManager = {
  TASKS_KEY: 'organizator-tasks',
  LANG_KEY: 'organizator-lang',
  THEME_KEY: 'theme',
  ACTIVE_TAB_KEY: 'organizator-active-tab',

  loadActiveTab(defaultTab = 'manual') {
    return localStorage.getItem(this.ACTIVE_TAB_KEY) || defaultTab;
  },
  saveActiveTab(tab) {
    try { localStorage.setItem(this.ACTIVE_TAB_KEY, tab); } catch {}
  },
  loadTasks() {
    try {
      const raw = localStorage.getItem(this.TASKS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },
  saveTasks(tasks) {
    try { localStorage.setItem(this.TASKS_KEY, JSON.stringify(tasks)); } catch {}
  },
  loadLanguage(defaultLang = 'es') {
    return localStorage.getItem(this.LANG_KEY) || defaultLang;
  },
  saveLanguage(lang) {
    try { localStorage.setItem(this.LANG_KEY, lang); } catch {}
  },
  loadTheme(defaultTheme = 'light') {
    return localStorage.getItem(this.THEME_KEY) || defaultTheme;
  },
  saveTheme(theme) {
    try { localStorage.setItem(this.THEME_KEY, theme); } catch {}
  }
};
