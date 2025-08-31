import { DateTime } from 'luxon';
import { ProductHuntAPI } from './producthunt';
import { DiscordBot } from './discord';
import { StateManager } from './state-manager';
import { TimezoneManager } from '../utils/timezone';
import { logger } from '../utils/logger';
import { config } from '../config';
import {
  DailySchedule,
  PollingResult,
  AdaptivePollingState,
  SchedulerConfig,
} from '../types/scheduler';

export class Scheduler {
  private phAPI: ProductHuntAPI;
  private discordBot: DiscordBot;
  private stateManager: StateManager;
  private timezoneManager: TimezoneManager;
  private schedulerConfig: SchedulerConfig;
  private adaptiveState: AdaptivePollingState;
  private isRunning: boolean = false;
  private currentSchedule: DailySchedule | null = null;
  private pollingTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    phAPI: ProductHuntAPI,
    discordBot: DiscordBot,
    stateManager: StateManager,
    timezoneManager: TimezoneManager
  ) {
    this.phAPI = phAPI;
    this.discordBot = discordBot;
    this.stateManager = stateManager;
    this.timezoneManager = timezoneManager;

    this.schedulerConfig = {
      fetchTime: config.time.fetchAtLocal,
      timezone: config.time.botTimezone,
      pollingConfig: {
        initialInterval: config.time.pollSeconds,
        minInterval: 60, // 1 minute minimum
        maxInterval: 600, // 10 minutes maximum
        adaptiveMultiplier: 1.5,
        activityThreshold: 2,
      },
      maxDailyPolls: 1000, // Safety limit
      gracePeriodMinutes: 5,
    };

    this.adaptiveState = {
      currentInterval: this.schedulerConfig.pollingConfig.initialInterval,
      consecutiveNoChanges: 0,
      consecutiveChanges: 0,
      lastActivityTime: null,
      isActivePeriod: false,
    };
  }

  /**
   * Start the scheduler
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Scheduler is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting scheduler...');

    // Start polling for the current day immediately
    await this.runDailyCycle();

    logger.info('Scheduler started successfully');
  }

  /**
   * Stop the scheduler
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.pollingTimeout) {
      clearTimeout(this.pollingTimeout);
      this.pollingTimeout = null;
    }

    logger.info('Scheduler stopped');
  }

  /**
   * Get current scheduler status
   */
  getStatus(): {
    isRunning: boolean;
    currentSchedule: DailySchedule | null;
    adaptiveState: AdaptivePollingState;
    nextPollDelay?: number;
  } {
    return {
      isRunning: this.isRunning,
      currentSchedule: this.currentSchedule,
      adaptiveState: this.adaptiveState,
      nextPollDelay: this.adaptiveState.currentInterval,
    };
  }

  /**
   * Trigger a manual update (for testing/debugging)
   */
  async triggerManualUpdate(): Promise<void> {
    logger.info('Manual update triggered');
    try {
      // Create a temporary schedule for manual trigger
      const tempSchedule: DailySchedule = {
        date: this.timezoneManager.getCurrentPHDate().toISODate() || '',
        nextFetchTime: this.timezoneManager.getCurrentPHDate(),
        isActive: true,
        totalPolls: 0,
        lastPollTime: null,
        lastChangeTime: null,
      };
      
      this.currentSchedule = tempSchedule;
      const result = await this.performPoll();
      
      logger.info('Manual update completed successfully', {
        success: result.success,
        postsFetched: result.postsFetched,
        changesDetected: result.changesDetected,
      });
    } catch (error) {
      logger.error('Manual update failed:', error);
      throw error;
    }
  }

  /**
   * Schedule the next daily cycle
   */
  private async scheduleNextDailyCycle(): Promise<void> {
    const { duration, nextFetch } = this.timezoneManager.getTimeUntilNextFetch();

    logger.info('Scheduling next daily cycle', {
      nextFetch: nextFetch.toISO(),
      durationMinutes: Math.round(duration / (1000 * 60)),
    });

    // Schedule the initial fetch
    setTimeout(async () => {
      if (this.isRunning) {
        await this.runDailyCycle();
      }
    }, duration);
  }

  /**
   * Run a complete daily cycle
   */
  private async runDailyCycle(): Promise<void> {
    try {
      const currentDate = this.timezoneManager.getPHDateString();
      logger.info('Starting daily cycle', { date: currentDate });

      // Reset adaptive polling state
      this.resetAdaptiveState();

      // Initialize daily schedule
      this.currentSchedule = {
        date: currentDate,
        nextFetchTime: this.timezoneManager.getNextOccurrenceOfTime(this.schedulerConfig.fetchTime),
        isActive: true,
        totalPolls: 0,
        lastPollTime: null,
        lastChangeTime: null,
      };

      // Wait for grace period
      const gracePeriodMs = this.schedulerConfig.gracePeriodMinutes * 60 * 1000;
      await new Promise((resolve) => setTimeout(resolve, gracePeriodMs));

      // Start polling loop
      await this.startPollingLoop();
      
      // Also schedule the next day's cycle
      await this.scheduleNextDailyCycle();
    } catch (error) {
      logger.error('Error in daily cycle:', error);

      // Schedule next cycle even if this one failed
      if (this.isRunning) {
        await this.scheduleNextDailyCycle();
      }
    }
  }

  /**
   * Start the polling loop for the current day
   */
  private async startPollingLoop(): Promise<void> {
    if (!this.currentSchedule) {
      throw new Error('No active schedule');
    }

    logger.info('Starting polling loop', {
      date: this.currentSchedule.date,
      initialInterval: this.adaptiveState.currentInterval,
      pollIntervalSeconds: this.adaptiveState.currentInterval,
    });

    // Start the first poll immediately
    try {
      await this.performPoll();
    } catch (error) {
      logger.error('Initial poll failed, but continuing with polling loop:', error);
    }

    // Continue polling until the day ends
    this.scheduleNextPoll();
  }

  /**
   * Schedule the next poll
   */
  private scheduleNextPoll(): void {
    if (!this.isRunning || !this.currentSchedule) {
      return;
    }

    // Check if we should stop polling for today
    if (this.shouldStopPolling()) {
      logger.info('Stopping polling for today', {
        date: this.currentSchedule.date,
        totalPolls: this.currentSchedule.totalPolls,
      });

      // Schedule next day
      this.scheduleNextDailyCycle();
      return;
    }

    const delayMs = this.adaptiveState.currentInterval * 1000;

    this.pollingTimeout = setTimeout(async () => {
      if (this.isRunning) {
        try {
          await this.performPoll();
        } catch (error) {
          logger.error('Poll failed, but continuing with next poll:', error);
        }
        // Always schedule next poll, even if current poll failed
        this.scheduleNextPoll();
      }
    }, delayMs);

    logger.info('Next poll scheduled', {
      delaySeconds: this.adaptiveState.currentInterval,
      nextPollTime: DateTime.now().plus({ seconds: this.adaptiveState.currentInterval }).toISO(),
      totalPolls: this.currentSchedule.totalPolls,
    });
  }

  /**
   * Perform a single poll
   */
  private async performPoll(): Promise<PollingResult> {
    if (!this.currentSchedule) {
      throw new Error('No active schedule');
    }

    const startTime = DateTime.now();
    this.currentSchedule.lastPollTime = startTime;
    this.currentSchedule.totalPolls++;

    try {
      logger.debug('Performing poll', {
        pollNumber: this.currentSchedule.totalPolls,
        date: this.currentSchedule.date,
      });

      // Fetch posts from Product Hunt
      const result = await this.phAPI.fetchTopPosts(5);
      const posts = result.posts;

      // Check if we need to update
      const shouldUpdate = this.stateManager.shouldUpdate(this.currentSchedule.date, posts);

      if (shouldUpdate) {
        // Get or create Discord message
        const messageId = this.stateManager.getDiscordMessageId(this.currentSchedule.date);

        if (messageId) {
          // Edit existing message
          const editResult = await this.discordBot.editTopPosts(
            messageId,
            posts,
            this.timezoneManager.formatDateForDisplay(this.timezoneManager.getCurrentPHDate()),
            { includeThumbnail: true }
          );

          if (editResult.success) {
            // Update state
            await this.stateManager.updateDailyState(this.currentSchedule.date, messageId, posts);

            this.currentSchedule.lastChangeTime = DateTime.now();
            this.updateAdaptiveState(true);

            logger.info('Message updated successfully', {
              messageId,
              postCount: posts.length,
              pollNumber: this.currentSchedule.totalPolls,
            });

            return {
              success: true,
              postsFetched: posts.length,
              changesDetected: true,
              messageUpdated: true,
              nextPollDelay: this.adaptiveState.currentInterval,
            };
          } else {
            throw new Error(`Failed to edit message: ${editResult.error}`);
          }
        } else {
          // Create new message
          const postResult = await this.discordBot.postTopPosts(
            posts,
            this.timezoneManager.formatDateForDisplay(this.timezoneManager.getCurrentPHDate()),
            { includeThumbnail: true }
          );

          if (postResult.success) {
            // Update state
            await this.stateManager.updateDailyState(
              this.currentSchedule.date,
              postResult.messageId!,
              posts
            );

            this.currentSchedule.lastChangeTime = DateTime.now();
            this.updateAdaptiveState(true);

            logger.info('New message posted successfully', {
              messageId: postResult.messageId,
              postCount: posts.length,
              pollNumber: this.currentSchedule.totalPolls,
            });

            return {
              success: true,
              postsFetched: posts.length,
              changesDetected: true,
              messageUpdated: true,
              nextPollDelay: this.adaptiveState.currentInterval,
            };
          } else {
            throw new Error(`Failed to post message: ${postResult.error}`);
          }
        }
      } else {
        // No changes detected
        this.updateAdaptiveState(false);

        logger.debug('No changes detected', {
          pollNumber: this.currentSchedule.totalPolls,
          currentInterval: this.adaptiveState.currentInterval,
        });

        return {
          success: true,
          postsFetched: posts.length,
          changesDetected: false,
          messageUpdated: false,
          nextPollDelay: this.adaptiveState.currentInterval,
        };
      }
    } catch (error) {
      logger.error('Poll failed:', error);

      // Increase interval on error
      this.adaptiveState.currentInterval = Math.min(
        this.adaptiveState.currentInterval * 2,
        this.schedulerConfig.pollingConfig.maxInterval
      );

      return {
        success: false,
        postsFetched: 0,
        changesDetected: false,
        messageUpdated: false,
        error: error instanceof Error ? error.message : String(error),
        nextPollDelay: this.adaptiveState.currentInterval,
      };
    }
  }

  /**
   * Update adaptive polling state based on activity
   */
  private updateAdaptiveState(hasChanges: boolean): void {
    if (hasChanges) {
      this.adaptiveState.consecutiveChanges++;
      this.adaptiveState.consecutiveNoChanges = 0;
      this.adaptiveState.lastActivityTime = DateTime.now();
      this.adaptiveState.isActivePeriod = true;

      // Decrease interval if we're getting lots of changes
      if (
        this.adaptiveState.consecutiveChanges >=
        this.schedulerConfig.pollingConfig.activityThreshold
      ) {
        this.adaptiveState.currentInterval = Math.max(
          this.adaptiveState.currentInterval /
            this.schedulerConfig.pollingConfig.adaptiveMultiplier,
          this.schedulerConfig.pollingConfig.minInterval
        );
      }
    } else {
      this.adaptiveState.consecutiveNoChanges++;
      this.adaptiveState.consecutiveChanges = 0;

      // Increase interval if no changes for a while
      if (this.adaptiveState.consecutiveNoChanges >= 3) {
        this.adaptiveState.currentInterval = Math.min(
          this.adaptiveState.currentInterval *
            this.schedulerConfig.pollingConfig.adaptiveMultiplier,
          this.schedulerConfig.pollingConfig.maxInterval
        );
      }

      // Mark as inactive if no activity for a long time
      if (this.adaptiveState.lastActivityTime) {
        const timeSinceActivity = DateTime.now()
          .diff(this.adaptiveState.lastActivityTime)
          .as('hours');
        if (timeSinceActivity > 2) {
          this.adaptiveState.isActivePeriod = false;
        }
      }
    }
  }

  /**
   * Reset adaptive polling state for new day
   */
  private resetAdaptiveState(): void {
    this.adaptiveState = {
      currentInterval: this.schedulerConfig.pollingConfig.initialInterval,
      consecutiveNoChanges: 0,
      consecutiveChanges: 0,
      lastActivityTime: null,
      isActivePeriod: false,
    };
  }

  /**
   * Check if we should stop polling for today
   */
  private shouldStopPolling(): boolean {
    if (!this.currentSchedule) {
      return true;
    }

    // Check if we've exceeded max polls
    if (this.currentSchedule.totalPolls >= this.schedulerConfig.maxDailyPolls) {
      logger.warn('Reached maximum daily polls', {
        maxPolls: this.schedulerConfig.maxDailyPolls,
        totalPolls: this.currentSchedule.totalPolls,
      });
      return true;
    }

    // Check if it's a new day in Product Hunt timezone
    const currentPHDate = this.timezoneManager.getPHDateString();
    if (currentPHDate !== this.currentSchedule.date) {
      logger.info('New day detected, stopping polling', {
        oldDate: this.currentSchedule.date,
        newDate: currentPHDate,
      });
      return true;
    }

    return false;
  }

}
