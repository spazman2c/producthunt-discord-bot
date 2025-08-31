import dotenv from 'dotenv';
import { AppConfig } from '../types/config';

// Load environment variables
dotenv.config();

function validateConfig(): AppConfig {
  const requiredEnvVars = [
    'PH_API_URL',
    'PH_TOKEN',
    'DISCORD_TOKEN',
    'DISCORD_CHANNEL_ID',
    'PH_TIMEZONE',
    'BOT_TIMEZONE',
    'FETCH_AT_LOCAL',
    'POLL_SECONDS',
    'LOG_LEVEL',
  ];

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  const pollSeconds = parseInt(process.env.POLL_SECONDS!, 10);
  if (isNaN(pollSeconds) || pollSeconds < 30) {
    throw new Error('POLL_SECONDS must be a number >= 30');
  }

  const config: AppConfig = {
    productHunt: {
      apiUrl: process.env.PH_API_URL!,
      token: process.env.PH_TOKEN!,
    },
    discord: {
      token: process.env.DISCORD_TOKEN!,
      channelId: process.env.DISCORD_CHANNEL_ID!,
    },
    time: {
      phTimezone: process.env.PH_TIMEZONE!,
      botTimezone: process.env.BOT_TIMEZONE!,
      fetchAtLocal: process.env.FETCH_AT_LOCAL!,
      pollSeconds,
    },
    log: {
      level: process.env.LOG_LEVEL!,
    },
  };

  return config;
}

// Export validated config
export const config = validateConfig();
