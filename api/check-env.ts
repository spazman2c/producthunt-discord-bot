import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const requiredVars = [
    'PH_API_URL',
    'PH_TOKEN',
    'DISCORD_TOKEN',
    'DISCORD_CHANNEL_ID',
  ];

  const optionalVars = [
    'PH_TIMEZONE',
    'BOT_TIMEZONE',
    'FETCH_AT_LOCAL',
    'POLL_SECONDS',
    'LOG_LEVEL',
  ];

  const missingRequired = requiredVars.filter(varName => !process.env[varName]);
  const missingOptional = optionalVars.filter(varName => !process.env[varName]);
  const presentVars = [...requiredVars, ...optionalVars].filter(varName => process.env[varName]);

  const status = {
    ready: missingRequired.length === 0,
    required: {
      missing: missingRequired,
      present: requiredVars.filter(varName => process.env[varName]),
    },
    optional: {
      missing: missingOptional,
      present: optionalVars.filter(varName => process.env[varName]),
    },
    all: {
      missing: [...missingRequired, ...missingOptional],
      present: presentVars,
    },
    recommendations: [] as string[],
  };

  if (missingRequired.length > 0) {
    status.recommendations.push(`Set these required environment variables: ${missingRequired.join(', ')}`);
  }

  if (missingOptional.length > 0) {
    status.recommendations.push(`Consider setting these optional variables: ${missingOptional.join(', ')}`);
  }

  if (status.ready) {
    status.recommendations.push('All required environment variables are set. Bot should be ready to run.');
  }

  res.status(200).json(status);
}
