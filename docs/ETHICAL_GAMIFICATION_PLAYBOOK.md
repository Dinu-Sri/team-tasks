# Ethical Gamification and Retention Playbook

## Purpose

This document is a reusable product, UX, and engineering specification for adding
gamification to a SaaS product without making the product confusing, coercive, or
easy to game. It can be given to another AI agent or product team and adapted to a
different domain.

The central principle is simple:

> Reward the useful behavior the product exists to support, make progress visible,
> allow humane recovery, and never let the game become more important than the work.

This playbook uses a task-management SaaS as the concrete implementation example.
The same framework can be adapted to education, health, finance, CRM, creative tools,
community products, or operational software.

## Executive Summary

A good retention system has five parts:

1. A tiny, meaningful daily action.
2. Immediate and understandable feedback.
3. Visible progress toward a nearby milestone.
4. Protection from occasional failure.
5. Cooperative social accountability without public humiliation.

For Team Tasks, this becomes **Momentum**:

- **Daily Win**: complete one legitimate task on an eligible workday.
- **Streak**: consecutive eligible workdays with a Daily Win.
- **Shield**: automatically protects an occasional missed eligible day.
- **Badge**: marks a meaningful streak milestone.
- **Team Quest**: a shared weekly target where each person contributes at most once
  per day.

Only these five concepts are exposed to users. Points, calculations, deduplication,
eligibility snapshots, timezone handling, and anti-abuse rules remain invisible.

## What the Research Supports

### Consistency and visible progress

Repeated behavior in a stable context can become easier to initiate over time. A
streak makes consistency tangible by turning an otherwise invisible history into a
small, visible number. The useful mechanism is not a magic animation duration or a
guaranteed dopamine release. It is the combination of anticipation, immediate
feedback, progress, and a meaningful commitment.

Duolingo has publicly reported several product experiments:

- Offering a voluntary seven-day streak wager produced statistically significant
  improvements in Day-1, Day-7, and Day-14 retention; Day-7 improved by 14%.
- A weekend-protection mechanic made participants 4% more likely to return one week
  later and 5% less likely to lose their streak.
- Improved streak-extension animations increased the probability that a new learner
  remained active seven days later by 1.7%.
- Duolingo reported that learners with at least one Friend Streak were 22% more
  likely to complete their daily lesson.

These are Duolingo's product results, not universal guarantees. Every SaaS must test
the mechanics with its own users and business outcomes.

### Goal gradient and endowed progress

Goal-gradient research suggests motivation tends to increase as a person perceives
themselves getting closer to a goal. This supports:

- Showing the next badge instead of a distant lifetime target.
- Showing a short progress path such as `5 of 7`.
- Giving a new user an early achievable milestone.
- Making milestone spacing wider only after the habit is established.

Artificial progress must not be deceptive. A product can introduce a short starter
goal, but should not fabricate completed work.

### Autonomy, competence, and relatedness

Self-Determination Theory is a useful design lens:

- **Autonomy**: users can understand, configure, pause, or leave the system.
- **Competence**: feedback shows that useful work was completed and progress grew.
- **Relatedness**: cooperative quests let people succeed together.

Gamification that removes autonomy, exposes employees to public judgment, or rewards
meaningless volume can weaken intrinsic motivation.

### Rapid meaningful feedback

A systematic review of persuasive technology at work found rapid, meaningful
interactive feedback to be an important recurring factor. The feedback must confirm
the real action. It should not delay the workflow, cover the interface, or demand a
second interaction.

### Evidence for caution

Research on GitHub's former public contribution streak showed that streak counters
changed developer behavior, including weekend activity and low-value one-contribution
days. The authors explicitly cautioned that gamification can steer behavior in
unwanted directions.

Research on gamification misuse in a language-learning app identified fixation on
points, competition, herding, and game mechanics that displaced the real learning
goal. Workplace and education reviews also identify common failures involving
leaderboards, badges without purpose, cheating, stress, and worsened performance.

Therefore, a workplace SaaS must not copy consumer gamification mechanically.

