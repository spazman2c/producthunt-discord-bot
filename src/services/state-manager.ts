import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';
import { TransformedPost } from '../types/producthunt';
import {
  DailyState,
  CachedPost,
  StateChange,
  PostChange,
  StateManagerConfig,
  CacheStats,
} from '../types/state';

export class StateManager {
  private cacheFilePath: string;
  private maxCacheAge: number;
  private backupInterval: number;
  private lastBackup: Date | null = null;
  private cache: Map<string, DailyState> = new Map();

  constructor(config: StateManagerConfig) {
    this.cacheFilePath = config.cacheFilePath;
    this.maxCacheAge = config.maxCacheAge;
    this.backupInterval = config.backupInterval;
  }

  /**
   * Initialize the state manager and load existing cache
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing state manager...');

      // Ensure cache directory exists
      const cacheDir = path.dirname(this.cacheFilePath);
      await fs.mkdir(cacheDir, { recursive: true });

      // Load existing cache
      await this.loadCache();

      // Clean up old cache entries
      await this.cleanupOldCache();

      logger.info('State manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize state manager:', error);
      throw error;
    }
  }

  /**
   * Load cache from file
   */
  private async loadCache(): Promise<void> {
    try {
      const data = await fs.readFile(this.cacheFilePath, 'utf-8');
      const cacheData = JSON.parse(data);

      // Convert dates back to Date objects
      for (const [date, state] of Object.entries(cacheData)) {
        const dailyState = state as DailyState;
        dailyState.lastUpdated = new Date(dailyState.lastUpdated);
        this.cache.set(date, dailyState);
      }

      logger.info('Cache loaded successfully', { entries: this.cache.size });
    } catch (error) {
      if ((error as { code?: string }).code === 'ENOENT') {
        logger.info('No existing cache file found, starting fresh');
      } else {
        logger.warn('Failed to load cache, starting fresh:', error);
      }
    }
  }

  /**
   * Save cache to file
   */
  private async saveCache(): Promise<void> {
    try {
      const cacheData: Record<string, DailyState> = {};

      for (const [date, state] of this.cache.entries()) {
        cacheData[date] = state;
      }

      await fs.writeFile(this.cacheFilePath, JSON.stringify(cacheData, null, 2));

      logger.debug('Cache saved successfully', { entries: this.cache.size });
    } catch (error) {
      logger.error('Failed to save cache:', error);
      throw error;
    }
  }

  /**
   * Get state for a specific date
   */
  getDailyState(date: string): DailyState | undefined {
    return this.cache.get(date);
  }

  /**
   * Update state for a specific date
   */
  async updateDailyState(
    date: string,
    discordMessageId: string,
    posts: TransformedPost[]
  ): Promise<void> {
    const cachedPosts: CachedPost[] = posts.map((post) => ({
      id: post.id,
      rank: post.rank,
      votes: post.votes,
      slug: post.slug,
      name: post.name,
      tagline: post.tagline,
      url: post.url,
      thumbnail: post.thumbnail,
    }));

    const existingState = this.cache.get(date);
    const totalUpdates = existingState ? existingState.totalUpdates + 1 : 1;

    const newState: DailyState = {
      date,
      discordMessageId,
      lastItems: cachedPosts,
      lastUpdated: new Date(),
      totalUpdates,
    };

    this.cache.set(date, newState);
    await this.saveCache();

    logger.info('Daily state updated', {
      date,
      messageId: discordMessageId,
      postCount: posts.length,
      totalUpdates,
    });
  }

