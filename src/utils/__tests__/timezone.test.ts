import { TimezoneManager } from '../timezone';
import { DateTime } from 'luxon';

// Mock the config module
jest.mock('../../config', () => ({
  config: {
    time: {
      phTimezone: 'America/Los_Angeles',
      botTimezone: 'America/New_York',
      fetchAtLocal: '07:00',
      pollSeconds: 180,
    },
    log: {
      level: 'info',
    },
  },
}));

describe('TimezoneManager', () => {
  let timezoneManager: TimezoneManager;

  beforeEach(() => {
    timezoneManager = new TimezoneManager();
  });

  describe('getCurrentPHDate', () => {
    it('should return current date in Product Hunt timezone', () => {
      const phDate = timezoneManager.getCurrentPHDate();
      expect(phDate).toBeInstanceOf(DateTime);
      expect(phDate.zoneName).toBe('America/Los_Angeles');
    });
  });

  describe('getCurrentBotDate', () => {
    it('should return current date in bot timezone', () => {
      const botDate = timezoneManager.getCurrentBotDate();
      expect(botDate).toBeInstanceOf(DateTime);
      expect(botDate.zoneName).toBe('America/New_York');
    });
  });

  describe('isTodayInPH', () => {
    it('should return true for today in PH timezone', () => {
      const today = timezoneManager.getCurrentPHDate();
      expect(timezoneManager.isTodayInPH(today)).toBe(true);
    });

    it('should return false for yesterday in PH timezone', () => {
      const yesterday = timezoneManager.getCurrentPHDate().minus({ days: 1 });
      expect(timezoneManager.isTodayInPH(yesterday)).toBe(false);
    });
  });

  describe('getPHDateString', () => {
    it('should return date in YYYY-MM-DD format', () => {
      const dateString = timezoneManager.getPHDateString();
      expect(dateString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getNextOccurrenceOfTime', () => {
    it('should return next occurrence of specified time', () => {
      const nextTime = timezoneManager.getNextOccurrenceOfTime('07:00');
      expect(nextTime).toBeInstanceOf(DateTime);
      expect(nextTime.hour).toBe(7);
      expect(nextTime.minute).toBe(0);
    });

    it('should schedule for tomorrow if time has passed today', () => {
      const now = DateTime.now().setZone('America/New_York');
      const pastTime = `${now.hour}:${now.minute}`;
      
      // Set time to 1 hour ago
      const oneHourAgo = now.minus({ hours: 1 });
      const pastTimeString = `${oneHourAgo.hour}:${oneHourAgo.minute}`;
      
      const nextTime = timezoneManager.getNextOccurrenceOfTime(pastTimeString);
      expect(nextTime.toMillis()).toBeGreaterThan(now.toMillis());
    });
  });

  describe('getTimeUntilNextFetch', () => {
    it('should return duration and next fetch time', () => {
      const result = timezoneManager.getTimeUntilNextFetch();
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('nextFetch');
      expect(result.duration).toBeGreaterThan(0);
      expect(result.nextFetch).toBeInstanceOf(DateTime);
    });
  });

  describe('formatDateForDisplay', () => {
    it('should format date correctly', () => {
      const testDate = DateTime.fromISO('2025-01-15T10:30:00.000Z');
      const formatted = timezoneManager.formatDateForDisplay(testDate);
      expect(formatted).toBe('January 15, 2025');
    });
  });

  describe('validateTimezones', () => {
    it('should return true for valid timezones', () => {
      expect(timezoneManager.validateTimezones()).toBe(true);
    });

    it('should return true for valid timezones', () => {
      expect(timezoneManager.validateTimezones()).toBe(true);
    });
  });

  describe('getTimezoneInfo', () => {
    it('should return timezone information', () => {
      const info = timezoneManager.getTimezoneInfo();
      expect(info).toHaveProperty('phTimezone');
      expect(info).toHaveProperty('botTimezone');
      expect(info).toHaveProperty('phCurrentTime');
      expect(info).toHaveProperty('botCurrentTime');
      expect(info.phTimezone).toBe('America/Los_Angeles');
      expect(info.botTimezone).toBe('America/New_York');
    });
  });
});