## Design Ethics

The following are product requirements, not optional polish:

1. Do not rank individual employees publicly.
2. Do not award raw task volume.
3. Do not require weekend, leave-day, or late-night activity.
4. Do not break a streak when no legitimate action was available.
5. Do not erase earned historical achievements.
6. Do not send fear-based or shame-based notifications.
7. Do not let owners use streaks as a formal performance score.
8. Provide reduced-motion support and an option to pause the system.
9. Explain every rule in plain language.
10. Measure harmful side effects alongside retention.

## Domain Translation Framework

Before applying this system to another SaaS, fill in this table:

| Question | Task SaaS answer | Other SaaS example |
| --- | --- | --- |
| What is the smallest useful action? | Finish one assigned task | Log one verified expense |
| When is a day eligible? | A configured workday with available work | A day with an open review |
| What must never earn progress? | Reopening and re-finishing one task | Re-uploading the same receipt |
| What is a humane neutral day? | Weekend, leave, no available task | No scheduled activity |
| What is cooperative success? | Team Daily Wins | Shared customer-response goal |
| What indicates real value? | On-time completion and return rate | Reconciliation accuracy |

If the smallest action can be spammed, duplicated, or created solely to earn points,
the mechanic is not ready.

## Momentum Vocabulary

### Daily Win

The first qualifying completion on an eligible local workday. Additional completions
are useful work but do not create more personal streak points.

### Eligible day

A day is eligible only when all are true:

- Momentum is enabled for the user.
- It is one of the user's configured workdays.
- At least one open task was available early enough for a reasonable response.

The system stores eligibility as a daily snapshot. Historical eligibility must not be
reconstructed from today's database state.

### Neutral day

A neutral day neither extends nor breaks a streak. Examples: weekends, configured
days off, no available work, or a paused Momentum profile.

### Shield

A Shield automatically converts one missed eligible day into a protected day. It is
not a currency purchase and it does not require the user to predict an emergency.

### Badge

A badge is a durable achievement for reaching a streak milestone. Earned badges stay
in the collection. If the active streak falls below a tier, the badge may appear
visually cool or dormant, but it is never deleted.

### Team Quest

A cooperative weekly target. Each member can contribute at most one point per team
per local day. There is no individual leaderboard.

## Rules Specification

### Personal streak

1. Completing the first qualifying task creates one Daily Win.
2. A second task on the same local date creates no additional personal point.
3. A shared task grants a Daily Win independently to each assigned member when the
   task is first completed.
4. Reopening and completing the same task never grants Momentum twice.
5. A neutral day preserves the current streak.
6. A missed eligible day consumes one Shield automatically when available.
7. A missed eligible day with no Shield resets the active streak to zero.
8. The longest streak remains historical and never decreases.
9. Timezone changes apply prospectively and must not rewrite prior daily records.

### Shield economy

- Earn the first Shield when reaching a three-day streak.
- Earn another Shield at each seven-total-win interval.
- Hold at most two Shields.
- A Shield is consumed automatically, not manually.
- Reaching a grant milestone while already full does not create an unlimited bank.

### Badge ladder

| Streak | Tier | Meaning | Icon direction |
| ---: | --- | --- | --- |
| 1 | Spark | The habit has started | Four-point spark |
| 3 | Rhythm | A repeatable rhythm exists | Three rising bars |
| 7 | Flow | One consistent work cycle | Flowing wave |
| 14 | Drive | Consistency survives novelty | Lightning mark |
| 30 | Peak | A durable working habit | Mountain and flag |
| 100 | Legacy | Long-term reliability | Laurel or award crest |

The current tier is based on active streak length. The collection is based on all
tiers ever unlocked.

### Team Quest

- One automatically created quest per team per week.
- Default target: three contributions per member, with sensible minimum and maximum
  limits for very small or large teams.
- A member contributes only through a legitimate task completion in that team.
- A member can contribute at most once per team per day.
- Completing the quest unlocks a shared team celebration and durable quest history.
- Owners see aggregate progress only; no individual ranking is shown.

