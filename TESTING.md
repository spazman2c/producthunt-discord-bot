# Testing Guide

This document provides comprehensive testing instructions for the Product Hunt Top 5 Discord Bot.

## Automated Testing

### Unit Tests
Run unit tests to verify individual components:
```bash
npm test
```

### Integration Tests
Run integration tests to verify component interactions:
```bash
npm test -- --testPathPattern=integration
```

### Coverage Report
Generate test coverage report:
```bash
npm run test:coverage
```

### Watch Mode
Run tests in watch mode for development:
```bash
npm run test:watch
```

## Manual Testing Checklist

### 1. Configuration Testing
- [ ] **Environment Variables**: Verify all required environment variables are set
- [ ] **Timezone Configuration**: Test with different timezone combinations
- [ ] **API Tokens**: Verify Product Hunt and Discord tokens are valid
- [ ] **Channel Permissions**: Ensure bot has proper Discord channel permissions

### 2. Product Hunt API Testing
```bash
npm run test:ph
```
- [ ] **API Connection**: Bot successfully connects to Product Hunt API
- [ ] **Data Fetching**: Bot retrieves top 5 posts correctly
- [ ] **Error Handling**: Bot handles API errors gracefully
- [ ] **Rate Limiting**: Bot respects API rate limits

### 3. Discord Bot Testing
```bash
npm run test:discord
```
- [ ] **Bot Connection**: Bot connects to Discord successfully
- [ ] **Message Posting**: Bot posts messages to configured channel
- [ ] **Message Editing**: Bot edits existing messages correctly
- [ ] **Embed Formatting**: Rich embeds display correctly
- [ ] **Error Handling**: Bot handles Discord API errors gracefully

### 4. State Management Testing
```bash
npm run test:state
```
- [ ] **Cache Persistence**: State persists across bot restarts
- [ ] **Change Detection**: Bot detects vote and rank changes correctly
- [ ] **No Duplicate Posts**: Bot doesn't post duplicate messages
- [ ] **Cache Cleanup**: Old cache entries are cleaned up properly

### 5. Scheduler Testing
```bash
npm run test:scheduler
```
- [ ] **Daily Scheduling**: Bot schedules daily cycles correctly
- [ ] **Adaptive Polling**: Polling intervals adjust based on activity
- [ ] **Timezone Handling**: Bot handles timezone transitions correctly
- [ ] **Graceful Shutdown**: Bot shuts down cleanly

### 6. Integration Testing
```bash
npm run test:scheduler
```
- [ ] **Complete Workflow**: End-to-end workflow functions correctly
- [ ] **Error Recovery**: System recovers from errors gracefully
- [ ] **State Consistency**: State remains consistent across operations
- [ ] **Performance**: System performs well under normal load

## Production Testing Scenarios

### Scenario 1: Normal Operation
1. Start the bot with valid configuration
2. Verify bot posts at scheduled time (7:00 AM)
3. Monitor polling throughout the day
4. Verify vote count updates are reflected
5. Check that no duplicate messages are posted

### Scenario 2: Bot Restart
1. Start the bot and let it post initial message
2. Stop the bot (Ctrl+C)
3. Restart the bot
4. Verify bot resumes polling without duplicate posts
5. Check that state is preserved

### Scenario 3: API Errors
1. Temporarily use invalid Product Hunt token
2. Verify bot handles API errors gracefully
3. Restore valid token
4. Verify bot resumes normal operation
5. Check error logging

### Scenario 4: Discord Errors
1. Temporarily use invalid Discord token
2. Verify bot handles Discord errors gracefully
3. Restore valid token
4. Verify bot resumes normal operation
5. Check error logging

### Scenario 5: Timezone Changes
1. Test during daylight saving time transitions
2. Verify bot handles timezone changes correctly
3. Check that scheduling remains accurate
4. Verify Product Hunt date calculations are correct

### Scenario 6: High Activity Periods
1. Monitor during Product Hunt launch days
2. Verify adaptive polling works correctly
3. Check that rate limits are respected
4. Verify all changes are captured

## Performance Testing

### Load Testing
- [ ] **Polling Frequency**: Verify bot can handle frequent polls
- [ ] **Memory Usage**: Monitor memory usage over time
- [ ] **CPU Usage**: Check CPU usage during peak activity
- [ ] **Network Usage**: Monitor API call frequency

### Stress Testing
- [ ] **Rapid Changes**: Test with rapidly changing vote counts
- [ ] **API Limits**: Test behavior when approaching rate limits
- [ ] **Concurrent Operations**: Test multiple operations simultaneously
- [ ] **Long Running**: Test bot stability over extended periods

## Security Testing

### Token Security
- [ ] **Environment Variables**: Verify tokens are not logged
- [ ] **File Permissions**: Check cache file permissions
- [ ] **Network Security**: Verify HTTPS connections
- [ ] **Token Rotation**: Test token update procedures

### Input Validation
- [ ] **API Responses**: Verify bot handles malformed API responses
- [ ] **Invalid Data**: Test with invalid post data
- [ ] **Edge Cases**: Test with empty or partial data
- [ ] **Malicious Input**: Test with potentially harmful data

## Monitoring and Logging

### Log Verification
- [ ] **Info Logs**: Verify important events are logged
- [ ] **Error Logs**: Check error logging is comprehensive
- [ ] **Debug Logs**: Verify debug information is available
- [ ] **Log Levels**: Test different log level configurations

### Metrics Collection
- [ ] **Poll Count**: Monitor number of polls per day
- [ ] **Update Count**: Track number of Discord updates
- [ ] **Error Rate**: Monitor error frequency
- [ ] **Response Times**: Track API response times

## Deployment Testing

### Environment Setup
- [ ] **Production Environment**: Test in production-like environment
- [ ] **Dependencies**: Verify all dependencies are available
- [ ] **File System**: Check file system permissions
- [ ] **Network Access**: Verify network connectivity

### Backup and Recovery
- [ ] **Cache Backup**: Test cache backup functionality
- [ ] **State Recovery**: Verify state recovery after failures
- [ ] **Data Integrity**: Check data integrity after recovery
- [ ] **Rollback Procedures**: Test rollback to previous versions

## Troubleshooting Guide

### Common Issues

#### Bot Won't Start
- Check environment variables are set correctly
- Verify API tokens are valid
- Check file system permissions
- Review error logs for specific issues

#### No Messages Posted
- Verify Discord bot has proper permissions
- Check channel ID is correct
- Verify Product Hunt API is accessible
- Check scheduling configuration

#### Duplicate Messages
- Verify state management is working
- Check cache file permissions
- Review change detection logic
- Verify timezone configuration

#### High Error Rate
- Check API rate limits
- Verify network connectivity
- Review error handling logic
- Check token validity

### Debug Commands
```bash
# Test individual components
npm run test:ph
npm run test:discord
npm run test:state
npm run test:scheduler

# Run with debug logging
LOG_LEVEL=debug npm start

# Check configuration
node -e "console.log(require('./src/config').config)"
```

## Success Criteria

The bot is considered ready for production when:

- [ ] All automated tests pass
- [ ] Manual testing checklist is completed
- [ ] Performance requirements are met
- [ ] Security requirements are satisfied
- [ ] Monitoring is in place
- [ ] Documentation is complete
- [ ] Error handling is robust
- [ ] Recovery procedures are tested
