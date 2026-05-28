import express from 'express';
import cors from 'cors';
import { env } from './shared/config/env';
import { httpLogger } from './shared/logging/httpLogger';
import { errorHandler, notFoundHandler } from './shared/http/errorHandler';
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
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import { mountDocs } from './shared/openapi';

const app = express();

app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json());
app.use(httpLogger);

app.get('/health', (_req, res) => res.json({ estado: 'ok' }));

mountDocs(app);

const api = express.Router();

api.use('/auth', authRoutes);
api.use('/time-entries', timeEntryRoutes);
api.use('/users', userRoutes);
api.use('/clients', clientRoutes);
api.use('/projects', projectRoutes);
api.use('/config', configRoutes);
api.use('/projections', projectionRoutes);
api.use('/periods', periodsRoutes);
api.use('/revenues', revenuesRoutes);
api.use('/admin-expenses', adminExpensesRoutes);
api.use('/sales-costs', salesCostsRoutes);
api.use('/personnel-costs', personnelCostsRoutes);
api.use('/commercial', commercialRoutes);
// Superficie de integración externa (BI), read-only y abierta. Sin auth a nivel
// de módulo: cada sub-recurso define su acceso (hoy todos abiertos, como v1).
api.use('/dashboard', dashboardRoutes);

app.use(env.API_PREFIX, api);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
