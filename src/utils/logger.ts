import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define colors for each level
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

// Add colors to winston
winston.addColors(logColors);

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += ` | Meta: ${JSON.stringify(meta)}`;
    }
    
    // Add stack trace for errors
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    return log;
  })
);

// Create the logger
const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug'
    }),
    
    // File transport for all logs
    new DailyRotateFile({
      filename: path.join(logsDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: 'info'
    }),
    
    // Separate file for errors
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error'
    }),
    
    // Debug logs (only in development)
    ...(process.env.NODE_ENV !== 'production' ? [
      new DailyRotateFile({
        filename: path.join(logsDir, 'debug-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '10m',
        maxFiles: '7d',
        level: 'debug'
      })
    ] : [])
  ]
});

// Create a stream for HTTP logging (for express)
export const httpLogStream = {
  write: (message: string) => {
    logger.http(message.trim());
  }
};

// Helper functions for structured logging
export const logWebhook = (action: string, data: any, metadata?: any) => {
  logger.info(`Webhook ${action}`, {
    action,
    data: typeof data === 'object' ? JSON.stringify(data) : data,
    ...metadata
  });
};

export const logEvolutionAPI = (action: string, instanceId: string, data?: any, error?: any) => {
  const level = error ? 'error' : 'info';
  logger[level](`Evolution API ${action}`, {
    action,
    instanceId,
    data: data ? JSON.stringify(data) : undefined,
    error: error ? error.message : undefined
  });
};

export const logMessage = (direction: 'incoming' | 'outgoing', from: string, to: string, message: string, metadata?: any) => {
  logger.info(`Message ${direction}`, {
    direction,
    from,
    to,
    message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
    messageLength: message.length,
    ...metadata
  });
};

export const logError = (error: Error, context?: string, metadata?: any) => {
  logger.error(`${context ? `[${context}] ` : ''}${error.message}`, {
    error: error.message,
    stack: error.stack,
    context,
    ...metadata
  });
};

export default logger;