import { config } from '../index';

describe('Configuration', () => {
  beforeEach(() => {
    // Reset environment variables
    delete process.env.PH_API_URL;
    delete process.env.PH_TOKEN;
    delete process.env.DISCORD_TOKEN;
    delete process.env.DISCORD_CHANNEL_ID;
    delete process.env.PH_TIMEZONE;
    delete process.env.BOT_TIMEZONE;
    delete process.env.FETCH_AT_LOCAL;
    delete process.env.POLL_SECONDS;
    delete process.env.LOG_LEVEL;
  });

  afterEach(() => {
    // Restore environment variables
    process.env.PH_API_URL = 'https://api.producthunt.com/v2/api/graphql';
    process.env.PH_TOKEN = 'test_token';
    process.env.DISCORD_TOKEN = 'test_discord_token';
    process.env.DISCORD_CHANNEL_ID = '123456789';
    process.env.PH_TIMEZONE = 'America/Los_Angeles';
    process.env.BOT_TIMEZONE = 'America/New_York';
    process.env.FETCH_AT_LOCAL = '07:00';
    process.env.POLL_SECONDS = '180';
    process.env.LOG_LEVEL = 'info';
  });

  it('should load configuration successfully with valid environment variables', () => {
    // Set up environment variables
    process.env.PH_API_URL = 'https://api.producthunt.com/v2/api/graphql';
    process.env.PH_TOKEN = 'test_token';
    process.env.DISCORD_TOKEN = 'test_discord_token';
    process.env.DISCORD_CHANNEL_ID = '123456789';
    process.env.PH_TIMEZONE = 'America/Los_Angeles';
    process.env.BOT_TIMEZONE = 'America/New_York';
    process.env.FETCH_AT_LOCAL = '07:00';
    process.env.POLL_SECONDS = '180';
    process.env.LOG_LEVEL = 'info';

    // Re-import config to trigger validation
    jest.resetModules();
    const { config: newConfig } = require('../index');

    expect(newConfig.productHunt.apiUrl).toBe('https://api.producthunt.com/v2/api/graphql');
    expect(newConfig.productHunt.token).toBe('test_token');
    expect(newConfig.discord.token).toBe('test_discord_token');
    expect(newConfig.discord.channelId).toBe('123456789');
    expect(newConfig.time.phTimezone).toBe('America/Los_Angeles');
    expect(newConfig.time.botTimezone).toBe('America/New_York');
    expect(newConfig.time.fetchAtLocal).toBe('07:00');
    expect(newConfig.time.pollSeconds).toBe(180);
    expect(newConfig.log.level).toBe('info');
  });

  it('should throw error when required environment variables are missing', () => {
    // Don't set any environment variables
    expect(() => {
      jest.resetModules();
      require('../index');
    }).toThrow('Missing required environment variables');
  });

  it('should throw error when POLL_SECONDS is invalid', () => {
    // Set up environment variables with invalid POLL_SECONDS
    process.env.PH_API_URL = 'https://api.producthunt.com/v2/api/graphql';
    process.env.PH_TOKEN = 'test_token';
    process.env.DISCORD_TOKEN = 'test_discord_token';
    process.env.DISCORD_CHANNEL_ID = '123456789';
    process.env.PH_TIMEZONE = 'America/Los_Angeles';
    process.env.BOT_TIMEZONE = 'America/New_York';
    process.env.FETCH_AT_LOCAL = '07:00';
    process.env.POLL_SECONDS = 'invalid';
    process.env.LOG_LEVEL = 'info';

    expect(() => {
      jest.resetModules();
      require('../index');
    }).toThrow('POLL_SECONDS must be a number >= 30');
  });

  it('should throw error when POLL_SECONDS is too low', () => {
    // Set up environment variables with POLL_SECONDS too low
    process.env.PH_API_URL = 'https://api.producthunt.com/v2/api/graphql';
    process.env.PH_TOKEN = 'test_token';
    process.env.DISCORD_TOKEN = 'test_discord_token';
    process.env.DISCORD_CHANNEL_ID = '123456789';
    process.env.PH_TIMEZONE = 'America/Los_Angeles';
    process.env.BOT_TIMEZONE = 'America/New_York';
    process.env.FETCH_AT_LOCAL = '07:00';
    process.env.POLL_SECONDS = '20';
    process.env.LOG_LEVEL = 'info';

    expect(() => {
      jest.resetModules();
      require('../index');
    }).toThrow('POLL_SECONDS must be a number >= 30');
  });
});
