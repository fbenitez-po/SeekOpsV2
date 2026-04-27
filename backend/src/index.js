require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConexion } = require('./config/database');
const errorHandler = require('./middlewares/errorHandler');

const authRoutes = require('./routes/auth');
const timeEntryRoutes = require('./routes/timeEntries');
const userRoutes = require('./routes/users');
const clientRoutes = require('./routes/clients');
const projectRoutes = require('./routes/projects');
const configRoutes = require('./routes/config');

const app = express();
const PUERTO = process.env.PORT || 3000;

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/time-entries', timeEntryRoutes);
app.use('/users', userRoutes);
app.use('/clients', clientRoutes);
app.use('/projects', projectRoutes);
app.use('/config', configRoutes);

app.get('/health', (_req, res) => res.json({ estado: 'ok' }));

app.use(errorHandler);

async function iniciar() {
  await testConexion();
  app.listen(PUERTO, () => {
    console.log(`Servidor corriendo en puerto ${PUERTO}`);
  });
}

iniciar().catch((err) => {
  console.error('Error al iniciar el servidor:', err);
  process.exit(1);
});

module.exports = app;
