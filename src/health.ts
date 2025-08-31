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
}

export class HealthChecker {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
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

    return {
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
