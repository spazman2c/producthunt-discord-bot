import { VercelRequest, VercelResponse } from '@vercel/node';
import { getConfig } from '../src/config/lazy';
import { logger } from '../src/utils/logger';
import { ProductHuntAPI } from '../src/services/producthunt';
import { DiscordBot } from '../src/services/discord';
import { StateManager } from '../src/services/state-manager';
import { Scheduler } from '../src/services/scheduler';
import { TimezoneManager } from '../src/utils/timezone';
import { StateManagerConfig } from '../src/types/state';

let botInitialized = false;
let scheduler: Scheduler | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!botInitialized) {
      await initializeBot();
      botInitialized = true;
    }

    // Start the scheduler if not already running
    if (scheduler && !scheduler.getStatus().isRunning) {
      await scheduler.start();
    }

    res.status(200).json({
      status: 'success',
      message: 'Bot started successfully',
      schedulerStatus: scheduler?.getStatus(),
    });
  } catch (error) {
    logger.error('Error starting bot:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to start bot',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function initializeBot(): Promise<void> {
  logger.info('Initializing Product Hunt Top 5 Discord Bot...');

  // Get configuration (this will load it when needed)
  const config = getConfig();

  // Initialize timezone manager
  const timezoneManager = new TimezoneManager();
  const timezoneInfo = timezoneManager.getTimezoneInfo();
  logger.info('Timezone configuration:', timezoneInfo);

  if (!timezoneManager.validateTimezones()) {
    throw new Error('Invalid timezone configuration');
  }

  // Initialize state manager
  const stateManagerConfig: StateManagerConfig = {
    cacheFilePath: '/tmp/cache.json', // Use temp directory for Vercel
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

  // Initialize scheduler
  scheduler = new Scheduler(phAPI, discordBot, stateManager, timezoneManager);

  logger.info('Bot initialization complete');
}
