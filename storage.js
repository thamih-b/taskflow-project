// ─── storageManager — Preferências de interface do usuário ───────────────────
// REQ. LABORATÓRIO: "Elimina cualquier rastro de persistencia local (LocalStorage)"
// As tarefas agora vêm EXCLUSIVAMENTE do backend via clienteApi.
// O localStorage só persiste preferências de UI: idioma, tema e aba ativa.
const storageManager = {
  CLAVE_IDIOMA: 'organizator-lang',
  CLAVE_TEMA:   'theme',
  CLAVE_TAB:    'organizator-active-tab',

  cargarTabActiva(porDefecto = 'manual') {
    return localStorage.getItem(this.CLAVE_TAB) || porDefecto;
  },
  guardarTabActiva(tab) {
    try { localStorage.setItem(this.CLAVE_TAB, tab); } catch {}
  },

  cargarIdioma(porDefecto = 'es') {
    return localStorage.getItem(this.CLAVE_IDIOMA) || porDefecto;
  },
  guardarIdioma(idioma) {
    try { localStorage.setItem(this.CLAVE_IDIOMA, idioma); } catch {}
  },

  cargarTema(porDefecto = 'light') {
    return localStorage.getItem(this.CLAVE_TEMA) || porDefecto;
  },
  guardarTema(tema) {
    try { localStorage.setItem(this.CLAVE_TEMA, tema); } catch {}
  },
};