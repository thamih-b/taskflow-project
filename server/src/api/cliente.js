// ─── clienteApi — Comunicação com o backend REST ─────────────────────────────
// Localização: server/src/api/cliente.js
//
// URL absoluta garante que o fetch sempre chega ao servidor Express
// independente de como o frontend é aberto (Live Server, file://, etc.)
// BUG CORRIGIDO: URL relativa '/api/v1' resolvia para a porta errada
const clienteApi = {
  BASE_URL: 'http://localhost:3000/api/v1',

  // Converte prioridade do servidor ('media','alta','baja') para o frontend ('medium','high','low')
  _normalizarPrioridad(p) {
    const mapa = { media: 'medium', alta: 'high', baja: 'low' };
    return mapa[p] ?? p ?? 'medium';
  },

  // Normaliza todos os campos do servidor para o formato interno do frontend
  _normalizarTarea(datos) {
    return {
      id:                String(datos.id ?? datos._id ?? Date.now()),
      text:              datos.text     ?? datos.titulo    ?? '',
      priority:          this._normalizarPrioridad(datos.priority ?? datos.prioridad),
      completed:         datos.completed ?? datos.completada ?? false,
      category:          datos.category  ?? datos.categoria  ?? 'General',
      subtasks:          datos.subtasks  ?? [],
      due_date:          datos.due_date  ?? null,
      due_date_has_time: datos.due_date_has_time ?? false,
      due_date_end:      datos.due_date_end ?? null,
    };
  },

  async _solicitar(ruta, opciones = {}) {
    const respuesta = await fetch(`${this.BASE_URL}${ruta}`, {
      headers: { 'Content-Type': 'application/json' },
      ...opciones,
    });
    if (!respuesta.ok) {
      const mensaje = await respuesta.text().catch(() => respuesta.statusText);
      throw new Error(`Error ${respuesta.status}: ${mensaje}`);
    }
    // DELETE devuelve 204 sin cuerpo
    if (respuesta.status === 204) return null;
    return respuesta.json();
  },

  async listarTareas() {
    const datos = await this._solicitar('/tareas');
    return Array.isArray(datos) ? datos.map(t => this._normalizarTarea(t)) : [];
  },

  async crearTarea({ titulo, prioridad, categoria, fecha_limite, fecha_limite_con_hora }) {
    const datos = await this._solicitar('/tareas', {
      method: 'POST',
      body: JSON.stringify({ titulo, prioridad, categoria, fecha_limite, fecha_limite_con_hora }),
    });
    return this._normalizarTarea(datos);
  },

  async actualizarTarea(id, cambios) {
    const datos = await this._solicitar(`/tareas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cambios),
    });
    return this._normalizarTarea(datos);
  },

  async eliminarTarea(id) {
    return this._solicitar(`/tareas/${id}`, { method: 'DELETE' });
  },
};