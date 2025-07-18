type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private config: LoggerConfig = {
    enabled: __DEV__ && process.env.NODE_ENV !== 'test',
    level: 'debug',
  };

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
  }

  private formatMessage(level: LogLevel, context: string, message: string, ...args: any[]): void {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${context}]`;

    switch (level) {
      case 'debug':
        console.log(`🔍 ${prefix}`, message, ...args);
        break;
      case 'info':
        console.log(`ℹ️ ${prefix}`, message, ...args);
        break;
      case 'warn':
        console.warn(`⚠️ ${prefix}`, message, ...args);
        break;
      case 'error':
        console.error(`❌ ${prefix}`, message, ...args);
        break;
    }
  }

  debug(context: string, message: string, ...args: any[]): void {
    this.formatMessage('debug', context, message, ...args);
  }

  info(context: string, message: string, ...args: any[]): void {
    this.formatMessage('info', context, message, ...args);
  }

  warn(context: string, message: string, ...args: any[]): void {
    this.formatMessage('warn', context, message, ...args);
  }

  error(context: string, message: string, ...args: any[]): void {
    this.formatMessage('error', context, message, ...args);
  }

  group(label: string): void {
    if (this.config.enabled) {
      console.group(label);
    }
  }

  groupEnd(): void {
    if (this.config.enabled) {
      console.groupEnd();
    }
  }

  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  setLevel(level: LogLevel): void {
    this.config.level = level;
  }
}

export const logger = new Logger();