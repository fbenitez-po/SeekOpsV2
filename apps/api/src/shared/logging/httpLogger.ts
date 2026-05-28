import { pinoHttp } from 'pino-http';
import { randomUUID } from 'node:crypto';
import { logger } from './logger';

export const httpLogger = pinoHttp({
  logger,
  // Reuse an incoming x-request-id when present (cross-service correlation),
  // otherwise generate one. Echo it back on the response.
  genReqId: (req, res) => {
    const incoming = req.headers['x-request-id'];
    const id = (Array.isArray(incoming) ? incoming[0] : incoming) || randomUUID();
    res.setHeader('x-request-id', id);
    return id;
  },
  customLogLevel: (req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    if (req.url === '/health') return 'debug';
    return 'info';
  },
  // The errorHandler logs the actual error object; keep the request line terse
  // so a 500 produces one error event with context, not a duplicated stack.
  customSuccessMessage: () => 'request completed',
  customErrorMessage: () => 'request errored',
});
