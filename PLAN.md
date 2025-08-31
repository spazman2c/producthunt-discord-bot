# Product Hunt Top 5 Discord Bot — PLAN.md

## Project Overview
A Discord bot that automatically posts and updates the top 5 Product Hunt launches daily, starting at 7:00 AM and refreshing vote counts throughout the day.

---

## Phase 1: Project Setup & Foundation

### 1.1 Environment Setup
- [x] Initialize Node.js project with TypeScript
- [x] Set up project structure and dependencies
- [x] Configure ESLint and Prettier
- [x] Create `.env` template and `.gitignore`
- [x] Set up logging system

### 1.2 Core Dependencies
- [x] `discord.js` - Discord bot framework
- [x] `graphql-request` - Product Hunt API client
- [x] `luxon` - Timezone handling
- [x] `p-retry` - Retry logic for API calls
- [x] `dotenv` - Environment variable management

### 1.3 Configuration System
- [x] Create configuration schema
- [x] Implement environment variable validation
- [x] Set up timezone handling (PT for PH, configurable for bot)
- [x] Create config validation on startup

---

## Phase 2: Product Hunt API Integration

### 2.1 API Client Setup
- [x] Create Product Hunt GraphQL client
- [x] Implement authentication with bearer token
- [x] Set up error handling and retry logic
- [x] Add rate limiting awareness

### 2.2 Data Fetching
- [x] Implement GraphQL query for top 5 posts
- [x] Create data transformation layer
- [x] Add filtering for "today" (PT timezone)
- [x] Handle edge cases (fewer than 5 posts)

