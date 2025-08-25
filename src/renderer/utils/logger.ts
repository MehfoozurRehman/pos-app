type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class RendererLogger {
  private async sendLog(level: LogLevel, message: string, context?: string, data?: any) {
    try {
      await window.api.log.create({
        level,
        message,
        context,
        data,
        timestamp: new Date().toISOString(),
        source: 'renderer' as const
      });
    } catch (error) {
      console.error('Failed to send log to main process:', error);
      console[level](`[${level.toUpperCase()}] ${context ? `[${context}] ` : ''}${message}`, data);
    }
  }

  info(message: string, context?: string, data?: any) {
    this.sendLog('info', message, context, data);
  }

  warn(message: string, context?: string, data?: any) {
    this.sendLog('warn', message, context, data);
  }

  error(message: string, context?: string, data?: any) {
    this.sendLog('error', message, context, data);
  }

  debug(message: string, context?: string, data?: any) {
    this.sendLog('debug', message, context, data);
  }
}

export const logger = new RendererLogger();