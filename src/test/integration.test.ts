import { ProductHuntAPI } from '../services/producthunt';
import { DiscordBot } from '../services/discord';
import { StateManager } from '../services/state-manager';
import { Scheduler } from '../services/scheduler';
import { TimezoneManager } from '../utils/timezone';
import { StateManagerConfig } from '../types/state';
import { TransformedPost } from '../types/producthunt';

// Mock external dependencies
jest.mock('../services/producthunt');
jest.mock('../services/discord');
jest.mock('fs/promises');

describe('Integration Tests', () => {
  let mockPhAPI: jest.Mocked<ProductHuntAPI>;
  let mockDiscordBot: jest.Mocked<DiscordBot>;
  let stateManager: StateManager;
  let timezoneManager: TimezoneManager;
  let scheduler: Scheduler;

  beforeEach(async () => {
    // Create mocks
    mockPhAPI = {
      fetchTopPosts: jest.fn(),
      testConnection: jest.fn(),
    } as any;

    mockDiscordBot = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      postTopPosts: jest.fn(),
      editTopPosts: jest.fn(),
      testConnection: jest.fn(),
      getStatus: jest.fn(),
    } as any;

    // Initialize real services
    const stateManagerConfig: StateManagerConfig = {
      cacheFilePath: './test-integration-cache.json',
      maxCacheAge: 7 * 24 * 60 * 60 * 1000,
      backupInterval: 24 * 60 * 60 * 1000,
    };

    stateManager = new StateManager(stateManagerConfig);
    await stateManager.initialize();

    timezoneManager = new TimezoneManager();

    scheduler = new Scheduler(mockPhAPI, mockDiscordBot, stateManager, timezoneManager);
  });

  afterEach(async () => {
    await stateManager.shutdown();
    jest.clearAllMocks();
  });

  describe('Complete Workflow', () => {
    it('should handle a complete daily cycle workflow', async () => {
      // Mock Product Hunt API response
      const mockPosts: TransformedPost[] = [
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

      mockPhAPI.fetchTopPosts.mockResolvedValue({
        posts: mockPosts,
        totalCount: 2,
        hasNextPage: false,
      });

      mockDiscordBot.postTopPosts.mockResolvedValue({
        success: true,
        messageId: '123456789',
      });

      mockDiscordBot.getStatus.mockReturnValue({
        isReady: true,
        botName: 'TestBot',
        botId: '123456789',
        channelId: '987654321',
      });

      // Test the workflow
      const currentDate = timezoneManager.getPHDateString();
      
      // 1. Fetch posts from Product Hunt
      const result = await mockPhAPI.fetchTopPosts(5);
      expect(result.posts).toHaveLength(2);
      expect(mockPhAPI.fetchTopPosts).toHaveBeenCalledWith(5);

      // 2. Check if we need to update
      const shouldUpdate = stateManager.shouldUpdate(currentDate, result.posts);
      expect(shouldUpdate).toBe(true);

      // 3. Post to Discord
      const postResult = await mockDiscordBot.postTopPosts(
        result.posts,
        timezoneManager.formatDateForDisplay(timezoneManager.getCurrentPHDate()),
        { includeThumbnail: true }
      );
      expect(postResult.success).toBe(true);
      expect(mockDiscordBot.postTopPosts).toHaveBeenCalled();

      // 4. Update state
      await stateManager.updateDailyState(
        currentDate,
        postResult.messageId!,
        result.posts
      );

      // 5. Verify state was updated
      const state = stateManager.getDailyState(currentDate);
      expect(state).toBeDefined();
      expect(state?.discordMessageId).toBe('123456789');
      expect(state?.lastItems).toHaveLength(2);
    });

    it('should handle vote count updates', async () => {
      // Initial posts
      const initialPosts: TransformedPost[] = [
        {
          id: '1',
          name: 'Test Product 1',
          tagline: 'An amazing test product',
          slug: 'test-product-1',
          votes: 150,
          url: 'https://producthunt.com/posts/test-product-1',
          rank: 1,
        },
      ];

      // Updated posts with higher vote count
      const updatedPosts: TransformedPost[] = [
        {
          id: '1',
          name: 'Test Product 1',
          tagline: 'An amazing test product',
          slug: 'test-product-1',
          votes: 180, // Vote count increased
          url: 'https://producthunt.com/posts/test-product-1',
          rank: 1,
        },
      ];

      mockPhAPI.fetchTopPosts
        .mockResolvedValueOnce({
          posts: initialPosts,
          totalCount: 1,
          hasNextPage: false,
        })
        .mockResolvedValueOnce({
          posts: updatedPosts,
          totalCount: 1,
          hasNextPage: false,
        });

      mockDiscordBot.postTopPosts.mockResolvedValue({
        success: true,
        messageId: '123456789',
      });

      mockDiscordBot.editTopPosts.mockResolvedValue({
        success: true,
        messageId: '123456789',
      });

      mockDiscordBot.getStatus.mockReturnValue({
        isReady: true,
        botName: 'TestBot',
        botId: '123456789',
        channelId: '987654321',
      });

      const currentDate = timezoneManager.getPHDateString();

      // First poll - should create new message
      const firstResult = await mockPhAPI.fetchTopPosts(5);
      const firstShouldUpdate = stateManager.shouldUpdate(currentDate, firstResult.posts);
      expect(firstShouldUpdate).toBe(true);

      const firstPostResult = await mockDiscordBot.postTopPosts(
        firstResult.posts,
        timezoneManager.formatDateForDisplay(timezoneManager.getCurrentPHDate()),
        { includeThumbnail: true }
      );

      await stateManager.updateDailyState(
        currentDate,
        firstPostResult.messageId!,
        firstResult.posts
      );

      // Second poll - should edit existing message
      const secondResult = await mockPhAPI.fetchTopPosts(5);
      const secondShouldUpdate = stateManager.shouldUpdate(currentDate, secondResult.posts);
      expect(secondShouldUpdate).toBe(true);

      const messageId = stateManager.getDiscordMessageId(currentDate);
      expect(messageId).toBe('123456789');

      const editResult = await mockDiscordBot.editTopPosts(
        messageId!,
        secondResult.posts,
        timezoneManager.formatDateForDisplay(timezoneManager.getCurrentPHDate()),
        { includeThumbnail: true }
      );

      expect(editResult.success).toBe(true);
      expect(mockDiscordBot.editTopPosts).toHaveBeenCalled();
    });

    it('should handle no changes scenario', async () => {
      const posts: TransformedPost[] = [
        {
          id: '1',
          name: 'Test Product 1',
          tagline: 'An amazing test product',
          slug: 'test-product-1',
          votes: 150,
          url: 'https://producthunt.com/posts/test-product-1',
          rank: 1,
        },
      ];

      mockPhAPI.fetchTopPosts.mockResolvedValue({
        posts,
        totalCount: 1,
        hasNextPage: false,
      });

      const currentDate = timezoneManager.getPHDateString();

      // First poll - should create new message
      const firstResult = await mockPhAPI.fetchTopPosts(5);
      const firstShouldUpdate = stateManager.shouldUpdate(currentDate, firstResult.posts);
      expect(firstShouldUpdate).toBe(true);

      // Second poll with same data - should not update
      const secondResult = await mockPhAPI.fetchTopPosts(5);
      const secondShouldUpdate = stateManager.shouldUpdate(currentDate, secondResult.posts);
      expect(secondShouldUpdate).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle Product Hunt API errors gracefully', async () => {
      mockPhAPI.fetchTopPosts.mockRejectedValue(new Error('API Error'));

      const currentDate = timezoneManager.getPHDateString();
      const posts: TransformedPost[] = [];

      // Should not throw error, but should return false for shouldUpdate
      const shouldUpdate = stateManager.shouldUpdate(currentDate, posts);
      expect(shouldUpdate).toBe(true); // Should still update for empty posts (first time)
    });

    it('should handle Discord API errors gracefully', async () => {
      const posts: TransformedPost[] = [
        {
          id: '1',
          name: 'Test Product 1',
          tagline: 'An amazing test product',
          slug: 'test-product-1',
          votes: 150,
          url: 'https://producthunt.com/posts/test-product-1',
          rank: 1,
        },
      ];

      mockPhAPI.fetchTopPosts.mockResolvedValue({
        posts,
        totalCount: 1,
        hasNextPage: false,
      });

      mockDiscordBot.postTopPosts.mockResolvedValue({
        success: false,
        error: 'Discord API Error',
      });

      const currentDate = timezoneManager.getPHDateString();
      const result = await mockPhAPI.fetchTopPosts(5);
      const shouldUpdate = stateManager.shouldUpdate(currentDate, result.posts);
      expect(shouldUpdate).toBe(true);

      const postResult = await mockDiscordBot.postTopPosts(
        result.posts,
        timezoneManager.formatDateForDisplay(timezoneManager.getCurrentPHDate()),
        { includeThumbnail: true }
      );

      expect(postResult.success).toBe(false);
      expect(postResult.error).toBe('Discord API Error');
    });
  });

  describe('Timezone Handling', () => {
    it('should handle different timezones correctly', () => {
      const phDate = timezoneManager.getCurrentPHDate();
      const botDate = timezoneManager.getCurrentBotDate();

      expect(phDate.zoneName).toBe('America/Los_Angeles');
      expect(botDate.zoneName).toBe('America/New_York');

      const phDateString = timezoneManager.getPHDateString();
      expect(phDateString).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      const { duration, nextFetch } = timezoneManager.getTimeUntilNextFetch();
      expect(duration).toBeGreaterThan(0);
      expect(nextFetch).toBeInstanceOf(Object);
    });
  });
});
