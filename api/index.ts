import { VercelRequest, VercelResponse } from '@vercel/node';
import { healthChecker } from '../src/health';

// Health checker is already initialized as a singleton

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = req.url || '/';
  const method = req.method || 'GET';

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    switch (url) {
      case '/health':
        handleHealthCheck(req, res);
        break;
      case '/status':
        handleStatusCheck(req, res);
        break;
      case '/metrics':
        handleMetrics(req, res);
        break;
      case '/':
        handleRoot(req, res);
        break;
      default:
        handleNotFound(req, res);
    }
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

function handleHealthCheck(req: VercelRequest, res: VercelResponse) {
  const isHealthy = healthChecker.isHealthy();
  const statusCode = isHealthy ? 200 : 503;

  res.status(statusCode).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: healthChecker.getUptime(),
  });
}

function handleStatusCheck(req: VercelRequest, res: VercelResponse) {
  const status = healthChecker.getHealthStatus();
  res.status(200).json(status);
}

function handleMetrics(req: VercelRequest, res: VercelResponse) {
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

  res.setHeader('Content-Type', 'text/plain');
  res.status(200).send(metrics);
}

function handleRoot(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    name: 'Product Hunt Top 5 Discord Bot',
    version: process.env.npm_package_version || '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      status: '/status',
      metrics: '/metrics',
    },
  });
}

function handleNotFound(req: VercelRequest, res: VercelResponse) {
  res.status(404).json({
    error: 'Not found',
    message: `Endpoint ${req.url} not found`,
    availableEndpoints: ['/health', '/status', '/metrics'],
  });
}
