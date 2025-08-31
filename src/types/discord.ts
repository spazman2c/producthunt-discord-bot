import { EmbedBuilder, TextChannel } from 'discord.js';
import { TransformedPost } from './producthunt';

export interface DiscordMessageData {
  messageId: string;
  channelId: string;
  guildId?: string;
  timestamp: Date;
}

export interface DiscordEmbedOptions {
  includeThumbnail?: boolean;
  color?: number;
  footerText?: string;
}

export interface DiscordBotConfig {
  token: string;
  channelId: string;
  intents: number[];
}

export interface DiscordMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface DiscordEmbedData {
  title: string;
  description: string;
  color?: number;
  thumbnail?: string;
  footer?: {
    text: string;
    iconURL?: string;
  };
  timestamp?: Date;
}
