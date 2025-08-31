# Product Hunt API Troubleshooting Guide

## Current Issue

The bot is failing with:
```
Product Hunt API response missing data property
```

This indicates that the Product Hunt API is not returning the expected GraphQL response structure.

## Root Cause Analysis

The error suggests one of these issues:

1. **Incorrect API URL**: The Product Hunt API endpoint might be wrong
2. **Authentication Failure**: Invalid or expired API token
3. **API Version Mismatch**: The API might have changed
4. **Network/Proxy Issues**: Connection problems

## Immediate Fixes

### 1. Check Environment Variables

First, verify your environment variables in Vercel:

```bash
# Check current environment variables
curl https://your-app.vercel.app/api/check-env
```

Make sure these are set correctly:
- `PH_API_URL`: Should be `https://api.producthunt.com/v2/api/graphql`
- `PH_TOKEN`: Your Product Hunt API token (should be a long string)

### 2. Verify API Token

1. **Get a new API token** from Product Hunt:
   - Go to https://www.producthunt.com/developers
   - Create a new app or use existing one
   - Generate a new API token

2. **Test the token locally**:
   ```bash
   # Set your token locally
   export PH_TOKEN="your_token_here"
   
   # Test the API
   npx ts-node src/test-api-response.ts
   ```

### 3. Update API URL

The correct Product Hunt API URL should be:
```
https://api.producthunt.com/v2/api/graphql
```

If you're using a different URL, update it in Vercel.

## Testing Steps

### Step 1: Local API Test

Run this to test your API token and URL:

```bash
# Set environment variables
export PH_TOKEN="your_token_here"

# Test the API
npx ts-node src/test-api-response.ts
```

Expected output:
```
✅ Success! Response structure:
Response type: object
Response keys: ['data']
Full response: {"data":{"viewer":{"id":"123","name":"Your Name"}}}

✅ Posts query successful!
Posts response: {"data":{"posts":{"edges":[{"node":{"id":"123","name":"Product Name"}}]}}}
```

### Step 2: Check Vercel Logs

After deploying, check the detailed logs to see:
- Which API URL is being used
- What the actual response looks like
- Any authentication errors

### Step 3: Test Different API URLs

If the current URL doesn't work, try these alternatives:

1. `https://api.producthunt.com/v2/api/graphql` (current)
2. `https://api.producthunt.com/v2/graphql`
3. `https://api.producthunt.com/graphql`

## Common Issues & Solutions

### Issue 1: "Unauthorized" or "Invalid token"
**Solution**: Regenerate your Product Hunt API token

### Issue 2: "API endpoint not found"
**Solution**: Use the correct API URL: `https://api.producthunt.com/v2/api/graphql`

### Issue 3: "Rate limit exceeded"
**Solution**: Wait and retry, or check your API usage limits

### Issue 4: "Network error"
**Solution**: Check if the API is accessible from your deployment region

## Debug Information

The bot now logs detailed information:

```
[INFO] Initializing Product Hunt API client {"apiUrl":"https://api.producthunt.com/v2/api/graphql","tokenLength":64}
[DEBUG] Product Hunt API raw result: {"queryVariation":1,"resultType":"object","resultKeys":["data"],"resultString":"..."}
[DEBUG] Product Hunt API raw response: {"queryVariation":1,"hasErrors":false,"errorCount":0,"hasData":true,"responseKeys":["data"],"fullResponse":"..."}
```

## Quick Fix Checklist

- [ ] **Verify API Token**: Generate a new token from Product Hunt
- [ ] **Check API URL**: Ensure it's `https://api.producthunt.com/v2/api/graphql`
- [ ] **Test Locally**: Run `npx ts-node src/test-api-response.ts`
- [ ] **Update Vercel**: Set correct environment variables
- [ ] **Deploy**: Push changes and test deployment
- [ ] **Monitor Logs**: Check Vercel logs for detailed error information

## Expected Success Response

When working correctly, you should see:

```
[INFO] Initializing Product Hunt API client
[INFO] Trying Product Hunt API query variation 1
[INFO] Successfully fetched top posts
[INFO] Query variation: 1, count: 5
[INFO] Product Hunt API connection successful
```

## Next Steps

1. **Test your API token locally** using the provided test script
2. **Update environment variables** in Vercel with correct values
3. **Deploy and monitor** the logs for detailed debugging information
4. **Verify the bot starts** without API errors

The enhanced logging will help identify exactly what's going wrong with the API connection.
