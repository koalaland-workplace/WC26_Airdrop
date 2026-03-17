# WC26 Airdrop Launch Plan — Design Spec

**Goal:** 500K+ TMA users via t.me/wc26viral_bot
**Budget:** ~$0 (AI API costs only)
**Timeline:** As fast as possible, phased rollout
**Autonomy:** Full — Claude executes, reports results

---

## Current State Analysis

- 46 users after 2 weeks
- Viral coefficient: ~0 (no organic growth)
- 10 nation TG groups exist but near-empty
- Outreach system built but not running (GROUP_IDs = 0)
- TMA has spin/quiz/penalty/referral but viral loop is broken
- Backend stable (just fixed), 2 VPS healthy

## Root Causes of Zero Growth

1. **No share mechanic** — users play alone, never share to friends/groups
2. **Weak referral incentive** — 50 KICK per invite (2% of daily cap)
3. **No onboarding hook** — new users don't understand value in first 60s
4. **No distribution** — zero discovery channels active
5. **No urgency** — no time-limited events or countdown mechanics

---

## Architecture: 3-Phase Growth Engine

### Phase 1: Product Fix (Days 1-3)
Make the TMA actually viral before pushing traffic to it.

#### 1A. Onboarding Redesign
- First screen: "Earn WC26 tokens FREE — World Cup 2026 is coming!"
- Immediate 500 KICK welcome bonus on first open
- Guided flow: Pick nation → First spin (guaranteed win) → See KICK balance → Share prompt
- Total onboarding: < 30 seconds to first reward

#### 1B. Viral Loop Mechanics (Code Changes)

**Share-to-Earn system:**
- New endpoint: `POST /api/share/verify` — verify user shared to TG story/group
- Share to TG story = +200 KICK + 1 bonus spin
- Share score/result after quiz = +100 KICK
- Share penalty win = +150 KICK
- Daily share cap: 3 shares = 450 KICK potential

**Enhanced Referral:**
- Increase from 50 → 500 KICK per direct invite
- Inviter gets bonus spin when invitee completes first quiz
- New milestone rewards:
  - 5 refs: +2,000 KICK
  - 20 refs: +10,000 KICK + "Recruiter" badge
  - 100 refs: +50,000 KICK + "Ambassador" badge
- Referral leaderboard visible in TMA

**Squad System (new feature):**
- Create/join squad of 5 users
- Squad daily KICK = sum of all members' earnings × 1.2 multiplier
- Squad leaderboard → top squad gets weekly bonus
- Inviting to fill squad = strongest social pressure mechanic

**Streak System Enhancement:**
- Current: basic streak tracking
- New: Streak multiplier — Day 1: 1x, Day 3: 1.5x, Day 7: 2x, Day 14: 3x, Day 30: 5x
- Missing a day resets to 1x → creates daily retention hook
- Visual streak counter prominent on home screen

#### 1C. FOMO & Social Proof
- Live activity feed: "Player_xyz just earned 2,000 KICK from penalty!"
- Global KICK counter on home: "Total KICK distributed: X,XXX,XXX"
- Countdown timer to WC26 snapshot (converts KICK → WC26 tokens)
- Nation leaderboard: aggregate KICK per nation → pride mechanic

### Phase 2: AI Growth Engine (Days 3-7)
Automated distribution across all channels.

#### 2A. Telegram Group Seeding (n8n + Bot)
- Configure all 10 nation GROUP_IDs properly
- AI content generator (already have) → enhance with:
  - Daily football trivia that links to TMA quiz
  - Match prediction posts with CTA to play in TMA
  - Leaderboard screenshots auto-generated
  - FOMO posts: "X users earned Y KICK today"
- Welcome bot for new group members → direct to TMA with referral link

#### 2B. Cross-Group Invasion Strategy
- Use outreach.py (already built) to contact admins of large football TG groups
- Offer: "Free World Cup game for your community"
- AI generates localized pitch per nation/language
- Target: 500 groups × 1000+ members = 500K reach
- Convert 2-5% = 10K-25K users from this alone

#### 2C. X/Twitter Auto-Posting (new n8n workflow)
- AI generates daily football + crypto content
- Posts with TMA link + referral tracking
- Engages with WC26/football trending hashtags
- Target accounts: football influencers, airdrop hunters
- 4-6 posts/day, AI-varied content

#### 2D. Airdrop Hunter Channels
- Auto-post to airdrop listing channels/groups
- Create task-based onboarding:
  - Join TG group ✓
  - Open TMA ✓
  - Complete first quiz ✓
  - Make first referral ✓
  - = earn 2,000 KICK
