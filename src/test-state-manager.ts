import { StateManager } from './services/state-manager';
import { logger } from './utils/logger';
import { TransformedPost } from './types/producthunt';
import { StateManagerConfig } from './types/state';

async function testStateManager(): Promise<void> {
  try {
    logger.info('Starting state manager test...');

    // Create test configuration
    const config: StateManagerConfig = {
      cacheFilePath: './test-cache.json',
      maxCacheAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      backupInterval: 24 * 60 * 60 * 1000, // 24 hours
    };

    // Initialize state manager
    const stateManager = new StateManager(config);
    await stateManager.initialize();

    // Create mock posts
    const mockPosts1: TransformedPost[] = [
      {
        id: '1',
        name: 'Test Product 1',
        tagline: 'An amazing test product',
        slug: 'test-product-1',
        votes: 150,
        url: 'https://producthunt.com/posts/test-product-1',
        rank: 1,
      },
      {
        id: '2',
        name: 'Test Product 2',
        tagline: 'Another great product',
        slug: 'test-product-2',
        votes: 120,
        url: 'https://producthunt.com/posts/test-product-2',
        rank: 2,
      },
    ];

    const mockPosts2: TransformedPost[] = [
      {
        id: '1',
        name: 'Test Product 1',
        tagline: 'An amazing test product',
        slug: 'test-product-1',
        votes: 180, // Vote count increased
        url: 'https://producthunt.com/posts/test-product-1',
        rank: 1,
      },
      {
        id: '2',
        name: 'Test Product 2',
        tagline: 'Another great product',
        slug: 'test-product-2',
        votes: 120,
        url: 'https://producthunt.com/posts/test-product-2',
        rank: 3, // Rank changed
      },
      {
        id: '3',
        name: 'Test Product 3',
        tagline: 'A new product',
        slug: 'test-product-3',
        votes: 130,
        url: 'https://producthunt.com/posts/test-product-3',
        rank: 2, // New product
      },
    ];

    const testDate = '2025-01-15';
    const messageId = '123456789';

    // Test initial state update
    logger.info('Testing initial state update...');
    await stateManager.updateDailyState(testDate, messageId, mockPosts1);

    // Test change detection
    logger.info('Testing change detection...');
    const changes = stateManager.detectChanges(testDate, mockPosts2);
    
    logger.info('Detected changes:', {
      type: changes.type,
      summary: changes.summary,
      changes: changes.changes,
    });

    // Test should update
    const shouldUpdate = stateManager.shouldUpdate(testDate, mockPosts2);
    logger.info('Should update:', shouldUpdate);

    // Test getting Discord message ID
    const retrievedMessageId = stateManager.getDiscordMessageId(testDate);
    logger.info('Retrieved message ID:', retrievedMessageId);

    // Test cache stats
    const stats = stateManager.getCacheStats();
    logger.info('Cache stats:', stats);

    // Test getting daily state
    const dailyState = stateManager.getDailyState(testDate);
    logger.info('Daily state:', {
      date: dailyState?.date,
      totalUpdates: dailyState?.totalUpdates,
      postCount: dailyState?.lastItems.length,
    });

    // Clean up
    await stateManager.shutdown();

    logger.info('State manager test completed successfully!');
  } catch (error) {
    logger.error('State manager test failed:', error);
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testStateManager();
}