## UX Architecture

### Cognitive-load rule

At any moment, show at most:

- Current streak.
- Today's state.
- Shield count.
- Distance to the next badge.

The complete rules belong in a details page, not the daily task list.

### Header

Use one compact Momentum control, such as a flame icon and the active streak number.
Its status must be understandable through icon, number, text label, and color rather
than color alone.

### Quick panel

The header control opens a compact panel containing:

- Current badge and streak.
- Seven-day history.
- Shield inventory.
- One next action: `2 more Daily Wins to Flow`.
- Link to the full Momentum page.

Desktop uses an anchored popover. Mobile uses a bottom sheet within the viewport.

### Completion feedback

1. The completion control responds immediately in approximately 100-200 ms.
2. A one-shot success transition plays in approximately 300-500 ms.
3. A first Daily Win can show a compact celebration lasting 2-3 seconds.
4. A badge unlock can use a larger 600-900 ms entrance.
5. No reward animation loops while the interface is idle.
6. `prefers-reduced-motion` removes translation, scaling, and repeated movement.

These values are interaction-design ranges, not neurological constants.

### Visual language

- Use familiar icons from the product's icon library.
- Use distinct tier colors rather than six versions of one hue.
- Keep badge silhouettes recognizable at 24 px.
- Use restrained dimensional highlights for earned badges.
- Use lower saturation and no glow for locked or dormant badges.
- Preserve labels because icons alone are ambiguous to new users.

### Notifications

Send at most one Momentum reminder per eligible day. Respect the user's timezone,
working days, reminder setting, and local reminder hour.

Good examples:

- `One finish keeps your 6-day Momentum going.`
- `Your Shield protected yesterday. Start again when you are ready.`
- `Flow unlocked. Seven consistent workdays.`
- `Your team is 2 Daily Wins from this week's quest.`

Avoid:

- Threats.
- Countdown panic.
- Public comparison.
- Repeated reminders after the user has already acted.

## Data Architecture

Use immutable event records plus a compact profile projection.

### Profile projection

Stores fast-to-read state:

- Current streak.
- Longest streak.
- Total Daily Wins.
- Shield inventory and historical grants.
- Timezone, workdays, reminder hour, and opt-in state.
- Last Daily Win date.

### Daily record

One unique row per user and local date:

- `PENDING`: eligible work existed but no win yet.
- `WIN`: a qualifying completion occurred.
- `SHIELDED`: a missed eligible day consumed a Shield.
- `MISSED`: a missed eligible day reset the active streak.

This row is the source of truth for calendars and audits.

### Achievement record

One unique row per user and badge tier. This guarantees that earned badges survive
streak resets and cannot be duplicated.

### Quest contribution

One unique row per quest, user, and local date. This prevents task-volume farming.

### Task credit marker

The task stores whether Momentum has already been awarded. Reopening a task can change
its operational state without creating a second reward.

### Idempotency

Every update must be safe to run twice. Use unique database constraints and
transactions rather than trusting UI state or a single server process.

## Processing Architecture

### On task completion

1. Authorize the user against the task assignment.
2. Change the task state transactionally.
3. If the task has not been credited, record Daily Wins for assigned members.
4. Update streak projections and unlock achievements.
5. Record an eligible Team Quest contribution.
6. Create deduplicated notifications.
7. Publish a realtime event.
8. Return a small celebration payload to the completing client.

### Scheduled maintenance

Run every 10-20 minutes:

1. Create eligibility snapshots for active users with available work.
2. Resolve prior pending days into `SHIELDED` or `MISSED`.
3. Send one deduplicated reminder after the configured local hour.
4. Create the current weekly quest for every team.
5. Expire incomplete past quests.

The scheduler must be a separate process or managed cron job. In-memory timers inside
the web server are not reliable across deployments or multiple replicas.

## Analytics and Experimentation

### Primary success metrics

