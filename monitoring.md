# Monitoring & Deployment Guide

## Deployment Status

The Product Hunt Discord Bot is now ready for deployment to Vercel with comprehensive monitoring.

## Health Check Endpoints

Once deployed, the bot provides the following monitoring endpoints:

### Basic Health Check
```
GET /health
```
Returns simple health status for load balancers:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": "2h 15m 30s"
}
```

### Detailed Status
```
GET /status
```
Returns comprehensive system status:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 8130000,
  "version": "1.0.0",
  "environment": "production",
  "timezone": {
    "phTimezone": "America/Los_Angeles",
    "botTimezone": "America/New_York",
    "phCurrentTime": "2025-01-15T07:30:00.000-08:00",
    "botCurrentTime": "2025-01-15T10:30:00.000-05:00"
  },
  "memory": {
    "used": 45,
    "total": 128,
    "percentage": 35
  },
  "config": {
    "phApiUrl": "https://api.producthunt.com/v2/api/graphql",
    "discordChannelId": "123456789",
    "fetchTime": "07:00",
    "pollInterval": 180
  }
}
```

### Metrics (Prometheus Format)
```
GET /metrics
```
Returns metrics in Prometheus format for monitoring systems:
```
# HELP bot_uptime_seconds Bot uptime in seconds
# TYPE bot_uptime_seconds gauge
bot_uptime_seconds 8130

# HELP bot_memory_usage_bytes Bot memory usage in bytes
# TYPE bot_memory_usage_bytes gauge
bot_memory_usage_bytes 47185920

# HELP bot_memory_total_bytes Bot total memory in bytes
# TYPE bot_memory_total_bytes gauge
bot_memory_total_bytes 134217728

# HELP bot_health_status Bot health status (0=healthy, 1=degraded, 2=unhealthy)
# TYPE bot_health_status gauge
bot_health_status 0
```

## Deployment to Vercel

### Prerequisites
1. GitHub repository connected to Vercel
2. Environment variables configured in Vercel dashboard
3. Vercel CLI installed (optional)

### Environment Variables
Configure these in your Vercel project settings:

| Variable | Description | Required |
|----------|-------------|----------|
| `PH_TOKEN` | Product Hunt API token | Yes |
| `DISCORD_TOKEN` | Discord bot token | Yes |
| `DISCORD_CHANNEL_ID` | Discord channel ID | Yes |
| `PH_TIMEZONE` | Product Hunt timezone | No (default: America/Los_Angeles) |
| `BOT_TIMEZONE` | Bot timezone | No (default: America/New_York) |
| `FETCH_AT_LOCAL` | Daily fetch time | No (default: 07:00) |
| `POLL_SECONDS` | Polling interval | No (default: 180) |
| `LOG_LEVEL` | Logging level | No (default: info) |

### Deployment Steps

#### Option 1: Automatic Deployment (Recommended)
1. Push to GitHub main branch
2. Vercel automatically deploys
3. Monitor deployment in Vercel dashboard

#### Option 2: Manual Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Option 3: Using Deployment Script
```bash
# Make script executable
chmod +x scripts/deploy.sh

# Run deployment
./scripts/deploy.sh
```

## Monitoring Setup

### Vercel Analytics
- Enable Vercel Analytics in project settings
- Monitor function execution times
- Track error rates and performance

### External Monitoring
Set up monitoring for the health endpoints:

#### Uptime Monitoring
- **Service**: UptimeRobot, Pingdom, or similar
- **URL**: `https://your-app.vercel.app/health`
- **Expected**: 200 status code
- **Frequency**: Every 5 minutes

#### Metrics Collection
- **Service**: Prometheus, Grafana, or similar
- **URL**: `https://your-app.vercel.app/metrics`
- **Frequency**: Every 30 seconds

### Alerting Rules

#### Critical Alerts
- Health check returns 503 (unhealthy)
- Memory usage > 90%
- Uptime < 99%

#### Warning Alerts
- Memory usage > 75%
- Response time > 5 seconds
- Error rate > 5%

## Troubleshooting

### Common Deployment Issues

#### Build Failures
```bash
# Check TypeScript compilation
npm run build

# Check for missing dependencies
npm install

# Verify environment variables
node -e "console.log(require('./src/config').config)"
```

#### Runtime Errors
```bash
# Check logs in Vercel dashboard
# Or use Vercel CLI
vercel logs

# Test locally with environment variables
npm run dev
```

#### Health Check Failures
1. Check if bot is running: `GET /status`
2. Verify environment variables are set
3. Check Discord bot permissions
4. Verify Product Hunt API access

### Debug Commands

#### Local Testing
```bash
# Test with debug logging
LOG_LEVEL=debug npm start

# Test individual components
npm run test:ph
npm run test:discord
npm run test:state
npm run test:scheduler
```

#### Production Debugging
```bash
# Check Vercel function logs
vercel logs

# Test health endpoints
curl https://your-app.vercel.app/health
curl https://your-app.vercel.app/status
curl https://your-app.vercel.app/metrics
```

## Performance Monitoring

### Key Metrics to Track
- **Uptime**: Should be > 99.9%
- **Memory Usage**: Should be < 75%
- **Response Time**: Health checks < 1 second
- **Error Rate**: Should be < 1%

### Optimization Tips
- Monitor memory usage patterns
- Adjust polling intervals based on activity
- Review logs for performance bottlenecks
- Consider scaling if needed

## Security Considerations

### Environment Variables
- Never commit tokens to Git
- Use Vercel's encrypted environment variables
- Rotate tokens regularly
- Use least privilege principle

### Network Security
- All API calls use HTTPS
- Validate all inputs
- Implement rate limiting
- Monitor for suspicious activity

## Backup & Recovery

### State Backup
- Cache files are automatically backed up
- State persists across deployments
- Recovery happens automatically on restart

### Rollback Procedure
1. Revert to previous Git commit
2. Push to trigger new deployment
3. Monitor health endpoints
4. Verify bot functionality

## Support & Maintenance

### Regular Maintenance
- Monitor health endpoints daily
- Review logs weekly
- Update dependencies monthly
- Test full workflow monthly

### Emergency Procedures
1. Check health status immediately
2. Review recent logs for errors
3. Verify environment variables
4. Restart if necessary
5. Contact support if issues persist
