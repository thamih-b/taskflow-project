// Persistência em memória (simulação de base de dados)

let tareas = [];
let siguienteId = 1;

const taskService = {

  obtenerTodas() {
    return tareas;
  },

  crearTarea(datos) {
    const nuevaTarea = {
      id: siguienteId++,
      titulo: datos.titulo,
      prioridad: datos.prioridad || 'media',
      completada: false,
      creadaEn: new Date().toISOString(),
    };
    tareas.push(nuevaTarea);
    return nuevaTarea;
  },

  eliminarTarea(id) {
    const indice = tareas.findIndex((t) => t.id === parseInt(id));

    if (indice === -1) {
      throw new Error('NO_ENCONTRADO');
    }

    const [eliminada] = tareas.splice(indice, 1);
    return eliminada;
  },
};

module.exports = taskService;