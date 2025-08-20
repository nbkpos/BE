const { createLogger, format, transports } = require('winston');
const { combine, timestamp, json, colorize, printf } = format;

const devFormat = printf(({ level, message, timestamp, ...meta }) => {
  return `${timestamp} [${level}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
});

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(timestamp(), json()),
  transports: [
    new transports.Console({
      format: process.env.NODE_ENV === 'production' ? combine(timestamp(), json()) : combine(colorize(), timestamp(), devFormat)
    })
  ]
});

logger.stream = {
  write: (message) => logger.info(message.trim())
};

module.exports = logger;
