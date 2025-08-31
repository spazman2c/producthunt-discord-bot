export interface DailyState {
  date: string; // YYYY-MM-DD format
  discordMessageId: string;
  lastItems: CachedPost[];
  lastUpdated: Date;
  totalUpdates: number;
}

export interface CachedPost {
  id: string;
  rank: number;
  votes: number;
  slug: string;
  name: string;
  tagline: string;
  url: string;
  thumbnail?: string | undefined;
}

export interface StateChange {
  type: 'vote_change' | 'rank_change' | 'new_post' | 'removed_post' | 'no_change';
  changes: PostChange[];
  summary: string;
}

export interface PostChange {
  postId: string;
  postName: string;
  oldRank?: number;
  newRank?: number;
  oldVotes?: number;
  newVotes?: number;
  changeType: 'vote_change' | 'rank_change' | 'new_post' | 'removed_post';
}

export interface StateManagerConfig {
  cacheFilePath: string;
  maxCacheAge: number; // in milliseconds
  backupInterval: number; // in milliseconds
}

export interface CacheStats {
  totalDays: number;
  totalUpdates: number;
  lastBackup: Date | null;
  cacheSize: number; // in bytes
}
