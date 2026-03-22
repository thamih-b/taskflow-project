const taskService = require('../services/task.service');

// Converte os valores de prioridade do frontend ('medium','high','low')
// para o formato interno do serviço ('media','alta','baja')
const MAPA_PRIORIDAD = {
  medium: 'media',
  high:   'alta',
  low:    'baja',
};

const taskController = {

  // GET /api/v1/tareas → 200 OK
  listarTareas(req, res) {
    const tareas = taskService.obtenerTodas();
    res.status(200).json(tareas);
  },

  // POST /api/v1/tareas → 201 Created
  crearTarea(req, res, next) {
    const { titulo, prioridad } = req.body;

    // Validação defensiva
    if (!titulo || typeof titulo !== 'string' || titulo.trim() === '') {
      return res.status(400).json({
        error: 'El campo "titulo" es obligatorio y no puede estar vacío.',
      });
    }

    try {
      // Aceita tanto 'medium'/'high'/'low' (frontend) quanto 'media'/'alta'/'baja' (interno)
      const prioridadNormalizada = MAPA_PRIORIDAD[prioridad] ?? prioridad ?? 'media';

      const nuevaTarea = taskService.crearTarea({
        titulo: titulo.trim(),
        prioridad: prioridadNormalizada,
      });
      res.status(201).json(nuevaTarea);
    } catch (err) {
      next(err);
    }
  },

  // DELETE /api/v1/tareas/:id → 204 No Content
  eliminarTarea(req, res, next) {
    const { id } = req.params;

    try {
      taskService.eliminarTarea(id);
      res.status(204).send();
    } catch (err) {
      next(err); // handler global converte 'NO_ENCONTRADO' → 404
    }
  },
};

module.exports = taskController;