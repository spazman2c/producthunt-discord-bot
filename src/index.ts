import { config } from './config';
import { logger } from './utils/logger';
import { ProductHuntAPI } from './services/producthunt';
import { DiscordBot } from './services/discord';
import { StateManager } from './services/state-manager';
import { Scheduler } from './services/scheduler';
import { TimezoneManager } from './utils/timezone';
import { StateManagerConfig } from './types/state';

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

    // Initialize state manager
    const stateManagerConfig: StateManagerConfig = {
      cacheFilePath: './data/cache.json',
      maxCacheAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      backupInterval: 24 * 60 * 60 * 1000, // 24 hours
    };
    
    const stateManager = new StateManager(stateManagerConfig);
    await stateManager.initialize();
    
    const cacheStats = stateManager.getCacheStats();
    logger.info('State manager initialized', cacheStats);

    // Initialize Product Hunt API client
    const phAPI = new ProductHuntAPI();
    logger.info('Testing Product Hunt API connection...');
    
    const connectionTest = await phAPI.testConnection();
    if (!connectionTest) {
      throw new Error('Product Hunt API connection failed');
    }

    // Initialize Discord bot
    const discordBot = new DiscordBot();
    logger.info('Connecting to Discord...');
    
    await discordBot.connect();
    
    // Wait for bot to be ready
    await new Promise((resolve) => {
      const checkReady = () => {
        if (discordBot.getStatus().isReady) {
          resolve(true);
        } else {
          setTimeout(checkReady, 1000);
        }
      };
      checkReady();
    });

    logger.info('Testing Discord connection...');
    const discordTest = await discordBot.testConnection();
    if (!discordTest) {
      throw new Error('Discord connection failed');
    }

    // Initialize and start scheduler
    const scheduler = new Scheduler(phAPI, discordBot, stateManager, timezoneManager);
    await scheduler.start();

    logger.info('Bot initialization complete - Scheduler is running!');
    
    // Keep the process running
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      await scheduler.stop();
      await discordBot.disconnect();
      await stateManager.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      await scheduler.stop();
      await discordBot.disconnect();
      await stateManager.shutdown();
      process.exit(0);
    });

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