  /**
   * Detect changes between current posts and cached posts
   */
  detectChanges(date: string, currentPosts: TransformedPost[]): StateChange {
    const cachedState = this.getDailyState(date);

    if (!cachedState) {
      // First time posting for this date
      return {
        type: 'new_post',
        changes: currentPosts.map((post) => ({
          postId: post.id,
          postName: post.name,
          newRank: post.rank,
          newVotes: post.votes,
          changeType: 'new_post' as const,
        })),
        summary: `Initial post with ${currentPosts.length} products`,
      };
    }

    const changes: PostChange[] = [];
    const cachedPosts = new Map(cachedState.lastItems.map((p) => [p.id, p]));
    const currentPostsMap = new Map(currentPosts.map((p) => [p.id, p]));

    // Check for removed posts
    for (const [postId, cachedPost] of cachedPosts) {
      if (!currentPostsMap.has(postId)) {
        changes.push({
          postId,
          postName: cachedPost.name,
          oldRank: cachedPost.rank,
          oldVotes: cachedPost.votes,
          changeType: 'removed_post',
        });
      }
    }

    // Check for new posts and changes
    for (const currentPost of currentPosts) {
      const cachedPost = cachedPosts.get(currentPost.id);

      if (!cachedPost) {
        // New post
        changes.push({
          postId: currentPost.id,
          postName: currentPost.name,
          newRank: currentPost.rank,
          newVotes: currentPost.votes,
          changeType: 'new_post',
        });
      } else {
        // Check for changes
        const rankChanged = cachedPost.rank !== currentPost.rank;
        const votesChanged = cachedPost.votes !== currentPost.votes;

        if (rankChanged && votesChanged) {
          changes.push({
            postId: currentPost.id,
            postName: currentPost.name,
            oldRank: cachedPost.rank,
            newRank: currentPost.rank,
            oldVotes: cachedPost.votes,
            newVotes: currentPost.votes,
            changeType: 'rank_change',
          });
        } else if (votesChanged) {
          changes.push({
            postId: currentPost.id,
            postName: currentPost.name,
            oldVotes: cachedPost.votes,
            newVotes: currentPost.votes,
            changeType: 'vote_change',
          });
        } else if (rankChanged) {
          changes.push({
            postId: currentPost.id,
            postName: currentPost.name,
            oldRank: cachedPost.rank,
            newRank: currentPost.rank,
            changeType: 'rank_change',
          });
        }
      }
    }

    if (changes.length === 0) {
      return {
        type: 'no_change',
        changes: [],
        summary: 'No changes detected',
      };
    }

    // Generate summary
    const voteChanges = changes.filter((c) => c.changeType === 'vote_change').length;
    const rankChanges = changes.filter((c) => c.changeType === 'rank_change').length;
    const newPosts = changes.filter((c) => c.changeType === 'new_post').length;
    const removedPosts = changes.filter((c) => c.changeType === 'removed_post').length;

    const summaryParts = [];
    if (voteChanges > 0) summaryParts.push(`${voteChanges} vote changes`);
    if (rankChanges > 0) summaryParts.push(`${rankChanges} rank changes`);
    if (newPosts > 0) summaryParts.push(`${newPosts} new posts`);
    if (removedPosts > 0) summaryParts.push(`${removedPosts} removed posts`);

    const summary = summaryParts.join(', ');

    return {
      type: changes.some((c) => c.changeType === 'rank_change') ? 'rank_change' : 'vote_change',
      changes,
      summary,
    };
  }

  /**
   * Check if we need to update based on changes
   */
  shouldUpdate(date: string, currentPosts: TransformedPost[]): boolean {
    const change = this.detectChanges(date, currentPosts);
    return change.type !== 'no_change';
  }

  /**
   * Get Discord message ID for a date
   */
  getDiscordMessageId(date: string): string | undefined {
    const state = this.getDailyState(date);
    return state?.discordMessageId;
  }

  /**
   * Clean up old cache entries
   */
  private async cleanupOldCache(): Promise<void> {
    const now = new Date();
    const cutoffTime = now.getTime() - this.maxCacheAge;

    let cleanedCount = 0;
    for (const [date, state] of this.cache.entries()) {
      if (state.lastUpdated.getTime() < cutoffTime) {
        this.cache.delete(date);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info('Cleaned up old cache entries', { cleanedCount });
      await this.saveCache();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    let totalUpdates = 0;
    for (const state of this.cache.values()) {
      totalUpdates += state.totalUpdates;
    }

    return {
      totalDays: this.cache.size,
      totalUpdates,
      lastBackup: this.lastBackup,
      cacheSize: 0, // Would need to calculate actual file size
    };
  }

  /**
   * Create backup of cache
   */
  async createBackup(): Promise<void> {
    try {
      const backupPath = `${this.cacheFilePath}.backup`;
      await fs.copyFile(this.cacheFilePath, backupPath);
      this.lastBackup = new Date();

      logger.info('Cache backup created', { backupPath });
    } catch (error) {
      logger.error('Failed to create cache backup:', error);
    }
  }

  /**
   * Shutdown and cleanup
   */
  async shutdown(): Promise<void> {
    try {
      await this.saveCache();
      logger.info('State manager shutdown complete');
    } catch (error) {
      logger.error('Error during state manager shutdown:', error);
    }
  }
}
