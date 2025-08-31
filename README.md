# Product Hunt Top 5 Discord Bot

A Discord bot that automatically posts and updates the top 5 Product Hunt launches daily, starting at 7:00 AM and refreshing vote counts throughout the day.

## Features

- 🕐 **Daily Scheduling**: Posts top 5 launches at 7:00 AM (configurable)
- 🔄 **Auto-Updating**: Refreshes vote counts throughout the day
- 🌍 **Timezone Support**: Configurable timezones for Product Hunt (PT) and bot operations
- 🛡️ **Rate Limit Aware**: Respects both Product Hunt and Discord API limits
- 🔄 **Resilient**: Handles errors gracefully with retry logic
- 📊 **Rich Embeds**: Beautiful Discord embeds with product information

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Discord Bot Token
- Product Hunt API Token

## Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd producthunt-discord-bot
npm install
```

### 2. Environment Configuration

Copy the environment template and configure your settings:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# Product Hunt API Configuration
PH_API_URL=https://api.producthunt.com/v2/api/graphql
PH_TOKEN=your_product_hunt_token_here

# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CHANNEL_ID=your_discord_channel_id_here

# Time / Polling Configuration
PH_TIMEZONE=America/Los_Angeles
BOT_TIMEZONE=America/New_York
FETCH_AT_LOCAL=07:00
POLL_SECONDS=180

# Logging Configuration
LOG_LEVEL=info
```

### 3. Get API Tokens

#### Discord Bot Token
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to "Bot" section and create a bot
4. Copy the bot token
5. Enable required intents (Message Content Intent)

#### Product Hunt Token
1. Go to [Product Hunt API v2](https://api.producthunt.com/v2/docs)
2. Create a developer account
3. Generate an API token (developer token or OAuth2 token)
4. Copy the token
5. Test the connection: `npm run test:ph`

### 4. Discord Bot Setup
1. In your Discord server, invite the bot with proper permissions
2. Get the channel ID where you want the bot to post
3. Ensure the bot has permissions to send messages and embed links

## Development

### Available Scripts

```bash
# Development mode with auto-reload
npm run dev

# Build the project
npm run build

# Start production build
npm start

# Test Product Hunt API (requires valid PH_TOKEN)
npm run test:ph

# Lint code
npm run lint

# Format code
npm run format

# Clean build directory
npm run clean
```

### Project Structure

```
src/
├── config/          # Configuration management
├── services/        # Business logic services
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── index.ts         # Main entry point
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PH_API_URL` | Product Hunt GraphQL endpoint | `https://api.producthunt.com/v2/api/graphql` |
| `PH_TOKEN` | Product Hunt API token | Required |
| `DISCORD_TOKEN` | Discord bot token | Required |
| `DISCORD_CHANNEL_ID` | Discord channel ID | Required |
| `PH_TIMEZONE` | Product Hunt timezone | `America/Los_Angeles` |
| `BOT_TIMEZONE` | Bot operations timezone | `America/New_York` |
| `FETCH_AT_LOCAL` | Daily fetch time (24h format) | `07:00` |
| `POLL_SECONDS` | Polling interval (seconds) | `180` |
| `LOG_LEVEL` | Logging level | `info` |

### Timezone Configuration

The bot uses two timezones:
- **Product Hunt Timezone**: Determines what constitutes "today" for Product Hunt posts
- **Bot Timezone**: Used for scheduling and logging

## Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Docker (Coming Soon)
```bash
docker build -t producthunt-discord-bot .
docker run --env-file .env producthunt-discord-bot
```

## Monitoring

The bot includes comprehensive logging:
- Application startup and configuration
- API requests and responses
- Discord message operations
- Error handling and retries
- Rate limit awareness

## Troubleshooting

### Common Issues

1. **Configuration Errors**: Ensure all required environment variables are set
2. **Discord Permissions**: Verify bot has proper permissions in the target channel
3. **API Rate Limits**: The bot automatically handles rate limits, but check logs for issues
4. **Timezone Issues**: Ensure timezone strings are valid IANA timezone identifiers

### Logs

Check the console output for detailed logs. Set `LOG_LEVEL=debug` for verbose logging.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC License

## Support

For issues and questions, please open an issue on GitHub.
