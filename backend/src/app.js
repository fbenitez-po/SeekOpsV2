require('dotenv').config();
const express = require('express');
const cors = require('cors');
const errorHandler = require('./middlewares/errorHandler');

const authRoutes = require('./routes/auth');
const timeEntryRoutes = require('./routes/timeEntries');
const userRoutes = require('./routes/users');
const clientRoutes = require('./routes/clients');
const projectRoutes = require('./routes/projects');
const configRoutes = require('./routes/config');
const projectionRoutes = require('./routes/projections');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/time-entries', timeEntryRoutes);
app.use('/users', userRoutes);
app.use('/clients', clientRoutes);
app.use('/projects', projectRoutes);
app.use('/config', configRoutes);
app.use('/projections', projectionRoutes);

app.get('/health', (_req, res) => res.json({ estado: 'ok' }));

app.use(errorHandler);

module.exports = app;
