// Logger utility for consistent logging
// This can be configured to turn off logs in production or send to a monitoring service

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Set environment-specific logging level
const LOG_LEVEL: LogLevel = process.env.NODE_ENV === 'production' ? 'warn' : 'debug';

// Determine if a log level should be shown based on configured level
const shouldLog = (level: LogLevel): boolean => {
  const levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };
  
  return levels[level] >= levels[LOG_LEVEL];
};

const logger = {
  debug: (...args: any[]) => {
    if (shouldLog('debug')) {
      console.log('[DEBUG]', ...args);
    }
  },
  
  info: (...args: any[]) => {
    if (shouldLog('info')) {
      console.info('[INFO]', ...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (shouldLog('warn')) {
      console.warn('[WARN]', ...args);
    }
  },
  
  error: (...args: any[]) => {
    if (shouldLog('error')) {
      console.error('[ERROR]', ...args);
    }
  }
};

export default logger; 