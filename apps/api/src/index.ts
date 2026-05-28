import app from './app';
import { env } from './shared/config/env';
import { logger } from './shared/logging/logger';

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'server listening');
});
