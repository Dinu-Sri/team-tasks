# Dashboard Simplicity Guide

Use this guide when redesigning dashboard screens in Tuduvia. The goal is a screen that feels obvious within a few seconds, even for a person who does not know task-management tools.

## Core Rule

Each screen should answer three questions quickly:

1. What is this screen for?
2. What can I do here?
3. What is already here?

If a control does not help one of those answers, remove it from the main screen or move it to a more focused settings area.

## Layout Rules

- Use separate rounded boxes for separate jobs.
- Do not pack unrelated actions into one large container.
- Keep one primary action per box.
- Prefer a two-column desktop layout when it helps scanning.
- Keep the main content visible in one screen where possible.
- Use empty states with one clear next step.
- Keep labels short and plain.
- Avoid project-management language when normal words work.
- In narrow dashboard boxes, stack form fields and buttons vertically so inputs can use the full section width.

## Visual Style

- Use calm spacing between groups.
- Use rounded boxes with clear borders.
- Use simple icons only when they make the action faster to recognize.
- Keep buttons obvious and sparse.
- Avoid dense forms, stacked controls, progress widgets, and secondary actions on first view.
- Avoid decorative UI that does not explain the screen.

## UX Rules

- A user should never need to study the page before acting.
- Put the most common action near the related content.
- Hide or remove rare actions from the main screen.
- Do not show task controls on non-task screens.
- Prefer visibility first, management second.
- Make destructive or admin actions separate from the default view.
- Use child-simple button text: `Create team`, `Send invite`, `Open`, `Save`.

## Team Screen Pattern

The Team screen should stay focused on three things:

1. Create a team.
2. Invite someone.
3. See team members.

Do not show these on the Team screen:

- Team Quest
- Assign Work
- task input
- due date controls
- priority controls
- progress bars
- dense member-management controls

Recommended structure:

```text
Teams
Create a team, invite people, and see who belongs here.

[ Choose a team ]
Team card
Team card

[ Create a team ]
Team name
Create team
```

Focused team view:

```text
[ Current team ]
Team name
Member count

[ Team members ]
Member
Member

[ Invite someone ]
Email address
Send invite

[ Create another team ]
Team name
Create team
```

## Future Screen Examples

Storage screen:

- Box 1: filters
- Box 2: files
- Box 3: empty state or delete summary
- Avoid showing advanced file metadata unless needed.

Features screen:

- Box 1: current team
- Box 2: simple feature toggles
- Box 3: organization access, only if relevant
- Avoid showing technical configuration before the user asks.

Activity screen:

- Box 1: page summary
- Box 2: compact recent-comment cards
- Use a small page size so the first view is scannable.
- Avoid long feed rows unless the screen is meant to be a full reader.
- Open full discussion detail only after the user selects a card.

Archive screen:

- Box 1: simple filter
- Box 2: quick status or empty-state summary
- Box 3: compact finished-task cards
- Use card grids instead of month-long lists when the user needs a quick overview.
- Avoid mixing analytics, storage, and task actions into the finished list.

## Decision Test

Before finishing a dashboard screen, ask:

- Can a new user understand the page in five seconds?
- Are there more than three main actions visible?
- Are unrelated things sharing one box?
- Is there anything here because the database has it, not because the user needs it?
- Can the screen usually be used without scrolling on desktop?

If the answer points to confusion, simplify the screen before adding more features.
