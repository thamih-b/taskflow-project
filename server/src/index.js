const { PORT } = require('./config/env');
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

const PASTA_FRONTEND = path.join(__dirname, '..', '..');

// ─── ARQUIVOS ESTÁTICOS — só em desenvolvimento local ────────────────────────
// No Vercel os ficheiros estáticos são servidos directamente pela CDN
if (process.env.NODE_ENV !== 'production') {
  app.use(express.static(PASTA_FRONTEND));
}

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ─── DOCUMENTAÇÃO SWAGGER ─────────────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(especificacion, opcionesUI));

// ─── ROTAS DA API ─────────────────────────────────────────────────────────────
app.use('/api/v1/tareas', taskRoutes);

// ─── MIDDLEWARE DE ERRO GLOBAL ────────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err.message === 'NO_ENCONTRADO') {
    return res.status(404).json({ error: 'Tarea no encontrada.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

// ─── FALLBACK SPA — só em desenvolvimento local ───────────────────────────────
// No Vercel o vercel.json já trata o routing dos ficheiros estáticos
if (process.env.NODE_ENV !== 'production') {
  app.get('*path', (req, res) => {
    res.sendFile(path.join(PASTA_FRONTEND, 'index.html'));
  });
}

// ─── ARRANQUE LOCAL ───────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    console.log(`   Frontend  → http://localhost:${PORT}`);
    console.log(`   API       → http://localhost:${PORT}/api/v1/tareas`);
    console.log(`   API Docs  → http://localhost:${PORT}/api/docs`);
  });
}

module.exports = app;