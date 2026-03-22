// Este ficheiro é o "porteiro" da aplicação: configura tudo antes de abrir as portas.

const { PORT } = require('./config/env'); // 1. Valida variáveis PRIMEIRO
const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const taskRoutes = require('./routes/task.routes');
const { swaggerUi, especificacion, opcionesUI } = require('./config/swagger');

const app = express();

// ─── MIDDLEWARES GLOBAIS ──────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── ARQUIVOS ESTÁTICOS DO FRONTEND ──────────────────────────────────────────
// Estrutura do projeto:
//   taskflow-project/          ← PASTA_FRONTEND (2 níveis acima de server/src)
//   ├── index.html
//   ├── app.js
//   ├── i18n.js
//   ├── storage.js
//   └── server/
//       └── src/
//           └── index.js       ← __dirname aponta aqui
const PASTA_FRONTEND = path.join(__dirname, '..', '..');
app.use(express.static(PASTA_FRONTEND));

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ─── DOCUMENTAÇÃO SWAGGER ─────────────────────────────────────────────────────
// Acessível em http://localhost:3000/api/docs
// Permite testar todos os endpoints directamente no navegador
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(especificacion, opcionesUI));

// ─── ROTAS DA API ─────────────────────────────────────────────────────────────
// IMPORTANTE: as rotas da API devem vir ANTES do fallback SPA
app.use('/api/v1/tareas', taskRoutes);

// ─── MIDDLEWARE DE ERRO GLOBAL ────────────────────────────────────────────────
// SEMPRE antes do fallback SPA — 4 parâmetros obrigatórios
app.use((err, req, res, next) => {
  if (err.message === 'NO_ENCONTRADO') {
    return res.status(404).json({ error: 'Tarea no encontrada.' });
  }
  // Não vaza detalhes técnicos ao cliente
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

// ─── FALLBACK SPA ─────────────────────────────────────────────────────────────
// Express 5 exige '*path' em vez de '*'
app.get('*path', (req, res) => {
  res.sendFile(path.join(PASTA_FRONTEND, 'index.html'));
});

// Arranque local (ignorado no Vercel)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    console.log(`   Frontend  → http://localhost:${PORT}`);
    console.log(`   API       → http://localhost:${PORT}/api/v1/tareas`);
    console.log(`   API Docs  → http://localhost:${PORT}/api/docs`);
  });
}

// Exportação para Vercel (serverless)
module.exports = app;