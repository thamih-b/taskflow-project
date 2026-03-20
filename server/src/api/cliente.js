// src/api/cliente.js
const URL_BASE = 'http://localhost:3000/api/v1';

const clienteApi = {

  async listarTareas() {
    const respuesta = await fetch(`${URL_BASE}/tareas`);
    if (!respuesta.ok) throw new Error(`Error del servidor: ${respuesta.status}`);
    return respuesta.json();
  },

  async crearTarea(datos) {
    const respuesta = await fetch(`${URL_BASE}/tareas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    });
    if (!respuesta.ok) {
      const error = await respuesta.json();
      throw new Error(error.error || 'Error al crear tarea');
    }
    return respuesta.json();
  },

  async eliminarTarea(id) {
    const respuesta = await fetch(`${URL_BASE}/tareas/${id}`, {
      method: 'DELETE',
    });
    if (!respuesta.ok) {
      const error = await respuesta.json();
      throw new Error(error.error || 'Error al eliminar tarea');
    }
  },
};