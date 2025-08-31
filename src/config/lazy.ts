import { AppConfig } from '../types/config';

let cachedConfig: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  // Only load config when actually needed
  const { config } = require('./index');
  cachedConfig = config;
  return cachedConfig!;
}

export function clearConfig(): void {
  cachedConfig = null;
}
