# Product Hunt Top 5 Bot — context.md

> Purpose: A Discord bot that posts (and keeps updated) the **top 5 launches of the day** from Product Hunt, starting at **7:00 AM** (configurable), and **refreshing upvote counts** throughout the day.

---

## 1) Goals & Non‑Goals

**Goals**

* Fetch the top 5 Product Hunt posts for “today” and post them to a configured Discord channel.
* Include: rank, name, tagline, live upvote count, direct link, and thumbnail (if desired).
* Update the message(s) as votes change throughout the day (until the daily window rolls over).
* Respect Product Hunt API rate limits and avoid spam in Discord.

**Non‑Goals**

* No historical analytics beyond “today” (can be added later).
* No write actions on Product Hunt (comments, votes, etc.).
* No scraping — only official API usage.

---

## 2) Time Model & Scheduling

* **PH “day” is based on Pacific Time (PT)**. We’ll default to this for “today”.
* **First fetch at 7:00 AM** (configurable) and then **poll** for changes (e.g., every 3–5 minutes, adaptive).
* Stop updates at **23:59:59 PT** (or when “today” rolls over) and schedule the next day.

**Config**

```env
PH_TIMEZONE=America/Los_Angeles   # Product Hunt reference day
BOT_TIMEZONE=America/New_York     # Your local ops timezone (for logs)
FETCH_AT_LOCAL=07:00               # First daily fetch time (BOT_TIMEZONE)
POLL_SECONDS=180                   # Frequency for refreshing upvote counts
```

---

## 3) Data Source & Auth (Product Hunt API v2, GraphQL)

**Endpoint**

* `POST https://api.producthunt.com/v2/api/graphql`

**Headers**

```
Accept: application/json
Content-Type: application/json
Authorization: Bearer <YOUR_TOKEN>
```

**Tokens**

* Use a **developer token** or **client-only token** for read access. Store in `.env` (never commit).

---

## 4) Core GraphQL Query

We request the **top-ranked posts for today** and the fields we need. Product Hunt supports ordering by **RANKING** (votes-based) and pagination via `first`/`after`.

**Variables**

```json
{
  "first": 5
}
```

**Query (minimal stable fields)**

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

> Note: If you need to strictly constrain to “today” PT, add a time filter if available in your account’s schema (e.g., `postedAfter` / `featuredAfter`). If not, fetch top N and trust `RANKING` for the daily list, or cross-check client-side by comparing `createdAt/featuredAt` to today’s PT window.

---

## 5) Discord Posting Strategy

**Channel**: configurable by ID (`DISCORD_CHANNEL_ID`).

**Format (single embedded message)**

* One **rich embed** with 5 fields, each line containing: `#<rank> • <Name> — <tagline>  |  👍 <votes>  |  <link>`
* Embed title: `Top 5 on Product Hunt — <Month Day, YYYY>` (PT date)
* Footer: “Auto-updating until midnight PT”
* Thumbnail: optional — either the #1 product’s thumbnail or none (saves space).

**Updating**

* Store the **message ID** after the first post, then **edit** the embed in place to refresh counts.
* Apply minimal-diff updates: only edit when vote totals change or order changes.

---

## 6) State, Idempotency & Caching

* Maintain a **daily cache** keyed by PT date: `YYYY-MM-DD`.
* Persist the last observed list: `[ {id, rank, votesCount} ]`.
* If a new fetch yields identical ordering & counts, **skip** Discord edits.
* If rank order changes, update the embed and log the change.

**Local cache shape** (example)

```json
{
  "2025-08-31": {
    "discordMessageId": "1234567890",
    "lastItems": [
      {"id": "139993", "rank": 1, "votes": 315, "slug": "a01"},
      {"id": "...", "rank": 2, "votes": 238, "slug": "nuraform"}
    ]
  }
}
```

---

## 7) Rate Limits & Polling Policy

