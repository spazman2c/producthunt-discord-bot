import { config } from './config';
import { logger } from './utils/logger';
import { ProductHuntAPI } from './services/producthunt';
import { DiscordBot } from './services/discord';
import { StateManager } from './services/state-manager';
import { Scheduler } from './services/scheduler';
import { TimezoneManager } from './utils/timezone';
import { StateManagerConfig } from './types/state';

async function testScheduler(): Promise<void> {
  try {
    logger.info('Starting scheduler test...');

    // Initialize all services
    const timezoneManager = new TimezoneManager();
    
    const stateManagerConfig: StateManagerConfig = {
      cacheFilePath: './test-scheduler-cache.json',
      maxCacheAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      backupInterval: 24 * 60 * 60 * 1000, // 24 hours
    };
    
    const stateManager = new StateManager(stateManagerConfig);
    await stateManager.initialize();

    const phAPI = new ProductHuntAPI();
    const discordBot = new DiscordBot();

    // Test connections
    logger.info('Testing service connections...');
    
    const phTest = await phAPI.testConnection();
    if (!phTest) {
      throw new Error('Product Hunt API connection failed');
    }

    await discordBot.connect();
    
    // Wait for Discord bot to be ready
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

    const discordTest = await discordBot.testConnection();
    if (!discordTest) {
      throw new Error('Discord connection failed');
    }

    // Create scheduler
    const scheduler = new Scheduler(phAPI, discordBot, stateManager, timezoneManager);

    // Test scheduler status
    const status = scheduler.getStatus();
    logger.info('Scheduler status:', status);

    // Test a single poll cycle (without starting the full scheduler)
    logger.info('Testing single poll cycle...');
    
    // This would normally be done by the scheduler, but we'll test it manually
    const currentDate = timezoneManager.getPHDateString();
    const result = await phAPI.fetchTopPosts(5);
    
    logger.info('Poll result:', {
      postsFetched: result.posts.length,
      hasNextPage: result.hasNextPage,
      posts: result.posts.map(p => ({ name: p.name, votes: p.votes, rank: p.rank })),
    });

    // Test state management with the fetched posts
    const shouldUpdate = stateManager.shouldUpdate(currentDate, result.posts);
    logger.info('Should update:', shouldUpdate);

    if (shouldUpdate) {
      // Test posting to Discord
      const postResult = await discordBot.postTopPosts(
        result.posts,
        timezoneManager.formatDateForDisplay(timezoneManager.getCurrentPHDate()),
        { includeThumbnail: true }
      );

      if (postResult.success) {
        // Update state
        await stateManager.updateDailyState(
          currentDate,
          postResult.messageId!,
          result.posts
        );

        logger.info('Test post successful', {
          messageId: postResult.messageId,
          postCount: result.posts.length,
        });

        // Clean up test message after a delay
        setTimeout(async () => {
          await discordBot.deleteMessage(postResult.messageId!);
          logger.info('Test message cleaned up');
        }, 5000);
      } else {
        throw new Error(`Failed to post test message: ${postResult.error}`);
      }
    }

    // Test timezone calculations
    const timezoneInfo = timezoneManager.getTimezoneInfo();
    logger.info('Timezone info:', timezoneInfo);

    const { duration, nextFetch } = timezoneManager.getTimeUntilNextFetch();
    logger.info('Next fetch info:', {
      nextFetch: nextFetch.toISO(),
      durationMinutes: Math.round(duration / (1000 * 60)),
    });

    // Clean up
    await discordBot.disconnect();
    await stateManager.shutdown();

    logger.info('Scheduler test completed successfully!');
  } catch (error) {
    logger.error('Scheduler test failed:', error);
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testScheduler();
}
