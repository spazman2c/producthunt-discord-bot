import http from 'http';
import { logger } from './utils/logger';
import { healthChecker } from './health';

export class MonitoringServer {
  private server: http.Server | null = null;
  private port: number;

  constructor(port: number = 3000) {
    this.port = port;
  }

  /**
   * Start the monitoring server
   */
  start(): void {
    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    this.server.listen(this.port, () => {
      logger.info(`Monitoring server started on port ${this.port}`);
    });

    this.server.on('error', (error) => {
      logger.error('Monitoring server error:', error);
    });
  }

  /**
   * Stop the monitoring server
   */
  stop(): void {
    if (this.server) {
      this.server.close(() => {
        logger.info('Monitoring server stopped');
      });
      this.server = null;
    }
  }

  /**
   * Handle HTTP requests
   */
  private handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    const url = req.url || '/';
    const method = req.method || 'GET';

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    try {
      switch (url) {
        case '/health':
          this.handleHealthCheck(req, res);
          break;
        case '/status':
          this.handleStatusCheck(req, res);
          break;
        case '/metrics':
          this.handleMetrics(req, res);
          break;
        case '/':
          this.handleRoot(req, res);
          break;
        default:
          this.handleNotFound(req, res);
      }
    } catch (error) {
      logger.error('Error handling request:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  }

  /**
   * Handle health check endpoint
   */
  private handleHealthCheck(req: http.IncomingMessage, res: http.ServerResponse): void {
    const isHealthy = healthChecker.isHealthy();
    const statusCode = isHealthy ? 200 : 503;

    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: healthChecker.getUptime(),
    }));
  }

  /**
   * Handle detailed status endpoint
   */
  private handleStatusCheck(req: http.IncomingMessage, res: http.ServerResponse): void {
    const status = healthChecker.getHealthStatus();

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(status, null, 2));
  }

  /**
   * Handle metrics endpoint
   */
  private handleMetrics(req: http.IncomingMessage, res: http.ServerResponse): void {
    const status = healthChecker.getHealthStatus();
    
    // Format as Prometheus-style metrics
    const metrics = [
      `# HELP bot_uptime_seconds Bot uptime in seconds`,
      `# TYPE bot_uptime_seconds gauge`,
      `bot_uptime_seconds ${Math.floor(status.uptime / 1000)}`,
      '',
      `# HELP bot_memory_usage_bytes Bot memory usage in bytes`,
      `# TYPE bot_memory_usage_bytes gauge`,
      `bot_memory_usage_bytes ${status.memory.used * 1024 * 1024}`,
      '',
      `# HELP bot_memory_total_bytes Bot total memory in bytes`,
      `# TYPE bot_memory_total_bytes gauge`,
      `bot_memory_total_bytes ${status.memory.total * 1024 * 1024}`,
      '',
      `# HELP bot_health_status Bot health status (0=healthy, 1=degraded, 2=unhealthy)`,
      `# TYPE bot_health_status gauge`,
      `bot_health_status ${status.status === 'healthy' ? 0 : status.status === 'degraded' ? 1 : 2}`,
    ].join('\n');

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(metrics);
  }

  /**
   * Handle root endpoint
   */
  private handleRoot(req: http.IncomingMessage, res: http.ServerResponse): void {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      name: 'Product Hunt Top 5 Discord Bot',
      version: process.env.npm_package_version || '1.0.0',
      status: 'running',
      endpoints: {
        health: '/health',
        status: '/status',
        metrics: '/metrics',
      },
    }, null, 2));
  }

  /**
   * Handle 404 errors
   */
  private handleNotFound(req: http.IncomingMessage, res: http.ServerResponse): void {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Not found',
      message: `Endpoint ${req.url} not found`,
      availableEndpoints: ['/health', '/status', '/metrics'],
    }));
  }
}
