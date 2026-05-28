import pino from 'pino';
import { env } from '../config/env';

const isTest = env.NODE_ENV === 'test';
const isDev = env.NODE_ENV === 'development';

// Never write secrets to the logs, even if a whole object is logged by mistake.
const redactPaths = [
  'req.headers.authorization',
  'password',
  '*.password',
  'access_token',
  '*.access_token',
  'refresh_token',
  '*.refresh_token',
];

export const logger = pino({
  level: isTest ? 'silent' : env.LOG_LEVEL,
  redact: { paths: redactPaths, censor: '[REDACTED]' },
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: { translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
        },
      }
    : {}),
});