- Day-7 and Day-30 retained users.
- Weekly active teams.
- Eligible days resulting in a Daily Win.
- Median time from assignment to completion.
- Reduction in overdue tasks.
- Team Quest participation and completion.

### Guardrail metrics

- Tasks created and completed within an unusually short interval.
- Reopen/re-complete attempts.
- Weekend and late-night activity.
- Notification opt-out rate.
- Momentum pause rate.
- Increase in trivial task titles or task fragmentation.
- Support messages mentioning stress, unfairness, or surveillance.

### Event vocabulary

- `momentum_eligible_day_created`
- `momentum_daily_win_earned`
- `momentum_shield_earned`
- `momentum_shield_used`
- `momentum_streak_reset`
- `momentum_badge_unlocked`
- `momentum_panel_opened`
- `momentum_reminder_sent`
- `team_quest_contribution_added`
- `team_quest_completed`

### Rollout strategy

1. Ship behind a feature flag.
2. Start with personal Daily Wins, streaks, and Shields.
3. Observe at least one complete retention window.
4. Add badge celebrations.
5. Add Team Quests only after anti-abuse metrics are stable.
6. Never launch an individual leaderboard without new research and explicit consent.

## Team Tasks Implementation Plan

### Phase A: foundation

- Add Momentum profile, daily records, achievements, quests, and contributions.
- Add timezone, workday, reminder, notification-kind, and deduplication fields.
- Add task completion-credit markers.
- Create an idempotent rules engine.

### Phase B: daily experience

- Add the compact header Momentum control.
- Add desktop popover and mobile bottom sheet.
- Return celebration payloads from task completion.
- Add badge and Shield notifications through existing realtime infrastructure.

### Phase C: full Momentum page

- Add personal statistics, seven-day and monthly history, badge path, Team Quests, and
  simple preferences.
- Keep archive analytics separate but cross-link both pages.

### Phase D: team integration

- Show aggregate Team Quest progress inside each team's dashboard section.
- Notify members once when a quest completes.
- Store quest history for future team analytics.

### Phase E: operations

- Add a protected maintenance endpoint.
- Run it from a dedicated Docker scheduler service.
- Document the additional production secret and deployment behavior.

## Future Growth

Potential additions after measurement:

- Planned leave and organization holidays.
- Owner-configured team workweeks and timezones.
- Optional paired accountability instead of public competition.
- Seasonal cooperative quests.
- Team-selected cosmetic badge themes.
- Personal weekly goals based on task type or role.
- Smart reminder timing learned from prior completion patterns.
- Feature flags and experiment assignment tables.
- Audit exports explaining every streak transition.
- Abuse detection for artificial task fragmentation.

Do not add currencies, loot boxes, random rewards, public employee leagues, or paid
streak restoration. Those mechanics conflict with the product's calm workplace role.

## Sources

- Duolingo, "How Streaks keep Duolingo learners committed to their language goals":
  https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals/
- Duolingo, "The habit-building research behind your Duolingo streak":
  https://blog.duolingo.com/how-duolingo-streak-builds-habit/
- Duolingo, "Friend Streak: a new way to stay motivated together":
  https://blog.duolingo.com/friend-streak/
- Moldon, Strohmaier, and Wachs, "How Gamification Affects Software Developers":
  https://arxiv.org/abs/2006.02371
- Mogavi et al., "When Gamification Spoils Your Learning":
  https://arxiv.org/abs/2203.16175
- Wenker, "A Systematic Literature Review on Persuasive Technology at the Workplace":
  https://arxiv.org/abs/2201.00329
- Ayoup, Costa, and Shihab, "Achievement Unlocked: A Case Study on Gamifying DevOps
  Practices in Industry": https://arxiv.org/abs/2208.05860
- W3C, "Understanding Success Criterion 2.3.3: Animation from Interactions":
  https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html
- Nunes and Dreze, "The Endowed Progress Effect":
  https://doi.org/10.1086/500480
- Kivetz, Urminsky, and Zheng, "The Goal-Gradient Hypothesis Resurrected":
  https://doi.org/10.1509/jmkr.43.1.39
