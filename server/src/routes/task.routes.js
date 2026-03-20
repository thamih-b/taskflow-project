const { Router } = require('express');
const taskController = require('../controllers/task.controller');

const router = Router();

// Mapeia: verbo HTTP + caminho → método do controlador
router.get('/', taskController.listarTareas);
router.post('/', taskController.crearTarea);
router.delete('/:id', taskController.eliminarTarea);

module.exports = router;