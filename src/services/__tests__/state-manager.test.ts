import { StateManager } from '../state-manager';
import { StateManagerConfig } from '../../types/state';
import { TransformedPost } from '../../types/producthunt';
import fs from 'fs/promises';
import path from 'path';

// Mock fs module
jest.mock('fs/promises');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('StateManager', () => {
  let stateManager: StateManager;
  let testConfig: StateManagerConfig;

  beforeEach(() => {
    testConfig = {
      cacheFilePath: './test-cache.json',
      maxCacheAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      backupInterval: 24 * 60 * 60 * 1000, // 24 hours
    };

    stateManager = new StateManager(testConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize successfully with no existing cache', async () => {
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.readFile.mockRejectedValue({ code: 'ENOENT' });

      await expect(stateManager.initialize()).resolves.not.toThrow();
      expect(mockedFs.mkdir).toHaveBeenCalledWith('./', { recursive: true });
    });

    it('should load existing cache successfully', async () => {
      const mockCacheData = {
        '2025-01-15': {
          date: '2025-01-15',
          discordMessageId: '123456789',
          lastItems: [
            {
              id: '1',
              rank: 1,
              votes: 150,
              slug: 'test-product',
              name: 'Test Product',
              tagline: 'A test product',
              url: 'https://producthunt.com/posts/test-product',
            },
          ],
          lastUpdated: '2025-01-15T10:30:00.000Z',
          totalUpdates: 1,
        },
      };

      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.readFile.mockResolvedValue(JSON.stringify(mockCacheData));

      await stateManager.initialize();

      const state = stateManager.getDailyState('2025-01-15');
      expect(state).toBeDefined();
      expect(state?.discordMessageId).toBe('123456789');
      expect(state?.lastItems).toHaveLength(1);
    });
  });

  describe('updateDailyState', () => {
    beforeEach(async () => {
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.readFile.mockRejectedValue({ code: 'ENOENT' });
      mockedFs.writeFile.mockResolvedValue(undefined);
      await stateManager.initialize();
    });

    it('should update state for new date', async () => {
      const posts: TransformedPost[] = [
        {
          id: '1',
          name: 'Test Product',
          tagline: 'A test product',
          slug: 'test-product',
          votes: 150,
          url: 'https://producthunt.com/posts/test-product',
          rank: 1,
        },
      ];

      await stateManager.updateDailyState('2025-01-15', '123456789', posts);

      const state = stateManager.getDailyState('2025-01-15');
      expect(state).toBeDefined();
      expect(state?.discordMessageId).toBe('123456789');
      expect(state?.lastItems).toHaveLength(1);
      expect(state?.totalUpdates).toBe(1);
    });

    it('should increment totalUpdates for existing date', async () => {
      const posts: TransformedPost[] = [
        {
          id: '1',
          name: 'Test Product',
          tagline: 'A test product',
          slug: 'test-product',
          votes: 150,
          url: 'https://producthunt.com/posts/test-product',
          rank: 1,
        },
      ];

      // First update
      await stateManager.updateDailyState('2025-01-15', '123456789', posts);
      
      // Second update
      await stateManager.updateDailyState('2025-01-15', '123456789', posts);

      const state = stateManager.getDailyState('2025-01-15');
      expect(state?.totalUpdates).toBe(2);
    });
  });

  describe('detectChanges', () => {
    beforeEach(async () => {
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.readFile.mockRejectedValue({ code: 'ENOENT' });
      mockedFs.writeFile.mockResolvedValue(undefined);
      await stateManager.initialize();
    });

    it('should detect new posts for first time', () => {
      const posts: TransformedPost[] = [
        {
          id: '1',
          name: 'Test Product',
          tagline: 'A test product',
          slug: 'test-product',
          votes: 150,
          url: 'https://producthunt.com/posts/test-product',
          rank: 1,
        },
      ];

      const changes = stateManager.detectChanges('2025-01-15', posts);
      expect(changes.type).toBe('new_post');
      expect(changes.changes).toHaveLength(1);
      expect(changes.summary).toContain('Initial post');
    });

    it('should detect vote changes', async () => {
      const initialPosts: TransformedPost[] = [
        {
          id: '1',
          name: 'Test Product',
          tagline: 'A test product',
          slug: 'test-product',
          votes: 150,
          url: 'https://producthunt.com/posts/test-product',
          rank: 1,
        },
      ];

      await stateManager.updateDailyState('2025-01-15', '123456789', initialPosts);

      const updatedPosts: TransformedPost[] = [
        {
          id: '1',
          name: 'Test Product',
          tagline: 'A test product',
          slug: 'test-product',
          votes: 180, // Vote count increased
          url: 'https://producthunt.com/posts/test-product',
          rank: 1,
        },
      ];

      const changes = stateManager.detectChanges('2025-01-15', updatedPosts);
      expect(changes.type).toBe('vote_change');
      expect(changes.changes).toHaveLength(1);
      expect(changes.changes[0].changeType).toBe('vote_change');
    });

    it('should detect rank changes', async () => {
      const initialPosts: TransformedPost[] = [
        {
          id: '1',
          name: 'Test Product 1',
          tagline: 'A test product',
          slug: 'test-product-1',
          votes: 150,
          url: 'https://producthunt.com/posts/test-product-1',
          rank: 1,
        },
        {
          id: '2',
          name: 'Test Product 2',
          tagline: 'Another test product',
          slug: 'test-product-2',
          votes: 120,
          url: 'https://producthunt.com/posts/test-product-2',
          rank: 2,
        },
      ];

      await stateManager.updateDailyState('2025-01-15', '123456789', initialPosts);

      const updatedPosts: TransformedPost[] = [
        {
          id: '2',
          name: 'Test Product 2',
          tagline: 'Another test product',
          slug: 'test-product-2',
          votes: 160, // Vote count increased
          url: 'https://producthunt.com/posts/test-product-2',
          rank: 1, // Rank changed
        },
        {
          id: '1',
          name: 'Test Product 1',
          tagline: 'A test product',
          slug: 'test-product-1',
          votes: 150,
          url: 'https://producthunt.com/posts/test-product-1',
          rank: 2, // Rank changed
        },
      ];

      const changes = stateManager.detectChanges('2025-01-15', updatedPosts);
      expect(changes.type).toBe('rank_change');
      expect(changes.changes).toHaveLength(2);
    });

    it('should detect no changes', async () => {
      const posts: TransformedPost[] = [
        {
          id: '1',
          name: 'Test Product',
          tagline: 'A test product',
          slug: 'test-product',
          votes: 150,
          url: 'https://producthunt.com/posts/test-product',
          rank: 1,
        },
      ];

      await stateManager.updateDailyState('2025-01-15', '123456789', posts);

      const changes = stateManager.detectChanges('2025-01-15', posts);
      expect(changes.type).toBe('no_change');
      expect(changes.changes).toHaveLength(0);
    });
  });

  describe('shouldUpdate', () => {
    beforeEach(async () => {
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.readFile.mockRejectedValue({ code: 'ENOENT' });
      mockedFs.writeFile.mockResolvedValue(undefined);
      await stateManager.initialize();
    });

    it('should return true when changes are detected', () => {
      const posts: TransformedPost[] = [
        {
          id: '1',
          name: 'Test Product',
          tagline: 'A test product',
          slug: 'test-product',
          votes: 150,
          url: 'https://producthunt.com/posts/test-product',
          rank: 1,
        },
      ];

      expect(stateManager.shouldUpdate('2025-01-15', posts)).toBe(true);
    });

    it('should return false when no changes are detected', async () => {
      const posts: TransformedPost[] = [
        {
          id: '1',
          name: 'Test Product',
          tagline: 'A test product',
          slug: 'test-product',
          votes: 150,
          url: 'https://producthunt.com/posts/test-product',
          rank: 1,
        },
      ];

      await stateManager.updateDailyState('2025-01-15', '123456789', posts);
      expect(stateManager.shouldUpdate('2025-01-15', posts)).toBe(false);
    });
  });

  describe('getDiscordMessageId', () => {
    beforeEach(async () => {
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.readFile.mockRejectedValue({ code: 'ENOENT' });
      mockedFs.writeFile.mockResolvedValue(undefined);
      await stateManager.initialize();
    });

    it('should return message ID for existing date', async () => {
      const posts: TransformedPost[] = [
        {
          id: '1',
          name: 'Test Product',
          tagline: 'A test product',
          slug: 'test-product',
          votes: 150,
          url: 'https://producthunt.com/posts/test-product',
          rank: 1,
        },
      ];

      await stateManager.updateDailyState('2025-01-15', '123456789', posts);
      expect(stateManager.getDiscordMessageId('2025-01-15')).toBe('123456789');
    });

    it('should return undefined for non-existing date', () => {
      expect(stateManager.getDiscordMessageId('2025-01-15')).toBeUndefined();
    });
  });

  describe('getCacheStats', () => {
    beforeEach(async () => {
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.readFile.mockRejectedValue({ code: 'ENOENT' });
      mockedFs.writeFile.mockResolvedValue(undefined);
      await stateManager.initialize();
    });

    it('should return cache statistics', async () => {
      const posts: TransformedPost[] = [
        {
          id: '1',
          name: 'Test Product',
          tagline: 'A test product',
          slug: 'test-product',
          votes: 150,
          url: 'https://producthunt.com/posts/test-product',
          rank: 1,
        },
      ];

      await stateManager.updateDailyState('2025-01-15', '123456789', posts);
      await stateManager.updateDailyState('2025-01-16', '987654321', posts);

      const stats = stateManager.getCacheStats();
      expect(stats.totalDays).toBe(2);
      expect(stats.totalUpdates).toBe(2);
    });
  });
});
