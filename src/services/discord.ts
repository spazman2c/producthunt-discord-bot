import {
  Client,
  GatewayIntentBits,
  TextChannel,
  EmbedBuilder,
  Message,
  ActivityType,
} from 'discord.js';
import { config } from '../config';
import { logger } from '../utils/logger';
import { TransformedPost } from '../types/producthunt';
import { DiscordMessageResult, DiscordEmbedOptions } from '../types/discord';

export class DiscordBot {
  private client: Client;
  private channelId: string;
  private isReady: boolean = false;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });
    this.channelId = config.discord.channelId;

    this.setupEventHandlers();
  }

  /**
   * Setup Discord client event handlers
   */
  private setupEventHandlers(): void {
    this.client.on('ready', () => {
      this.isReady = true;
      logger.info('Discord bot is ready!', {
        botName: this.client.user?.username,
        botId: this.client.user?.id,
      });

      // Set bot activity
      this.client.user?.setActivity('Product Hunt Top 5', {
        type: ActivityType.Watching,
      });
    });

    this.client.on('error', (error) => {
      logger.error('Discord client error:', error);
    });

    this.client.on('disconnect', () => {
      this.isReady = false;
      logger.warn('Discord bot disconnected');
    });
  }

  /**
   * Connect to Discord
   */
  async connect(): Promise<void> {
    try {
      logger.info('Connecting to Discord...');
      await this.client.login(config.discord.token);
    } catch (error) {
      logger.error('Failed to connect to Discord:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Discord
   */
  async disconnect(): Promise<void> {
    try {
      logger.info('Disconnecting from Discord...');
      await this.client.destroy();
      this.isReady = false;
    } catch (error) {
      logger.error('Error disconnecting from Discord:', error);
    }
  }

  /**
   * Get the target channel
   */
  private async getChannel(): Promise<TextChannel> {
    if (!this.isReady) {
      throw new Error('Discord bot is not ready');
    }

    const channel = await this.client.channels.fetch(this.channelId);
    if (!channel || !channel.isTextBased()) {
      throw new Error(`Channel ${this.channelId} not found or not a text channel`);
    }

    return channel as TextChannel;
  }

  /**
   * Create a rich embed for the top 5 posts
   */
  createTopPostsEmbed(
    posts: TransformedPost[],
    dateString: string,
    options: DiscordEmbedOptions = {}
  ): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setTitle(`Top 5 on Product Hunt — ${dateString}`)
      .setColor(options.color || 0xda552f) // Product Hunt orange
      .setTimestamp()
      .setFooter({
        text: options.footerText || 'Auto-updating until midnight PT',
        iconURL: 'https://ph-static.imgix.net/ph-logo.png',
      });

    // Build description with posts
    const description = posts
      .map(
        (post) =>
          `**#${post.rank} • ${post.name}**\n${post.tagline}\n👍 ${post.votes} | [View on Product Hunt](${post.url})`
      )
      .join('\n\n');

    embed.setDescription(description);

    // Add thumbnail if requested and available
    if (options.includeThumbnail && posts[0]?.thumbnail) {
      embed.setThumbnail(posts[0].thumbnail);
    }

    return embed;
  }

  /**
   * Post the top 5 posts to Discord
   */
  async postTopPosts(
    posts: TransformedPost[],
    dateString: string,
    options: DiscordEmbedOptions = {}
  ): Promise<DiscordMessageResult> {
    try {
      const channel = await this.getChannel();
      const embed = this.createTopPostsEmbed(posts, dateString, options);

      logger.info('Posting top 5 posts to Discord', {
        channelId: this.channelId,
        postCount: posts.length,
      });

      const message = await channel.send({ embeds: [embed] });

      logger.info('Successfully posted to Discord', {
        messageId: message.id,
        channelId: this.channelId,
      });

      return {
        success: true,
        messageId: message.id,
      };
    } catch (error) {
      logger.error('Failed to post to Discord:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Edit an existing message with updated posts
   */
  async editTopPosts(
    messageId: string,
    posts: TransformedPost[],
    dateString: string,
    options: DiscordEmbedOptions = {}
  ): Promise<DiscordMessageResult> {
    try {
      const channel = await this.getChannel();
      const embed = this.createTopPostsEmbed(posts, dateString, options);

      logger.info('Editing Discord message', {
        messageId,
        channelId: this.channelId,
        postCount: posts.length,
      });

      const message = await channel.messages.fetch(messageId);
      await message.edit({ embeds: [embed] });

      logger.info('Successfully edited Discord message', {
        messageId,
        channelId: this.channelId,
      });

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      logger.error('Failed to edit Discord message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      const channel = await this.getChannel();
      const message = await channel.messages.fetch(messageId);
      await message.delete();

      logger.info('Successfully deleted Discord message', { messageId });
      return true;
    } catch (error) {
      logger.error('Failed to delete Discord message:', error);
      return false;
    }
  }

  /**
   * Test the Discord connection and permissions
   */
  async testConnection(): Promise<boolean> {
    try {
      logger.info('Testing Discord connection...');
      
      const channel = await this.getChannel();
      
      // Test if we can send messages
      const testMessage = await channel.send('🔄 Testing bot connection...');
      await testMessage.delete();

      logger.info('Discord connection test successful');
      return true;
    } catch (error) {
      logger.error('Discord connection test failed:', error);
      return false;
    }
  }

  /**
   * Get bot status
   */
  getStatus(): {
    isReady: boolean;
    botName?: string;
    botId?: string;
    channelId: string;
  } {
    return {
      isReady: this.isReady,
      botName: this.client.user?.username,
      botId: this.client.user?.id,
      channelId: this.channelId,
    };
  }
}
