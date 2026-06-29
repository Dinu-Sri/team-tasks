# Tuduvia Garden Rive Engine Plan

## Purpose

Tuduvia Garden is a visible emotional reward system for task completion. The goal is to make progress feel alive without turning the app into a game that encourages fake tiny tasks.

The engine lives inside the existing Next.js app. It does not run in a separate container. Phase 1 is display-only and does not add database tables, migrations, cron work, billing limits, or task-completion logic.

## Product Rule

The plant should not grow after every completed task. That can reward noisy behavior. The intended long-term rule is daily goal completion:

- Default daily goal: complete at least 3 tasks in the day.
- Growth happens once per day when the daily goal is achieved.
- After 7 growth stages, the flower moves into Garden Collection and the user receives a new seed.

Future loop:

`daily goal achieved -> plant growth -> flower reward -> seed unlock -> garden collection -> repeat`

## Phase Roadmap

### Phase 1: Safe Rive Runtime Shell

Status: implementation target for the first pass.

- Install `@rive-app/react-canvas`.
- Add `PlantRiveWidget` as a client-only visual widget.
- Load one test `.riv` plant asset from `/public/assets/garden/rive/`.
- Render the plant in the bottom-right corner only when the environment flag is enabled.
- Temporarily simulate the test asset's `level` input by looping stages 1, 2, and 3 every 3 seconds.
- Use a transparent widget shell and do not create database changes.
- Prepare naming, folders, and code shape for later state-machine control.

### Phase 2: Daily Goal State

- Add database records for user daily garden progress.
- Record daily goal achievement from existing task completion events.
- Store current plant stage, active seed, last growth date, and completed flower history.
- Add backfill-safe defaults for existing users.

### Phase 3: Seven-Stage Plants

- Replace the test asset with production `.riv` files using a state machine.
- Support stages:
  - `plant_stage_0_empty_pot`
  - `plant_stage_1_seed`
  - `plant_stage_2_sprout`
  - `plant_stage_3_small_leaves`
  - `plant_stage_4_medium_plant`
  - `plant_stage_5_bud`
  - `plant_stage_6_pre_flower`
  - `plant_stage_7_flower`
- App inputs should control `plantStage`, `isGrowing`, and reward transitions.

### Phase 4: Effects and Context

- Add optional effect assets and state-machine overlays:
  - `wind`
  - `rain`
  - `morning_light`
  - `day_light`
  - `evening_light`
  - `night_light`
  - `growth_pop`
  - `flower_bloom`
  - `new_seed_drop`
- Calculate time of day from the user's local time.
- Keep weather decorative and non-blocking.

### Phase 5: Seeds and Garden Collection

- Add seed rewards after a full bloom.
- Move completed flowers to a Garden Collection screen.
- Add unlock rules for seed types without making the core task app harder to understand.

## Environment Flags

Phase 1 uses environment variables so production can turn the feature on or off safely.

```env
NEXT_PUBLIC_TUDUVIA_GARDEN_RIVE_ENABLED=false
TUDUVIA_GARDEN_RIVE_ENABLED=false
NEXT_PUBLIC_TUDUVIA_GARDEN_RIVE_SRC=/assets/garden/rive/plant_daisy_stage_01_v1.riv
```

Rules:

- The feature is enabled when either `NEXT_PUBLIC_TUDUVIA_GARDEN_RIVE_ENABLED` or `TUDUVIA_GARDEN_RIVE_ENABLED` is exactly `true`.
- The feature is disabled when either flag is explicitly `false`.
- If no flag reaches the container, production defaults to enabled for the Phase 1 rollout.
- `NEXT_PUBLIC_TUDUVIA_GARDEN_RIVE_SRC` can point to another public `.riv` asset later.
- The app uses `/api/garden/rive-config` to read the live container environment at runtime, so Portainer flag changes require a container restart but not a rebuild.

## Folder Structure

```text
public/
  assets/
    garden/
      rive/
        plant_daisy_stage_01_v1.riv
      effects/
        effect_wind_soft_v1.riv
```

Phase 1 ships only the test plant file. The `effects` folder exists now so later effect files have a stable public location.

## Naming Conventions

Use lowercase snake case. Keep asset names descriptive and versioned.

Plant file pattern:

```text
plant_{seed_type}_stage_{two_digit_stage}_v{version}.riv
```

Examples:

```text
plant_daisy_stage_01_v1.riv
plant_lotus_stage_07_v2.riv
```

Effect file pattern:

```text
effect_{effect_name}_{intensity}_v{version}.riv
```

Examples:

```text
effect_wind_soft_v1.riv
effect_rain_light_v1.riv
effect_growth_pop_v1.riv
```

State-machine input names should use camel case:

```text
plantStage
timeOfDay
weather
isGrowing
```

The Phase 1 marketplace test asset uses a numeric input named `level`. Until production plant files are designed, the app loops `level = 1`, `level = 2`, and `level = 3` every 3 seconds to validate runtime control.

## Code Structure

Phase 1 component:

```text
src/components/garden/plant-rive-widget.tsx
```

The root app layout mounts a small client-side runtime gate. The gate fetches `/api/garden/rive-config`, and only then renders the widget if runtime config enables it. In production, missing flags default to enabled for Phase 1; explicit `false` disables the widget. The widget itself stays client-side because Rive needs browser canvas APIs.

Future garden logic should be split into:

```text
src/lib/garden/
  daily-goal.ts
  plant-stage.ts
  seed-rewards.ts
```

Avoid mixing animation concerns into task actions. Task completion should emit or update durable progress state, and the Garden UI should read that state.

## Future Growth Logic

Recommended long-term durable fields:

- `userId`
- `activeSeedType`
- `plantStage`
- `growthCycleStartedAt`
- `lastGrowthAt`
- `dailyGoalDate`
- `dailyGoalCompleted`
- `completedFlowerCount`

Growth guardrails:

- Grow at most once per local calendar day.
- Count only real task completions by the current user.
- Avoid rewarding repeated reopen/complete loops.
- Preserve progress if the widget is disabled.
- Keep Garden Collection additive; never block task usage because of garden state.

## Phase 1 Acceptance Criteria

- `@rive-app/react-canvas` is installed.
- `/public/assets/garden/rive/plant_daisy_stage_01_v1.riv` exists.
- `/public/assets/garden/effects/` exists.
- `PlantRiveWidget` renders the Rive asset bottom-right only when enabled.
- The widget uses a transparent visual shell.
- No database migration is added.
- The planner document explains the future roadmap and naming rules.
