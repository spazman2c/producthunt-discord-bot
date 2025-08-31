# Deployment Fix - ES Module Issue

## The Problem

The bot was crashing with this error:
```
Error [ERR_REQUIRE_ESM]: require() of ES Module /app/node_modules/p-retry/index.js from /app/dist/services/producthunt.js not supported.
```

This happened because `p-retry` is an ES module that can't be imported using CommonJS `require()`.

## The Solution

I've fixed this by:

1. **Removed `p-retry`** dependency
2. **Created a custom retry utility** (`src/utils/retry.ts`)
3. **Updated Product Hunt service** to use the new retry utility

## What Changed

### 1. Custom Retry Utility (`src/utils/retry.ts`)
```typescript
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T>
```

Features:
- Exponential backoff
- Configurable retry attempts
- Random jitter to prevent thundering herd
- Maximum timeout limits

### 2. Updated Product Hunt Service
- Replaced `pRetry` with our custom `retry` function
- Maintained the same retry behavior
- Simplified error handling

## Deployment Steps

### 1. Push the Fix
```bash
git add .
git commit -m "Fix ES module issue by replacing p-retry with custom retry utility"
git push origin main
```

### 2. Verify Build
The build should now succeed without ES module errors.

### 3. Test Deployment
Once deployed, test the endpoints:
```bash
# Check environment variables
curl https://your-app.vercel.app/api/check-env

# Test health endpoint
curl https://your-app.vercel.app/health

# Start the bot
curl -X POST https://your-app.vercel.app/api/bot
```

## Benefits of the Fix

1. **No ES Module Issues**: All dependencies are CommonJS compatible
2. **Better Control**: Custom retry logic with specific error handling
3. **Smaller Bundle**: Removed unnecessary dependency
4. **More Reliable**: Simplified dependency tree

## Retry Configuration

The new retry utility uses these defaults:
- **Retries**: 3 attempts
- **Factor**: 2x exponential backoff
- **Min Timeout**: 1 second
- **Max Timeout**: 10 seconds
- **Randomize**: Yes (prevents thundering herd)

## Next Steps

1. **Deploy the fix** by pushing to GitHub
2. **Set environment variables** in Vercel dashboard
3. **Test the bot** using the API endpoints
4. **Monitor the deployment** for any issues

The bot should now deploy and run successfully! 🚀
