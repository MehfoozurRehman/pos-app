import type { Log } from '../types';
import crypto from 'crypto';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private dbInstance: any = null;
  private logQueue: Log[] = [];
  private isProcessing = false;
  private cleanupInterval: NodeJS.Timeout | null = null;

  setDbInstance(db: any) {
    this.dbInstance = db;
    this.processQueue();
    this.startPeriodicCleanup();
    this.cleanup().catch(error => {
      console.error('Initial log cleanup failed:', error);
    });
  }

  private generateId(): string {
    return 'log_' + crypto.randomBytes(8).toString('hex');
  }

  private async processQueue() {
    if (this.isProcessing || !this.dbInstance || this.logQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.logQueue.length > 0) {
        const log = this.logQueue.shift()!;
        if (!this.dbInstance.data.logs) {
          this.dbInstance.data.logs = [];
        }
        this.dbInstance.data.logs.push(log);
        await this.dbInstance.write();
      }
    } catch (error) {
      console.error('Failed to write logs to database:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async addLog(level: LogLevel, message: string, context?: string, data?: any) {
    const log: Log = {
      id: this.generateId(),
      level,
      message,
      context,
      data,
      timestamp: new Date().toISOString(),
      source: 'main'
    };

    this.logQueue.push(log);
    this.processQueue();
  }

  info(message: string, context?: string, data?: any) {
    this.addLog('info', message, context, data);
  }

  warn(message: string, context?: string, data?: any) {
    this.addLog('warn', message, context, data);
  }

  error(message: string, context?: string, data?: any) {
    this.addLog('error', message, context, data);
  }

  debug(message: string, context?: string, data?: any) {
    this.addLog('debug', message, context, data);
  }

  async cleanup(daysToKeep: number = 30) {
    if (!this.dbInstance) return;

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      if (!this.dbInstance.data.logs) {
        this.dbInstance.data.logs = [];
        return;
      }

      const initialCount = this.dbInstance.data.logs.length;
      this.dbInstance.data.logs = this.dbInstance.data.logs.filter(
        (log: Log) => new Date(log.timestamp) > cutoffDate
      );
      
      const removedCount = initialCount - this.dbInstance.data.logs.length;
      if (removedCount > 0) {
        await this.dbInstance.write();
        this.info(`Cleaned up ${removedCount} old log entries`, 'logger-cleanup', { removedCount, daysToKeep });
      }
    } catch (error) {
      console.error('Failed to cleanup logs:', error);
    }
  }

  private startPeriodicCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup().catch(error => {
        console.error('Periodic log cleanup failed:', error);
      });
    }, 24 * 60 * 60 * 1000);
  }

  stopPeriodicCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

export const logger = new Logger();