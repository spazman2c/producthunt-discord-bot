import { DateTime } from 'luxon';
import { config } from '../config';
import { logger } from './logger';

export class TimezoneManager {
  private phTimezone: string;
  private botTimezone: string;

  constructor() {
    this.phTimezone = config.time.phTimezone;
    this.botTimezone = config.time.botTimezone;
  }

  /**
   * Get the current date in Product Hunt timezone
   * @returns DateTime in PH timezone
   */
  getCurrentPHDate(): DateTime {
    return DateTime.now().setZone(this.phTimezone);
  }

  /**
   * Get the current date in bot timezone
   * @returns DateTime in bot timezone
   */
  getCurrentBotDate(): DateTime {
    return DateTime.now().setZone(this.botTimezone);
  }

  /**
   * Check if a given date is "today" in Product Hunt timezone
   * @param date DateTime to check
   * @returns boolean
   */
  isTodayInPH(date: DateTime): boolean {
    const phToday = this.getCurrentPHDate();
    return date.hasSame(phToday, 'day');
  }

  /**
   * Get the date string in YYYY-MM-DD format for Product Hunt timezone
   * @returns string
   */
  getPHDateString(): string {
    return this.getCurrentPHDate().toFormat('yyyy-MM-dd');
  }

  /**
   * Parse a time string (HH:mm) and convert it to the next occurrence in bot timezone
   * @param timeString Time in HH:mm format
   * @returns DateTime of next occurrence
   */
  getNextOccurrenceOfTime(timeString: string): DateTime {
    const [hours, minutes] = timeString.split(':').map(Number);
    const now = this.getCurrentBotDate();

    let targetTime = now.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });

    // If the time has already passed today, schedule for tomorrow
    if (targetTime <= now) {
      targetTime = targetTime.plus({ days: 1 });
    }

    return targetTime;
  }

  /**
   * Get the time until the next scheduled fetch
   * @returns Duration until next fetch
   */
  getTimeUntilNextFetch(): { duration: number; nextFetch: DateTime } {
    const nextFetch = this.getNextOccurrenceOfTime(config.time.fetchAtLocal);
    const duration = nextFetch.diff(DateTime.now()).as('milliseconds');

    return { duration, nextFetch };
  }

  /**
   * Format a date for display
   * @param date DateTime to format
   * @returns Formatted date string
   */
  formatDateForDisplay(date: DateTime): string {
    return date.toFormat('MMMM d, yyyy');
  }

  /**
   * Validate timezone strings
   * @returns boolean
   */
  validateTimezones(): boolean {
    try {
      DateTime.now().setZone(this.phTimezone);
      DateTime.now().setZone(this.botTimezone);
      return true;
    } catch (error) {
      logger.error('Invalid timezone configuration', {
        phTimezone: this.phTimezone,
        botTimezone: this.botTimezone,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Get timezone information for logging
   * @returns Timezone info object
   */
  getTimezoneInfo(): {
    phTimezone: string;
    botTimezone: string;
    phCurrentTime: string;
    botCurrentTime: string;
  } {
    return {
      phTimezone: this.phTimezone,
      botTimezone: this.botTimezone,
      phCurrentTime: this.getCurrentPHDate().toISO() || '',
      botCurrentTime: this.getCurrentBotDate().toISO() || '',
    };
  }
}
