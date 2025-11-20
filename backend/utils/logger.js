const { createLogger, format, transports } = require('winston');
const path = require('path');

// Determine log level based on environment
const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'warn' : 'info');

// Custom format for better readability
const customFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.printf(({ timestamp, level, message, stack }) => {
    if (stack) {
      return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
  })
);

// Create logger with environment-specific configuration
const logger = createLogger({
  level: logLevel,
  format: customFormat,
  transports: [
    // Console transport for all environments
    new transports.Console({
      format: format.combine(
        format.colorize(),
        customFormat
      )
    })
  ],
  // Don't exit on handled exceptions
  exitOnError: false
});

// In production, add file transports
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
  
  logger.add(
    new transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Helper to safely log in production (replaces console.log)
logger.debug = function(...args) {
  if (process.env.NODE_ENV !== 'production') {
    logger.info(args.join(' '));
  }
};

module.exports = logger;
