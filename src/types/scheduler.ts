import { DateTime } from 'luxon';

export interface PollingConfig {
  initialInterval: number; // seconds
  minInterval: number; // seconds
  maxInterval: number; // seconds
  adaptiveMultiplier: number; // how much to increase/decrease interval
  activityThreshold: number; // minimum changes to consider "active"
}

export interface DailySchedule {
  date: string; // YYYY-MM-DD
  nextFetchTime: DateTime;
  isActive: boolean;
  totalPolls: number;
  lastPollTime: DateTime | null;
  lastChangeTime: DateTime | null;
}

export interface PollingResult {
  success: boolean;
  postsFetched: number;
  changesDetected: boolean;
  messageUpdated: boolean;
  error?: string;
  nextPollDelay: number; // seconds
}

export interface AdaptivePollingState {
  currentInterval: number;
  consecutiveNoChanges: number;
  consecutiveChanges: number;
  lastActivityTime: DateTime | null;
  isActivePeriod: boolean;
}

export interface SchedulerConfig {
  fetchTime: string; // HH:mm format
  timezone: string;
  pollingConfig: PollingConfig;
  maxDailyPolls: number;
  gracePeriodMinutes: number; // minutes after fetch time to start polling
}
