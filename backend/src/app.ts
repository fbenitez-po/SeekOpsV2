import express from 'express';
import cors from 'cors';
import { env } from './shared/config/env';
import { errorHandler } from './shared/http/errorHandler';
import clientRoutes from './modules/clients/clients.routes';
import configRoutes from './modules/config/config.routes';
import userRoutes from './modules/users/users.routes';
import projectRoutes from './modules/projects/projects.routes';
import projectionRoutes from './modules/projections/projections.routes';
import timeEntryRoutes from './modules/timeEntries/timeEntries.routes';
import periodsRoutes from './modules/finance/periods/periods.routes';
import revenuesRoutes from './modules/finance/revenues/revenues.routes';
import adminExpensesRoutes from './modules/finance/adminExpenses/adminExpenses.routes';
import salesCostsRoutes from './modules/finance/salesCosts/salesCosts.routes';
import personnelCostsRoutes from './modules/finance/personnelCosts/personnelCosts.routes';
import commercialRoutes from './modules/commercial/commercial.routes';
import authRoutes from './modules/auth/auth.routes';

const app = express();

app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/time-entries', timeEntryRoutes);
app.use('/users', userRoutes);
app.use('/clients', clientRoutes);
app.use('/projects', projectRoutes);
app.use('/config', configRoutes);
app.use('/projections', projectionRoutes);
app.use('/periods', periodsRoutes);
app.use('/revenues', revenuesRoutes);
app.use('/admin-expenses', adminExpensesRoutes);
app.use('/sales-costs', salesCostsRoutes);
app.use('/personnel-costs', personnelCostsRoutes);
app.use('/commercial', commercialRoutes);

app.get('/health', (_req, res) => res.json({ estado: 'ok' }));

app.use(errorHandler);

export default app;
