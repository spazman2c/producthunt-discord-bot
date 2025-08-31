import { config } from './config';
import { logger } from './utils/logger';
import { ProductHuntAPI } from './services/producthunt';
import { TimezoneManager } from './utils/timezone';

async function testProductHuntAPI(): Promise<void> {
  try {
    logger.info('Starting Product Hunt API test...');

    // Test timezone manager
    const timezoneManager = new TimezoneManager();
    const timezoneInfo = timezoneManager.getTimezoneInfo();
    
    logger.info('Timezone configuration:', timezoneInfo);
    
    if (!timezoneManager.validateTimezones()) {
      throw new Error('Invalid timezone configuration');
    }

    // Test Product Hunt API
    const phAPI = new ProductHuntAPI();
    
    logger.info('Testing Product Hunt API connection...');
    const connectionTest = await phAPI.testConnection();
    
    if (!connectionTest) {
      throw new Error('Product Hunt API connection failed');
    }

    // Fetch top 5 posts
    logger.info('Fetching top 5 posts...');
    const result = await phAPI.fetchTopPosts(5);
    
    logger.info('Successfully fetched posts:', {
      totalCount: result.totalCount,
      hasNextPage: result.hasNextPage,
    });

    // Display posts
    result.posts.forEach((post) => {
      logger.info(`#${post.rank} - ${post.name}`, {
        tagline: post.tagline,
        votes: post.votes,
        url: post.url,
      });
    });

    logger.info('Product Hunt API test completed successfully!');
  } catch (error) {
    logger.error('Product Hunt API test failed:', error);
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testProductHuntAPI();
}
