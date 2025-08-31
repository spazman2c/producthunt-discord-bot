# Vercel Deployment Guide

## Quick Deployment Steps

### 1. Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Select the repository containing this bot

### 2. Configure Environment Variables

In your Vercel project settings, add these environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `PH_TOKEN` | Product Hunt API token | ✅ Yes |
| `DISCORD_TOKEN` | Discord bot token | ✅ Yes |
| `DISCORD_CHANNEL_ID` | Discord channel ID | ✅ Yes |
| `PH_TIMEZONE` | Product Hunt timezone | No (default: America/Los_Angeles) |
| `BOT_TIMEZONE` | Bot timezone | No (default: America/New_York) |
| `FETCH_AT_LOCAL` | Daily fetch time | No (default: 07:00) |
| `POLL_SECONDS` | Polling interval | No (default: 180) |
| `LOG_LEVEL` | Logging level | No (default: info) |

### 3. Deploy

1. Click "Deploy" in Vercel
2. Wait for the build to complete
3. Check the deployment logs for any errors

### 4. Test the Deployment

Once deployed, test the endpoints:

```bash
# Health check
curl https://your-app.vercel.app/health

# Status check
curl https://your-app.vercel.app/status

# Start the bot
curl -X POST https://your-app.vercel.app/api/bot
```

## Deployment Structure

### API Endpoints

- **`/health`** - Basic health check
- **`/status`** - Detailed system status
- **`/metrics`** - Prometheus metrics
- **`/api/bot`** - Bot control endpoint (POST)

### File Structure

```
api/
├── index.ts    # Health check endpoints
└── bot.ts      # Bot runner
src/
├── config/     # Configuration
├── services/   # Business logic
├── types/      # TypeScript types
├── utils/      # Utilities
└── index.ts    # Main application
```

## Troubleshooting

### Common Issues

#### Build Failures
- Check that all environment variables are set
- Verify TypeScript compilation works locally
- Check Vercel build logs for specific errors

#### Runtime Errors
- Check Vercel function logs
- Verify API tokens are valid
- Test endpoints individually

#### Bot Not Starting
- Check Discord bot permissions
- Verify channel ID is correct
- Test Product Hunt API access

### Debug Commands

```bash
# Test locally
npm run build
npm start

# Test individual components
npm run test:ph
npm run test:discord
npm run test:state

# Check Vercel logs
vercel logs
```

## Monitoring

### Health Checks
Set up monitoring for:
- `https://your-app.vercel.app/health`
- Expected: 200 OK response

### Bot Status
Monitor bot activity:
- Check Discord channel for posts
- Review Vercel function logs
- Monitor API usage

## Alternative Deployment

If Vercel continues to have issues, consider:

1. **Railway**: Good for long-running processes
2. **Heroku**: Traditional hosting with good Node.js support
3. **DigitalOcean**: VPS with full control
4. **AWS Lambda**: Serverless with longer timeouts

## Support

For deployment issues:
1. Check Vercel documentation
2. Review build logs
3. Test locally first
4. Verify environment variables
