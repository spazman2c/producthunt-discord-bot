// Test setup file
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock environment variables for testing
process.env.PH_API_URL = 'https://api.producthunt.com/v2/api/graphql';
process.env.PH_TOKEN = 'test_token';
process.env.DISCORD_TOKEN = 'test_discord_token';
process.env.DISCORD_CHANNEL_ID = '123456789';
process.env.PH_TIMEZONE = 'America/Los_Angeles';
process.env.BOT_TIMEZONE = 'America/New_York';
process.env.FETCH_AT_LOCAL = '07:00';
process.env.POLL_SECONDS = '180';
process.env.LOG_LEVEL = 'error'; // Reduce log noise in tests

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
