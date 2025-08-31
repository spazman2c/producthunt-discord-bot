import { config } from './config';
import { logger } from './utils/logger';
import { DiscordBot } from './services/discord';
import { TransformedPost } from './types/producthunt';

async function testDiscordBot(): Promise<void> {
  try {
    logger.info('Starting Discord bot test...');

    // Create Discord bot instance
    const discordBot = new DiscordBot();
    
    // Connect to Discord
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

    // Test connection
    logger.info('Testing Discord connection...');
    const connectionTest = await discordBot.testConnection();
    
    if (!connectionTest) {
      throw new Error('Discord connection test failed');
    }

    // Create mock posts for testing
    const mockPosts: TransformedPost[] = [
      {
        id: '1',
        name: 'Test Product 1',
        tagline: 'An amazing test product for demonstration',
        slug: 'test-product-1',
        votes: 150,
        url: 'https://producthunt.com/posts/test-product-1',
        thumbnail: 'https://ph-static.imgix.net/ph-logo.png',
        rank: 1,
      },
      {
        id: '2',
        name: 'Test Product 2',
        tagline: 'Another great test product',
        slug: 'test-product-2',
        votes: 120,
        url: 'https://producthunt.com/posts/test-product-2',
        rank: 2,
      },
      {
        id: '3',
        name: 'Test Product 3',
        tagline: 'The third test product in our series',
        slug: 'test-product-3',
        votes: 95,
        url: 'https://producthunt.com/posts/test-product-3',
        rank: 3,
      },
    ];

    // Test posting
    logger.info('Testing Discord post...');
    const postResult = await discordBot.postTopPosts(
      mockPosts,
      'January 15, 2025',
      { includeThumbnail: true }
    );

    if (!postResult.success) {
      throw new Error(`Failed to post: ${postResult.error}`);
    }

    logger.info('Successfully posted to Discord', {
      messageId: postResult.messageId,
    });

    // Wait a moment, then test editing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Update mock posts with new vote counts
    const updatedPosts = mockPosts.map((post) => ({
      ...post,
      votes: post.votes + Math.floor(Math.random() * 20),
    }));

    logger.info('Testing Discord message edit...');
    const editResult = await discordBot.editTopPosts(
      postResult.messageId!,
      updatedPosts,
      'January 15, 2025',
      { includeThumbnail: true }
    );

    if (!editResult.success) {
      throw new Error(`Failed to edit: ${editResult.error}`);
    }

    logger.info('Successfully edited Discord message');

    // Wait a moment, then clean up
    await new Promise((resolve) => setTimeout(resolve, 2000));

    logger.info('Cleaning up test message...');
    await discordBot.deleteMessage(postResult.messageId!);

    // Disconnect
    await discordBot.disconnect();

    logger.info('Discord bot test completed successfully!');
  } catch (error) {
    logger.error('Discord bot test failed:', error);
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testDiscordBot();
}
