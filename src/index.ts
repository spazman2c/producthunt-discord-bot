import { config } from './config';
import { logger } from './utils/logger';
import { ProductHuntAPI } from './services/producthunt';
import { TimezoneManager } from './utils/timezone';

async function main(): Promise<void> {
  try {
    logger.info('Starting Product Hunt Top 5 Discord Bot...');
    logger.info('Configuration loaded successfully');
    logger.debug('Config:', {
      phApiUrl: config.productHunt.apiUrl,
      phTimezone: config.time.phTimezone,
      botTimezone: config.time.botTimezone,
      fetchAtLocal: config.time.fetchAtLocal,
      pollSeconds: config.time.pollSeconds,
    });

    // Initialize timezone manager
    const timezoneManager = new TimezoneManager();
    const timezoneInfo = timezoneManager.getTimezoneInfo();
    logger.info('Timezone configuration:', timezoneInfo);
    
    if (!timezoneManager.validateTimezones()) {
      throw new Error('Invalid timezone configuration');
    }

    // Initialize Product Hunt API client
    const phAPI = new ProductHuntAPI();
    logger.info('Testing Product Hunt API connection...');
    
    const connectionTest = await phAPI.testConnection();
    if (!connectionTest) {
      throw new Error('Product Hunt API connection failed');
    }

    // TODO: Initialize Discord bot
    // TODO: Set up scheduling system
    // TODO: Start polling loop

    logger.info('Bot initialization complete');
  } catch (error) {
    logger.error('Failed to start bot:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the application
main().catch((error) => {
  logger.error('Unhandled error in main:', error);
  process.exit(1);
});
