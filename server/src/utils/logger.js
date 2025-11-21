import winston from 'winston';

const { combine, timestamp, json, printf } = winston.format;

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(timestamp(), json()),
  defaultMeta: { service: 'restaurant-server' },
  transports: [new winston.transports.Console({ level: process.env.LOG_LEVEL || 'info' })],
});

export function childLogger(meta = {}) {
  return logger.child(meta);
}

export default logger;
