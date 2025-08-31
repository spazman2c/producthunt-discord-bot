# Environment Variable Setup Guide

## The Issue

The bot is crashing because required environment variables are not set in your Vercel deployment. The error shows:

```
Error: Missing required environment variables: PH_API_URL, PH_TOKEN
```

## Quick Fix

### 1. Check Current Environment Variables

Visit your Vercel deployment and check the environment variables:

```bash
curl https://your-app.vercel.app/api/check-env
```

This will show you exactly which variables are missing.

### 2. Set Required Environment Variables

In your Vercel project dashboard:

1. Go to **Settings** > **Environment Variables**
2. Add these **required** variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `PH_API_URL` | Product Hunt API URL | `https://api.producthunt.com/v2/api/graphql` |
| `PH_TOKEN` | Product Hunt API token | `your_product_hunt_token_here` |
| `DISCORD_TOKEN` | Discord bot token | `your_discord_bot_token_here` |
| `DISCORD_CHANNEL_ID` | Discord channel ID | `1234567890123456789` |

### 3. Optional Environment Variables

You can also set these optional variables for customization:

| Variable | Description | Default |
|----------|-------------|---------|
| `PH_TIMEZONE` | Product Hunt timezone | `America/Los_Angeles` |
| `BOT_TIMEZONE` | Bot timezone | `America/New_York` |
| `FETCH_AT_LOCAL` | Daily fetch time | `07:00` |
| `POLL_SECONDS` | Polling interval | `180` |
| `LOG_LEVEL` | Logging level | `info` |

### 4. Redeploy

After setting the environment variables:

1. Go to **Deployments** in Vercel
2. Click **Redeploy** on your latest deployment
3. Or push a new commit to trigger automatic deployment

### 5. Test the Fix

Once redeployed, test the endpoints:

```bash
# Check environment variables
curl https://your-app.vercel.app/api/check-env

# Test health endpoint
curl https://your-app.vercel.app/health

# Start the bot
curl -X POST https://your-app.vercel.app/api/bot
```

## Getting the Required Values

### Product Hunt API Token

1. Go to https://www.producthunt.com/v2/oauth/applications
2. Create a new application
3. Generate an access token
4. Copy the token to `PH_TOKEN`

### Discord Bot Token

1. Go to https://discord.com/developers/applications
2. Create a new application
3. Go to **Bot** section
4. Copy the token to `DISCORD_TOKEN`

### Discord Channel ID

1. Enable Developer Mode in Discord
2. Right-click on your target channel
3. Click "Copy ID"
4. Paste to `DISCORD_CHANNEL_ID`

## Troubleshooting

### Still Getting Errors?

1. **Check Vercel Logs**: Go to your deployment and check the function logs
2. **Verify Variables**: Use the `/api/check-env` endpoint to verify
3. **Redeploy**: Make sure to redeploy after setting variables
4. **Check Permissions**: Ensure your Discord bot has proper permissions

### Common Issues

- **Token Invalid**: Make sure tokens are copied correctly
- **Channel ID Wrong**: Verify the channel ID is correct
- **Bot Not Invited**: Make sure the bot is invited to your server
- **Permissions Missing**: Check bot permissions in Discord

## Next Steps

Once environment variables are set:

1. Test the bot endpoints
2. Monitor the bot activity
3. Set up external monitoring
4. Configure alerts if needed

The bot should now start successfully! 🚀
