import { config } from '../config';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

const logLevelMap: Record<string, LogLevel> = {
  error: LogLevel.ERROR,
  warn: LogLevel.WARN,
  info: LogLevel.INFO,
  debug: LogLevel.DEBUG,
};

const currentLogLevel = logLevelMap[config.log.level.toLowerCase()] || LogLevel.INFO;

function formatMessage(level: string, message: string, ...args: unknown[]): string {
  const timestamp = new Date().toISOString();
  const formattedArgs =
    args.length > 0 ? ` ${args.map((arg) => JSON.stringify(arg)).join(' ')}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${formattedArgs}`;
}

export const logger = {
  error: (message: string, ...args: unknown[]): void => {
    if (currentLogLevel >= LogLevel.ERROR) {
      console.error(formatMessage('error', message, ...args));
    }
  },

  warn: (message: string, ...args: unknown[]): void => {
    if (currentLogLevel >= LogLevel.WARN) {
      console.warn(formatMessage('warn', message, ...args));
    }
  },

  info: (message: string, ...args: unknown[]): void => {
    if (currentLogLevel >= LogLevel.INFO) {
      console.info(formatMessage('info', message, ...args));
    }
  },

  debug: (message: string, ...args: unknown[]): void => {
    if (currentLogLevel >= LogLevel.DEBUG) {
      console.debug(formatMessage('debug', message, ...args));
    }
  },
};