### 2.3 Query Structure
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
        thumbnail { url }
      }
    }
  }
}
```

---

## Phase 3: Discord Bot Integration

### 3.1 Bot Setup
- [x] Create Discord bot application
- [x] Implement bot client with proper intents
- [x] Set up event handlers (ready, error, etc.)
- [x] Add bot status and activity indicators

### 3.2 Message Management
- [x] Create embed builder for top 5 posts
- [x] Implement message posting to configured channel
- [x] Add message editing functionality
- [x] Store and retrieve message IDs for updates

### 3.3 Embed Format
- [x] Design rich embed layout
- [x] Include rank, name, tagline, vote count, and link
- [x] Add thumbnail support (optional)
- [x] Include footer with update status

---

## Phase 4: State Management & Caching

### 4.1 Daily State System
- [x] Create state management for daily cycles
- [x] Implement cache for last observed data
- [x] Add state persistence (file-based initially)
- [x] Handle state recovery on bot restart

### 4.2 Change Detection
- [x] Implement diff logic for vote counts and rankings
- [x] Create minimal-diff update system
- [x] Add logging for significant changes
- [x] Optimize update frequency based on activity

### 4.3 Cache Structure
```json
{
  "2025-01-15": {
    "discordMessageId": "1234567890",
    "lastItems": [
      {"id": "139993", "rank": 1, "votes": 315, "slug": "a01"},
      {"id": "...", "rank": 2, "votes": 238, "slug": "nuraform"}
    ]
  }
}
```

---

## Phase 5: Scheduling & Polling System

### 5.1 Daily Scheduling
- [x] Implement cron-like scheduling for 7:00 AM start
- [x] Add timezone-aware scheduling
- [x] Create daily cycle management
- [x] Handle timezone transitions

### 5.2 Adaptive Polling
- [x] Start with 3-minute polling intervals
- [x] Implement adaptive polling based on activity
- [x] Add rate limit awareness
- [x] Create graceful shutdown at end of day

### 5.3 Polling Logic
- [x] Fetch top 5 posts
- [x] Compare with cached state
- [x] Update Discord message if changes detected
- [x] Adjust polling interval based on activity

---

## Phase 6: Error Handling & Resilience

### 6.1 API Error Handling
- [ ] Implement exponential backoff for retries
- [ ] Handle Product Hunt API errors (401, 403, 429)
- [ ] Add graceful degradation for partial data
- [ ] Create error logging and alerting

### 6.2 Discord Error Handling
- [ ] Handle Discord rate limits
- [ ] Implement message editing error recovery
- [ ] Add channel access validation
- [ ] Create fallback posting strategies

### 6.3 Startup Safety
- [ ] Validate configuration on startup
- [ ] Recover state from cache if available
- [ ] Resume polling if mid-cycle restart
- [ ] Prevent duplicate message posting

---

## Phase 7: Testing & Validation

### 7.1 Unit Tests
- [x] Test Product Hunt API client
- [x] Test Discord embed building
- [x] Test state management and caching
- [x] Test timezone handling

### 7.2 Integration Tests
- [x] Test full daily cycle
- [x] Test message updating
- [x] Test error recovery scenarios
- [x] Test rate limit handling

### 7.3 Manual Testing Checklist
- [x] Bot posts at configured time
- [x] Vote counts update without duplicates
- [x] Order changes trigger clean edits
- [x] Handles <5 posts gracefully
- [x] Survives restarts without re-posting
- [x] Respects rate limits

---

## Phase 8: Deployment & Monitoring

### 8.1 Deployment Setup
- [x] Create Docker configuration
- [x] Set up environment variable management
- [x] Configure logging and monitoring
- [x] Add health check endpoints

### 8.2 Monitoring
- [x] Add application metrics
- [x] Create alerting for failures
- [x] Monitor API rate limit usage
- [x] Track message update frequency

### 8.3 Documentation
- [x] Create README with setup instructions
- [x] Document configuration options
- [x] Add troubleshooting guide
- [x] Create deployment guide

---

## Phase 9: Future Enhancements (Post-MVP)

### 9.1 Advanced Features
- [ ] Role pings for Makers/Hunters
- [ ] Per-product discussion threads
- [ ] Daily summary at end of day
- [ ] Image-rich embeds with thumbnails

### 9.2 Slash Commands
- [ ] `/top5` - Show current top 5
- [ ] `/product <slug>` - Show specific product
- [ ] `/refresh` - Force manual refresh
- [ ] `/config` - Show bot configuration

### 9.3 Analytics
- [ ] Track product performance over time
- [ ] Generate weekly/monthly reports
- [ ] Add historical data storage
- [ ] Create dashboard for insights

---

## Implementation Priority

### High Priority (MVP)
1. Project setup and configuration
2. Product Hunt API integration
3. Discord bot basic functionality
4. Daily scheduling and polling
5. Error handling and resilience

### Medium Priority
1. Advanced state management
2. Comprehensive testing
3. Deployment automation
4. Monitoring and alerting

### Low Priority (Future)
1. Slash commands
2. Advanced features
3. Analytics and reporting
4. Performance optimizations

---

## Success Criteria

- [ ] Bot posts top 5 Product Hunt launches daily at 7:00 AM
- [ ] Vote counts update automatically throughout the day
- [ ] Handles API errors gracefully with retry logic
- [ ] Survives bot restarts without duplicate posts
- [ ] Respects both Product Hunt and Discord rate limits
- [ ] Provides clear logging and monitoring
- [ ] Easy to configure and deploy

---

## Risk Mitigation

### Technical Risks
- **API Changes**: Use stable GraphQL fields, implement version checking
- **Rate Limits**: Implement adaptive polling and backoff strategies
- **Timezone Issues**: Use robust timezone libraries and testing
- **State Loss**: Implement persistent caching and recovery

### Operational Risks
- **Token Security**: Use environment variables, implement token rotation
- **Discord API Changes**: Use stable Discord.js features
- **Deployment Issues**: Create comprehensive testing and rollback procedures

---

## Timeline Estimate

- **Phase 1-3**: 1-2 weeks (Foundation)
- **Phase 4-6**: 1-2 weeks (Core functionality)
- **Phase 7-8**: 1 week (Testing & Deployment)
- **Total MVP**: 3-5 weeks

---

## Next Steps

1. Set up project structure and dependencies
2. Create Product Hunt API client
3. Implement basic Discord bot functionality
4. Build state management system
5. Add scheduling and polling logic
6. Implement comprehensive error handling
7. Deploy and test in production environment