* PH GraphQL endpoint enforces **complexity-based limits**; use lean queries.
* Read `X-Rate-Limit-*` response headers and **back off** if remaining quota is low.
* Adaptive polling: begin at `POLL_SECONDS`, increase to 300–600s when changes slow; reduce to 60–120s during early-day surges.

---

## 8) Error Handling & Resilience

* **HTTP/GraphQL errors**: retry with exponential backoff (jitter). Abort on 401/403 and alert.
* **Discord errors**: catch rate limit (`429`), respect `X-RateLimit-Reset` from Discord.
* **Partial data**: if fewer than 5 posts, post what is available and continue polling.
* **Startup safety**: if the bot restarts midday, recreate state from cache and resume editing.

---

## 9) Config & Secrets (.env)

```env
# Product Hunt
PH_API_URL=https://api.producthunt.com/v2/api/graphql
PH_TOKEN=xxxxxx

# Discord
DISCORD_TOKEN=xxxxxx
DISCORD_CHANNEL_ID=123456789012345678

# Time / Polling
PH_TIMEZONE=America/Los_Angeles
BOT_TIMEZONE=America/New_York
FETCH_AT_LOCAL=07:00
POLL_SECONDS=180
```

---

## 10) Implementation Outline

**Stack**: Node.js + `discord.js` + `graphql-request` (or fetch) + `luxon` for timezones + `p-retry`.

**Pseudocode**

```ts
// boot
loadEnv();
const tzPH = PH_TIMEZONE; // America/Los_Angeles
const tzBot = BOT_TIMEZONE; // America/New_York
scheduleDaily(FETCH_AT_LOCAL, tzBot, runDailyCycle);

async function runDailyCycle() {
  const todayPT = now().setZone(tzPH).toFormat('yyyy-MM-dd');
  const msg = await ensureDiscordMessage(todayPT);
  await refreshLoop(todayPT, msg.id);
}

async function refreshLoop(day, messageId) {
  let interval = POLL_SECONDS;
  while (isSameDayPT(now(), day)) {
    const top = await fetchTop5();
    const changed = diffAndMaybeEdit(messageId, top);
    interval = tuneInterval(interval, changed);
    await sleep(interval);
  }
}

async function fetchTop5() {
  const query = `
    query TopToday($first: Int!) {
      posts(order: RANKING, first: $first) {
        edges { node { id name tagline slug votesCount url thumbnail { url } } }
      }
    }`;
  const data = await graphql(PH_API_URL, query, { first: 5 }, PH_TOKEN);
  return data.posts.edges.map((e, i) => ({
    id: e.node.id,
    name: e.node.name,
    tagline: e.node.tagline,
    slug: e.node.slug,
    votes: e.node.votesCount,
    url: e.node.url,
    thumb: e.node.thumbnail?.url,
    rank: i + 1
  }));
}

function buildEmbed(dayPT, items) {
  return {
    title: `Top 5 on Product Hunt — ${formatDate(dayPT)}`,
    description: items.map(x => `#${x.rank} • **${x.name}** — ${x.tagline}\n👍 ${x.votes}  |  <${x.url}>`).join('\n\n'),
    footer: { text: 'Auto-updating until midnight PT' }
  };
}
```

---

## 11) Testing Checklist

* [ ] Bot posts at the configured time and edits in place.
* [ ] Vote counts increase over time without duplicate messages.
* [ ] Ordering changes trigger a single clean edit.
* [ ] Handles <5 posts gracefully.
* [ ] Survives restarts (state reload) without re-posting.
* [ ] Respects both Discord and PH rate limits.

---

## 12) Future Enhancements

* **Role pings** for Makers/Hunters when their product enters top 5.
* **Per-product threads** for deeper discussion.
* **Daily summary** at EOD: final ranks & deltas.
* **Image-rich embeds**: per-item thumbnails as individual embeds.
* **Slash commands**: `/top5`, `/product <slug>`, `/refresh`.

---

## 13) Attribution & Compliance

* Include a small footer/link crediting Product Hunt.
* Keep the bot non-commercial unless you get permission.
* Do not expose tokens; restrict access and rotate regularly.
