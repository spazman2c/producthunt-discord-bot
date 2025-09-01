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
  ];

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    console.error('Please set these environment variables in your Vercel project settings');
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  const pollSeconds = parseInt(process.env.POLL_SECONDS || '180', 10);
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
      phTimezone: process.env.PH_TIMEZONE || 'America/New_York',
      botTimezone: process.env.BOT_TIMEZONE || 'America/New_York',
      fetchAtLocal: process.env.FETCH_AT_LOCAL || '07:00',
      pollSeconds,
    },
    log: {
      level: process.env.LOG_LEVEL || 'info',
    },
  };

  return config;
}

// Export validated config
export const config = validateConfig();
