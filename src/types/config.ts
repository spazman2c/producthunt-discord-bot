export interface ProductHuntConfig {
  apiUrl: string;
  token: string;
}

export interface DiscordConfig {
  token: string;
  channelId: string;
}

export interface TimeConfig {
  phTimezone: string;
  botTimezone: string;
  fetchAtLocal: string;
  pollSeconds: number;
}

export interface LogConfig {
  level: string;
}

export interface AppConfig {
  productHunt: ProductHuntConfig;
  discord: DiscordConfig;
  time: TimeConfig;
  log: LogConfig;
}
