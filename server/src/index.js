// Este ficheiro é o "porteiro" da clínica: configura tudo antes de abrir as portas (segurança, recepção, sinalizações, etc).

const { PORT } = require('./config/env'); // 1. Valida variáveis PRIMEIRO
const express = require('express');
const cors = require('cors');
const taskRoutes = require('./routes/task.routes');

const app = express(); // cia a instância da app Express. É o objeto centra, tudo se registra nele.

// ─── MIDDLEWARES GLOBAIS ────────────────────────────────────────────────────
// Middleware: função que intercepta TODAS as requisições antes de chegar às rotas (app.use() registra um midleware global)
app.use(cors()); // Permite pedidos do frontend (porta 5500) para o servidor (porta 3000); Sem isto, o browser bloqueia pedidos por razões de segurança. O cors diz "aceito peddos desta origem"
app.use(express.json()); // Interpreta o body das requisições como JSON; Sem isto, req.body sera undefined. Este middleware lêo corpo do pedido e converte o JSON em objeto JavaScript.

// ─── ROTAS ──────────────────────────────────────────────────────────────────
// Monta o roteador de tarefas sob o prefixo /api/v1/tasks
app.use('/api/v1/tareas', taskRoutes);

// ─── MIDDLEWARE DE ERRO GLOBAL (4 parâmetros = Express identifica como handler de erro)
// DEVE ser o ÚLTIMO middleware registrado
app.use((err, req, res, next) => {
  // Mapeia erros semânticos do serviço para códigos HTTP
  if (err.message === 'NO_ENCONTRADO') {
    return res.status(404).json({ erro: 'Tarea no encontrada.' });
  }

  // Para qualquer outro erro desconhecido:
  // 1. Regista o erro completo no servidor (para debugging)
  console.error(err);
  // 2. Devolve mensagem genérica ao cliente (não expõe detalhes técnicos)
  res.status(500).json({ erro: 'Error interno del servidor.' });
});

// ─── ARRANQUE ───────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Servidor TaskFlow corriendo en http://localhost:${PORT}`);
});