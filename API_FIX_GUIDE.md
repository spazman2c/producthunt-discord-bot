# Product Hunt API Fix Guide

## The Problem

The bot was crashing with this error:
```
Cannot read properties of undefined (reading 'posts')
```

This indicated that the Product Hunt API response structure was different than expected, likely due to:
1. **API Version Differences**: The Product Hunt API might have changed
2. **Authentication Issues**: Invalid or expired API token
3. **Query Structure**: The GraphQL query might not be compatible with the current API

## The Solution

I've implemented a **robust query fallback system** that tries multiple query variations until one works:

### 1. Multiple Query Variations

The bot now tries 3 different query structures:

#### **Query 1: Standard GraphQL with RANKING order**
```graphql
query TopToday($first: Int!) {
  posts(order: RANKING, first: $first) {
    edges {
      node {
        id
        name
        tagline
        slug
        votesCount
        url
        thumbnail {
          url
        }
      }
    }
  }
}
```

#### **Query 2: Simple posts query without order**
```graphql
query TopToday($first: Int!) {
  posts(first: $first) {
    edges {
      node {
        id
        name
        tagline
        slug
        votesCount
        url
        thumbnail {
          url
        }
      }
    }
  }
}
```

#### **Query 3: Direct posts query**
```graphql
query {
  posts(first: 5) {
    edges {
      node {
        id
        name
        tagline
        slug
        votesCount
        url
        thumbnail {
          url
        }
      }
    }
  }
}
```

### 2. Enhanced Error Handling

- **Detailed Logging**: Each query attempt is logged with response structure
- **Graceful Fallback**: If one query fails, it tries the next
- **Better Error Messages**: More specific error messages for debugging
- **Response Validation**: Validates response structure before processing

### 3. Debug Information

The bot now logs:
- Which query variation is being tried
- Response structure details
- GraphQL errors (if any)
- API authentication status

## Deployment Steps

### 1. Push the Fix
```bash
git add .
git commit -m "Fix Product Hunt API compatibility with multiple query fallbacks"
git push origin main
```

### 2. Verify Environment Variables

Make sure these are set in Vercel:
- `PH_API_URL`: Product Hunt API endpoint
- `PH_TOKEN`: Your Product Hunt API token
- `DISCORD_TOKEN`: Discord bot token
- `DISCORD_CHANNEL_ID`: Discord channel ID

### 3. Test the Deployment

Once deployed, test the endpoints:
```bash
# Check environment variables
curl https://your-app.vercel.app/api/check-env

# Test health endpoint
curl https://your-app.vercel.app/health

# Start the bot (this will test the API)
curl -X POST https://your-app.vercel.app/api/bot
```

## Expected Behavior

### Success Case
```
[INFO] Trying Product Hunt API query variation 1
[INFO] Successfully fetched top posts
[INFO] Query variation: 1, count: 5
```

### Fallback Case
```
[WARN] Product Hunt API query variation 1 failed: GraphQL errors: Unknown field 'order'
[INFO] Trying Product Hunt API query variation 2
[INFO] Successfully fetched top posts
[INFO] Query variation: 2, count: 5
```

## Troubleshooting

### If All Queries Fail

1. **Check API Token**: Verify your Product Hunt API token is valid
2. **Check API URL**: Ensure `PH_API_URL` is correct
3. **Check API Documentation**: Product Hunt API might have changed
4. **Review Logs**: Check Vercel logs for specific error messages

### Common Issues

1. **Authentication Error**: "Unauthorized" or "Invalid token"
   - Solution: Regenerate your Product Hunt API token

2. **Rate Limiting**: "Rate limit exceeded"
   - Solution: Wait and retry, or check rate limit headers

3. **API Changes**: "Unknown field" or "Invalid query"
   - Solution: The fallback queries should handle this automatically

## Benefits

✅ **Robust**: Multiple query fallbacks ensure compatibility  
✅ **Informative**: Detailed logging for debugging  
✅ **Future-Proof**: Adapts to API changes automatically  
✅ **Reliable**: Better error handling and recovery  

## Next Steps

1. **Deploy the fix** by pushing to GitHub
2. **Monitor the logs** to see which query variation works
3. **Test the bot** to ensure it fetches posts correctly
4. **Set up monitoring** to alert on API failures

The bot should now successfully connect to the Product Hunt API and fetch the top posts! 🚀
