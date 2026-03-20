const taskService = require('../services/task.service');

const taskController = {

  // GET /api/v1/tasks → 200 OK
  listarTareas(req, res) {
    const tareas = taskService.obtenerTodas();
    res.status(200).json(tareas);
  },

  // POST /api/v1/tasks → 201 Created
  crearTarea(req, res, next) {
    const { titulo } = req.body;

    // VALIDAÇÃO DEFENSIVA — nunca confies nos dados do cliente
    if (!titulo || typeof titulo !== 'string' || titulo.trim() === '') {
      return res.status(400).json({
        erro: 'El campo "titulo" es obligatorio y no puede estar vacío.',
      });
    }

    try {
      const nuevaTarea = taskService.crearTarea({
        texto: texto.trim(),
        prioridade: req.body.prioridade,
      });
      res.status(201).json(nuevaTarea); // 201 = Created
    } catch (err) {
      next(err); // Passa o erro ao middleware global
    }
  },

  // DELETE /api/v1/tasks/:id → 204 No Content
  eliminarTarea(req, res, next) {
    const { id } = req.params;

    try {
      taskService.eliminarTarea(id);
      res.status(204).send(); // 204 = No Content (sucesso sem corpo)
    } catch (err) {
      next(err); // O middleware global trata o 'NOT_FOUND' ou em espanhol vai ser No_ENCONTRADO
    }
  },
};

module.exports = taskController;