- List on airdrop aggregator websites (free submissions)

### Phase 3: Viral Amplification (Week 2+)
Once base is growing, amplify with events.

#### 3A. Flash Events
- "Double KICK Hour" — random 2h window, all earnings 2x
- "Nation War Weekend" — nations compete for bonus pool
- "Prediction Challenge" — predict real match scores, winners get KICK jackpot
- All announced via bot to all groups + TMA push

#### 3B. Ambassador Program
- Top referrers become Nation Captains
- Captains earn 10% of their referrals' KICK forever
- Weekly ambassador call-to-action leaderboard
- AI-generated personalized recruitment messages for ambassadors

#### 3C. Content Virality
- Auto-generate shareable images (score cards, leaderboard positions)
- "My WC26 Nation Journey" — shareable profile card
- Meme generator with WC26 branding
- AI creates daily viral-worthy football content

---

## Technical Implementation

### Backend Changes (Fastify)

New/modified endpoints:
```
POST /api/share/verify      — Verify TG share, award KICK
POST /api/squad/create       — Create squad
POST /api/squad/join         — Join squad
GET  /api/squad/leaderboard  — Squad rankings
GET  /api/leaderboard/public — Public leaderboard (nations + individual)
GET  /api/stats/live         — Live activity feed data
POST /api/onboarding/complete — Track onboarding funnel
```

Modified game constants:
- REFERRAL_KICK: 50 → 500
- WELCOME_BONUS: 0 → 500
- SHARE_KICK: new (100-200 per share)
- STREAK_MULTIPLIERS: [1, 1, 1.5, 1.5, 1.5, 1.5, 2, 2, 2, 2, 2, 2, 2, 3, ...]
- DAILY_KICK_CAP: 2500 → 5000 (accommodate shares + enhanced referrals)

### Frontend Changes (Svelte TMA)

New components:
- `OnboardingFlow.svelte` — guided first-time experience
- `ShareButton.svelte` — TG share integration
- `SquadPanel.svelte` — squad creation/management
- `LiveFeed.svelte` — real-time activity ticker
- `StreakCounter.svelte` — visual streak display
- `PublicLeaderboard.svelte` — nations + top players

Modified:
- `Home.svelte` — add live feed, streak counter, share CTAs
- `Referral.svelte` — enhanced rewards display, squad invite

### n8n Workflows (New)

1. **X/Twitter Auto-Post** — every 4h, AI-generated football content
2. **Airdrop Channel Poster** — daily post to airdrop channels
3. **Group Invasion Outreach** — daily batch of admin DMs
4. **Leaderboard Screenshot Generator** — daily shareable image
5. **Flash Event Scheduler** — trigger random flash events
6. **Growth Metrics Dashboard** — daily report to admin

### Bot Enhancements (VPS #2)

- Fix ADMIN_GROUP_ID for analytics
- Add /squad command
- Add share tracking webhook
- Enhanced welcome flow with TMA deeplink
- Nation group seeding automation

---

## Growth Projections (Conservative)

| Week | Users | Growth Driver |
|------|-------|--------------|
| 1 | 200 | Product fix + team seeding |
| 2 | 2,000 | Outreach to football groups |
| 3 | 10,000 | Viral loop kicks in (R > 1) |
| 4 | 30,000 | Airdrop hunter channels |
| 6 | 100,000 | Squad mechanics + flash events |
| 8 | 250,000 | Ambassador program + organic |
| 12 | 500,000+ | Self-sustaining viral growth |

Key metric: **Viral coefficient (K) > 1** = each user brings > 1 new user.
Target: K = 1.3 (each user brings 1.3 users on average)

---

## Success Metrics

- **D1 retention**: > 40% (currently unknown, likely < 10%)
- **D7 retention**: > 20%
- **Daily active / total**: > 15%
- **Referral rate**: > 30% of users make at least 1 referral
- **Viral coefficient**: > 1.0
- **Share rate**: > 20% of daily active users share at least once

---

## Risk Mitigation

- **Sybil farming**: Anti-sybil scoring already built, enforce minimum activity
- **Server load at scale**: VPS #1 has 14GB free RAM, can handle 100K+ concurrent
- **Telegram rate limits**: Batch sends with delays, use multiple bot tokens
- **KICK inflation**: Daily cap + snapshot conversion formula auto-balances
- **Low quality users from airdrop channels**: Minimum 7 active days + 10K KICK for conversion eligibility (already in rules)
