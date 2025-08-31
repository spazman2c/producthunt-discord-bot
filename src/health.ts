import { logger } from './utils/logger';
import { config } from './config';
import { TimezoneManager } from './utils/timezone';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  timezone: {
    phTimezone: string;
    botTimezone: string;
    phCurrentTime: string;
    botCurrentTime: string;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  config: {
    phApiUrl: string;
    discordChannelId: string;
    fetchTime: string;
    pollInterval: number;
  };
  scheduler?: {
    isRunning: boolean;
    currentDate?: string;
    totalPolls?: number;
    lastPollTime?: string;
    nextPollDelay?: number;
  };
}

export class HealthChecker {
  private startTime: number;
  private scheduler: any = null;

  constructor() {
    this.startTime = Date.now();
  }

  setScheduler(scheduler: any): void {
    this.scheduler = scheduler;
  }

  /**
   * Get comprehensive health status
   */
  getHealthStatus(): HealthStatus {
    const timezoneManager = new TimezoneManager();
    const timezoneInfo = timezoneManager.getTimezoneInfo();
    
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const memoryPercentage = (usedMemory / totalMemory) * 100;

    const baseStatus = {
      status: this.determineHealthStatus(memoryPercentage),
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timezone: {
        phTimezone: timezoneInfo.phTimezone,
        botTimezone: timezoneInfo.botTimezone,
        phCurrentTime: timezoneInfo.phCurrentTime,
        botCurrentTime: timezoneInfo.botCurrentTime,
      },
      memory: {
        used: Math.round(usedMemory / 1024 / 1024), // MB
        total: Math.round(totalMemory / 1024 / 1024), // MB
        percentage: Math.round(memoryPercentage),
      },
      config: {
        phApiUrl: config.productHunt.apiUrl,
        discordChannelId: config.discord.channelId,
        fetchTime: config.time.fetchAtLocal,
        pollInterval: config.time.pollSeconds,
      },
    };

    // Add scheduler status if available
    if (this.scheduler) {
      try {
        const schedulerStatus = this.scheduler.getStatus();
        (baseStatus as any).scheduler = {
          isRunning: schedulerStatus.isRunning,
          currentDate: schedulerStatus.currentSchedule?.date,
          totalPolls: schedulerStatus.currentSchedule?.totalPolls,
          lastPollTime: schedulerStatus.currentSchedule?.lastPollTime?.toISO(),
          nextPollDelay: schedulerStatus.nextPollDelay,
        };
      } catch (error) {
        logger.error('Error getting scheduler status:', error);
      }
    }

    return baseStatus;
  }

  /**
   * Determine health status based on metrics
   */
  private determineHealthStatus(memoryPercentage: number): 'healthy' | 'unhealthy' | 'degraded' {
    if (memoryPercentage > 90) {
      return 'unhealthy';
    } else if (memoryPercentage > 75) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  /**
   * Simple health check for load balancers
   */
  isHealthy(): boolean {
    const status = this.getHealthStatus();
    return status.status === 'healthy';
  }

  /**
   * Get uptime in human readable format
   */
  getUptime(): string {
    const uptime = Date.now() - this.startTime;
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

// Export singleton instance
export const healthChecker = new HealthChecker();
