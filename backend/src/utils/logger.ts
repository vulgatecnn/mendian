import pino from 'pino';
import { appConfig, isDevelopment } from '@/config/index.js';

export const logger = pino({
  level: appConfig.LOG_LEVEL,
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
        colorize: true,
      },
    },
  }),
  ...(!isDevelopment && {
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label.toUpperCase() }),
    },
  }),
});

export default logger;